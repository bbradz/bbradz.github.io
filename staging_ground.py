import torch
import torch.distributed as dist
import contextlib
from torch import nn
from torch.autograd import Variable

class DataParallelNaive(nn.Module):
    def __init__(self, module):
        super().__init__()
        self.module = module  # The model to parallelize
        self.require_backward_grad_sync = True  # Controls gradient synchronization
        for p in self.module.parameters():  # Register hooks for all parameters
            if p.requires_grad: p.register_hook(self._allreduce_grads)  # Hook for gradient synchronization
    
    def forward(self, *inputs, **kwargs): return self.module(*inputs, **kwargs)  # Forward pass through the model
                
    def _allreduce_grads(self, grad):  # Synchronize gradients across processes
        if self.require_backward_grad_sync:  # Only sync if enabled
            dist.all_reduce(grad, op=dist.ReduceOp.SUM, group=dist.group.WORLD)  # Sum gradients across processes
            grad /= dist.get_world_size()  # Average gradients
        return grad 
    
    @contextlib.contextmanager
    def no_sync(self):  # Temporarily disable gradient synchronization (useful for gradient accumulation)
        self.require_backward_grad_sync = False
        yield
        self.require_backward_grad_sync = True

class Bucket:
    def __init__(self, params, grad_data, process_group):
        self.params = set(params)  # Parameters in this bucket
        self.params_with_grad_ready = set()  # Parameters with gradients ready for synchronization
        self.grad_data = grad_data  # Tensor to store gradients
        self.process_group = process_group  # Process group for communication
        self.process_group_size = dist.get_world_size(group=self.process_group)  # Number of processes
        self.handle = None  # Handle for async all-reduce
        self.reset()  # Initialize bucket state
    
    def sync_gradient(self):  # Launch async all-reduce to synchronize gradients
        self.grad_data /= self.process_group_size  # Normalize gradients
        self.handle = dist.all_reduce(self.grad_data, group=self.process_group, async_op=True)  # Async all-reduce
    
    def reset(self):  # Reset bucket state
        self.handle = None
        self.params_with_grad_ready.clear()  # Clear ready parameters
        self.grad_data.zero_()  # Zero out gradients

    def wait(self): self.handle.wait()  # Wait for all-reduce to finish

    def mark_param_as_ready(self, param):  # Mark parameter as ready for synchronization
        self.params_with_grad_ready.add(param)  # Add to ready set
        if len(self.params_with_grad_ready) == len(self.params): self.sync_gradient()  # Sync if all params are ready

class BucketManager:
    def __init__(self, params, process_group, bucket_size, grad_type=torch.float32):
        self.params = list(params)  # List of model parameters
        self.device = torch.device("cuda") if self.params[0].is_cuda else torch.device("cpu")  # Device for gradients
        self.buckets = []  # List of buckets
        self.process_group = process_group  # Process group for communication
        self.params_to_bucket_location = {}  # Maps params to their bucket and location
        self.grad_data_list = []  # List of gradient tensors (one per bucket)
        self._initialize_buckets(bucket_size, grad_type)  # Initialize buckets
    
    def _initialize_buckets(self, bucket_size, grad_type):  # Divide params into buckets
        cur_bucket_size, cur_bucket_idx = 0, 0  # Track current bucket size and index
        for param in self.params:  # Assign params to buckets
            if not param.requires_grad: continue  # Skip params without gradients
            if cur_bucket_size + param.numel() > bucket_size:  # Start new bucket if current is full
                cur_bucket_idx += 1
                cur_bucket_size = param.numel()
                self.params_to_bucket_location[param] = (0, param.numel(), cur_bucket_idx)  # Map param to new bucket
            else:  # Add param to current bucket
                self.params_to_bucket_location[param] = (cur_bucket_size, cur_bucket_size + param.numel(), cur_bucket_idx)
                cur_bucket_size += param.numel()

        bucket_sizes = [0] * (cur_bucket_idx + 1)  # Track size of each bucket
        buckets_to_params = [[] for _ in range(cur_bucket_idx + 1)]  # Map buckets to their params
        for param, (_, end, idx) in self.params_to_bucket_location.items():  # Populate bucket sizes and params
            bucket_sizes[idx] = max(bucket_sizes[idx], end)
            buckets_to_params[idx].append(param)
        
        for i in range(len(bucket_sizes)):  # Create gradient tensors and buckets
            self.grad_data_list.append(torch.zeros(bucket_sizes[i], dtype=grad_type, device=self.device))  # Gradient tensor
            self.buckets.append(Bucket(buckets_to_params[i], self.grad_data_list[i], self.process_group))  # Create bucket
        
        for param in self.params[::-1]:  # Create gradient views for each parameter
            if param.requires_grad:
                start, end, bucket_id = self.params_to_bucket_location[param]
                param.main_grad = self.grad_data_list[bucket_id][start:end].view(param.shape)  # View into gradient tensor
    
    def reset(self):  # Reset all buckets
        for bucket in self.buckets: bucket.reset()
    
    def wait(self):  # Wait for all buckets to finish synchronization
        for bucket in self.buckets: bucket.wait()
    
    def mark_param_as_ready(self, param):  # Mark param as ready for synchronization
        self.buckets[self.params_to_bucket_location[param][2]].mark_param_as_ready(param)

class DataParallelBucket(nn.Module):
    def __init__(self, module, bucket_cap_mb=25, grad_type=torch.float32):
        super().__init__()
        self.module = module  # The model to parallelize
        self.require_backward_grad_sync = True  # Controls gradient synchronization
        bucket_size = bucket_cap_mb * 1024 * 1024 // (2 if grad_type == torch.bfloat16 else 4)  # Calculate bucket size
        self.bucket_manager = BucketManager(module.parameters(), dist.group.WORLD, bucket_size, grad_type)  # Initialize bucket manager
        self._register_backward_hooks()  # Register hooks for gradient accumulation
        self._post_backward_callback_set = False  # Track if post-backward callback is set
    
    def forward(self, *inputs, **kwargs): return self.module(*inputs, **kwargs)  # Forward pass through the model

    def _register_backward_hooks(self):  # Register hooks for gradient accumulation
        self.grad_accs = []  # Store gradient accumulator functions
        for param in self.module.parameters():
            if param.requires_grad:
                grad_acc_fn = param.expand_as(param).grad_fn.next_functions[0][0]  # Get gradient accumulator
                grad_acc_fn.register_hook(self._make_param_hook(param))  # Register hook for gradient accumulation
                self.grad_accs.append(grad_acc_fn)
                
    def _make_param_hook(self, param):  # Create hook for gradient accumulation
        def param_hook(*unused):
            if param.requires_grad:
                param.main_grad.add_(param.grad.data)  # Accumulate gradients
                param.grad = None  # Clear gradient
                if self.require_backward_grad_sync:  # Sync gradients if enabled
                    if not self._post_backward_callback_set:  # Add post-backward callback if not already set
                        Variable._execution_engine.queue_callback(self._post_backward)
                        self._post_backward_callback_set = True
                    self.bucket_manager.mark_param_as_ready(param)  # Mark param as ready for synchronization
        return param_hook
    
    @contextlib.contextmanager
    def no_sync(self):  # Temporarily disable gradient synchronization
        self.require_backward_grad_sync = False
        yield
        self.require_backward_grad_sync = True
        
    def _post_backward(self):  # Post-backward callback to finalize synchronization
        self.bucket_manager.wait()  # Wait for all buckets to finish
        self._post_backward_callback_set = False  # Reset callback flag
        for p in self.module.parameters():  # Copy synchronized gradients back to parameters
            if p.requires_grad: p.grad = p.main_grad.to(p.dtype)

    def reset(self):  # Reset bucket manager and gradients
        self.bucket_manager.reset()
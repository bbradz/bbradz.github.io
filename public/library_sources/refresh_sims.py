import json
from sentence_transformers import SentenceTransformer
import numpy as np

def cosine_similarity(vec_a, vec_b):
    """
    Calculates the cosine similarity between two vectors.

    Args:
        vec_a (list): First vector.
        vec_b (list): Second vector.

    Returns:
        float: Cosine similarity between the vectors.
    """
    vec_a = np.array(vec_a)
    vec_b = np.array(vec_b)
    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0  # Handle zero norm case to avoid division by zero
    return dot_product / (norm_a * norm_b)

def generate_embeddings(input_filepath="input.json"):
    """
    Reads data from input.json, generates sentence embeddings using a SentenceTransformer model,
    and returns the data with embeddings. Embeddings are NOT written to input.json.

    Args:
        input_filepath (str): Path to the input JSON file (default: "input.json").

    Returns:
        list: List of items with embeddings, or None if an error occurred.
    """
    try:
        # Load data from input.json
        with open(input_filepath, 'r') as f:
            reading_list_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found at '{input_filepath}'. Please make sure input.json exists in the same directory.")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{input_filepath}'. Please check the JSON syntax.")
        return None

    # Load a high-quality sentence embedding model (Sentence-BERT - all-mpnet-base-v2 is a good choice)
    try:
        model = SentenceTransformer('all-mpnet-base-v2') # You can choose other models from sentence-transformers library
    except Exception as e:
        print(f"Error loading SentenceTransformer model: {e}. Make sure you have the 'sentence-transformers' library installed (pip install sentence-transformers) and internet connection if downloading for the first time.")
        return None

    updated_reading_list_data = []
    for item in reading_list_data:
        # Construct the text to embed - using title, description, and tags for richer context
        text_to_embed = f"{item['title']} {item['description']} {' '.join(item['tags'])}"

        # Generate embedding
        try:
            embedding = model.encode(text_to_embed).tolist() # Convert numpy array to list for JSON serializability
        except Exception as e:
            print(f"Error generating embedding for item '{item['title']}': {e}. Skipping embedding for this item.")
            embedding = [] # Assign empty list if embedding generation fails. You might want to handle this differently.

        # Add embedding to the item
        item['embedding'] = embedding
        updated_reading_list_data.append(item)

    return updated_reading_list_data

def generate_document_similarity_data(sources_data, output_filepath="document_similarities.json", similarity_threshold=0.6):
    """
    Calculates cosine similarities between document embeddings from provided data,
    and writes a JSON file (document_similarities.json) containing the similarity links
    suitable for direct loading in library.js.

    Args:
        sources_data (list): List of document data with embeddings.
        output_filepath (str): Path to the output JSON file for similarities (default: "document_similarities.json").
        similarity_threshold (float): Threshold for cosine similarity to create a link (default: 0.75).
    """
    documents = sources_data
    links = []

    for i in range(len(documents)):
        for j in range(i + 1, len(documents)):
            doc1 = documents[i]
            doc2 = documents[j]

            # Ensure embeddings exist and are not empty lists
            if not doc1.get('embedding') or not doc2.get('embedding') or not isinstance(doc1['embedding'], list) or not isinstance(doc2['embedding'], list) or len(doc1['embedding']) == 0 or len(doc2['embedding']) == 0:
                print(f"Warning: Embedding missing or invalid for document '{doc1['title']}' or '{doc2['title']}'. Skipping similarity calculation.")
                continue

            similarity = cosine_similarity(doc1['embedding'], doc2['embedding'])

            if similarity > similarity_threshold:
                links.append({
                    "source": i,  # Use index as source ID
                    "target": j,  # Use index as target ID
                    "similarity": similarity,
                    "width": 1 + (similarity - similarity_threshold) * (4 / (1 - similarity_threshold)) # Width calculation from library.js
                })

    # Write the similarity links to src/document_similarities.json
    output_filepath_sims = "../../src/document_similarities.json"
    try:
        with open(output_filepath_sims, 'w') as f:
            json.dump(links, f, indent=2)
        print(f"Successfully created '{output_filepath_sims}' with document similarity links.")
    except Exception as e:
        print(f"Error writing to output file '{output_filepath_sims}': {e}")


if __name__ == "__main__":
    input_file = "../../src/input.json" # Input is read from src/input.json
    output_file = "../../src/document_similarities.json" # Output is written to src/document_similarities.json

    embedded_data = generate_embeddings(input_file)
    if embedded_data: # Proceed only if embedding generation was successful
        generate_document_similarity_data(embedded_data, output_file)


"""
\\\\\\\\\\\\\\\\\\\\\ TEMPLATE & RUNNING LIST OF TAGS \\\\\\\\\\\\\\\\\\\\\

The following is the list of all of the current Tags:

Tags = 
Information Theory, Statistics, Linear Algebra, Stochastic Calculus, Misc Math,
GPU, ASIC, HPC, Distributed Techniques,
Time-Series Forecasting, Monte Carlo Methods, Finance,
Compilers, ProgLangs, Version Control, System Design, DevOps, Infrastructure, 
SWE Best Practices, Benchmarking, Libraries
Alignment, Governance, X-Risk,
Interpretability, CV, NLP, CompBio, Control, Game,
Career Advice,
Architecture, SSM, MoE, Transformer, Attention, Generative Methods
Training, Scaling, Inference, Test-Time Methods, RL for Test-Time, Context Length
Quantization, Sparsity, Distillation, Optimizer, Hyperparams
RL, Symbolic AI, ML,
Econ, Wonky, Politiking, Philosophy
Arxiv, Site, YT, Essay

{
  "title": "",
  "author": "",
  "description":
    "",
  "tags": [""],
  "readTime": 0.0,
  "releaseDate": "XXXX-XX-XX",
  "isRead": false,
  "downloadLink": "",
},
"""
import sys
import json
from sentence_transformers import SentenceTransformer

def main():
    model = SentenceTransformer("all-MiniLM-L6-v2")
    documents = json.loads(sys.stdin.read())
    embeddings = model.encode(documents).tolist()
    print(json.dumps(embeddings))

if __name__ == "__main__":
    main()

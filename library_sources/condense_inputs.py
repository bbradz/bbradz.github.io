import json

def process_json_file(input_filepath, output_filepath):
    """
    Processes a JSON file with book entries and creates a new JSON file
    with a reduced structure.

    Args:
        input_filepath (str): Path to the input JSON file.
        output_filepath (str): Path to the output JSON file.

    Returns:
        bool: True if processing was successful, False otherwise (e.g., file not found, JSON error).
    """
    try:
        with open(input_filepath, 'r') as infile:
            data = json.load(infile)
    except FileNotFoundError:
        print(f"Error: Input file not found at '{input_filepath}'")
        return False
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{input_filepath}'")
        return False

    output_data = []
    for entry in data:
        new_entry = {
            "title": entry.get("title", ""),  # Use .get() with default to handle missing keys gracefully
            "description": entry.get("description", ""),
            "tags": entry.get("tags", [])  # Default to empty list if tags are missing
        }
        output_data.append(new_entry)

    try:
        with open(output_filepath, 'w') as outfile:
            json.dump(output_data, outfile, indent=4) # indent=4 for pretty formatting
        print(f"Successfully processed '{input_filepath}' and saved to '{output_filepath}'")
        return True
    except IOError:
        print(f"Error: Could not write to output file '{output_filepath}'")
        return False

if __name__ == "__main__":
    input_file = "../../src/input.json"  # Replace with your input file name
    output_file = "condensed.json" # Replace with your desired output file name

    # Create a dummy input.json file for testing if it doesn't exist
    import os
    if not os.path.exists(input_file):
        dummy_data = [
            {
              "title": "The Great Book",
              "author": "John Doe",
              "description": "A fantastic story.",
              "tags": ["fiction", "adventure"],
              "readTime": 3.5,
              "releaseDate": "2023-10-27",
              "isRead": False,
              "downloadLink": "http://example.com/book1"
            },
            {
              "title": "Science Explained",
              "author": "Jane Smith",
              "description": "Understanding science concepts.",
              "tags": ["science", "education"],
              "readTime": 2.0,
              "releaseDate": "2023-11-15",
              "isRead": True,
              "downloadLink": "http://example.com/book2"
            }
        ]
        with open(input_file, 'w') as f:
            json.dump(dummy_data, f, indent=4)
        print(f"Created dummy input file '{input_file}' for testing.")


    if process_json_file(input_file, output_file):
        print("JSON processing complete.")
    else:
        print("JSON processing failed.")
import os
import json

def index_standards():
    base_dir = r'c:\myworld\cqt_light\Padrões'
    output_path = r'c:\myworld\cqt_light\data\standards\standards_index.json'
    
    file_tree = {}
    
    print(f"Indexing {base_dir}...")
    
    for root, dirs, files in os.walk(base_dir):
        # Create relative path key
        rel_path = os.path.relpath(root, base_dir)
        if rel_path == ".":
            rel_path = "root"
            
        file_tree[rel_path] = {
            "dirs": dirs,
            "files": files
        }
        
    print(f"Indexed {len(file_tree)} directories.")
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(file_tree, f, indent=4, ensure_ascii=False)
        
    print(f"Saved index to {output_path}")

if __name__ == "__main__":
    index_standards()

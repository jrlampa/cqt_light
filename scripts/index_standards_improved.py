import os
import json
import time

def index_standards_robustly():
    # Root directories to index
    target_dirs = [
        r'c:\myworld\cqt_light\Padrões',
        r'c:\myworld\cqt_light\Padrões construtivos'
    ]
    output_path = r'c:\myworld\cqt_light\data\standards\full_standards_index.json'
    
    index = {
        "metadata": {
            "indexed_at": time.ctime(),
            "total_files": 0,
            "total_dirs": 0
        },
        "tree": {}
    }
    
    for base_dir in target_dirs:
        if not os.path.exists(base_dir):
            print(f"Directory not found: {base_dir}")
            continue
            
        print(f"Indexing {base_dir}...")
        base_name = os.path.basename(base_dir)
        
        for root, dirs, files in os.walk(base_dir):
            rel_path = os.path.relpath(root, os.path.dirname(base_dir))
            
            file_details = []
            for f in files:
                f_path = os.path.join(root, f)
                stats = os.stat(f_path)
                file_details.append({
                    "name": f,
                    "size": stats.st_size,
                    "extension": os.path.splitext(f)[1].lower(),
                    "modified": time.ctime(stats.st_mtime)
                })
                index["metadata"]["total_files"] += 1
                
            index["tree"][rel_path] = {
                "dirs": dirs,
                "files": file_details
            }
            index["metadata"]["total_dirs"] += 1
            
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=4, ensure_ascii=False)
        
    print(f"Saved full index to {output_path}")
    print(f"Found {index['metadata']['total_files']} files across {index['metadata']['total_dirs']} directories.")

if __name__ == "__main__":
    index_standards_robustly()

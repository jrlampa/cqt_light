import requests
import json
import os

BASE_URL = "http://localhost:5000/api"

def verify_custom_kit():
    print("1. Testing POST /api/kits/custom...")
    
    kit_id = "CUSTOM-TEST-01"
    payload = {
        "id": kit_id,
        "name": "Kit Manual de Teste",
        "pole_id": "P11/600",
        "materials": [
             {"sap": "307941", "description": "MATERIAL TESTE 1", "qty": 2.0},
             {"sap": "999999", "description": "MATERIAL TESTE 2", "qty": 5.0}
        ]
    }
    
    try:
        res = requests.post(f"{BASE_URL}/kits/custom", json=payload)
        print(f"POST Status: {res.status_code}")
        print(f"POST Response: {res.text}")
        
        if res.status_code != 200:
            print("FAILED: POST request failed.")
            return

        print("\n2. Verifying File Existence...")
        file_path = r'c:\myworld\cqt_light\data\kits\custom_kits.json'
        if os.path.exists(file_path):
            print(f"SUCCESS: {file_path} exists.")
            with open(file_path, 'r', encoding='utf-8') as f:
                saved_data = json.load(f)
                if kit_id in saved_data:
                    print(f"SUCCESS: Kit '{kit_id}' found in JSON file.")
                else:
                    print(f"FAILED: Kit '{kit_id}' NOT found in JSON file.")
        else:
            print("FAILED: custom_kits.json NOT found.")
            
        print("\n3. Testing GET /api/kits (Integration)...")
        res_get = requests.get(f"{BASE_URL}/kits")
        if res_get.status_code == 200:
            all_kits = res_get.json()
            if kit_id in all_kits:
                print(f"SUCCESS: Kit '{kit_id}' returned by GET API.")
                print(f"Kit Name: {all_kits[kit_id]['name']}")
            else:
                print(f"FAILED: Kit '{kit_id}' NOT in GET response.")
        else:
             print(f"FAILED: GET /api/kits failed {res_get.status_code}")

    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    verify_custom_kit()

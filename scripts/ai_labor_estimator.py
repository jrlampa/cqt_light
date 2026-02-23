import sys
import json
import os
import requests

def suggest_cost(data):
    description = data.get("description", "")
    materials = data.get("materials", [])
    
    # Simple heuristic fallback if AI fails or key is missing
    # In a real scenario, this would call GROQ
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        # Heuristic suggestion: ~15% of material cost or flat rate based on keywords
        base_rate = 50.0
        if "REFORÇO" in description.upper(): base_rate += 100.0
        if "POSTE" in description.upper(): base_rate += 250.0
        return {"cost": base_rate, "source": "heuristic"}

    # Placeholder for GROQ API Call
    # prompt = f"Estime o custo de mão de obra (em Reais) para instalar o seguinte kit: {description}. Materiais inclusos: {materials}. Retorne apenas um JSON: {{\"cost\": float}}"
    
    try:
        # Mocking GROQ logic for now until user provides key or I confirm connectivity
        # return {"cost": 123.45, "source": "groq"}
        return {"cost": 75.0, "source": "mock_ai"}
    except Exception as e:
        return {"error": str(e), "cost": 0}

if __name__ == "__main__":
    if not sys.stdin.isatty():
        try:
            line = sys.stdin.read()
            if line:
                input_data = json.loads(line)
                print(json.dumps(suggest_cost(input_data)))
        except Exception as e:
            print(json.dumps({"error": str(e)}))

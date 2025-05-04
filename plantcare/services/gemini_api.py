import google.generativeai as genai
from decouple import config

def get_models():
      models = genai.list_models()
      models = [model for model in models if "gemini" in model.name.lower()]
      return models
      
    

def get_care_advice(plant_name):
    genai.configure(api_key=config("GEMINI_API_KEY"))

    try:
        models = genai.list_models()
        print("Available Models:", models)  
        models = [model for model in models if "gemini" in model.name.lower()]
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")  # ✅ Correct syntax
        prompt = f"Give 4 short bullet-point care instructions for the plant '{plant_name}' in plain English."
        response = model.generate_content(prompt)

        # Some Gemini responses come as a single string
        advice_text = response.text.strip()
        # Convert to list (split by line)
        return [line.strip("-• ") for line in advice_text.splitlines() if line.strip()]
    except Exception as e:
        print("Gemini Error:", e)
        return ["No Gemini advice available."]
def get_care_advice(prompt):
    genai.configure(api_key=config("GEMINI_API_KEY"))
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
    response = model.generate_content(f"A plant owner says: '{prompt}'. Give 3 care tips.")
    return [line.strip("-• ") for line in response.text.strip().splitlines() if line.strip()]


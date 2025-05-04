# from django.shortcuts import render, redirect
# from .forms import PlantImageForm
# from .models import PlantImage
# from .services.plantid_api import identify_plant
# import requests
# import json
# from django.conf import settings

# import os
# from decouple import config


# def identify_plant(image_path):
#     api_key = config('PLANT_ID_API_KEY')
#     print("API Key:", api_key)
#     url = "https://api.plant.id/v2/identify"
    
#     with open(image_path, 'rb') as img_file:
#         files = {'images': img_file}
#         data = {
#             'api_key': api_key,
#             'modifiers': ["crops_fast", "similar_images"],
#             'plant_language': 'en',
#             'plant_details': ['common_names', 'watering', 'care_guides']
#         }
#         response = requests.post(url, files=files, data={'data': json.dumps(data)})
    
#     try:
#         result = response.json()
#         if result.get('suggestions'):
#             plant_info = result['suggestions'][0]
#             name = plant_info['plant_name']
#             care = plant_info.get('plant_details', {}).get('watering', 'Care details not found.')
#             return {'name': name, 'care': str(care)}
#     except Exception as e:
#         print("API Error:", e, response.text)
    
#     return None

# def home(request):
#     return render(request, 'home.html')

# def upload_image(request):
#     if request.method == 'POST':
#         form = PlantImageForm(request.POST, request.FILES)
#         if form.is_valid():
#             plant = form.save()
#             plant_data = identify_plant(plant.image.path)
#             print("Plant Data:", plant_data)
#             if plant_data:
#                 plant.plant_name = plant_data['name']
#                 plant.care_instructions = plant_data['care']
#                 plant.save()
#             return render(request, 'result.html', {'plant': plant})
#     else:
#         form = PlantImageForm()
#     return render(request, 'upload.html', {'form': form})

import os
import base64
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services.plantid_api import identify_plant
# Optional Gemini integration
from .services.gemini_api import get_care_advice
import json
from django.shortcuts import render

def home(request):
    return render(request, 'home.html')

@csrf_exempt
def analyze_plant(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            image_data = data.get('image')
            print("Received image data length:", len(image_data) if image_data else "No data")

            if not image_data or not image_data.startswith('data:image'):
                return JsonResponse({'error': 'Invalid image format'}, status=400)

            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            filename = f"temp_{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join("media", filename)
            print("Saving image to:", filepath)

            # Save the image
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(imgstr))

            print("Calling Plant.id API...")
            result = identify_plant(filepath)
            print("Plant.id result:", result)

            if not result:
                return JsonResponse({'error': 'Plant identification failed'}, status=500)

            # Optional Gemini
            advice = get_care_advice(result['name']) if result['name'] else []

            response_data = {
                "diagnosis": {
                    "diseaseName": result['name'],
                    "confidence": result['confidence'],
                    "status": result['status'],
                    "advice": advice or result['care']
                }
            }

            return JsonResponse(response_data)
        except Exception as e:
            import traceback
            print("Exception occurred:", str(e))
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST allowed'}, status=405)
@csrf_exempt
def voice_diagnose(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            prompt = data.get('prompt')
            from .services.gemini_api import get_care_advice
            advice = get_care_advice(prompt)
            return JsonResponse({'advice': advice})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)
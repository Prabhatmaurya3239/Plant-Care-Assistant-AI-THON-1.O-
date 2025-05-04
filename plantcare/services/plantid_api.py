# import requests, os
# from dotenv import load_dotenv
# load_dotenv()

# def identify_plant(image_path):
#     api_key = os.getenv('PLANT_ID_API_KEY')
#     url = "https://api.plant.id/v3"
#     files = {'images': open(image_path, 'rb')}
#     data = {
#         'api_key': api_key,
#         'modifiers': ["crops_fast", "similar_images"],
#         'plant_language': 'en',
#         'plant_details': ['common_names', 'watering', 'care_guides']
#     }
#     response = requests.post(url, files=files, json=data)
#     result = response.json()
#     if result.get('suggestions'):
#         plant_info = result['suggestions'][0]
#         name = plant_info['plant_name']
#         care = plant_info.get('plant_details', {}).get('watering', 'Care details not found.')
#         return {'name': name, 'care': str(care)}
#     return None

import json
import requests
from decouple import config

def identify_plant(image_path):
    api_key = config("PLANT_ID_API_KEY")
    url = "https://api.plant.id/v2/identify"

    with open(image_path, 'rb') as img_file:
        files = {'images': img_file}
        data = {
            'api_key': api_key,
            'modifiers': ['crops_fast', 'similar_images'],
            'plant_language': 'en',
            'plant_details': ['common_names', 'watering', 'care_guides']
        }

        response = requests.post(url, files=files, data={'data': json.dumps(data)})
        result = response.json()

        if 'suggestions' in result and result['suggestions']:
            top = result['suggestions'][0]
            return {
                'name': top['plant_name'],
                'confidence': top['probability'],
                'care': [top.get('plant_details', {}).get('watering', 'Care info unavailable')],
                'status': classify_status(top['probability'])
            }
    return None

def classify_status(prob):
    if prob > 0.9:
        return 'healthy'
    elif prob > 0.7:
        return 'minor'
    elif prob > 0.5:
        return 'moderate'
    else:
        return 'severe'


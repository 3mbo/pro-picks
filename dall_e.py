import requests
from PIL import Image
import io
import os
from openai import OpenAI


def generate_description(api_key, champion_name, model='gpt-3.5-turbo'):
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    data = {
        "model": model,
        "messages": [{"role": "user", "content": f"Please create a prompt for a background based on elements "
                                                 f"you associate with this league of legends character,"
                                                 f" the prompt should contain motifs and settings that are unique"
                                                 f"to the character without mentioning the name of"
                                                 f"the character or that there is a character at all. Stay away from"
                                                 f"using a cityscape or forest. Please include an art style that"
                                                 f"suits the mood, but stay away from realism. The prompt should always include"
                                                 f"at least some motifs, colors, and at least one strong, suitable"
                                                 f"art style. You may take into account the faction."
                                                 f"The prompt should avoid using"
                                                 f"language that may cause DALL-E 3 to include letters, words, or human forms in the "
                                                 f"image. Ideally the image has a thematic border at the"
                                                 f"top and bottom. Okay now let's try my favorite champion {champion_name}"}],
        "temperature": 0.7,
        "max_tokens": 500
    }
    response = requests.post('https://api.openai.com/v1/chat/completions', headers=headers, json=data)
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content'].strip()
    else:
        print('Failed to generate description:', response.text)
        return None


def generate_image(api_key, prompt):
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", api_key))

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt + " image only without typography.",
        size="1024x1024",
        quality="standard",
        n=1,
    )
    # This gets the URL of the generated image
    image_url = response.data[0].url
    print('Generated Image URL:', image_url)

    image_response = requests.get(image_url)
    image = Image.open(io.BytesIO(image_response.content))
    save_path = f'static/images/{champion_name}.webp'
    image.save(save_path, 'WEBP')
    print(f'Image has been saved locally at {save_path}.')


key = 'sk-proj-qjJ79ErtS4feg3Jvyy3wT3BlbkFJvl0jM9bENGjcrIqIg7H2'

names = [

]

for name in names:
    champion_name = name
    description = generate_description(key, champion_name)

    if description:
        print("Generated Description:", description)
        # Use the generated description to create a full prompt for the image generation
        full_prompt = description
        generate_image(key, full_prompt)

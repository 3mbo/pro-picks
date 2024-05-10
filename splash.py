import requests
from PIL import Image
from io import BytesIO
import os
from models import Champion

def download_splashes():
    # List of champion IDs
    champion_ids = []
    for champion in Champion.query.all():
        champion_ids.append(champion.id)

    def download_and_convert_image(champion_id):
        url = f"https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/{champion_id}/{champion_id}000.jpg"
        response = requests.get(url)

        if response.status_code == 200:
            # Convert image to WebP
            image = Image.open(BytesIO(response.content))
            webp_path = f'static/images/splashArt/{champion_id}.webp'
            image.save(webp_path, 'WEBP')
            print(f'Saved {webp_path}')
        else:
            print(f'Failed to download image for champion ID {champion_id}')


    # Ensure the target directory exists
    os.makedirs('static/images/splashArt', exist_ok=True)

    # Process each champion ID
    for champ_id in champion_ids:
        download_and_convert_image(champ_id)

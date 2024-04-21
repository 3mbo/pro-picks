from mwrogue.esports_client import EsportsClient
from datetime import datetime, timedelta
from collections import defaultdict
import json
import requests

from database import db
from models import Champion


def fetch_champion_data():
    url = 'https://ddragon.leagueoflegends.com/cdn/14.8.1/data/en_US/champion.json'
    response = requests.get(url)

    if response.status_code != 200:
        raise Exception('Failed to fetch champion data')

    riot_champions = response.json()
    data = riot_champions.get('data', {})
    champions = []

    for champion_id, champion_info in data.items():
        # Convert key (champion_id) to an integer
        try:
            champion_id_int = int(champion_info['key'])
        except ValueError:
            raise ValueError(f"Failed to convert key '{champion_info['key']}' to an integer.")

        name = champion_info['name']
        # Append the champion's name and integer id
        champions.append((name, champion_id_int))
    return champions


def fetch_esports_data():
    """Fetches esports data from the API."""
    # Initialize the EsportsClient
    site = EsportsClient("lol")

    # Calculate the date one year ago
    time_ago = datetime.now() - timedelta(days=100)
    time_str = time_ago.strftime('%Y-%m-%d 00:00:00')  # Format the date

    # Query data
    response = site.cargo_client.query(
        tables="ScoreboardGames=SG, Tournaments=T",
        join_on="SG.OverviewPage=T.OverviewPage",
        fields=(
            f"T.Name, T.Region, SG.DateTime_UTC, SG.Team1, SG.Team2, SG.Team1Picks,"
            f"SG.Team2Picks, SG.Team1Bans, SG.Team2Bans"
        ),
        where=(
            f"SG.DateTime_UTC >= '{time_str}' AND "
            f"(SG.OverviewPage LIKE '%LCS%' OR SG.OverviewPage LIKE '%LCK%' OR"
            f" SG.OverviewPage LIKE '%LPL%' OR SG.OverviewPage LIKE '%LEC%')"
        ),
        limit=200,
        order_by="SG.DateTime_UTC DESC"
    )
    return response


def analyze_esports_data(data):
    # Initialize a dictionary to hold the count of picks and bans for each champion for Blue and Red teams separately
    champions_dict = defaultdict(lambda: {
        'Blue': {'picks': [0, 0, 0, 0], 'bans': [0, 0]},
        'Red': {'picks': [0, 0, 0, 0], 'bans': [0, 0]}
    })

    # Iterate through the data
    for game in data:
        # Get the picks and bans for each team
        blue_picks = game.get('Team1Picks', '').split(',')
        red_picks = game.get('Team2Picks', '').split(',')
        blue_bans = game.get('Team1Bans', '').split(',')
        red_bans = game.get('Team2Bans', '').split(',')

        # Define the pick groupings for Blue and Red teams
        blue_groups = [blue_picks[0:1], blue_picks[1:3], blue_picks[3:5]]
        red_groups = [red_picks[0:2], red_picks[2:3], red_picks[3:4], red_picks[4:5]]

        # Process each group for Blue and Red teams (for picks)
        for i, group in enumerate(blue_groups):
            for champion in group:
                champions_dict[champion]['Blue']['picks'][i] += 1

        for i, group in enumerate(red_groups):
            for champion in group:
                champions_dict[champion]['Red']['picks'][i] += 1

        # Process bans data for Blue and Red teams
        for i, ban in enumerate(blue_bans):
            if i < 2:
                champions_dict[ban]['Blue']['bans'][i] += 1

        for i, ban in enumerate(red_bans):
            if i < 2:
                champions_dict[ban]['Red']['bans'][i] += 1

    # Convert the dictionary to JSON format
    json_data = json.dumps(champions_dict, indent=4)
    return json_data


def store_analyzed_data(data):
    # Verify `esports_data` format: Parse it if necessary
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            print("Error: Provided data is not valid JSON.")
            return

    # Iterate over each champion in the data
    for champion_name, data in data.items():
        # Find the Champion record by name
        champion = Champion.query.filter_by(name=champion_name).first()

        # If the champion doesn't exist, create a new record
        if champion is None:
            champion = Champion(name=champion_name)

        # Ensure 'Blue' and 'Red' data exist and have the expected structure
        if 'Blue' in data and 'Red' in data:
            blue_data = data['Blue']
            red_data = data['Red']

            # Validate the data
            if 'picks' in blue_data and 'bans' in blue_data and 'picks' in red_data and 'bans' in red_data:
                # Store Blue and Red team picks and bans in dictionaries
                champion.blue_picks = blue_data['picks']
                champion.blue_bans = blue_data['bans']

                champion.red_picks = red_data['picks']
                champion.red_bans = red_data['bans']

                # Add or update the record in the session
                db.session.add(champion)
            else:
                print(f"Error: Missing or invalid picks and bans data for champion '{champion_name}'")
        else:
            print(f"Error: Missing 'Blue' or 'Red' data for champion '{champion_name}'.")

    # Commit the session to save changes to the database

    db.session.commit()


def add_champions_to_database(data):
    Champion.query.delete()
    for champion in data:
        champ = Champion(id=champion[1], name=champion[0])
        db.session.add(champ)
    db.session.commit()


if __name__ == "__main__":
    esports_data = fetch_esports_data()  # Replace with your data fetching function
    json_esports = analyze_esports_data(esports_data)

    champion_data = fetch_champion_data()
    add_champions_to_database(champion_data)

    print(json_esports)  # This prints the JSON-formatted analyzed data
    print(champion_data)

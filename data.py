from mwrogue.esports_client import EsportsClient
from datetime import datetime, timedelta
from collections import defaultdict
import requests
import json

from database import db
from models import Champion, CachedTransactions


def fetch_champion_data():
    """Fetches esports data from the Riot Ddragon API."""
    url = 'https://ddragon.leagueoflegends.com/cdn/14.16.1/data/en_US/champion.json'
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
    """Fetches esports data from the Leaguepedia API."""
    # Initialize the EsportsClient
    site = EsportsClient("lol")

    # Calculate the date one hundred days ago
    time_ago = datetime.now() - timedelta(days=100)
    time_str = time_ago.strftime('%Y-%m-%d 00:00:00')  # Format the date

    # Query data
    response = site.cargo_client.query(
        tables="ScoreboardGames=SG, PicksAndBansS7=PB",
        join_on="SG.GameId=PB.GameId",
        fields=(
            f"SG.OverviewPage,SG.DateTime_UTC, SG.Team1, SG.Team2, SG.Team1Picks,"
            f"SG.Team2Picks, SG.Team1Bans, SG.Team2Bans, SG.Patch,"
            f"PB.Team1Pick1, PB.Team1Pick2, PB.Team1Pick3, PB.Team1Pick4, PB.Team1Pick5,"
            f"PB.Team2Pick1, PB.Team2Pick2, PB.Team2Pick3, PB.Team2Pick4, PB.Team2Pick5"
        ),
        where=(
            f"SG.DateTime_UTC >= '{time_str}' AND "
            f"(SG.OverviewPage LIKE '%LCS/2%' OR SG.OverviewPage LIKE '%LCK' OR"
            f" SG.OverviewPage LIKE '%LPL/2%' OR SG.OverviewPage LIKE '%LEC/2%' OR"
            f" SG.OverviewPage LIKE '%World%' OR SG.OverviewPage LIKE '%Mid-Season%')"
        ),
        limit=500,
        order_by="SG.DateTime_UTC DESC"
    )
    # print(json.dumps(response, indent=4))
    return response


def get_champion_data(manual_update=False):
    # Check when the data was last updated
    champions = Champion.query.all()
    if champions:
        last_updated = champions[0].last_updated

        # Check if a manual update is requested or if the data is outdated
        if manual_update or (last_updated and datetime.now() - last_updated >= timedelta(days=7)):
            # Data is outdated or manual update requested, refresh data from both sources
            print("Updating data...")
            fetch_prep_store()
            print("Data updated.")

        # Return the champion data
        return Champion.query.all()
    else:
        # No data available, fetch and store data
        print("No data available. Fetching and storing data...")
        fetch_prep_store()
        print("Data fetched and stored.")
        return Champion.query.all()


def prep_esports_data(response):
    # Initialize a dictionary to hold the count of picks and bans for each champion for Blue and Red teams separately
    champions_side_to_pb = defaultdict(lambda: {
        'Blue': {'picks': [0, 0, 0, 0], 'bans': [0, 0]},
        'Red': {'picks': [0, 0, 0, 0], 'bans': [0, 0]}
    })
    # Initialize a dictionary to store roles for each champion
    champion_role_counts = defaultdict(lambda: [0, 0, 0, 0, 0])

    # Initialize lists to store champions from each game by role and pick
    team_transactions_by_role = []
    transactions_by_pick = []

    # Counters for pick ban %
    total_picks = defaultdict(int)
    total_bans = defaultdict(int)
    total_games = 0

    # Iterate through the games
    for game in response:
        blue_picks = []
        red_picks = []

        # Iterate through teams for pick order
        for i in range(1, 3):
            # Iterate through picks
            for j in range(1, 6):
                # Create the field name using a formatted string
                pick_by_order_field = f'Team{i}Pick{j}'
                pick_by_order = game.get(pick_by_order_field, '')

                if i == 1:
                    blue_picks.append(pick_by_order)

                else:
                    red_picks.append(pick_by_order)

        # Define the picks by order groupings for Blue and Red teams (
        blue_groups = [blue_picks[0:1], blue_picks[1:3], blue_picks[3:5]]
        red_groups = [red_picks[0:2], red_picks[2:3], red_picks[3:4], red_picks[4:5]]
        blue_bans = game.get('Team1Bans', '').split(',')
        red_bans = game.get('Team2Bans', '').split(',')

        # Convert picks to correct format
        picks = [
            blue_picks[0],
            [red_picks[0], red_picks[1]], '',
            [blue_picks[1], blue_picks[2]], '',
            red_picks[2],

            red_picks[3],
            [blue_picks[3], blue_picks[4]], '',
            red_picks[4]
        ]

        # Iterate through each pick
        for i, element in enumerate(picks):
            if i == 1 or i == 3 or i == 7:
                picks_sorted = sorted(picks[i])
                picks[i] = picks_sorted[0]
                picks[i + 1] = picks_sorted[1]

        transactions_by_pick.append(picks)

        # Process each group for Blue and Red picks
        for i, group in enumerate(blue_groups):
            for champion_name in group:
                champions_side_to_pb[champion_name]['Blue']['picks'][i] += 1
                total_picks[champion_name] += 1

        for i, group in enumerate(red_groups):
            for champion_name in group:
                champions_side_to_pb[champion_name]['Red']['picks'][i] += 1
                total_picks[champion_name] += 1

        # Process bans data for Blue and Red teams
        for i, champion_name in enumerate(blue_bans):
            if i < 2:
                champions_side_to_pb[champion_name]['Blue']['bans'][i] += 1
                total_bans[champion_name] += 1

        for i, champion_name in enumerate(red_bans):
            if i < 2:
                champions_side_to_pb[champion_name]['Red']['bans'][i] += 1
                total_bans[champion_name] += 1

        # Iterate through teams for champion roles
        for i in range(1, 3):
            # Create the field name using a formatted string
            picks_by_role_field = f'Team{i}Picks'
            picks_by_role = game.get(picks_by_role_field, '').split(',')

            team_transactions_by_role.append(picks_by_role)

            # Iterate through picks in role order
            for j in range(5):
                champion_by_role = picks_by_role[j]

                # Increment champion role count for jth role
                champion_role_counts[champion_by_role][j] += 1

        total_games += 1

    def default_list():
        return [0, 0, 0.0]  # This function returns a new list each time it's called

    pick_ban_pct = defaultdict(default_list)

    for champion_name, pick_total in total_picks.items():
        pick_ban_pct[champion_name][0] = pick_total
    for champion_name, ban_total in total_bans.items():
        pick_ban_pct[champion_name][1] = ban_total
    for champion_name in pick_ban_pct.keys():
        pick_ban_pct[champion_name][2] = ((pick_ban_pct[champion_name][0] + pick_ban_pct[champion_name][
            1]) / total_games) * 100

    transactions_by_role = []
    for i in range(0, len(team_transactions_by_role), 2):
        game = team_transactions_by_role[i] + team_transactions_by_role[i + 1]
        transactions_by_role.append(game)

    data_prepped = [champions_side_to_pb, champion_role_counts, json.dumps(transactions_by_role),
                    json.dumps(transactions_by_pick), pick_ban_pct, total_games]

    return data_prepped


def store_esports_data(data_prepped):
    # Iterate over each champion in the data_pb
    data_pb = data_prepped[0]
    data_roles = data_prepped[1]
    data_transactions_role = data_prepped[2]
    data_transactions_pick = data_prepped[3]
    data_pick_ban_pct = data_prepped[4]
    data_total_games = data_prepped[5]

    # Update picks, bans, roles, and last updated date for each champion
    now = datetime.now()
    for champion_name, data_pb in data_pb.items():
        # Query the database to find the Champion object
        print(champion_name)
        champion = Champion.query.filter_by(name=champion_name).first()

        # Update the last updated date
        champion.last_updated = now

        # Ensure 'Blue' and 'Red' data_pb exist and have the expected structure
        if 'Blue' in data_pb and 'Red' in data_pb:
            blue_data = data_pb['Blue']
            red_data = data_pb['Red']

            # Validate the data_pb
            if 'picks' in blue_data and 'bans' in blue_data and 'picks' in red_data and 'bans' in red_data:
                # Store Blue and Red team picks and bans in dictionaries
                champion.blue_picks = blue_data['picks']
                champion.blue_bans = blue_data['bans']

                champion.red_picks = red_data['picks']
                champion.red_bans = red_data['bans']

                db.session.add(champion)
            else:
                print(f"Error: Missing or invalid picks and bans data_pb for champion '{champion_name}'")
        else:
            print(f"Error: Missing 'Blue' or 'Red' data_pb for champion '{champion_name}'.")

    # Iterate through each champion name and role counts
    for champion_name, role_counts in data_roles.items():
        # Query the database to find the Champion object with the given name
        champion = Champion.query.filter_by(name=champion_name).first()

        champion.roles = role_counts
        champion.relevance += 1

        db.session.add(champion)

    # Iterate through each champion name for pick ban data
    for champion_name, data in data_pick_ban_pct.items():
        champion = Champion.query.filter_by(name=champion_name).first()
        champion.pick_total = data[0]
        champion.ban_total = data[1]
        champion.pb_pct = data[2]
        db.session.add(champion)

    # Creating new instances of CachedTransactions
    new_cache_role = CachedTransactions(id=1, transactions=data_transactions_role, total=data_total_games)
    new_cache_pick = CachedTransactions(id=2, transactions=data_transactions_pick, total=data_total_games)
    db.session.add(new_cache_role)
    db.session.add(new_cache_pick)

    # Commit the session to save changes to the database
    db.session.commit()


def add_champions_to_database(data):
    Champion.query.delete()

    for champion in data:
        champ = Champion(id=champion[1], name=champion[0], last_updated=datetime.now())
        db.session.add(champ)

    db.session.commit()


def fetch_prep_store():
    # Fetch champion data
    champion_data = fetch_champion_data()
    add_champions_to_database(champion_data)
    print("Champion data fetched and added to db.")
    # Fetch esports data
    esports_data = fetch_esports_data()
    print("Esports data fetched")
    prepped_data = prep_esports_data(esports_data)
    print("Esports data prepped")
    # Store the prepped esports data in the database
    store_esports_data(prepped_data)
    print("Prepped data stored")

    # Update the last updated field for each champion
    now = datetime.now()
    champions = Champion.query.all()
    for champion in champions:
        champion.last_updated = now
        db.session.add(champion)
    db.session.commit()

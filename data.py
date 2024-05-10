from mwrogue.esports_client import EsportsClient
from datetime import datetime, timedelta
from collections import defaultdict
import requests
import json
from pprint import pprint

from database import db
from models import Champion, CachedTransactions

from mlxtend.frequent_patterns import apriori, association_rules
import pandas as pd


def fetch_champion_data():
    """Fetches esports data from the Riot Ddragon API."""
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

    pick_ban_total_pct = defaultdict(default_list)

    for champion_name, pick_total in total_picks.items():
        pick_ban_total_pct[champion_name][0] = pick_total
    for champion_name, ban_total in total_bans.items():
        pick_ban_total_pct[champion_name][1] = ban_total
    for champion_name in pick_ban_total_pct.keys():
        pick_ban_total_pct[champion_name][2] = ((pick_ban_total_pct[champion_name][0] + pick_ban_total_pct[champion_name][0]) / total_games) * 100

    transactions_by_role = []
    for i in range(0, len(team_transactions_by_role), 2):
        game = team_transactions_by_role[i] + team_transactions_by_role[i + 1]
        transactions_by_role.append(game)

    print(json.dumps(transactions_by_role), json.dumps(transactions_by_pick))
    data_prepped = [champions_side_to_pb, champion_role_counts, json.dumps(transactions_by_role),
                    json.dumps(transactions_by_pick), pick_ban_total_pct]

    return data_prepped


def store_esports_data(data_prepped):
    # Iterate over each champion in the data_pb
    data_pb = data_prepped[0]
    data_roles = data_prepped[1]

    # Update picks, bans, roles, and last updated date for each champion
    now = datetime.now()
    for champion_name, data_pb in data_pb.items():
        # Query the database to find the Champion object
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
    for champion_name, pb_data in data_prepped[4].items():
        champion = Champion.query.filter_by(name=champion_name).first()
        champion.pick_total = pb_data[0]
        champion.ban_total = pb_data[1]
        champion.pb_pct = pb_data[2]
        db.session.add(champion)

    # Creating new instances of CachedTransactions
    new_cache_role = CachedTransactions(id=1, transactions=data_prepped[2])
    new_cache_pick = CachedTransactions(id=2, transactions=data_prepped[3])
    db.session.add(new_cache_role)
    db.session.add(new_cache_pick)

    # Commit the session to save changes to the database
    db.session.commit()


def apriori_rules(transactions, min_support=0.01):
    # Convert transactions to DataFrame
    df = pd.DataFrame(transactions)

    # One-hot encode the DataFrame
    df = pd.get_dummies(df)

    # Perform the Apriori algorithm with the higher support threshold for multi-antecedent rules
    frequent_itemsets = apriori(df, min_support=min_support, use_colnames=True)

    # Generate association rules using the combined frequent itemsets
    rules = association_rules(frequent_itemsets, metric='lift', min_threshold=2)

    # Round the confidence, support, lift, and conviction columns to 4 decimal places
    rules = rules.round({'confidence': 4, 'support': 4, 'lift': 4, 'conviction': 4})

    # print("Association rules:")
    # for index, row in rules.iterrows():
    #     antecedents = ', '.join(list(row['antecedents']))
    #     consequents = ', '.join(list(row['consequents']))
    #     print(
    #         f"Rule: {antecedents} -> {consequents}, Lift: {row['lift']:.2f}, Support: {row['support']:.2f}, "
    #         f"Confidence: {row['confidence']:.2f}, Conviction: {row['conviction']:.2f}"
    #     )

    return rules


def filter_apriori_rules(rules, pick=False, min_confidence_single=0, min_support_single=0.01,
                         min_confidence_multi=0.3, min_support_multi=0.02):
    # Dictionary to store rules for each antecedent set sorted by confidence and support
    rules_by_antecedents = {}

    # Define the pick order and role order
    pick_order = ['BP1', 'RP1-2', 'RP1-2', 'BP2-3', 'BP2-3', 'RP3', 'RP4', 'BP4-5', 'BP4-5', 'RP5']
    role_order = ['Blue-Top', 'Blue-Jungle', 'Blue-Mid', 'Blue-Bot', 'Blue-Support',
                  'Red-Top', 'Red-Jungle', 'Red-Mid', 'Red-Bot', 'Red-Support']

    # Function to rename elements (antecedents and consequents) based on the provided orders
    def rename_elements(elements, use_pick_order):
        renamed_elements = []
        # Select the appropriate order based on the value of use_pick_order
        order = pick_order if use_pick_order else role_order

        for element in elements:
            order_and_champion = element.split('_')
            # Convert the index from a string to an integer
            idx = int(order_and_champion[0])
            # Get the corresponding name from the chosen order
            renamed_name = order[idx] + '_' + order_and_champion[1]
            renamed_elements.append(renamed_name)
        return tuple(renamed_elements)

    # Apply the renaming function to the antecedents and consequents
    rules['antecedents'] = rules['antecedents'].apply(lambda x: rename_elements(x, pick))
    rules['consequents'] = rules['consequents'].apply(lambda x: rename_elements(x, pick))

    # Iterate through each rule in single_node_rules
    for index, row in rules.iterrows():
        # Extract antecedents and consequents
        antecedents = row['antecedents']
        consequents = row['consequents']

        # Get rule metrics
        confidence = row['confidence']
        support = row['support']
        lift = row['lift']
        conviction = row['conviction']

        # Determine the number of antecedents
        num_antecedents = len(antecedents)

        # Set thresholds based on the number of antecedents
        if num_antecedents == 1:
            # Single antecedent rule
            min_confidence = min_confidence_single
            min_support = min_support_single
        else:
            # Multi-antecedent rule
            min_confidence = min_confidence_multi
            min_support = min_support_multi

        # Filter rules by support and confidence thresholds
        if confidence < min_confidence or support < min_support:
            continue

        # Convert antecedents to a tuple for dictionary key
        antecedent_key = tuple(sorted(antecedents))

        # Check if the antecedent set is already in the dictionary
        if antecedent_key not in rules_by_antecedents:
            rules_by_antecedents[antecedent_key] = []

        rule_details = (consequents, confidence, support, lift, conviction)
        rules_by_antecedents[antecedent_key].append(rule_details)

    # Print the top rules for each champion
    # for champion, rules in rules_by_antecedents.items():
    #     print(f"Top rules for {champion}:")
    #     for consequent, confidence, support, lift, conviction in rules[:10]:  # Keep only the top 10 rules
    #         print(f"{consequent}: Confidence {confidence:.4f}, Support {support:.4f}, Lift {lift:.4f}, "
    #               f"Conviction {conviction:.4f}")
    #     print("---")

    return rules_by_antecedents


def merge_rules_by_highest_metric(antecedent_rules, metric='support'):
    # Dictionary to store the merged rules
    merged_rules = {}

    # Iterate through each antecedent and its list of rules
    for antecedent, rules in antecedent_rules.items():
        # Dictionary to store the best rules for each consequent key (based on the specified metric)
        best_rules = {}

        # Iterate through each rule for the current antecedent
        for consequent, confidence, support, lift, conviction in rules:
            # Get the current rule's metric value
            current_metric_value = {'support': support, 'confidence': confidence, 'lift': lift,
                                    'conviction': conviction}[metric]

            # Check if the consequent key already exists in best_rules
            if consequent not in best_rules:
                # Add the current rule as the best rule for this consequent key
                best_rules[consequent] = (confidence, support, lift, conviction)
            else:
                # Get the existing rule's metric value
                existing_metric = best_rules[consequent]
                existing_metric_value = {'support': existing_metric[1], 'confidence': existing_metric[0],
                                         'lift': existing_metric[2], 'conviction': existing_metric[3]}[metric]

                # Update the best rule for this consequent key if the current rule has a higher metric
                if current_metric_value > existing_metric_value:
                    best_rules[consequent] = (confidence, support, lift, conviction)

        # Add the best rules for the current antecedent to the merged_rules dictionary
        merged_rules[antecedent] = best_rules

    # Print by iterating through each antecedent and its merged rules in the dictionary
    # for antecedent, best_rules in merged_rules.items():
    #     print(f"Top rules for {antecedent}:")
    #
    #     # Iterate through the best rules for each consequent key
    #     for consequent, metrics in best_rules.items():
    #         confidence, support, lift, conviction = metrics
    #         print(f"  - {consequent}: Confidence {confidence:.4f}, Support {support:.4f}, Lift {lift:.4f}, "
    #               f"Conviction {conviction:.4f}")
    #
    #     print("---")  # Add a separator line after each antecedent's rules for clarity

    # Return the merged rules dictionary
    return merged_rules


def organize_rules(merged_rules_role, merged_rules_pick):
    # Create the structure for organizing the rules by champion
    organized_rules = {}

    # Define function to categorize rules into single or multi based on the number of antecedents
    def categorize_rules(merged_rules, champion_to_rule_category):
        # Iterate through each set of antecedents and best rules
        for antecedents, best_rules in merged_rules.items():

            # Extract initial information (e.g., BP1 or Red-Bot) and champion from the first antecedent
            initial_info = antecedents[0].split('_')[0]
            champion_name = antecedents[0].split('_')[1]

            # Determine the category (Single or Multi) based on the number of antecedents
            category = 'Single' if len(antecedents) == 1 else 'Multi'

            # Ensure the champion name key exists in the section_dict
            if champion_name not in champion_to_rule_category:
                champion_to_rule_category[champion_name] = {'Single': {}, 'Multi': {}}

            # Ensure the initial_info subcategory exists within the category
            if initial_info not in champion_to_rule_category[champion_name][category]:
                champion_to_rule_category[champion_name][category][initial_info] = {}

            # Add rules to the appropriate subcategory and category based on initial_info
            if category == 'Single':
                # Add rules directly for Single category
                champion_to_rule_category[champion_name][category][initial_info] = best_rules
            else:
                # Iterate through each champion in the antecedent tuple
                for i, ant in enumerate(antecedents):
                    # Remove the current antecedent champion
                    initial_info, current_antecedent = ant.split('_')[0], ant.split('_')[1]

                    other_antecedents = list(antecedents)
                    other_antecedents.pop(i)

                    # Add rule information under the current antecedent champion in the Multi category
                    if current_antecedent not in champion_to_rule_category:
                        champion_to_rule_category[current_antecedent] = {'Single': {}, 'Multi': {}}
                    if initial_info not in champion_to_rule_category[current_antecedent][category]:
                        champion_to_rule_category[current_antecedent][category][initial_info] = {}

                    # Append rule with other antecedents and the rule itself
                    champion_to_rule_category[current_antecedent][category][initial_info] = {
                        'other_antecedents': other_antecedents,
                        'rules': best_rules
                    }
            # Sort and convert rule keys to strings for json format later
            best_rules_string_keys = {}
            for consequents, metrics in best_rules.items():
                consequents_str = json.dumps(consequents)
                best_rules_string_keys[consequents_str] = metrics

            items = list(best_rules_string_keys.items())
            # Sort the list based on the metric index in the tuple values
            sorted_items = sorted(items, key=lambda item: item[1][2])

            # Clear the original dictionary and update it with sorted items
            best_rules.clear()
            best_rules.update(sorted_items)

    # Categorize and organize rules from role and pick into the organized_rules dictionary
    # categorize_rules(merged_rules_role, organized_rules)
    categorize_rules(merged_rules_pick, organized_rules)

    # Print the organized rules (pprint messes with the order so print normally for order)
    pprint(organized_rules, width=160)

    # Return the organized rules dictionary
    return organized_rules


def further_analysis():
    cached_role = CachedTransactions.query.get(1)
    rules_role = apriori_rules(json.loads(cached_role.transactions))
    filtered_rules_role = filter_apriori_rules(rules_role)
    merged_rules_role = merge_rules_by_highest_metric(filtered_rules_role)

    cached_pick = CachedTransactions.query.get(2)
    rules_pick = apriori_rules(json.loads(cached_pick.transactions))
    filtered_rules_pick = filter_apriori_rules(rules_pick, True)
    merged_rules_pick = merge_rules_by_highest_metric(filtered_rules_pick)

    organized_rules = organize_rules(merged_rules_role, merged_rules_pick)

    for champion_name, rules in organized_rules.items():
        # Retrieve the Champion record by name
        champion = Champion.query.filter_by(name=champion_name).first()
        champion.rules = rules

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

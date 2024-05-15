from collections import Counter
import itertools
from models import Champion, CachedTransactions
import json
from database import db


def calculate_frequencies(games):
    ally_counts = Counter()
    enemy_counts = Counter()
    champion_appearances = Counter()

    for game in games:
        for champ in game['team1']:
            champion_appearances[champ] += 1
        for champ in game['team2']:
            champion_appearances[champ] += 1

        for champ1, champ2 in itertools.combinations(game['team1'], 2):
            ally_counts[(champ1, champ2)] += 1
            ally_counts[(champ2, champ1)] += 1
        for champ1, champ2 in itertools.combinations(game['team2'], 2):
            ally_counts[(champ1, champ2)] += 1
            ally_counts[(champ2, champ1)] += 1
        for champ in game['team1']:
            for enemy in game['team2']:
                enemy_counts[(champ, enemy)] += 1
                enemy_counts[(enemy, champ)] += 1

    return ally_counts, enemy_counts, champion_appearances


def calculate_expected_frequencies(champion_appearances, total_games):
    expected_ally_counts = Counter()
    expected_enemy_counts = Counter()

    for (champ1, champ2) in itertools.permutations(champion_appearances.keys(), 2):
        p_champ1 = champion_appearances[champ1] / total_games
        p_champ2 = champion_appearances[champ2] / total_games

        # For allies (same team), each game has 5 champions per team
        expected_ally_counts[(champ1, champ2)] = p_champ1 * p_champ2 * total_games * 0.4

        # For enemies (opposite teams), each game has 5 champions per team against 5 champions on the other team
        expected_enemy_counts[(champ1, champ2)] = p_champ1 * p_champ2 * total_games * 0.5

    return expected_ally_counts, expected_enemy_counts


def rank_counts(counts):
    ranked_counts = {}
    for (champ1, champ2), count in counts.items():
        if champ1 not in ranked_counts:
            ranked_counts[champ1] = Counter()
        ranked_counts[champ1][champ2] = count

    for champ in ranked_counts:
        ranked_counts[champ] = ranked_counts[champ].most_common(15)  # Get top 15

    return ranked_counts


def get_top_allies_and_enemies(champion, ranked_allies, ranked_enemies):
    top_allies = ranked_allies.get(champion, [])
    top_enemies = ranked_enemies.get(champion, [])
    return top_allies, top_enemies


def store_ally_enemy():
    cached_role = db.session.get(CachedTransactions, 1)
    transactions = json.loads(cached_role.transactions)

    games = [
        {'team1': transaction[:5], 'team2': transaction[5:]}
        for transaction in transactions
    ]

    ally_counts, enemy_counts, champion_appearances = calculate_frequencies(games)
    total_games = len(games)
    expected_ally_counts, expected_enemy_counts = calculate_expected_frequencies(champion_appearances, total_games)

    ranked_allies = rank_counts(ally_counts)
    ranked_enemies = rank_counts(enemy_counts)

    champions = Champion.query.all()
    for champion in champions:
        champion_name = champion.name
        top_allies, top_enemies = get_top_allies_and_enemies(champion_name, ranked_allies, ranked_enemies)

        # Add difference between actual and expected values to the top_allies and top_enemies
        top_allies = [
            (ally, count, round(count - expected_ally_counts[(champion_name, ally)], 1))
            for ally, count in top_allies
        ]
        top_enemies = [
            (enemy, count, round(count - expected_enemy_counts[(champion_name, enemy)], 1))
            for enemy, count in top_enemies
        ]

        champion.allies = json.dumps(top_allies)
        champion.enemies = json.dumps(top_enemies)

    db.session.commit()

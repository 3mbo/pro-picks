from flask import Flask, render_template, redirect, request
from flask_scss import Scss
import logging

from database import db, initialize_database
from models import Champion, Slot, MyTask
from data import (fetch_champion_data, add_champions_to_database, fetch_esports_data, fetch_player_data,
                  analyze_esports_data, analyze_player_data, store_esports_data, store_player_data,)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__, static_folder='static')
Scss(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
initialize_database(app)


def initialize_data():
    """Function to initialize data when the application starts."""
    try:
        # Run the initialization code inside the Flask application context
        with app.app_context():
            # Fetch, sort, and add champion data to the database
            champion_data = fetch_champion_data()
            add_champions_to_database(champion_data)

            # Fetch and analyze esports data, then store
            esports_data = fetch_esports_data()
            player_data = fetch_player_data()
            analyzed_esports = analyze_esports_data(esports_data)
            store_esports_data(analyzed_esports)
            analyzed_player = analyze_player_data(player_data)
            store_player_data(analyzed_player)
            champion = Champion.query.filter_by(name='Braum').first()


    except Exception as e:
        print(f"Error while initializing data: {e}")

initialize_data()

@app.route('/', methods=['GET'])
def index():
    tasks = MyTask.query.all()
    champions = Champion.query.order_by(Champion.name.asc()).all()
    slots = Slot.query.all()
    return render_template('index.html', tasks=tasks, champions=champions, slots=slots)


# Delete item
@app.route('/delete/<int:id>', methods=['GET', 'POST'])
def delete(id):
    task = MyTask.query.get_or_404(id)
    try:
        db.session.delete(task)
        db.session.commit()
        return redirect('/')
    except Exception as e:
        print(f'Error: {e}')


# Edit item
@app.route('/update/<int:id>', methods=['GET', 'POST'])
def update(id):
    task = MyTask.query.get_or_404(id)
    if request.method == 'POST':
        task.content = request.form['content']
        try:
            db.session.commit()
            return redirect('/')
        except Exception as e:
            print(f'Error: {e}')
    else:
        return render_template('update.html', task=task)


if __name__ == '__main__':
    app.run(debug=True)


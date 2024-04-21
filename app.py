from flask import Flask, render_template, redirect, request
from flask_scss import Scss
import logging

from database import db, initialize_database
from models import Champion, Slot, MyTask
from data import (fetch_champion_data, add_champions_to_database, fetch_esports_data,
                  analyze_esports_data, store_analyzed_data)

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
            # Fetch and add champion data to the database
            champion_data = fetch_champion_data()
            add_champions_to_database(champion_data)

            # Fetch and analyze esports data, then store
            esports_data = fetch_esports_data()
            json_esports = analyze_esports_data(esports_data)
            store_analyzed_data(json_esports)

    except Exception as e:
        print(f"Error while initializing data: {e}")
initialize_data()

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        current_task = request.form['content']
        new_task = MyTask(content=current_task, completed=False)
        try:
            db.session.add(new_task)
            db.session.commit()
            return redirect('/')
        except Exception as e:
            print(f'Error: {e}')
            return f'There was an error adding task: {e}'

    else:
        tasks = MyTask.query.all()
        champions = Champion.query.all()
        logging.debug(f"Found champions: {champions}")
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


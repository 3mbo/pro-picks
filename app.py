from flask import Flask, render_template
from flask_scss import Scss
import logging

from database import initialize_database
from models import Champion, Slot, CachedTransactions
from data import (get_champion_data, further_analysis)

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
            print("Initializing data...")
            get_champion_data()
            print("Initializing further analysis...")
            further_analysis()
    except Exception as e:
        print(f"Error while initializing data: {e}")


initialize_data()


@app.route('/', methods=['GET'])
def index():
    champions = Champion.query.order_by(Champion.name.asc()).all()
    cached_transactions = CachedTransactions.query.all()
    slots = Slot.query.all()
    number_of_roles = 5
    return render_template('index.html', champions=champions, slots=slots, number_of_roles=number_of_roles,
                           cached_transactions=cached_transactions)


if __name__ == '__main__':
    app.run(debug=False)

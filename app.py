from flask import Flask, render_template, redirect, request, jsonify
from flask_scss import Scss
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__,static_folder='static')
Scss(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
db = SQLAlchemy(app)


class MyTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f'<Task {self.id}>'


class Champion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slots = db.relationship('Slot', back_populates='champion')

    def __repr__(self) -> str:
        return f'<Champion {self.id}>'


class Slot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    champion_id = db.Column(db.Integer, db.ForeignKey('champion.id'))
    champion = db.relationship('Champion', back_populates='slots')

    def __repr__(self) -> str:
        return f'<Slot {self.id} - Champion ID: {self.champion_id}>'


def add_champions_to_database():
    Champion.query.delete()
    for champion_id in range(1, 21):
        champion = Champion(id=champion_id)
        db.session.add(champion)

    db.session.commit()



@app.route('/',methods=['GET','POST'])
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
        slots = Slot.query.all()
        return render_template('index.html', tasks=tasks, champions=champions, slots=slots)


# Delete item
@app.route('/delete/<int:id>',methods=['GET','POST'])
def delete(id):
    task = MyTask.query.get_or_404(id)
    try:
        db.session.delete(task)
        db.session.commit()
        return redirect('/')
    except Exception as e:
        print(f'Error: {e}')


# Edit item

@app.route('/update/<int:id>',methods=['GET','POST'])
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


@app.route('/select/<int:champion_id>', methods=['POST'])
def select(champion_id):
    logging.debug(f"Received request to select champion ID: {champion_id}")
    slot = Slot(champion_id=champion_id)
    db.session.add(slot)
    db.session.commit()
    logging.debug(f"Champion ID {champion_id} added to slot.")
    return jsonify({'status': 'added'})


def remove_champion_from_slot(champion_id):
    slot = Slot.query.filter_by(champion_id=champion_id).first()
    if slot:
        # Remove the champion from the slot by setting champion_id to None
        slot.champion_id = None
        db.session.commit()  # Commit the changes to the database
        logging.info(f"Champion {champion_id} removed from slot {slot.id}")
        return True
    else:
        logging.warning(f"Champion {champion_id} not found in any slot")
        return False

def add_champion_to_champions_list(champion_id):
    # Check if the champion is in the champions list
    champion = Champion.query.get(champion_id)
    if champion:
        logging.info(f"Champion {champion_id} is already in the champions list")
        return True
    else:
        # Create a new Champion object and add it to the database
        new_champion = Champion(id=champion_id, name="New Champion")
        db.session.add(new_champion)
        db.session.commit()
        logging.info(f"Champion {champion_id} added back to the champions list")
        return True
@app.route('/deselect/<int:champion_id>', methods=['POST'])
def deselect(champion_id):
    success = remove_champion_from_slot(champion_id)  # Function to remove champion from slot
    if success:
        add_champion_to_champions_list(champion_id)  # Function to add champion back to champions list
        return jsonify({'success': True, 'champion_id': champion_id})
    else:
        return jsonify({'success': False, 'error': 'Failed to deselect champion'}), 400

with app.app_context():
    db.create_all()
    add_champions_to_database()

if __name__ == '__main__':
    app.run(debug=True)

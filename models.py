from datetime import datetime
from database import db

# Define models
class MyTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Champion(db.Model):
    __tablename__ = 'champions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)

    # Add attributes to store blue picks and bans
    blue_picks = db.Column(db.JSON, nullable=False, default=lambda: [0, 0, 0, 0])
    blue_bans = db.Column(db.JSON, nullable=False, default=lambda: [0, 0])

    # Add attributes to store red picks and bans
    red_picks = db.Column(db.JSON, nullable=False, default=lambda: [0, 0, 0, 0])
    red_bans = db.Column(db.JSON, nullable=False, default=lambda: [0, 0])

    # Relationship with Slot model
    slots = db.relationship('Slot', back_populates='champion', lazy=True)


class Slot(db.Model):
    __tablename__ = 'slots'

    id = db.Column(db.Integer, primary_key=True)

    # Foreign key to link back to the Champion model
    champion_id = db.Column(db.Integer, db.ForeignKey('champions.id'))

    # Relationship with Champion, back_populates the 'slots' attribute in Champion
    champion = db.relationship('Champion', back_populates='slots')

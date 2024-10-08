from database import db


class Champion(db.Model):
    __tablename__ = 'champions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    relevance = db.Column(db.Integer, nullable=False, default=0)

    # Attributes to store blue picks and bans
    blue_picks = db.Column(db.JSON, nullable=False, default=lambda: [0, 0, 0, 0])
    blue_bans = db.Column(db.JSON, nullable=False, default=lambda: [0, 0])

    # Attributes to store red picks and bans
    red_picks = db.Column(db.JSON, nullable=False, default=lambda: [0, 0, 0, 0])
    red_bans = db.Column(db.JSON, nullable=False, default=lambda: [0, 0])

    # Attributes to store pick ban data
    pick_total = db.Column(db.Integer, nullable=False, default=0)
    ban_total = db.Column(db.Integer, nullable=False, default=0)
    pb_pct = db.Column(db.Numeric(precision=10, scale=1), nullable=False, default=0)

    # Attribute to store role stats in the order: Top, Jungle, Mid, Bot, Support
    roles = db.Column(db.JSON, nullable=False, default=lambda: [0, 0, 0, 0, 0])

    # Attribute to store the rules in JSON format
    rules = db.Column(db.JSON, nullable=True, default='{}')

    # Attributes to store frequent allies and enemies:
    allies = db.Column(db.JSON, nullable=True, default='{}')
    enemies = db.Column(db.JSON, nullable=True, default='{}')

    # Relationship with Slot model
    slots = db.relationship('Slot', back_populates='champion', lazy=True)

    # Field to track the last update timestamp
    last_updated = db.Column(db.DateTime, nullable=True, default='2022-02-18')


class Slot(db.Model):
    __tablename__ = 'slots'

    id = db.Column(db.Integer, primary_key=True)

    # Foreign key to link back to the Champion model
    champion_id = db.Column(db.Integer, db.ForeignKey('champions.id'))

    # Relationship with Champion, back_populates the 'slots' attribute in Champion
    champion = db.relationship('Champion', back_populates='slots')


class CachedTransactions(db.Model):
    __tablename__ = 'cached_transactions'

    id = db.Column(db.Integer, primary_key=True)
    transactions = db.Column(db.JSON, nullable=False)
    total = db.Column(db.Integer, nullable=False, default=0)

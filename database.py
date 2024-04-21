from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()

def initialize_database(app):
    """Initialize the database and create tables."""
    db.init_app(app)
    with app.app_context():
        db.create_all()
# reset_db.py
from extensions import db
from app import app

with app.app_context():
    print("🗑️  Drop tables...")
    db.drop_all()
    
    print("🏗️  Create tables...")
    db.create_all()
    
    print("✅ Database reset successfully!")
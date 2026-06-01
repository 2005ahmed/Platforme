from app import app
from extensions import db
from models.user import User
from models.application import Application
import random
from datetime import datetime, timedelta

with app.app_context():

    # 🔍 check ila kayn user
    user = User.query.filter_by(email="test@test.com").first()

    if not user:
        user = User(
            full_name="Ahmed Test",
            email="test@test.com"
        )
        user.set_password("123456")
        db.session.add(user)
        db.session.commit()
        print("✅ User created")
    else:
        print("⚠️ User already exists")

    statuses = ["pending", "accepted", "rejected", "interview"]

    # create applications
    for i in range(20):
        app_item = Application(
            user_id=user.id,
            company=f"Company {i}",
            job_title="Developer",
            status=random.choice(statuses),
            created_at=datetime.now() - timedelta(days=random.randint(0, 60))
        )
        db.session.add(app_item)

    db.session.commit()

    print("✅ Applications added!")
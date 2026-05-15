from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    full_name = db.Column(db.String(120), nullable=False)

    email = db.Column(db.String(180), unique=True, nullable=False)

    password_hash = db.Column(db.String(255), nullable=False)

    phone = db.Column(db.String(40), nullable=True)

    # roles:
    # user
    # recruiter
    # admin
    role = db.Column(db.String(20), default="user")

    applications = db.relationship(
        "Application",
        backref="user",
        lazy=True
    )

    notifications = db.relationship(
        "Notification",
        backref="user",
        lazy=True
    )

    def set_password(self, raw_password: str):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash, raw_password)

    @property
    def is_admin(self):
        return self.role == "admin"

    @property
    def is_recruiter(self):
        return self.role == "recruiter"

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_admin": self.is_admin
        }
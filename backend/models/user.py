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
    photo_url = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.Text)
    cv_filename = db.Column(db.String(255))
    cv_text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    applications = db.relationship(
        "Application",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"  # ⭐ HADI
    )

    notifications = db.relationship(
        "Notification",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"  # ⭐ W HADI
    )

    email_history = db.relationship(
        "EmailHistory",
        backref="candidate",
        lazy=True,
        cascade="all, delete-orphan",
        foreign_keys="EmailHistory.candidate_id"
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
            "is_admin": self.is_admin,
            "cv_filename": self.cv_filename,
            "cv_text": self.cv_text,
            "photo_url": self.photo_url,
            "created_at": self.created_at,
        }
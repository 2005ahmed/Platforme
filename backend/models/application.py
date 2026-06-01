from datetime import datetime
from extensions import db

class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))

    company = db.Column(db.String(180), nullable=False)
    job_title = db.Column(db.String(180), nullable=False)
    status = db.Column(db.String(40), default="En attente")  # En attente / Acceptée / Refusée / Entretien
    applied_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company": self.company,
            "job_title": self.job_title,
            "status": self.status,
            "applied_date": self.applied_date.isoformat() if self.applied_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }
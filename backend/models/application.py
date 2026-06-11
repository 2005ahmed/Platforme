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

    location = db.Column(db.String(255), nullable=True)  # ⭐ NEW: Store job location
    company_email = db.Column(db.String(255), nullable=True)  # ⭐ NEW: Store company email for reminders

    offer_id = db.Column(db.Integer, db.ForeignKey("job_offers.id"), nullable=True)  # ⭐ NEW: Link to offer if accepted
    offer = db.relationship("JobOffer", backref="applications", lazy=True)

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
            "location": self.location,
            "company_email": self.company_email,
            "offer_id": self.offer_id,
            "created_at": self.created_at.isoformat(),
        }
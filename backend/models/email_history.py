from datetime import datetime
from extensions import db

class EmailHistory(db.Model):
    __tablename__ = "email_history"
    
    id = db.Column(db.Integer, primary_key=True)
    
    recruiter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    subject = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(180), nullable=False)
    status = db.Column(db.String(40), default="sent")  # sent / failed / opened
    
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    opened_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "recruiter_id": self.recruiter_id,
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate.full_name if self.candidate else None,
            "subject": self.subject,
            "company": self.company,
            "status": self.status,
            "sent_at": self.sent_at.isoformat(),
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
        }
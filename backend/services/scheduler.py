from datetime import datetime, timedelta
from extensions import db

class ScheduledEmail(db.Model):
    __tablename__ = "scheduled_emails"
    
    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    company = db.Column(db.String(180), nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    sent = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "candidate_name": self.candidate.full_name if self.candidate else None,
            "company": self.company,
            "scheduled_at": self.scheduled_at.isoformat(),
            "sent": self.sent,
        }

# Function bach t-schedule
def schedule_email(recruiter_id, candidate_id, company, scheduled_at):
    scheduled = ScheduledEmail(
        recruiter_id=recruiter_id,
        candidate_id=candidate_id,
        company=company,
        scheduled_at=scheduled_at
    )
    db.session.add(scheduled)
    db.session.commit()
    return scheduled
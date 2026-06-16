from extensions import db
from datetime import datetime

# models/resource.py

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String(50), default="article")
    url = db.Column(db.String(500))
    category = db.Column(db.String(100))
    
    offer_id = db.Column(db.Integer, db.ForeignKey('job_offers.id'), nullable=True)
    offer = db.relationship('JobOffer', backref='offer_resources')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.type,
            "url": self.url,
            "category": self.category,
            "offer_id": self.offer_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    def to_dict_with_offer(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.type,
            "url": self.url,
            "category": self.category,
            "offer_id": self.offer_id,
            "offer": {
                "id": self.offer.id,
                "company": self.offer.company,
                "title": self.offer.title
            } if self.offer else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class JobOffer(db.Model):
    __tablename__ = 'job_offers'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200))
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)
    salary_range = db.Column(db.String(100))
    contract_type = db.Column(db.String(50))
    status = db.Column(db.String(50), default="active")
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "description": self.description,
            "requirements": self.requirements,
            "salary_range": self.salary_range,
            "contract_type": self.contract_type,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }

    def to_dict_with_resources(self):
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "description": self.description,
            "requirements": self.requirements,
            "salary_range": self.salary_range,
            "contract_type": self.contract_type,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "resources": [r.to_dict() for r in self.offer_resources] if hasattr(self, 'offer_resources') else []
        }


class CareerAdvice(db.Model):
    __tablename__ = 'career_advice'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100))
    tags = db.Column(db.String(300))
    target_roles = db.Column(db.String(200), default="all")
    is_featured = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "tags": self.tags,
            "target_roles": self.target_roles,
            "is_featured": self.is_featured,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ReminderSettings(db.Model):
    __tablename__ = 'reminder_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True)
    
    enable_email_reminders = db.Column(db.Boolean, default=True)
    enable_in_app_reminders = db.Column(db.Boolean, default=True)
    follow_up_frequency = db.Column(db.Integer, default=7)
    interview_prep_reminder = db.Column(db.Integer, default=1)
    no_response_reminder = db.Column(db.Integer, default=14)
    weekly_digest = db.Column(db.Boolean, default=True)
    digest_day = db.Column(db.String(10), default="monday")
    reminder_time = db.Column(db.String(5), default="09:00")
    timezone = db.Column(db.String(50), default="Europe/Paris")
    include_ai_tips = db.Column(db.Boolean, default=True)
    include_market_insights = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "enable_email_reminders": self.enable_email_reminders,
            "enable_in_app_reminders": self.enable_in_app_reminders,
            "follow_up_frequency": self.follow_up_frequency,
            "interview_prep_reminder": self.interview_prep_reminder,
            "no_response_reminder": self.no_response_reminder,
            "weekly_digest": self.weekly_digest,
            "digest_day": self.digest_day,
            "reminder_time": self.reminder_time,
            "timezone": self.timezone,
            "include_ai_tips": self.include_ai_tips,
            "include_market_insights": self.include_market_insights
        }
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.resource import ReminderSettings
from extensions import db
from routes import settings_bp 

@settings_bp.get("/reminders")
@jwt_required()
def get_reminder_settings():
    user_id = int(get_jwt_identity())
    settings = ReminderSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = ReminderSettings(user_id=user_id)
        db.session.add(settings)
        db.session.commit()
    return jsonify(settings.to_dict())

@settings_bp.put("/reminders")
@jwt_required()
def update_reminder_settings():
    user_id = int(get_jwt_identity())
    settings = ReminderSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = ReminderSettings(user_id=user_id)
        db.session.add(settings)
    
    data = request.get_json()
    fields = ['enable_email_reminders', 'enable_in_app_reminders',
              'follow_up_frequency', 'interview_prep_reminder', 'no_response_reminder',
              'weekly_digest', 'digest_day', 'reminder_time', 'timezone',
              'include_ai_tips', 'include_market_insights']
    
    for field in fields:
        if field in data:
            setattr(settings, field, data[field])
    
    db.session.commit()
    return jsonify(settings.to_dict())

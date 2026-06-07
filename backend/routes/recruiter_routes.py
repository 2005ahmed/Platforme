from datetime import datetime, timedelta  
from sqlalchemy import func, extract

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.email_history import EmailHistory
from routes import recruiter_bp
from extensions import db

from models.user import User
from models.application import Application
from models.notification import Notification

from services.scheduler import schedule_email
from services.email_service import send_reminder_email


# ==============================
# GET ALL APPLICATIONS
# Recruiter only
# ==============================
# recruiter_routes.py

@recruiter_bp.get("/applications")
@jwt_required()
def get_all_applications():
    user_id = int(get_jwt_identity())
    recruiter = User.query.get(user_id)
    
    if not recruiter or recruiter.role != "recruiter":  # ⭐ FIX
        return jsonify({"message": "Access denied"}), 403

    applications = Application.query.order_by(Application.created_at.desc()).all()
    result = []

    for app in applications:
        candidate = User.query.get(app.user_id)
        
        result.append({
            "id": app.id,
            "company": app.company,
            "job_title": app.job_title,
            "status": app.status,
            "applied_date": app.applied_date.isoformat() if app.applied_date else None,
            "candidate": {
                "id": candidate.id,
                "full_name": candidate.full_name,
                "email": candidate.email,
                "phone": candidate.phone,
                "cv_filename": candidate.cv_filename,  # ⭐ HADI KHASSEK TZIDHA!
                "cv_text": candidate.cv_text[:200] if candidate.cv_text else None,  # ⭐ WLA HADI
            }
        })

    return jsonify(result), 200


# ==============================
# UPDATE APPLICATION STATUS
# Recruiter only
# ==============================
@recruiter_bp.patch("/applications/<int:app_id>/status")
@jwt_required()
def update_application_status(app_id):

    user_id = int(get_jwt_identity())

    recruiter = User.query.get(user_id)

    # CHECK ROLE
    if not recruiter or recruiter.role != "recruiter":  # ⭐ FIX
        return jsonify({"message": "Access denied"}), 403

    app = Application.query.get(app_id)

    if not app:
        return jsonify({
            "message": "Application not found"
        }), 404

    data = request.get_json() or {}

    status = data.get("status")

    allowed_status = [
        "En attente",
        "Entretien",
        "Acceptée",
        "Refusée"
    ]

    if status not in allowed_status:
        return jsonify({
            "message": "Invalid status"
        }), 400

    app.status = status

    db.session.commit()

    return jsonify({
        "message": "Status updated",
        "application": app.to_dict()
    }), 200


# ==============================
# SEND NOTIFICATION
# Recruiter only
# ==============================
@recruiter_bp.post("/send-notification")
@jwt_required()
def send_notification():
    try:  # ⭐ ZID try/except
        user_id = int(get_jwt_identity())
        recruiter = User.query.get(user_id)

        if not recruiter or recruiter.role != "recruiter":  # ⭐ FIX
            return jsonify({"message": "Access denied"}), 403

        data = request.get_json() or {}
        candidate_id = data.get("candidate_id")
        message = data.get("message")

        if not candidate_id or not message:
            return jsonify({"message": "candidate_id and message required"}), 400

        candidate = User.query.get(candidate_id)
        if not candidate:
            return jsonify({"message": "Candidate not found"}), 404

        # ⭐ ZID title
        notification = Notification(
            user_id=candidate.id,
            title="Message du recruteur",  # ⭐ ZID
            type="response",
            message=message
        )

        db.session.add(notification)
        db.session.commit()

        return jsonify({"message": "Notification sent"}), 201
        
    except Exception as e:
        db.session.rollback()  # ⭐ ROLLBACK si erreur
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500
# ==============================
# SEND EMAIL REMINDER
# Recruiter only
# ==============================

# recruiter_routes.py — Zid try/except bach t-chouf error

@recruiter_bp.post("/send-email")
@jwt_required()
def send_email():
    try:
        user_id = int(get_jwt_identity())
        recruiter = User.query.get(user_id)
        
        if not recruiter or recruiter.role != "recruiter":  # ⭐ FIX
            return jsonify({"message": "Access denied"}), 403
        
        data = request.get_json() or {}
        candidate_id = data.get("candidate_id")
        company = data.get("company")
        custom_message = data.get("custom_message")  # ⭐ ZID
        
        if not candidate_id or not company:
            return jsonify({"message": "candidate_id and company required"}), 400
        
        candidate = User.query.get(candidate_id)
        if not candidate:
            return jsonify({"message": "Candidate not found"}), 404
        
        # ⭐ SAVE HISTORY
        history = EmailHistory(
            recruiter_id=recruiter.id,
            candidate_id=candidate.id,
            subject=f"Relance - {company}",
            company=company,
            status="pending"
        )
        db.session.add(history)
        db.session.commit()
        
        # ⭐ SEND EMAIL — 5 params!
        success = send_reminder_email(
            user_id=candidate.id,      # ⭐ nommé
            email=candidate.email,      # ⭐ nommé
            company=company,            # ⭐ nommé
            custom_message=custom_message,  # ⭐ ZID
            history_id=history.id       # ⭐ ZID
        )
        
        if success:
            history.status = "sent"
            db.session.commit()
            return jsonify({"message": "Email sent"}), 200
        else:
            history.status = "failed"
            db.session.commit()
            return jsonify({"message": "Error sending email"}), 500
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@recruiter_bp.get("/email-history")
@jwt_required()
def get_email_history():
    try:
        user_id = int(get_jwt_identity())
        recruiter = User.query.get(user_id)
        
        if not recruiter or recruiter.role != "recruiter":  # ⭐ FIX
            return jsonify({"message": "Access denied"}), 403
        
        history = EmailHistory.query.filter_by(recruiter_id=recruiter.id)\
            .order_by(EmailHistory.sent_at.desc())\
            .all()
        
        result = []
        for h in history:
            candidate = User.query.get(h.candidate_id)
            
            result.append({
                "id": h.id,
                "candidate_name": candidate.full_name if candidate else "Unknown",
                "candidate_email": candidate.email if candidate else "",
                "company": h.company,
                "subject": h.subject,
                "status": h.status,
                "sent_at": h.sent_at.isoformat() if h.sent_at else None,
                "opened_at": h.opened_at.isoformat() if h.opened_at else None,
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500
    # ⭐ SUPPRIMER le deuxième except block!

# ==============================
# RECRUITER ANALYTICS
# ==============================
# recruiter_routes.py


@recruiter_bp.get("/analytics")
@jwt_required()
def recruiter_analytics():
    user_id = int(get_jwt_identity())
    recruiter = User.query.get(user_id)
    
    if not recruiter or recruiter.role != "recruiter":  # ⭐ FIX
        return jsonify({"message": "Access denied"}), 403

    # ⭐ DATES
    today = datetime.utcnow()
    last_30_days = today - timedelta(days=30)
    last_7_days = today - timedelta(days=7)

    # ⭐ TOTALS
    total = Application.query.count()
    accepted = Application.query.filter_by(status="Acceptée").count()
    rejected = Application.query.filter_by(status="Refusée").count()
    interview = Application.query.filter_by(status="Entretien").count()
    pending = Application.query.filter_by(status="En attente").count()

    # ⭐ THIS MONTH vs LAST MONTH (taux d'évolution)
    this_month = Application.query.filter(
        extract('month', Application.created_at) == today.month,
        extract('year', Application.created_at) == today.year
    ).count()
    
    last_month = Application.query.filter(
        extract('month', Application.created_at) == (today.month - 1 if today.month > 1 else 12),
        extract('year', Application.created_at) == (today.year if today.month > 1 else today.year - 1)
    ).count()
    
    month_growth = ((this_month - last_month) / last_month * 100) if last_month > 0 else 0

    # ⭐ WEEKLY DATA (last 7 days)
    daily_stats = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = Application.query.filter(
            func.date(Application.created_at) == date.date()
        ).count()
        daily_stats.append({
            "day": date.strftime("%a"),  # Lun, Mar, Mer...
            "full_date": date.strftime("%Y-%m-%d"),
            "count": count
        })

    # ⭐ STATUS BREAKDOWN (b7al doughnut chart)
    status_breakdown = [
        {"status": "En attente", "count": pending, "color": "#f59e0b"},
        {"status": "Entretien", "count": interview, "color": "#3b82f6"},
        {"status": "Acceptée", "count": accepted, "color": "#22c55e"},
        {"status": "Refusée", "count": rejected, "color": "#ef4444"},
    ]

    # ⭐ TOP CANDIDATES (plus actifs)
    top_candidates = db.session.query(
        User.id,
        User.full_name,
        User.email,
        func.count(Application.id).label('app_count')
    ).join(Application, User.id == Application.user_id)\
     .group_by(User.id)\
     .order_by(func.count(Application.id).desc())\
     .limit(5).all()

    top_candidates_list = [{
        "id": c.id,
        "name": c.full_name,
        "email": c.email,
        "applications": c.app_count
    } for c in top_candidates]

    # ⭐ RECENT ACTIVITY (last 10)
    recent = Application.query.order_by(Application.created_at.desc()).limit(10).all()
    recent_activity = [{
        "id": a.id,
        "candidate": a.user.full_name if a.user else "Unknown",
        "job_title": a.job_title,
        "company": a.company,
        "status": a.status,
        "time": a.created_at.isoformat(),
        "time_ago": time_ago(a.created_at)
    } for a in recent]

    # ⭐ EMAIL STATS
    total_emails = EmailHistory.query.count()
    opened_emails = EmailHistory.query.filter_by(status="opened").count()
    email_rate = (opened_emails / total_emails * 100) if total_emails > 0 else 0

    return jsonify({
        # Totals
        "total_applications": total,
        "accepted": accepted,
        "rejected": rejected,
        "interview": interview,
        "pending": pending,
        
        # Growth
        "this_month": this_month,
        "last_month": last_month,
        "month_growth": round(month_growth, 1),
        
        # Weekly
        "daily_stats": daily_stats,
        
        # Charts
        "status_breakdown": status_breakdown,
        
        # Top
        "top_candidates": top_candidates_list,
        
        # Recent
        "recent_activity": recent_activity,
        
        # Emails
        "total_emails": total_emails,
        "opened_emails": opened_emails,
        "email_open_rate": round(email_rate, 1),
    }), 200


def time_ago(dt):
    """Convert datetime to 'il y a X minutes/heures/jours'"""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 0:
        return f"Il y a {diff.days}j"
    hours = diff.seconds // 3600
    if hours > 0:
        return f"Il y a {hours}h"
    minutes = (diff.seconds % 3600) // 60
    return f"Il y a {minutes}min"


# recruiter_routes.py - Endpoint bach t-jib CV

# recruiter_routes.py

@recruiter_bp.get("/candidate/<int:candidate_id>/cv")
@jwt_required()
def get_candidate_cv(candidate_id):
    user_id = int(get_jwt_identity())
    recruiter = User.query.get(user_id)
    
    if not recruiter or recruiter.role != "recruiter":  # ⭐ FIX
        return jsonify({"message": "Access denied"}), 403
    
    candidate = User.query.get(candidate_id)
    if not candidate:
        return jsonify({"message": "Candidate not found"}), 404
    
    return jsonify({
        "id": candidate.id,
        "full_name": candidate.full_name,
        "has_cv": bool(candidate.cv_filename),
        "cv_filename": candidate.cv_filename,
    }), 200
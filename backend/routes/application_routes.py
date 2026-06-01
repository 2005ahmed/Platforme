from datetime import date
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.application import Application
from models.user import User
from routes import applications_bp
from services.email_service import send_reminder_email

@applications_bp.get("")
@jwt_required()
def list_applications():
    try:
        user_id = int(get_jwt_identity())
        print(f"USER_ID: {user_id}")  # DEBUG
    except:
        return jsonify({"message": "Invalid token"}), 422
    
    status = request.args.get("status")  # optional
    q = Application.query.filter_by(user_id=user_id).order_by(Application.created_at.desc())
    if status:
        q = q.filter_by(status=status)
    return jsonify([a.to_dict() for a in q.all()]), 200

@applications_bp.post("")
@jwt_required()
def create_application():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    # ⭐ Ghir user y9der y-zid candidature
    if not user or user.role != "user":
        return jsonify({"message": "Access denied"}), 403

    data = request.get_json() or {}

    company = (data.get("company") or "").strip()
    job_title = (data.get("job_title") or "").strip()
    
    # ⭐ Force status "En attente" - user ma y9derch y-badel
    status = "En attente"

    applied_date_str = data.get("applied_date")
    applied_date = date.fromisoformat(applied_date_str) if applied_date_str else None

    if not company or not job_title:
        return jsonify({"message": "company and job_title are required"}), 400

    app = Application(
        user_id=user_id,
        company=company,
        job_title=job_title,
        status=status,  # ⭐ "En attente" force
        applied_date=applied_date,
    )

    db.session.add(app)
    db.session.commit()

    return jsonify(app.to_dict()), 201

@applications_bp.put("/<int:app_id>")
@jwt_required()
def update_application(app_id: int):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user :
        return jsonify({"message": "User not found"}), 404
    
    if user.is_admin:
        app = Application.query.get(app_id)
    else:
        app = Application.query.filter_by(id=app_id, user_id=user_id).first()
    
    if not app:
        return jsonify({"message": "Not found"}), 404

    data = request.get_json() or {}
    for field in ["company", "job_title", "status", "notes"]:
        if field in data and data[field] is not None:
            setattr(app, field, str(data[field]).strip())

    if "applied_date" in data:
        app.applied_date = date.fromisoformat(data["applied_date"]) if data["applied_date"] else None

    db.session.commit()
    return jsonify(app.to_dict()), 200

@applications_bp.delete("/<int:app_id>")
@jwt_required()
def delete_application(app_id: int):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user :
        return jsonify({"message": "User not found"}), 404
    

    if user.is_admin:
        app = Application.query.get(app_id)
    else:
        app = Application.query.filter_by(id=app_id, user_id=user_id).first()
    
    if not app:
        return jsonify({"message": "Not found"}), 404

    db.session.delete(app)
    db.session.commit()
    return jsonify({"success": True}), 200

@applications_bp.route("/test-email")
@jwt_required()
def test_email():

    user_id = int(get_jwt_identity())

    send_reminder_email(
        user_id,
        "Google"
    )

    return {"message": "email sent"}
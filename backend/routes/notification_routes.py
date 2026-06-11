from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.notification import Notification
from routes import notifications_bp

from services.email_service import send_reminder_email


@notifications_bp.get("/")
@jwt_required()
def list_notifications():
    user_id = int(get_jwt_identity())
    items = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return jsonify([n.to_dict() for n in items]), 200


@notifications_bp.patch("/<int:notif_id>/read")
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if not n:
        return jsonify({"message": "Not found"}), 404
    n.is_read = True
    db.session.commit()
    return jsonify({"success": True}), 200


@notifications_bp.patch("/read-all")
@jwt_required()
def read_all():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"success": True}), 200


@notifications_bp.delete("/<int:notif_id>")
@jwt_required()
def delete_notification(notif_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if not n:
        return jsonify({"message": "Not found"}), 404
    db.session.delete(n)
    db.session.commit()
    return jsonify({"success": True}), 200


# ⭐ FIX: send_reminder_email signature wassit (5 params)
@notifications_bp.post("/send-reminder")
@jwt_required()
def send_reminder():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    email = data.get("email")
    company = data.get("company")

    if not email or not company:
        return jsonify({"message": "Email and company required"}), 400

    try:
        send_reminder_email(
            user_id=user_id,
            email=email,
            company=company,
            custom_message=data.get("custom_message"),
            history_id=None
        )
        return jsonify({"message": "Email + notification sent"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
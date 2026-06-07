import os
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.user import User
from models.application import Application
from models.notification import Notification
from routes import admin_bp
from extensions import db
import traceback
from models.resource import Resource, JobOffer, CareerAdvice

# ========== GET /admin/stats ==========
@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized - Admin only"}), 403

    from datetime import datetime, timedelta
    from sqlalchemy import extract, func
    
    today = datetime.utcnow()
    last_month = today - timedelta(days=30)

    total_users = User.query.count()
    total_applications = Application.query.count()
    
    # ⭐ ZID: Offres (ila kaynin f model)
    from models.resource import JobOffer
    total_offers = JobOffer.query.filter_by(status="active").count() if 'JobOffer' in globals() else 0
    
    # ⭐ ZID: Users ce mois
    new_users_this_month = User.query.filter(
        User.created_at >= last_month
    ).count()
    
    # ⭐ ZID: Candidatures ce mois
    new_apps_this_month = Application.query.filter(
        Application.created_at >= last_month
    ).count()
    
    # ⭐ ZID: Satisfaction (mock wla calcul réel)
    satisfaction_rate = 94  # Wla calcul men feedback
    
    # ⭐ ZID: Growth rates
    prev_month_users = User.query.filter(
        User.created_at >= last_month - timedelta(days=30),
        User.created_at < last_month
    ).count()
    user_growth = round(((new_users_this_month - prev_month_users) / max(prev_month_users, 1)) * 100, 1)

    by_status = {
        "En attente": Application.query.filter_by(status="En attente").count(),
        "Entretien": Application.query.filter_by(status="Entretien").count(),
        "Acceptée": Application.query.filter_by(status="Acceptée").count(),
        "Refusée": Application.query.filter_by(status="Refusée").count(),
    }

    return jsonify({
        "total_users": total_users,
        "total_applications": total_applications,
        "total_offers": total_offers,  # ⭐
        "satisfaction_rate": satisfaction_rate,  # ⭐
        "new_users_this_month": new_users_this_month,  # ⭐
        "new_apps_this_month": new_apps_this_month,  # ⭐
        "user_growth": user_growth,  # ⭐
        "by_status": by_status
    })


# ========== GET /admin/users ==========
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized - Admin only"}), 403

    users = User.query.all()
    result = []
    for user in users:
        # ⭐ COMPTE CANDIDATURES
        app_count = Application.query.filter_by(user_id=user.id).count()
        
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,  # ⭐ ZID
            "application_count": app_count,  # ⭐ ZID
        })
    return jsonify(result)


# ⭐⭐⭐ ROUTES JDOD ⭐⭐⭐

# ========== DELETE /admin/users/<id> ==========
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_admin:
            return jsonify({"message": "Unauthorized - Admin only"}), 403
        
        if current_user_id == user_id:
            return jsonify({"message": "Cannot delete yourself"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        # Supprimer candidatures
        applications = Application.query.filter_by(user_id=user_id).all()
        for app in applications:
            db.session.delete(app)
        
        # Supprimer notifications
        notifications = Notification.query.filter_by(user_id=user_id).all()
        for notif in notifications:
            db.session.delete(notif)
        
        # ⭐ ZID: Supprimer EmailHistory
        from models.email_history import EmailHistory
        emails = EmailHistory.query.filter_by(candidate_id=user_id).all()
        for e in emails:
            db.session.delete(e)
        
        # ⭐ ZID: Supprimer ReminderSettings
        from models.resource import ReminderSettings
        settings = ReminderSettings.query.filter_by(user_id=user_id).first()
        if settings:
            db.session.delete(settings)
        
        # Supprimer fichiers
        if user.cv_filename:
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], user.cv_filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        
        if user.photo_url:
            filename = user.photo_url.split("/")[-1]
            photo_path = os.path.join(current_app.config["UPLOAD_FOLDER"], "photos", filename)
            if os.path.exists(photo_path):
                os.remove(photo_path)
        
        # Supprimer user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "User deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"ERROR delete_user: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": str(e)}), 400


@admin_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@jwt_required()
def toggle_admin_role(user_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_admin:
            return jsonify({"message": "Unauthorized - Admin only"}), 403
        
        if current_user_id == user_id:
            return jsonify({"message": "Cannot change your own role"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        data = request.get_json() or {}
        is_admin = data.get("is_admin", False)
        
        # ⭐ FIX: Badal les deux!
        user.is_admin = is_admin
        user.role = "admin" if is_admin else "user"
        
        db.session.commit()
        
        return jsonify({
            "message": "Role updated",
            "user_id": user.id,
            "role": user.role,
            "is_admin": user.is_admin,
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": str(e)}), 400
    
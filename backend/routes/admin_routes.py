import os
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.user import User
from models.application import Application
from routes import admin_bp
from extensions import db
import traceback


# ========== GET /admin/stats ==========
@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    # ⭐ Vérifier admin
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized - Admin only"}), 403

    total_users = User.query.count()
    total_applications = Application.query.count()

    by_status = {
        "En attente": Application.query.filter_by(status="En attente").count(),
        "Entretien": Application.query.filter_by(status="Entretien").count(),
        "Acceptée": Application.query.filter_by(status="Acceptée").count(),
        "Refusée": Application.query.filter_by(status="Refusée").count(),
    }

    return jsonify({
        "total_users": total_users,
        "total_applications": total_applications,
        "by_status": by_status
    })


# ========== GET /admin/users ==========
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    # ⭐ Vérifier admin
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized - Admin only"}), 403

    users = User.query.all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
            "role": user.role,
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
        
        # ⭐⭐⭐ SUPPRIMER CANDIDATURES 9BEL L-USER ⭐⭐⭐
        from models.application import Application
        applications = Application.query.filter_by(user_id=user_id).all()
        for app in applications:
            db.session.delete(app)
        
        # Supprimer notifications (ila kaynin)
        from models.notification import Notification
        notifications = Notification.query.filter_by(user_id=user_id).all()
        for notif in notifications:
            db.session.delete(notif)
        
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
        
        # ⭐ DABA SUPPRIMER L-USER
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
        
        print(f"DEBUG - current_user_id: {current_user_id}")
        print(f"DEBUG - current_user: {current_user}")
        print(f"DEBUG - current_user.is_admin: {current_user.is_admin if current_user else 'None'}")
        
        if not current_user or not current_user.is_admin:
            return jsonify({"message": "Unauthorized - Admin only"}), 403
        
        if current_user_id == user_id:
            return jsonify({"message": "Cannot change your own role"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        data = request.get_json() or {}
        print(f"DEBUG - data: {data}")
        
        user.role = "admin" if data.get("is_admin") else "user"
        db.session.commit()
        
        return jsonify({
            "message": "Role updated",
            "user_id": user.id,
            "role": user.role,
            "is_admin": user.is_admin,
        }), 200
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": str(e)}), 400
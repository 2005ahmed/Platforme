from flask import jsonify
from flask_jwt_extended import jwt_required
from models.user import User
from models.application import Application
from routes import admin_bp


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():

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
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    users = User.query.all()

    result = []

    for user in users:
        result.append({
            "id": user.id,
            "email": user.email
        })

    return jsonify(result)
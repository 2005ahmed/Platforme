from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.resource import Resource, JobOffer, CareerAdvice
from models.user import User
from extensions import db
from routes import resources_bp

# ========== RESOURCES ==========
@resources_bp.route("", methods=["GET"])
def list_resources():
    offer_id = request.args.get("offer_id", type=int)  # ⭐ ZID HADI
    
    query = Resource.query
    if offer_id:
        query = query.filter_by(offer_id=offer_id)  # ⭐ FILTER
    
    resources = query.order_by(Resource.created_at.desc()).all()
    return jsonify([r.to_dict() for r in resources])

@resources_bp.route("/by-offer/<int:offer_id>", methods=["GET"])
def get_resources_by_offer(offer_id):
    """Jib ga3 resources li motala9in m3a offer"""
    resources = Resource.query.filter_by(offer_id=offer_id).all()
    return jsonify([r.to_dict() for r in resources])

@resources_bp.route("", methods=["POST"])
@jwt_required()
def create_resource():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    r = Resource(
        title=data.get("title"),
        description=data.get("description"),
        type=data.get("type", "article"),
        url=data.get("url"),
        category=data.get("category"),
        created_by=current_user_id,
        offer_id=data.get("offer_id")  # ⭐ ZID HADI,
    )
    db.session.add(r)
    db.session.commit()
    return jsonify(r.to_dict()), 201

# ========== OFFERS ==========
@resources_bp.route("/offers", methods=["GET"])
def list_offers():
    from datetime import datetime
    offers = JobOffer.query.filter(
        JobOffer.status == "active",
        JobOffer.expires_at > datetime.utcnow()
    ).order_by(JobOffer.created_at.desc()).all()
    
    # ⭐ SE7I7: use to_dict_with_resources()
    return jsonify([o.to_dict_with_resources() for o in offers])

@resources_bp.route("/offers", methods=["POST"])
@jwt_required()
def create_offer():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    from datetime import datetime, timedelta
    
    o = JobOffer(
        title=data.get("title"),
        company=data.get("company"),
        location=data.get("location"),
        description=data.get("description"),
        requirements=data.get("requirements"),
        salary_range=data.get("salary_range"),
        contract_type=data.get("contract_type"),
        expires_at=datetime.utcnow() + timedelta(days=data.get("expires_in_days", 30)),
        created_by=current_user_id
    )
    db.session.add(o)
    db.session.commit()
    return jsonify(o.to_dict()), 201

# ========== ADVICE ==========
@resources_bp.route("/advice", methods=["GET"])
def list_advice():
    advice = CareerAdvice.query.order_by(CareerAdvice.created_at.desc()).all()
    return jsonify([a.to_dict() for a in advice])

@resources_bp.route("/advice", methods=["POST"])
@jwt_required()
def create_advice():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    a = CareerAdvice(
        title=data.get("title"),
        content=data.get("content"),
        category=data.get("category"),
        tags=data.get("tags"),
        target_roles=data.get("target_roles", "all"),
        is_featured=data.get("is_featured", False),
        created_by=current_user_id
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201

# ========== DELETE ==========
@resources_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_resource(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized"}), 403
    r = Resource.query.get_or_404(id)
    db.session.delete(r)
    db.session.commit()
    return jsonify({"success": True})

@resources_bp.route("/offers/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_offer(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized"}), 403
    o = JobOffer.query.get_or_404(id)
    db.session.delete(o)
    db.session.commit()
    return jsonify({"success": True})

@resources_bp.route("/advice/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_advice(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or not current_user.is_admin:
        return jsonify({"message": "Unauthorized"}), 403
    a = CareerAdvice.query.get_or_404(id)
    db.session.delete(a)
    db.session.commit()
    return jsonify({"success": True})
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from routes import ai_bp
from services.ai_service import generate_cover_letter as build_cover_letter



@ai_bp.route("/generate-cover-letter", methods=["POST"])
@jwt_required()
def generate_cover_letter_route():
    data = request.get_json() or {}

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # 🎯 smart mapping (backend flexible)
    job_title = data.get("job_title") or data.get("poste") or user.title or "Développeur"
    company = data.get("company") or data.get("entreprise") or "Entreprise"
    skills = data.get("skills")  or "Développement logiciel"

    # fallback name split safe
    full_name = (user.full_name or "").strip().split()
    prenom = full_name[0] if len(full_name) > 0 else ""
    nom = full_name[-1] if len(full_name) > 1 else full_name[0] if full_name else ""

    payload = {
        "poste": job_title,
        "entreprise": company,
        "competences": skills,
        "prenom": prenom,
        "nom": nom,
        "email": user.email,
        "telephone": user.phone
    }
    

    letter = build_cover_letter(payload)

    return jsonify({"letter": letter}), 200

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from routes import ai_bp
from services.ai_service import( 
    generate_cover_letter as build_cover_letter , 
    extract_text_from_file, 
    analyze_cv_text , 
    chat_cv_followup  , 
    rewrite_cv_section

)


@ai_bp.route("/analyze-cv", methods=["POST"])
def analyze_cv():
    file = request.files.get("cv")

    if not file:
        return jsonify({"error": "No file provided"}), 400

    text = extract_text_from_file(file)

    result = analyze_cv_text(text)

    return jsonify({
        "ai_analysis": result,
        "ats_score": result.get("score"),
        "cv_text_preview": text[:500],
        "session_id": None
    })

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

@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat_route():
    data = request.get_json() or {}
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    message = data.get("message")
    history = data.get("history", [])
    
    if not message:
        return jsonify({"error": "Message is required"}), 400

    # ✅ CONNECTI L'AI VRAIE
    try:
        # Ila bghiti chat général (bila CV context)
        response = chat_cv_followup(
            cv_text="",  # ou cv_text dyal user ila 3andek
            history=[h["content"] for h in history if h.get("content")],
            user_message=message
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"response": response}), 200


@ai_bp.route("/chat-cv", methods=["POST"])
@jwt_required()
def chat_cv_route():
    data = request.get_json() or {}
    user_id = get_jwt_identity()
    
    session_id = data.get("session_id")
    message = data.get("message")
    cv_text = data.get("cv_text", "")  # Khass t'envoi men frontend
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
    
    try:
        response = chat_cv_followup(
            cv_text=cv_text,
            history=[],  # ou history men session
            user_message=message
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"response": response}), 200


@ai_bp.route("/rewrite-cv-section", methods=["POST"])
@jwt_required()
def rewrite_cv_section_route():
    data = request.get_json() or {}
    user_id = get_jwt_identity()
    
    session_id = data.get("session_id")
    section = data.get("section")
    instructions = data.get("instructions", "Rendre plus impactante")
    
    if not section:
        return jsonify({"error": "Section is required"}), 400
    
    # Khass t'jib cv_text men session ou database
    cv_text = data.get("cv_text", "")  # ou men session
    
    try:
        new_version = rewrite_cv_section(
            cv_text=cv_text,
            section=section,
            instructions=instructions
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"new_version": new_version}), 200
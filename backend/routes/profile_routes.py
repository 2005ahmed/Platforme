import os
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from routes import profile_bp
from extensions import db
from models.user import User
from utils.doc_extractor import extract_pdf_text, extract_docx_text

ALLOWED_EXT = {"pdf", "docx"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


@profile_bp.get("")
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify(user.to_dict()), 200


@profile_bp.put("")
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}
    user.full_name = (data.get("full_name") or user.full_name).strip()
    user.phone = data.get("phone", user.phone)
    user.title = data.get("title", user.title)
    user.bio = data.get("bio", user.bio)

    db.session.commit()
    return jsonify(user.to_dict()), 200


@profile_bp.post("/cv")
@jwt_required()
def upload_cv():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if "file" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    f = request.files["file"]
    if f.filename == "":
        return jsonify({"message": "Empty filename"}), 400

    if not allowed_file(f.filename):
        return jsonify({"message": "Only PDF or DOCX allowed"}), 400

    filename = secure_filename(f.filename)
    ext = filename.rsplit(".", 1)[1].lower()

    # Save per user
    save_name = f"user_{user_id}_cv.{ext}"
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], save_name)
    f.save(save_path)

    # Extract text for AI/ATS later
    try:
        if ext == "pdf":
            text = extract_pdf_text(save_path)
        else:
            text = extract_docx_text(save_path)
    except Exception:
        text = ""

    user.cv_filename = save_name
    user.cv_text = text
    db.session.commit()

    return jsonify({"success": True, "cv_filename": save_name}), 200
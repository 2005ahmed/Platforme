import os
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from routes import profile_bp
from extensions import db
from models.user import User
from utils.doc_extractor import extract_pdf_text, extract_docx_text
from utils.pdf_converter import convert_docx_to_pdf
from flask import send_file

ALLOWED_EXT = {"pdf", "docx"}
ALLOWED_PHOTO_EXT = {"png", "jpg", "jpeg", "gif", "webp"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def allowed_photo(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_PHOTO_EXT


# ========== GET /profile ==========
@profile_bp.get("")
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "role": user.role,
        "cv_filename": user.cv_filename,
        "cv_text": user.cv_text,
        "photo_url": user.photo_url,    # ⭐ ZID HADI
    }), 200


# ========== PUT /profile ==========
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
    user.bio = data.get("bio", user.bio)
    user.title = data.get("title", user.title)  # ⭐ ZID HADI

    db.session.commit()
    return jsonify(user.to_dict()), 200


# ========== POST /profile/cv ==========
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


# ========== GET /profile/cv/view/<filename> ==========
@profile_bp.get("/cv/view/<filename>")
@jwt_required()
def view_cv(filename):
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    file_path = os.path.join(upload_folder, filename)
    
    if not os.path.exists(file_path):
        return jsonify({"message": "CV not found"}), 404
    
    if filename.endswith('.pdf'):
        return send_file(file_path, mimetype='application/pdf')
    
    if filename.endswith('.docx'):
        pdf_path = convert_docx_to_pdf(file_path)
        if pdf_path and os.path.exists(pdf_path):
            return send_file(pdf_path, mimetype='application/pdf')
    
    return send_file(file_path, as_attachment=True, download_name=filename)


# ========== DELETE /profile/cv ==========
@profile_bp.delete("/cv")
@jwt_required()
def delete_cv():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.cv_filename:
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        file_path = os.path.join(upload_folder, user.cv_filename)
        
        # Supprimer fichier CV
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"✅ Deleted CV: {file_path}")
        
        # Supprimer PDF converti (ila kayn)
        pdf_path = file_path.replace('.docx', '.pdf')
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
            print(f"✅ Deleted PDF: {pdf_path}")

        # Vider DB
        user.cv_filename = None
        user.cv_text = None
        db.session.commit()

    return jsonify({"message": "CV deleted"}), 200

# ========== POST /profile/photo ==========
@profile_bp.post("/photo")
@jwt_required()
def upload_photo():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if "photo" not in request.files:
        return jsonify({"message": "No photo uploaded"}), 400

    f = request.files["photo"]
    if f.filename == "":
        return jsonify({"message": "Empty filename"}), 400

    if not allowed_photo(f.filename):
        return jsonify({"message": "Only PNG, JPG, JPEG, GIF, WEBP allowed"}), 400

    # Sécuriser le nom
    filename = secure_filename(f.filename)
    ext = filename.rsplit(".", 1)[1].lower()

    # Créer dossier photos
    photo_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "photos")
    os.makedirs(photo_folder, exist_ok=True)

    # Nom unique par user
    save_name = f"user_{user_id}_photo.{ext}"
    save_path = os.path.join(photo_folder, save_name)
    f.save(save_path)

    # Sauvegarder URL en DB
    photo_url = f"/uploads/photos/{save_name}"
    user.photo_url = photo_url
    db.session.commit()

    return jsonify({
        "success": True,
        "photo_url": photo_url
    }), 200


# ========== DELETE /profile/photo ==========
@profile_bp.delete("/photo")
@jwt_required()
def delete_photo():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.photo_url:
        # Supprimer fichier
        filename = user.photo_url.split("/")[-1]
        photo_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "photos")
        file_path = os.path.join(photo_folder, filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)

        # Supprimer de DB
        user.photo_url = None
        db.session.commit()

    return jsonify({"message": "Photo deleted"}), 200


# ========== GET /profile/photo/<filename> ==========
@profile_bp.get("/photo/<filename>")
def serve_photo(filename):
    """
    Servir la photo (public ou protégé selon tes besoins)
    """
    photo_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "photos")
    file_path = os.path.join(photo_folder, filename)
    
    if not os.path.exists(file_path):
        return jsonify({"message": "Photo not found"}), 404
    
    return send_file(file_path)
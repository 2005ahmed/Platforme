import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import timedelta

from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db, jwt , mail , socketio
from config import Config
from services.ai_service import extract_text_from_file, analyze_cv_text
from services.email_service import send_reminder_email

from routes import auth_bp, applications_bp, ai_bp, admin_bp, profile_bp, notifications_bp

import routes.auth_routes
import routes.application_routes
import routes.ai_routes
import routes.admin_routes
import routes.profile_routes
import routes.notification_routes

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config.from_object(Config)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True
)

db.init_app(app)
jwt.init_app(app)
mail.init_app(app)
socketio.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(applications_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(notifications_bp)

with app.app_context():
    db.create_all()


@app.route("/api/analyze-cv", methods=["POST"])
def analyze_cv():
    file = request.files["cv"]
    text = extract_text_from_file(file)
    result = analyze_cv_text(text)
    return jsonify(result)


@app.route("/uploads/<path:filename>", methods=["GET"])
def get_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
@app.route("/test-email")
@jwt_required()
def test_email():

    user_id = int(get_jwt_identity())

    send_reminder_email(
        user_id,
        "Google"
    )

    return {"message": "email sent"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

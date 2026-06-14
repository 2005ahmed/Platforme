import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from datetime import timedelta


from extensions import db, jwt , mail
from config import Config

from routes import (
    auth_bp, 
    applications_bp, 
    ai_bp, 
    admin_bp, 
    profile_bp, 
    notifications_bp,
    recruiter_bp,
    resources_bp,
    settings_bp
    
)

import routes.auth_routes
import routes.application_routes
import routes.ai_routes
import routes.admin_routes
import routes.profile_routes
import routes.notification_routes
import routes.recruiter_routes
import routes.resources_routes
import routes.settings_routes

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config.from_object(Config)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)



CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

db.init_app(app)
jwt.init_app(app)
mail.init_app(app)


app.register_blueprint(auth_bp)
app.register_blueprint(applications_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(recruiter_bp)
app.register_blueprint(resources_bp)
app.register_blueprint(settings_bp)

with app.app_context():
    db.create_all()



@app.route("/uploads/<path:filename>", methods=["GET"])
def get_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

from flask import Blueprint

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
applications_bp = Blueprint("applications", __name__, url_prefix="/api/applications")
ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")
admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")
profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")
notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")
some_bp = Blueprint("some", __name__, url_prefix="/api/some")
recruiter_bp = Blueprint("recruiter", __name__, url_prefix="/api/recruiter")
tracking_bp = Blueprint("tracking", __name__, url_prefix="/api/tracking")
resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')
settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

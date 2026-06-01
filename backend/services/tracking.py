# routes/tracking.py (wla f app.py)

from flask import Blueprint, send_file, request
from models.email_history import EmailHistory
from extensions import db
from datetime import datetime
import io

tracking_bp = Blueprint("tracking", __name__)

@tracking_bp.get("/pixel/<int:email_id>")
def tracking_pixel(email_id):
    """
    1x1 pixel bach t-track wash email t-fetah
    """
    try:
        history = EmailHistory.query.get(email_id)
        
        if history and not history.opened_at:
            history.opened_at = datetime.utcnow()
            history.status = "opened"
            db.session.commit()
            print(f"✅ EMAIL OPENED: id={email_id}")  # DEBUG
        
        # Return 1x1 transparent GIF
        pixel = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        
        return send_file(
            io.BytesIO(pixel),
            mimetype='image/gif',
            as_attachment=False
        )
        
    except Exception as e:
        print(f"❌ TRACKING ERROR: {e}")
        # Return pixel anyway bach ma y-banch error f email
        pixel = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        return send_file(
            io.BytesIO(pixel),
            mimetype='image/gif'
        )
from flask_mail import Message
from config import Config
from extensions import mail, db, socketio

from models.notification import Notification
from models.user import User

def send_reminder_email(user_id, company):

    # GET USER
    user = User.query.get(user_id)

    if not user:
        return

    # EMAIL
    msg = Message(
        subject="Relance candidature",
        sender=Config.MAIL_USERNAME,
        recipients=[user.email]
    )

    msg.body = f"""
    Bonjour {user.full_name},
    N'oubliez pas de relancer votre candidature chez {company}.
    Bonne chance.
    """

    mail.send(msg)

    # DATABASE NOTIFICATION
    notification = Notification(
        user_id=user_id,
        message=f"Relance envoyée pour {company}",
        is_read=False
    )

    db.session.add(notification)
    db.session.commit()

    # REALTIME SOCKET
    socketio.emit(
        "new_notification",
        {
            "user_id": user_id,
            "message": notification.message
        },
        room=str(user_id)
    )
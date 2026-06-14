import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    DB_HOST = os.getenv("DB_HOST" , "localhost")
    DB_PORT = os.getenv("DB_PORT" , "3306")
    DB_USER = os.getenv("DB_USER" , "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD" , "")
    DB_NAME = os.getenv("DB_NAME","jobtracker")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    # OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "jobtracker056@gmail.com")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")  # ⭐ FIX: Use env var!
    MAIL_DEFAULT_SENDER = ("JobTracker", os.getenv("MAIL_USERNAME", "jobtracker056@gmail.com"))
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN python -m pip install --upgrade pip && \
    python -m pip uninstall -y docx || true && \
    python -m pip install --no-cache-dir --force-reinstall -r requirements.txt && \
    python -c "import docx; print('DOCX:', docx.__file__)"

COPY . .

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} app:app"]
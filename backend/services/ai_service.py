# services/ai_service.py — qwen2.5:3b (LETTRE + CHAT CV) — CORRIGÉ
import os
import requests
import PyPDF2
import docx
from datetime import datetime
from flask import current_app
import json

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")


class OllamaService:
    """Service AI — qwen2.5:3b"""

    def __init__(self, model=None, url=None):
        self.model = model or OLLAMA_MODEL
        self.url = url or OLLAMA_URL
        self.generate_url = f"{self.url}/api/generate"
        self.chat_url = f"{self.url}/api/chat"

    def is_available(self):
        try:
            response = requests.get(f"{self.url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False

    def check_model(self):
        try:
            response = requests.get(f"{self.url}/api/tags", timeout=5)
            models = response.json().get('models', [])
            return any(self.model in m.get('name', '') for m in models)
        except:
            return False

    def generate(self, prompt, system=None, stream=False, temperature=0.7):
        """Appel Ollama generate"""
        if not self.is_available():
            raise RuntimeError("Ollama n'est pas démarré !")

        if not self.check_model():
            raise RuntimeError(f"Modèle '{self.model}' non trouvé !")

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "top_p": 0.9,
                "num_predict": 1024
            }
        }
        if system:
            payload["system"] = system

        try:
            response = requests.post(
                self.generate_url,
                json=payload,
                timeout=600,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json().get("response", "")
        except Exception as e:
            raise RuntimeError(f"Erreur: {str(e)}")

    def chat(self, messages, stream=False, temperature=0.7):
        """Appel Ollama chat (format messages)"""
        if not self.is_available():
            raise RuntimeError("Ollama n'est pas démarré !")

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "top_p": 0.9,
                "num_predict": 1024
            }
        }

        try:
            response = requests.post(
                self.chat_url,
                json=payload,
                timeout=120,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()
            return result["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"Erreur chat: {str(e)}")


# Instance
ollama = OllamaService()


# ==================== ⭐ LETTRE DE MOTIVATION ====================

def generate_cover_letter(data):
    """Génère lettre de motivation EN FRANÇAIS"""
    if isinstance(data, str):
        data = {
            "poste": data,
            "entreprise": "",
            "competences": "",
            "experience": "",
            "nom": "",
            "prenom": ""
        }

    today = datetime.now().strftime("%d/%m/%Y")

    system = """Tu es un expert en rédaction de lettres de motivation professionnelles.
Tu rédiges des lettres formelles en français.
RÈGLE ABSOLUE: Réponds UNIQUEMENT en français. JAMAIS en anglais."""

    prompt = f"""Rédige une lettre de motivation en FRANÇAIS pour le poste de {data.get('poste', '')} chez {data.get('entreprise', '')}.

INFORMATIONS DU CANDIDAT:
- Compétences: {data.get('competences', '')}
- Expérience: {data.get('experience', '')}
- Nom: {data.get('prenom', '').capitalize()} {data.get('nom', '').capitalize()}

RÈGLES:
1. UNIQUEMENT en français
2. Format lettre formelle française
3. Longueur: 200-300 mots
4. Date: {today}
5. Signature: {data.get('prenom', '').capitalize()} {data.get('nom', '').capitalize()}

EXEMPLE DE STRUCTURE:
Safi, le {today}
À l'attention du Responsable Recrutement
{data.get('entreprise', '')}
Madame, Monsieur,
Je me permets de vous adresser ma candidature...
Cordialement,
{data.get('prenom', '').capitalize()} {data.get('nom', '').capitalize()}
plain

LETTRE COMPLÈTE EN FRANÇAIS:"""

    return ollama.generate(prompt, system=system)


# ==================== ANALYSE CV INITIALE ====================

def analyze_cv_text(cv_text, job_description=""):
    """Analyse CV avec sortie JSON clean"""

    system = """
Tu es un expert en recrutement.
Tu réponds UNIQUEMENT en JSON valide.
Aucun texte hors JSON.
"""

    prompt = f"""
Analyse ce CV en francais et retourne UNIQUEMENT un JSON valide:

{{
  "resume": "Résumé du candidat",
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "weaknesses": ["point faible 1", "point faible 2"],
  "suggestions": ["amélioration 1", "amélioration 2"],
  "score": {{
    "overall": 0,
    "grade": "A",
    "is_ats_friendly": true
  }}
}}

CV:
{cv_text[:2500]}

POSTE:
{job_description}

IMPORTANT:
- Return ONLY valid JSON
- No markdown
- No explanation
"""

    try:
        response = ollama.generate(prompt, system=system)

        # 🔥 clean response
        response = response.strip()

        # remove possible markdown garbage
        if "```" in response:
            response = response.replace("```json", "").replace("```", "")

        data = json.loads(response)

        return data

    except Exception as e:
        return {
            "resume": "Erreur d'analyse",
            "strengths": [],
            "weaknesses": [],
            "suggestions": [],
            "score": {
                "overall": 0,
                "grade": "F",
                "is_ats_friendly": False
            },
            "error": str(e)
        }


# ==================== CHAT CV INTERACTIF ====================

def chat_cv_followup(cv_text, history, user_message, job_description=""):
    """Chat interactif pour améliorer le CV"""
    
    system = """Tu es un consultant RH français expert.
Tu aides les candidats à améliorer leur CV.
RÈGLE: Réponds UNIQUEMENT en français."""

    first_response = history[0] if history and len(history) > 0 else "J'ai analysé votre CV."

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Voici mon CV:\n{cv_text[:2000]}\n\n{f'Poste visé: {job_description[:500]}' if job_description else ''}"},
        {"role": "assistant", "content": first_response}
    ]

    for i, msg in enumerate(history[1:], 1):
        role = "user" if i % 2 == 1 else "assistant"
        messages.append({"role": role, "content": msg})

    messages.append({"role": "user", "content": user_message})

    return ollama.chat(messages)


# ==================== SUGGESTIONS SPÉCIFIQUES ====================

def get_cv_section_advice(cv_text, section, job_description=""):
    """Conseil sur une section spécifique du CV"""
    
    system = "Tu es un consultant RH français. Réponds UNIQUEMENT en français."

    prompt = f"""Donne des conseils pour la section "{section}" de ce CV.

CONTENU DU CV:
{cv_text[:2000]}

{f"POSTE VISÉ:{job_description[:500]}" if job_description else ""}

Donne:
1. Ce qui est bien
2. Ce qui peut être amélioré
3. Un exemple de reformulation

RÉPONSE EN FRANÇAIS:"""

    return ollama.generate(prompt, system=system)


# ==================== REFORMULATION CV ====================

def rewrite_cv_section(cv_text, section, instructions, job_description=""):
    """Reformule une section du CV"""
    
    system = "Tu es un rédacteur de CV professionnel français. Réponds UNIQUEMENT en français."

    prompt = f"""Reformule la section "{section}" selon: {instructions}

CONTENU DU CV:
{cv_text[:2000]}

{f"POSTE VISÉ:{job_description[:500]}" if job_description else ""}

NOUVELLE VERSION EN FRANÇAIS:"""

    return ollama.generate(prompt, system=system)


# ==================== EXTRACTION CV ====================

def extract_text_from_file(file):
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    elif filename.endswith(".docx"):
        doc = docx.Document(file)
        return "\n".join([para.text for para in doc.paragraphs])

    elif filename.endswith((".png", ".jpg", ".jpeg")):
        try:
            from PIL import Image
            import pytesseract
        except ImportError as exc:
            raise RuntimeError("OCR non installé") from exc
        image = Image.open(file)
        return pytesseract.image_to_string(image)

    return ""
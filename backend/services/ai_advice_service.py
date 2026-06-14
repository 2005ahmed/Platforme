# services/ai_advice_service.py — qwen2.5:3b (KHEFAF)
from models.application import Application
from models.user import User
from extensions import db
from .ai_service import ollama


class AIAdviceService:
    """Conseils carrière — qwen2.5:3b rapide"""

    def __init__(self):
        self.service = ollama

    def generate_personalized_advice(self, user_id):
        """Conseils rapides"""
        apps = Application.query.filter_by(user_id=user_id).all()

        if not apps:
            return {
                "advice": "Postulez à 5 offres par semaine.",
                "actions": ["Complétez votre profil", "Optimisez votre CV"]
            }

        total = len(apps)
        by_status = {}
        for a in apps:
            by_status[a.status] = by_status.get(a.status, 0) + 1

        # Conseil IA rapide
        try:
            prompt = f"Donne 2 conseils pour candidat avec {total} candidatures, statuts: {by_status}. Réponse courte."
            ai_advice = ollama.generate(prompt)
        except:
            ai_advice = None

        return {
            "total_applications": total,
            "status_breakdown": by_status,
            "ai_advice": ai_advice,
            "next_steps": ["Postulez plus", "Relancez les recruteurs"]
        }

    def interview_prep(self, job_title, company_name=""):
        """Préparation rapide"""
        prompt = f"3 questions d'entretien pour {job_title} {company_name}. Réponses courtes."
        return ollama.generate(prompt)


ai_advice_service = AIAdviceService()
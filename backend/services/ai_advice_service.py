from models.application import Application
from models.user import User
from extensions import db

def generate_personalized_advice(user_id):
    """
    Génère des conseils personnalisés basés sur l'historique des candidatures
    """
    apps = Application.query.filter_by(user_id=user_id).all()
    user = User.query.get(user_id)
    
    if not apps:
        return {
            "advice": "Commencez par postuler à au moins 5 offres par semaine pour construire votre pipeline.",
            "insights": {
                "total_applications": 0,
                "response_rate": 0,
                "bottleneck": "no_applications"
            },
            "actions": [
                "Complétez votre profil à 100%",
                "Téléchargez un CV optimisé ATS",
                "Ciblez des postes correspondant à 80%+ de vos compétences"
            ]
        }
    
    total = len(apps)
    by_status = {}
    for a in apps:
        by_status[a.status] = by_status.get(a.status, 0) + 1
    
    response_rate = round(((by_status.get("Entretien", 0) + 
                           by_status.get("Acceptée", 0) + 
                           by_status.get("Refusée", 0)) / total) * 100, 1)
    
    # Analyse patterns
    advice = []
    actions = []
    bottleneck = None
    
    if by_status.get("En attente", 0) / total > 0.7:
        advice.append("70%+ de vos candidatures sont en attente. Relancez après 7-10 jours.")
        actions.append("Envoyez des emails de relance personnalisés")
        bottleneck = "too_many_pending"
    
    if by_status.get("Refusée", 0) / total > 0.5:
        advice.append("Taux de refus élevé. Votre CV ne passe peut-être pas les ATS.")
        actions.extend([
            "Optimisez votre CV avec des mots-clés du poste",
            "Personnalisez chaque candidature",
            "Demandez un feedback aux recruteurs"
        ])
        bottleneck = "high_rejection"
    
    if by_status.get("Entretien", 0) > 0 and by_status.get("Acceptée", 0) == 0:
        advice.append("Vous passez des entretiens mais n'obtenez pas d'offres. Travaillez votre pitch.")
        actions.extend([
            "Préparez des stories STAR",
            "Faites des simulations d'entretien",
            "Recherchez des retours d'expérience"
        ])
        bottleneck = "interview_no_offer"
    
    if response_rate < 20:
        advice.append("Taux de réponse faible. Ciblez mieux vos candidatures.")
        actions.extend([
            "Postulez uniquement si vous correspondez à 80%+ des critères",
            "Utilisez le réseau pour des recommandations",
            "Personnalisez votre lettre de motivation"
        ])
        bottleneck = "low_response"
    
    if not advice:
        advice.append("Bonne progression ! Continuez à diversifier vos candidatures.")
        bottleneck = "healthy"
    
    # Conseils sectoriels
    sector_tips = []
    companies = list(set([a.company for a in apps]))
    if len(companies) < 3:
        sector_tips.append("Diversifiez les entreprises ciblées (actuellement < 3).")
    
    return {
        "advice": " ".join(advice),
        "insights": {
            "total_applications": total,
            "response_rate": response_rate,
            "status_breakdown": by_status,
            "bottleneck": bottleneck
        },
        "actions": actions,
        "sector_tips": sector_tips,
        "next_steps": [
            f"Objectif: {max(5 - by_status.get('En attente', 0), 0)} nouvelles candidatures cette semaine",
            "Mettez à jour votre CV avec les retours reçus",
            "Activez les rappels automatiques pour les relances"
        ]
    }
from datetime import date, datetime
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.application import Application
from models.user import User
from models.resource import JobOffer
from routes import applications_bp
from services.email_service import send_reminder_email


# ========== LIST APPLICATIONS ==========
@applications_bp.get("")
@jwt_required()
def list_applications():
    try:
        user_id = int(get_jwt_identity())
    except:
        return jsonify({"message": "Invalid token"}), 422

    status = request.args.get("status")
    q = Application.query.filter_by(user_id=user_id).order_by(Application.created_at.desc())
    if status:
        q = q.filter_by(status=status)
    return jsonify([a.to_dict() for a in q.all()]), 200


# ========== CREATE APPLICATION ==========
@applications_bp.post("")
@jwt_required()
def create_application():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user or user.role != "user":
        return jsonify({"message": "Access denied"}), 403

    data = request.get_json() or {}
    company = (data.get("company") or "").strip()
    job_title = (data.get("job_title") or "").strip()
    status = data.get("status", "En attente")
    applied_date_str = data.get("applied_date")
    applied_date = date.fromisoformat(applied_date_str) if applied_date_str else None

    # ⭐ NEW: Get location & email from offer or data
    location = data.get("location", "").strip()
    company_email = data.get("company_email", "").strip()
    offer_id = data.get("offer_id")

    # If offer_id provided, get location/email from offer
    if offer_id:
        offer = JobOffer.query.get(offer_id)
        if offer:
            location = location or offer.location or ""
            company_email = company_email or ""  # Offer doesn't have email, keep from data

    if not company or not job_title:
        return jsonify({"message": "company and job_title are required"}), 400

    app = Application(
        user_id=user_id,
        company=company,
        job_title=job_title,
        status=status,
        applied_date=applied_date,
        location=location,
        company_email=company_email,
        offer_id=offer_id,
    )
    db.session.add(app)
    db.session.commit()
    return jsonify(app.to_dict()), 201


# ========== UPDATE APPLICATION ==========
@applications_bp.put("/<int:app_id>")
@jwt_required()
def update_application(app_id: int):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.is_admin:
        app = Application.query.get(app_id)
    else:
        app = Application.query.filter_by(id=app_id, user_id=user_id).first()

    if not app:
        return jsonify({"message": "Not found"}), 404

    data = request.get_json() or {}
    for field in ["company", "job_title", "status", "notes", "location", "company_email"]:
        if field in data and data[field] is not None:
            setattr(app, field, str(data[field]).strip())

    if "applied_date" in data:
        app.applied_date = date.fromisoformat(data["applied_date"]) if data["applied_date"] else None

    db.session.commit()
    return jsonify(app.to_dict()), 200


# ========== DELETE APPLICATION ==========
@applications_bp.delete("/<int:app_id>")
@jwt_required()
def delete_application(app_id: int):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.is_admin:
        app = Application.query.get(app_id)
    else:
        app = Application.query.filter_by(id=app_id, user_id=user_id).first()

    if not app:
        return jsonify({"message": "Not found"}), 404

    db.session.delete(app)
    db.session.commit()
    return jsonify({"success": True}), 200


# ========== GET SINGLE APPLICATION (for edit) ==========
@applications_bp.get("/<int:app_id>")
@jwt_required()
def get_application(app_id: int):
    user_id = int(get_jwt_identity())
    app = Application.query.filter_by(id=app_id, user_id=user_id).first()
    if not app:
        return jsonify({"message": "Not found"}), 404
    return jsonify(app.to_dict()), 200


# ========== EMAIL TEST ==========
@applications_bp.route("/test-email")
@jwt_required()
def test_email():
    user_id = int(get_jwt_identity())
    send_reminder_email(user_id, "Google")
    return {"message": "email sent"}


# ========== AI TIPS ==========
@applications_bp.route("/ai-tips", methods=["GET"])
@jwt_required()
def get_my_ai_tips():
    candidate_id = int(get_jwt_identity())
    candidate = User.query.get_or_404(candidate_id)

    applications = Application.query.filter_by(user_id=candidate_id).all()

    total = len(applications)
    accepted = len([a for a in applications if a.status == "Acceptée"])
    interview = len([a for a in applications if a.status == "Entretien"])
    rejected = len([a for a in applications if a.status == "Refusée"])
    pending = len([a for a in applications if a.status == "En attente"])

    tips = []

    if total > 0:
        conversion_rate = (accepted / total) * 100
        if conversion_rate < 20:
            tips.append({
                "type": "warning",
                "title": "Améliorez votre ciblage",
                "message": f"Votre taux de conversion est de {conversion_rate:.0f}%. Postulez à des postes plus adaptés."
            })
        elif conversion_rate > 50:
            tips.append({
                "type": "success",
                "title": "Profil très demandé!",
                "message": f"Excellent! {conversion_rate:.0f}% de vos candidatures sont acceptées."
            })

    if interview > 0 and accepted == 0:
        tips.append({
            "type": "info",
            "title": "Travaillez vos entretiens",
            "message": f"{interview} entretien(s) sans succès. Préparez-vous mieux aux questions techniques."
        })

    if pending > 2:
        tips.append({
            "type": "warning",
            "title": "Relancez vos candidatures",
            "message": f"{pending} candidatures sans réponse. Envoyez des relances!"
        })

    if rejected > 2:
        tips.append({
            "type": "error",
            "title": "Optimisez votre CV",
            "message": f"{rejected} refus. Votre CV ne passe peut-être pas les filtres ATS."
        })

    companies = list(set([a.company for a in applications]))
    if len(companies) < 2 and total > 2:
        tips.append({
            "type": "info",
            "title": "Diversifiez vos cibles",
            "message": "Vous postulez toujours aux mêmes entreprises. Élargissez votre recherche!"
        })

    if total < 3:
        tips.append({
            "type": "info",
            "title": "Postulez plus",
            "message": "Postulez à au moins 5 offres par semaine pour maximiser vos chances."
        })

    return jsonify({
        "candidate_id": candidate_id,
        "candidate_name": candidate.full_name,
        "total_applications": total,
        "stats": {
            "accepted": accepted,
            "interview": interview,
            "rejected": rejected,
            "pending": pending
        },
        "tips": tips,
        "last_updated": datetime.utcnow().isoformat()
    }), 200


# ========== ATS SCORE ==========
@applications_bp.route("/ats-score", methods=["GET"])
@jwt_required()
def get_my_ats_score():
    candidate_id = int(get_jwt_identity())
    candidate = User.query.get_or_404(candidate_id)

    score = 0
    tips = []
    details = {}

    # 1. INFORMATIONS DE BASE (20 pts)
    basic_score = 0
    if candidate.full_name and len(candidate.full_name) > 3:
        basic_score += 5
    else:
        tips.append("❌ Ajoutez votre nom complet sur votre profil")

    if candidate.email and "@" in candidate.email:
        basic_score += 5
    else:
        tips.append("❌ Ajoutez un email professionnel valide")

    if candidate.phone:
        basic_score += 5
    else:
        tips.append("⚠️ Ajoutez un numéro de téléphone")

    if getattr(candidate, 'location', None):
        basic_score += 5
    else:
        tips.append("⚠️ Ajoutez votre localisation")

    score += basic_score
    details["basic_info"] = basic_score

    # 2. QUALITÉ DU CV (35 pts)
    cv_score = 0
    if candidate.cv_filename:
        cv_score += 20
        tips.append("✅ CV uploadé")

        if candidate.cv_filename.endswith('.pdf'):
            cv_score += 10
            tips.append("✅ Format PDF optimal pour les ATS")
        elif candidate.cv_filename.endswith('.docx'):
            cv_score += 5
            tips.append("⚠️ Format DOCX acceptable, PDF recommandé")
        else:
            tips.append("❌ Format non standard — convertissez en PDF")

        cv_score += 5
    else:
        tips.append("❌ Aucun CV uploadé — c'est critique!")
        tips.append("💡 Uploadez un CV en PDF: Prenom_Nom_CV.pdf")

    score += cv_score
    details["cv_quality"] = cv_score

    # 3. ACTIVITÉ (20 pts)
    activity_score = 0
    applications = Application.query.filter_by(user_id=candidate_id).all()

    if len(applications) > 0:
        activity_score += 5
    if len(applications) >= 3:
        activity_score += 10
    if len(applications) >= 5:
        activity_score += 5
    else:
        tips.append("💡 Postulez à au moins 5 offres pour montrer votre motivation")

    score += activity_score
    details["activity"] = activity_score

    # 4. DIVERSITÉ (15 pts)
    diversity_score = 0
    companies = list(set([a.company for a in applications]))
    job_titles = list(set([a.job_title for a in applications]))

    if len(companies) >= 2:
        diversity_score += 5
    if len(companies) >= 4:
        diversity_score += 5
    if len(job_titles) >= 2:
        diversity_score += 5
    else:
        tips.append("💡 Diversifiez les types de postes et entreprises ciblés")

    score += diversity_score
    details["diversity"] = diversity_score

    # 5. PROFIL COMPLET (10 pts)
    profile_score = 0
    if getattr(candidate, 'skills', None):
        profile_score += 5
    else:
        tips.append("⚠️ Ajoutez vos compétences clés")

    if getattr(candidate, 'experience', None) or candidate.bio:
        profile_score += 5
    else:
        tips.append("⚠️ Complétez votre expérience professionnelle")

    score += profile_score
    details["profile_complete"] = profile_score

    # STATUS
    if score >= 85:
        status = "excellent"
        status_text = "🌟 Excellent — Votre profil est très attractif"
    elif score >= 65:
        status = "good"
        status_text = "✅ Bon — Quelques optimisations possibles"
    elif score >= 45:
        status = "average"
        status_text = "⚠️ Moyen — Des améliorations nécessaires"
    else:
        status = "poor"
        status_text = "❌ À améliorer — Suivez les conseils ci-dessous"

    return jsonify({
        "candidate_id": candidate_id,
        "score": score,
        "max_score": 100,
        "status": status,
        "status_text": status_text,
        "cv_filename": candidate.cv_filename,
        "tips": tips,
        "details": details,
        "improvement_potential": 100 - score,
        "last_updated": datetime.utcnow().isoformat()
    }), 200


# ========== CV IMPROVEMENTS ==========
@applications_bp.route("/cv-improvements", methods=["GET"])
@jwt_required()
def get_cv_improvements():
    candidate_id = int(get_jwt_identity())
    candidate = User.query.get_or_404(candidate_id)

    improvements = []

    if not candidate.cv_filename:
        improvements = [
            {"priority": "critical", "section": "CV", "tip": "Uploadez votre CV immédiatement", "action": "Allez dans Profil > Upload CV"},
            {"priority": "high", "section": "Format", "tip": "Utilisez un format PDF", "action": "Exportez en PDF depuis Word/Google Docs"},
            {"priority": "high", "section": "Nom", "tip": "Nommez le fichier: Prenom_Nom_CV.pdf", "action": "Renommez avant upload"}
        ]
    else:
        improvements = [
            {"priority": "medium", "section": "Mots-clés", "tip": "Incluez les mots-clés de l'offre dans votre CV", "action": "Relisez l'offre et adaptez votre CV"},
            {"priority": "medium", "section": "Structure", "tip": "Sections claires: Expérience, Compétences, Formation", "action": "Réorganisez votre CV"},
            {"priority": "low", "section": "Action verbs", "tip": "Verbes d'action: Développé, Géré, Optimisé", "action": "Reformulez vos bullet points"}
        ]

        if not getattr(candidate, 'skills', None):
            improvements.append({
                "priority": "high", 
                "section": "Compétences", 
                "tip": "Ajoutez une section Compétences techniques", 
                "action": "Listez vos hard skills (Python, React, SQL...)"
            })

    return jsonify({
        "candidate_id": candidate_id,
        "improvements": improvements,
        "priority_order": ["critical", "high", "medium", "low"]
    }), 200
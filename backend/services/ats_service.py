# services/ats_service.py — CHAT CV INTERACTIF
import re
from collections import Counter
from .ai_service import ollama

SECTOR_KEYWORDS = {
    "tech": ["python", "javascript", "react", "sql", "docker", "git", "aws"],
    "data": ["python", "sql", "pandas", "machine learning", "tensorflow"],
    "design": ["figma", "ui/ux", "prototyping", "responsive design"]
}


def analyze_ats_score(cv_text, job_description=None, sector="tech"):
    """Analyse ATS basique"""
    cv_lower = cv_text.lower()
    words = re.findall(r'\b\w+\b', cv_lower)
    word_count = len(words)

    keywords = SECTOR_KEYWORDS.get(sector, SECTOR_KEYWORDS["tech"])
    if job_description:
        jd_words = re.findall(r'\b\w+\b', job_description.lower())
        keywords = list(set(keywords + [w for w in jd_words if len(w) > 3]))[:30]

    found_keywords = [k for k in keywords if k in cv_lower]
    keyword_score = (len(found_keywords) / len(keywords) * 100) if keywords else 0

    standard_headings = ["experience", "education", "skills", "summary", "contact"]
    found_headings = [h for h in standard_headings if h in cv_lower]
    structure_score = (len(found_headings) / len(standard_headings)) * 100

    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text))
    has_phone = bool(re.search(r'\+?\d[\d\s-]{8,}', cv_text))
    contact_score = (has_email + has_phone) / 2 * 100

    final_score = round(keyword_score * 0.4 + structure_score * 0.3 + contact_score * 0.3, 1)

    suggestions = []
    missing = [k for k in keywords if k not in cv_lower]
    if missing:
        suggestions.append(f"Ajoutez: {', '.join(missing[:3])}")
    if structure_score < 80:
        suggestions.append("Ajoutez sections: Experience, Skills, Education")

    return {
        "overall_score": final_score,
        "grade": "A" if final_score >= 80 else "B" if final_score >= 60 else "C",
        "breakdown": {
            "keywords": round(keyword_score, 1),
            "structure": round(structure_score, 1),
            "contact": round(contact_score, 1)
        },
        "suggestions": suggestions,
        "is_ats_friendly": final_score >= 60,
        "sections_found": found_headings
    }


def optimize_cv_suggestions(cv_text, job_description, sector="tech"):
    """Optimisation + chat interactif"""
    analysis = analyze_ats_score(cv_text, job_description, sector)

    # Suggestions pour chaque section
    sections = ["experience", "skills", "education", "summary"]
    section_tips = {}

    for section in sections:
        if section not in analysis["sections_found"]:
            section_tips[section] = f"Section '{section}' manquante. Ajoutez-la."

    # IA suggestions
    try:
        system = "Tu es un consultant RH français. Réponds UNIQUEMENT en français."
        prompt = f"""Donne 3 conseils en FRANÇAIS pour améliorer ce CV.

Score: {analysis['overall_score']}/100
Sections manquantes: {list(section_tips.keys())}

Conseils:"""

        ai_suggestions = ollama.generate(prompt, system=system)
    except:
        ai_suggestions = "Analyse IA indisponible"

    return {
        **analysis,
        "ai_suggestions": ai_suggestions,
        "section_tips": section_tips,
        "optimized_summary_template": f"Professionnel {sector} avec expertise technique."
    }
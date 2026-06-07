import re
from collections import Counter

# Mots-clés par secteur (extensibles)
SECTOR_KEYWORDS = {
    "tech": [
        "python", "javascript", "react", "node.js", "sql", "docker", "git",
        "aws", "kubernetes", "ci/cd", "agile", "scrum", "rest api", "graphql",
        "typescript", "mongodb", "postgresql", "redis", "linux", "bash"
    ],
    "data": [
        "python", "sql", "pandas", "numpy", "machine learning", "deep learning",
        "tensorflow", "pytorch", "data visualization", "tableau", "power bi",
        "statistics", "regression", "classification", "etl", "spark", "hadoop"
    ],
    "design": [
        "figma", "adobe xd", "sketch", "ui/ux", "prototyping", "wireframing",
        "design system", "responsive design", "user research", "accessibility"
    ]
}

def analyze_ats_score(cv_text, job_description=None, sector="tech"):
    """
    Analyse le CV et retourne un score ATS détaillé
    Basé sur les 5 dimensions des ATS modernes (2026)
    """
    cv_lower = cv_text.lower()
    words = re.findall(r'\b\w+\b', cv_lower)
    word_count = len(words)
    
    # 1. Keyword Coverage (30%)
    keywords = SECTOR_KEYWORDS.get(sector, SECTOR_KEYWORDS["tech"])
    if job_description:
        # Extraire keywords JD
        jd_words = re.findall(r'\b\w+\b', job_description.lower())
        jd_keywords = [w for w in jd_words if len(w) > 3]
        keywords = list(set(keywords + jd_keywords))[:50]
    
    found_keywords = [k for k in keywords if k in cv_lower]
    keyword_coverage = len(found_keywords) / len(keywords) if keywords else 0
    
    # Placement multiplier
    sections = cv_lower.split('\n\n')
    summary = sections[0] if sections else ""
    skills_section = ""
    for s in sections:
        if "skill" in s or "compétence" in s:
            skills_section = s
            break
    
    placement_score = 0
    for kw in found_keywords:
        in_summary = kw in summary
        in_skills = kw in skills_section
        in_experience = any(kw in sec for sec in sections[1:] if sec != skills_section)
        
        if in_summary and in_skills and in_experience:
            placement_score += 1.0
        elif in_summary or in_skills:
            placement_score += 0.7
        else:
            placement_score += 0.4
    
    keyword_score = (placement_score / len(keywords) * 100) if keywords else 0
    
    # 2. Structure Recognition (20%)
    standard_headings = ["experience", "education", "skills", "summary", "contact", "projects"]
    found_headings = [h for h in standard_headings if h in cv_lower]
    structure_score = (len(found_headings) / len(standard_headings)) * 100
    
    # 3. Formatting Risk (20%)
    formatting_penalties = 0
    if "table" in cv_lower or "column" in cv_lower:
        formatting_penalties += 30
    if len(sections) < 3:
        formatting_penalties += 20
    if word_count < 200:
        formatting_penalties += 15
    formatting_score = max(0, 100 - formatting_penalties)
    
    # 4. Contact & Completeness (15%)
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text))
    has_phone = bool(re.search(r'\+?\d[\d\s-]{8,}', cv_text))
    has_linkedin = "linkedin" in cv_lower
    contact_score = (has_email + has_phone + has_linkedin) / 3 * 100
    
    # 5. Recency (15%) — simplified
    current_year = 2026
    years = re.findall(r'20\d{2}', cv_text)
    recent_years = [y for y in years if int(y) >= current_year - 2]
    recency_score = (len(recent_years) / max(len(years), 1)) * 100 if years else 50
    
    # Score final pondéré
    final_score = round(
        keyword_score * 0.30 +
        structure_score * 0.20 +
        formatting_score * 0.20 +
        contact_score * 0.15 +
        recency_score * 0.15,
        1
    )
    
    # Suggestions d'amélioration
    suggestions = []
    missing = [k for k in keywords if k not in cv_lower]
    
    if missing:
        suggestions.append(f"Ajoutez ces compétences clés: {', '.join(missing[:5])}")
    if structure_score < 80:
        suggestions.append("Utilisez des titres de section standard (Experience, Skills, Education)")
    if formatting_score < 80:
        suggestions.append("Évitez les tableaux et colonnes — utilisez une mise en page simple")
    if contact_score < 100:
        suggestions.append("Ajoutez email, téléphone et LinkedIn dans le corps du document")
    if recency_score < 50:
        suggestions.append("Mettez à jour vos expériences avec des dates récentes")
    
    return {
        "overall_score": final_score,
        "grade": "A" if final_score >= 85 else "B" if final_score >= 70 else "C" if final_score >= 55 else "D",
        "breakdown": {
            "keyword_coverage": round(keyword_score, 1),
            "structure": round(structure_score, 1),
            "formatting": round(formatting_score, 1),
            "contact_completeness": round(contact_score, 1),
            "recency": round(recency_score, 1)
        },
        "found_keywords": found_keywords,
        "missing_keywords": missing[:10],
        "suggestions": suggestions,
        "word_count": word_count,
        "is_ats_friendly": final_score >= 70
    }

def optimize_cv_suggestions(cv_text, job_description, sector="tech"):
    """
    Génère des suggestions d'optimisation spécifiques pour un poste
    """
    analysis = analyze_ats_score(cv_text, job_description, sector)
    
    # Analyse JD spécifique
    jd_lower = job_description.lower() if job_description else ""
    jd_keywords = re.findall(r'\b\w+\b', jd_lower)
    jd_counter = Counter([w for w in jd_keywords if len(w) > 3])
    top_jd_keywords = [k for k, _ in jd_counter.most_common(20)]
    
    missing_critical = [k for k in top_jd_keywords if k not in cv_text.lower()]
    
    return {
        **analysis,
        "job_specific": {
            "top_jd_keywords": top_jd_keywords,
            "missing_critical": missing_critical[:8],
            "match_rate": round((1 - len(missing_critical) / len(top_jd_keywords)) * 100, 1) if top_jd_keywords else 0
        },
        "optimized_summary_template": generate_summary_template(missing_critical, sector),
        "bullet_templates": generate_bullet_templates(missing_critical[:5])
    }

def generate_summary_template(keywords, sector):
    if not keywords:
        return None
    kw_str = ", ".join(keywords[:5])
    return f"Professionnel {sector} avec expertise en {kw_str}. Reconnu pour [résultat quantifiable]."

def generate_bullet_templates(keywords):
    templates = []
    for kw in keywords:
        templates.append(f"• Utilisé {kw} pour [action spécifique], résultant en [métrique]% d'amélioration")
    return templates
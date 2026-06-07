import PyPDF2
import docx


from datetime import datetime

def generate_cover_letter(data):
    today = datetime.now().strftime("%d/%m/%Y")

    return f"""
                                            Safi, le {today}
                                            

À l'attention du Responsable Recrutement
{data['entreprise']}

Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de {data['poste']} au sein de votre entreprise.

Titulaire de compétences solides en {data['competences']}, je suis particulièrement motivé(e) à l'idée de rejoindre {data['entreprise']} et de contribuer activement à son développement.

Au cours de mon parcours, j'ai développé des compétences techniques ainsi qu'une grande capacité d'adaptation, de travail en équipe et de résolution de problèmes. Sérieux(se), motivé(e) et rigoureux(se), je suis convaincu(e) de pouvoir apporter une réelle valeur ajoutée à votre organisation.

Intégrer votre entreprise représente pour moi une opportunité de mettre en pratique mes connaissances, d'enrichir mon expérience professionnelle et de participer à des projets ambitieux.

Je reste à votre entière disposition pour un entretien au cours duquel je pourrai vous exposer plus en détail mes motivations.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Signature :

{data['prenom'].capitalize()} {data['nom'].capitalize()}
"""



def extract_text_from_file(file):
    filename = file.filename.lower()

    # PDF
    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    # DOCX
    elif filename.endswith(".docx"):
        doc = docx.Document(file)
        return "\n".join([para.text for para in doc.paragraphs])

    # Image
    elif filename.endswith((".png", ".jpg", ".jpeg")):
        try:
            from PIL import Image
            import pytesseract
        except ImportError as exc:
            raise RuntimeError("Image OCR dependencies are not installed") from exc

        image = Image.open(file)
        return pytesseract.image_to_string(image)

    return ""

def analyze_cv_text(text):
    score = 0
    suggestions = []

    keywords = ["python", "react", "flask", "sql", "docker", "git"]

    for word in keywords:
        if word.lower() in text.lower():
            score += 10

    if "experience" not in text.lower():
        suggestions.append("Ajoutez une section expérience professionnelle.")

    if "education" not in text.lower():
        suggestions.append("Ajoutez votre formation académique.")

    if "skills" not in text.lower():
        suggestions.append("Ajoutez une section compétences.")

    return {
        "score": min(score, 100),
        "suggestions": suggestions
    }



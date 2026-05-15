import PyPDF2
import docx


def generate_cover_letter(data):
    return f"""
Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de {data['poste']} au sein de votre entreprise.

Titulaire de compétences solides en {data['competences']}, et particulièrement intéressé(e) par le domaine de {data['entreprise']}, je souhaite mettre mes connaissances et mon dynamisme au service de votre équipe.

Motivé(e), sérieux(se) et doté(e) d’un bon esprit d’analyse, je suis capable de travailler aussi bien en autonomie qu’en équipe. Mon parcours m’a permis de développer des compétences techniques ainsi qu’un sens de responsabilité et d’adaptation face aux différents défis professionnels.

Intégrer votre structure représente pour moi une opportunité de progresser, d’enrichir mon expérience et de contribuer activement à vos projets.

Je reste à votre disposition pour un entretien afin de vous exposer plus en détail mes motivations.

Dans l’attente de votre réponse, je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.

{data['prenom'].capitalize()} {data['nom'].capitalize()}
Email : {data['email']}
Téléphone : {data['telephone']}
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



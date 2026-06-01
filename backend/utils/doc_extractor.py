from PyPDF2 import PdfReader
from docx import Document

def extract_pdf_text(path: str) -> str:
    reader = PdfReader(path)
    return "\n".join([(p.extract_text() or "") for p in reader.pages])

def extract_docx_text(path: str) -> str:
    doc = Document(path)
    return "\n".join([p.text for p in doc.paragraphs])
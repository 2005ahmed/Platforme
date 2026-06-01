import subprocess
import os

def convert_docx_to_pdf(input_path):
    """
    Convert DOCX to PDF using LibreOffice
    """
    try:
        output_dir = os.path.dirname(input_path)
        
        # LibreOffice headless conversion
        result = subprocess.run([
            'soffice', '--headless', '--convert-to', 'pdf',
            '--outdir', output_dir, input_path
        ], check=True, capture_output=True, timeout=30)
        
        # Smiya dial PDF
        pdf_name = os.path.basename(input_path).replace('.docx', '.pdf')
        pdf_path = os.path.join(output_dir, pdf_name)
        
        if os.path.exists(pdf_path):
            return pdf_path
            
        return None
        
    except Exception as e:
        print(f"Conversion error: {e}")
        return None
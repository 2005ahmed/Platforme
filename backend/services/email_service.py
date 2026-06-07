from flask_mail import Message
from extensions import mail

def send_reminder_email(user_id , email, company, custom_message=None, history_id=None):
    try:
        # ⭐ TRACKING PIXEL
        tracking_pixel = ""
        if history_id:
            tracking_url = f"http://localhost:5000/api/pixel/{history_id}"
            tracking_pixel = f'<img src="{tracking_url}" width="1" height="1" style="display:none;" />'
        
        # ⭐ HTML TEMPLATE - BARREJ L-IF!
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    padding: 30px;
                    text-align: center;
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: bold;
                    color: white;
                    margin-bottom: 10px;
                }}
                .content {{
                    padding: 30px;
                }}
                .company-name {{
                    color: #6366f1;
                    font-weight: bold;
                }}
                .footer {{
                    background: #f1f5f9;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 24px;
                    background: #6366f1;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">📋 JobTracker</div>
                    <p style="color: #e0e7ff; margin: 0;">Votre partenaire de recherche d'emploi</p>
                </div>
                
                <div class="content">
                    <h2 style="color: #1e293b; margin-top: 0;">Relance de candidature</h2>
                    
                    <p>Bonjour,</p>
                    
                    <p>Nous espérons que vous allez bien.</p>
                    
                    <p>
                        Nous vous contactons concernant votre candidature chez 
                        <span class="company-name">{company}</span>.
                    </p>
                    
                    {f'<p style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">{custom_message}</p>' if custom_message else ''}
                    
                    <p>
                        Nous vous remercions de votre intérêt et restons à votre disposition 
                        pour toute information complémentaire.
                    </p>
                    
                    <a href="#" class="button">Voir mes candidatures</a>
                </div>
                
                <div class="footer">
                    <p>© 2026 JobTracker. Tous droits réservés.</p>
                    <p>
                        <a href="#" style="color: #6366f1;">Contact</a> | 
                        <a href="#" style="color: #6366f1;">Désabonnement</a>
                    </p>
                </div>
            </div>
            {tracking_pixel}
        </body>
        </html>
        """
        
        msg = Message(
            subject=f"📧 Relance - Candidature chez {company}",
            sender=("JobTracker", "jobtracker056@gmail.com"),
            recipients=[email],
            html=html_template,
            body=f"Relance pour candidature chez {company}. Connectez-vous pour plus de détails."
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        import traceback
        traceback.print_exc()
        return False
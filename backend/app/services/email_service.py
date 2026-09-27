import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional, List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_weekly_seo_email(
    brand_name: str,
    kpi_data: Dict[str, Any],
    pdf_path: Optional[str] = None,
    recipients: Optional[List[str]] = None
) -> bool:
    """
    Sends weekly automated SEO report email with attached PDF.
    If SMTP credentials are not configured, logs the email details gracefully.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        logger.info(
            f"[MOCK EMAIL SERVICE] SMTP credentials not set. Weekly report email prepared for {brand_name}. "
            f"KPIs: Total={kpi_data.get('total_keywords')}, Top 10={kpi_data.get('top_10')}, "
            f"Improved={kpi_data.get('improved')}, Dropped={kpi_data.get('dropped')}. "
            f"Attachment: {pdf_path}"
        )
        return True

    recipient_list = recipients or [settings.SMTP_USERNAME]

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = ", ".join(recipient_list)
        msg["Subject"] = f"[Avention SEO] Weekly Performance Report - {brand_name}"

        body = f"""
Hello SEO Team,

Here is your automated weekly SEO rank tracking summary for {brand_name}:

• Total Keywords Tracked: {kpi_data.get('total_keywords', 0)}
• Google Top 3: {kpi_data.get('top_3', 0)}
• Google Top 10: {kpi_data.get('top_10', 0)}
• Improved Positions: +{kpi_data.get('improved', 0)}
• Dropped Positions: -{kpi_data.get('dropped', 0)}
• Average Ranking Position: #{kpi_data.get('average_position', 0):.1f}

Please find the complete detailed executive PDF report attached.

Best regards,
Avention SEO Rank Automation Platform
        """
        msg.attach(MIMEText(body, "plain"))

        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                part = MIMEApplication(f.read(), Name=os.path.basename(pdf_path))
                part['Content-Disposition'] = f'attachment; filename="{os.path.basename(pdf_path)}"'
                msg.attach(part)

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, recipient_list, msg.as_string())
        server.quit()

        logger.info(f"Weekly SEO email successfully sent to {recipient_list}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email report: {e}")
        return False

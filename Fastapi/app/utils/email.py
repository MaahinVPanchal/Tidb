import emails
from emails.template import JinjaTemplate as T
from app.config import settings

def send_welcome_email(to_email: str, name: str, token: str):
    message = emails.html(
        html=T("""
        <p>Hi {{ name }},</p>
        <p>Thanks for registering on OurPlatform!</p>
        <p>Your auth token is: <b>{{ token }}</b></p>
        <p>Keep it safe.</p>
        """),
        subject="Welcome to OurPlatform",
        mail_from=(settings.from_name, settings.from_email),
    )
    r = message.send(
        to=to_email,
        smtp={
            "host": settings.smtp_host,
            "port": settings.smtp_port,
            "tls": True,
            "user": settings.smtp_user,
            "password": settings.smtp_password,
        },
    )
    return r.status_code == 250
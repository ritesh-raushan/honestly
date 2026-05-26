from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.config import settings
from pydantic import EmailStr
from textwrap import dedent

class EmailService:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME="resend",
            MAIL_PASSWORD=settings.resend_api_key,
            MAIL_FROM=settings.mail_from_address,
            MAIL_PORT=587,
            MAIL_SERVER="smtp.resend.com",
            MAIL_FROM_NAME=settings.mail_from_name,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        self.fast_mail = FastMail(self.conf)

    async def send_verification_email(self, email: EmailStr, username: str, otp: str):
        html_content = dedent(f"""\
                <!doctype html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width,initial-scale=1" />
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    </head>
                    <body style="margin:0; padding:0; background:#FFBD3F; font-family:'DM Sans', Arial, sans-serif; color:#121212;">
                        <span style="display:none; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden;">Use the code inside to verify your email.</span>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFBD3F; -webkit-text-size-adjust:100%;">
                            <tr>
                                <td align="center" style="padding:24px 12px;">
                                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
                                        <tr>
                                            <td style="background:#FFFDF5; border-radius:16px; padding:22px; box-shadow:0 4px 0 rgba(0,0,0,0.06);">
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="width:40px; vertical-align:middle;">
                                                            <div style="width:32px; height:32px; border-radius:8px; background:#4611CD; color:#ffffff; text-align:center; line-height:32px; font-weight:700; font-family:'Space Grotesque', Arial, sans-serif;">?</div>
                                                        </td>
                                                        <td style="vertical-align:middle;">
                                                            <div style="font-family:'Space Grotesque', Arial, sans-serif; font-weight:700; font-size:20px; color:#121212;">Honestly<span style="color:#4611CD;">.</span></div>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <div style="margin-top:16px; font-size:15px; line-height:1.5; color:#333;">
                                                    <h2 style="margin:0 0 12px 0; font-family:'Space Grotesque', Arial, sans-serif; font-size:20px; color:#4611CD;">Verify your email</h2>
                                                    <p style="margin:0 0 12px 0;">Hi {username},</p>
                                                    <p style="margin:0 0 16px 0;">Use the code below to verify your email and activate your account.</p>

                                                    <div style="background:#F0EDFF; padding:20px; border-radius:12px; text-align:center; margin:18px 0;">
                                                        <div style="font-size:12px; color:#666; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Your verification code</div>
                                                        <div style="font-family:'Courier New', monospace; font-size:36px; font-weight:700; color:#4611CD; letter-spacing:8px;">{otp}</div>
                                                    </div>

                                                    <p style="text-align:center; color:#666; margin:0 0 16px 0;">Enter this code on the verification page.</p>

                                                    <div style="margin-top:18px; padding-top:16px; border-top:1px solid rgba(0,0,0,0.06); font-size:12px; color:#666;">
                                                        This code will expire in {settings.verification_token_expire_hours} hours.<br />
                                                        If you didn't create an account, you can safely ignore this email.<br />
                                                        <strong>Do not share this code with anyone.</strong>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
                """).strip()

        message = MessageSchema(
            subject="Verify your email - Honestly",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )

        await self.fast_mail.send_message(message)

    async def send_welcome_email(self, email: EmailStr, username: str):
        profile_link = f"{settings.frontend_url}/u/{username}"
        
        html_content = dedent(f"""\
                <!doctype html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width,initial-scale=1" />
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    </head>
                    <body style="margin:0; padding:0; background:#FFBD3F; font-family:'DM Sans', Arial, sans-serif; color:#121212;">
                        <span style="display:none; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden;">Your account is verified - your link is ready.</span>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFBD3F; -webkit-text-size-adjust:100%;">
                            <tr>
                                <td align="center" style="padding:24px 12px;">
                                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
                                        <tr>
                                            <td style="background:#FFFDF5; border-radius:16px; padding:22px; box-shadow:0 4px 0 rgba(0,0,0,0.06);">
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="width:40px; vertical-align:middle;">
                                                            <div style="width:32px; height:32px; border-radius:8px; background:#4611CD; color:#ffffff; text-align:center; line-height:32px; font-weight:700; font-family:'Space Grotesque', Arial, sans-serif;">?</div>
                                                        </td>
                                                        <td style="vertical-align:middle;">
                                                            <div style="font-family:'Space Grotesque', Arial, sans-serif; font-weight:700; font-size:20px; color:#121212;">Honestly<span style="color:#4611CD;">.</span></div>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <div style="margin-top:16px; font-size:15px; line-height:1.5; color:#333;">
                                                    <h2 style="margin:0 0 12px 0; font-family:'Space Grotesque', Arial, sans-serif; font-size:20px; color:#4611CD;">Welcome - you're verified</h2>
                                                    <p style="margin:0 0 12px 0;">Hi {username},</p>
                                                    <p style="margin:0 0 16px 0;">Your email has been verified. Your account is now active.</p>

                                                    <div style="text-align:center; margin:18px 0;">
                                                        <a href="{profile_link}" style="background:#4611CD; color:#ffffff; padding:12px 28px; border-radius:12px; text-decoration:none; display:inline-block; font-weight:700; font-family:'Space Grotesque', Arial, sans-serif; box-shadow:0 10px 20px rgba(70,17,205,0.25);">Open your feedback page</a>
                                                    </div>

                                                    <p style="margin:0 0 6px 0; text-align:center; color:#666;">Or copy/paste your link:</p>
                                                    <p style="margin:0 0 16px 0; text-align:center;">
                                                        <a href="{profile_link}" style="color:#4611CD; text-decoration:underline;">{profile_link}</a>
                                                    </p>

                                                    <div style="margin-top:12px;">
                                                        <strong>Getting started</strong>
                                                        <ul style="margin:8px 0 0 18px; padding:0; color:#333;">
                                                            <li>Share your link with friends, colleagues, or on social media</li>
                                                            <li>Toggle message acceptance on/off from your dashboard</li>
                                                            <li>Read incoming anonymous messages</li>
                                                        </ul>
                                                    </div>

                                                    <div style="margin-top:18px; padding-top:16px; border-top:1px solid rgba(0,0,0,0.06); font-size:12px; color:#666;">
                                                        Need help? Reply to this email and we'll assist.
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
                """).strip()
        
        message = MessageSchema(
            subject="Welcome to Honestly!",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        await self.fast_mail.send_message(message)

    async def send_password_reset_email(self, email: EmailStr, username: str, otp: str):
        html_content = dedent(f"""\
                <!doctype html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width,initial-scale=1" />
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    </head>
                    <body style="margin:0; padding:0; background:#FFBD3F; font-family:'DM Sans', Arial, sans-serif; color:#121212;">
                        <span style="display:none; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden;">Use the code inside to reset your password.</span>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFBD3F; -webkit-text-size-adjust:100%;">
                            <tr>
                                <td align="center" style="padding:24px 12px;">
                                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
                                        <tr>
                                            <td style="background:#FFFDF5; border-radius:16px; padding:22px; box-shadow:0 4px 0 rgba(0,0,0,0.06);">
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="width:40px; vertical-align:middle;">
                                                            <div style="width:32px; height:32px; border-radius:8px; background:#4611CD; color:#ffffff; text-align:center; line-height:32px; font-weight:700; font-family:'Space Grotesque', Arial, sans-serif;">?</div>
                                                        </td>
                                                        <td style="vertical-align:middle;">
                                                            <div style="font-family:'Space Grotesque', Arial, sans-serif; font-weight:700; font-size:20px; color:#121212;">Honestly<span style="color:#4611CD;">.</span></div>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <div style="margin-top:16px; font-size:15px; line-height:1.5; color:#333;">
                                                    <h2 style="margin:0 0 12px 0; font-family:'Space Grotesque', Arial, sans-serif; font-size:20px; color:#4611CD;">Reset your password</h2>
                                                    <p style="margin:0 0 12px 0;">Hi {username},</p>
                                                    <p style="margin:0 0 16px 0;">We received a request to reset your password. Use the code below to continue.</p>

                                                    <div style="background:#F0EDFF; padding:20px; border-radius:12px; text-align:center; margin:18px 0;">
                                                        <div style="font-size:12px; color:#666; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Your reset code</div>
                                                        <div style="font-family:'Courier New', monospace; font-size:36px; font-weight:700; color:#4611CD; letter-spacing:8px;">{otp}</div>
                                                    </div>

                                                    <p style="text-align:center; color:#666; margin:0 0 16px 0;">Enter this code on the password reset page.</p>

                                                    <div style="margin-top:18px; padding-top:16px; border-top:1px solid rgba(0,0,0,0.06); font-size:12px; color:#666;">
                                                        This code will expire in {settings.password_reset_token_expire_hours} hour(s).<br />
                                                        If you didn't request a password reset, you can safely ignore this email.<br />
                                                        <strong>Do not share this code with anyone.</strong>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
                """).strip()
        
        message = MessageSchema(
            subject="Password reset code - Honestly",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        await self.fast_mail.send_message(message)

email_service = EmailService()
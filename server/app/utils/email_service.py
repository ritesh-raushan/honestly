from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.config import settings
from pydantic import EmailStr

class EmailService:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME="resend",
            MAIL_PASSWORD=settings.resend_api_key,
            MAIL_FROM=f"noreply@{settings.mail_from}",
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
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">Welcome to Anonymous Feedback!</h2>
                    <p>Hi {username},</p>
                    <p>Thank you for registering with Anonymous Feedback. Please use the OTP below to verify your email address.</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            {otp}
                        </p>
                    </div>
                    <p style="text-align: center; color: #666;">Enter this code on the verification page to activate your account.</p>
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                        This code will expire in {settings.verification_token_expire_hours} hours.<br>
                        If you didn't create an account, please ignore this email.<br>
                        <strong>Do not share this code with anyone.</strong>
                    </p>
                </div>
            </body>
        </html>
        """

        message = MessageSchema(
            subject="Verify your email address - Anonymous Feedback",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )

        await self.fast_mail.send_message(message)

    async def send_welcome_email(self, email: EmailStr, username: str):
        profile_link = f"{settings.frontend_url}/u/{username}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">Welcome to Anonymous Feedback! 🎉</h2>
                    <p>Hi {username},</p>
                    <p>Your email has been verified successfully! Your account is now active.</p>
                    <p>Your unique feedback link is:</p>
                    <p style="margin: 20px 0;">
                        <a href="{profile_link}" 
                            style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            {profile_link}
                        </a>
                    </p>
                    <p>Share this link with others to receive anonymous feedback!</p>
                    <p style="margin-top: 20px;">
                        <strong>Getting Started:</strong>
                    </p>
                    <ul>
                        <li>Share your unique link with friends, colleagues, or on social media</li>
                        <li>Toggle message acceptance on/off from your dashboard</li>
                        <li>Receive and read anonymous messages</li>
                    </ul>
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                        Have questions? Feel free to reach out to our support team.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MessageSchema(
            subject="Welcome to Anonymous Feedback!",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        await self.fast_mail.send_message(message)

    async def send_password_reset_email(self, email: EmailStr, username: str, otp: str):
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">Password Reset Request</h2>
                    <p>Hi {username},</p>
                    <p>We received a request to reset your password for your Anonymous Feedback account.</p>
                    <p>Please use the OTP below to reset your password:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                        <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            {otp}
                        </p>
                    </div>
                    <p style="text-align: center; color: #666;">Enter this code on the password reset page.</p>
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                        This code will expire in {settings.password_reset_token_expire_hours} hour(s).<br>
                        If you didn't request a password reset, please ignore this email or contact support if you have concerns.<br>
                        <strong>Do not share this code with anyone.</strong>
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MessageSchema(
            subject="Password Reset Request - Anonymous Feedback",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        await self.fast_mail.send_message(message)

email_service = EmailService()
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_hostname: str
    database_port: int
    database_password: str
    database_name: str
    database_username: str
    
    # JWT Settings
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_secret_key: str
    refresh_token_expire_days: int
    verification_token_expire_hours: int
    password_reset_token_expire_hours: int
    
    # Email Settings
    resend_api_key: str
    mail_from: str
    mail_from_name: str
    
    # URL Settings
    frontend_url: str
    backend_url: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Campus Multilingual Chatbot"
    DATABASE_URL: str = "sqlite:///./campus_chatbot.db"

    # Admin auth config
    ADMIN_USERNAME: str = "ashishp"
    ADMIN_PASSWORD: str = "ashishp123"

    # JWT config
    JWT_SECRET: str = "super_secret_campus_sahayak_key_change_me"  # change later if you want
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    groq_api_key: str
    supabase_url: str
    supabase_key: str
    database_url: str
    secret_key: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()  # raises ValidationError at startup if any var is missing

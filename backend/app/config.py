from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/opengiphy"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    upload_dir: str = "./uploads"
    max_upload_mb: int = 10

    # comma-separated, e.g. "http://localhost:5173,http://localhost:5174"
    cors_origins: str = "http://localhost:5173"


settings = Settings()

"""Configuração central via variáveis de ambiente (.env)."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_env: str = "development"
    log_level: str = "info"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algo: str = "HS256"
    jwt_ttl_minutes: int = 60 * 24

    # LLMs (opcionais — se vazias, sistema cai em modo demo)
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Postgres
    postgres_user: str = "invest"
    postgres_password: str = "invest_dev_pwd"
    postgres_db: str = "investigacao"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8001

    # MinIO / S3
    minio_root_user: str = "invest"
    minio_root_password: str = "invest_dev_pwd"
    minio_endpoint: str = "http://localhost:9000"
    minio_bucket: str = "casos"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def has_llm(self) -> bool:
        return bool(self.anthropic_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()

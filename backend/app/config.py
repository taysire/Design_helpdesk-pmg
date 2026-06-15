from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://pmg:pmg_dev@localhost:5433/pmg_helpdesk"
    redis_url: str = "redis://localhost:6379/0"
    api_cors_origins: str = "http://127.0.0.1:8888,http://localhost:8888"

    notifications_enabled: bool = True
    notify_email_mode: str = "log"
    notify_slack_webhook_url: str = ""
    notify_slack_channel: str = "#ithelp"
    notify_jira_enabled: bool = True
    notify_jira_mode: str = "log"
    notify_jira_project: str = "PHARM"
    notify_jira_categories: str = "kroll,pharmacy"

    auth_mode: str = "dev"
    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_audience: str = ""
    entra_api_scope: str = ""
    auth_dev_user_id: str = "me"
    auth_dev_role: str = "it"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]

    @property
    def jira_categories_list(self) -> list[str]:
        return [c.strip() for c in self.notify_jira_categories.split(",") if c.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

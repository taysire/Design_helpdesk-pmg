from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.env_bootstrap import bootstrap_env

bootstrap_env()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://pmg:pmg_dev@localhost:5433/pmg_helpdesk"
    redis_url: str = "redis://localhost:6379/0"
    api_cors_origins: str = "http://127.0.0.1:8888,http://localhost:8888"
    helpdesk_portal_url: str = "http://localhost:8888"

    notifications_enabled: bool = True
    notify_email_mode: str = Field(
        default="log",
        validation_alias=AliasChoices("notify_email_mode", "NOTIFY_EMAIL_MODE", "NOTIFICATIONS_MODE"),
    )
    notify_slack_webhook_url: str = ""
    notify_slack_channel: str = "#ithelp"
    notify_jira_enabled: bool = True
    notify_jira_mode: str = "log"
    notify_jira_project: str = "PHARM"
    notify_jira_categories: str = "kroll,pharmacy"

    graph_tenant_id: str = Field(
        default="",
        validation_alias=AliasChoices("graph_tenant_id", "GRAPH_TENANT_ID", "MS_TENANT_ID"),
    )
    graph_client_id: str = Field(
        default="",
        validation_alias=AliasChoices("graph_client_id", "GRAPH_CLIENT_ID", "MS_CLIENT_ID"),
    )
    graph_client_secret: str = Field(
        default="",
        validation_alias=AliasChoices("graph_client_secret", "GRAPH_CLIENT_SECRET", "MS_CLIENT_SECRET"),
    )
    graph_sender_email: str = Field(
        default="",
        validation_alias=AliasChoices(
            "graph_sender_email", "GRAPH_SENDER_EMAIL", "GRAPH_SENDER_UPN", "EMAIL",
        ),
    )

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

    @property
    def graph_email_ready(self) -> bool:
        return bool(
            self.graph_tenant_id
            and self.graph_client_id
            and self.graph_client_secret
            and self.graph_sender_email
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()

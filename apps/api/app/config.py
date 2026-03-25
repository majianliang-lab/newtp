from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Topology Security Platform API"
    api_prefix: str = "/api"

    model_config = SettingsConfigDict(env_prefix="TOPOLOGY_")


settings = Settings()

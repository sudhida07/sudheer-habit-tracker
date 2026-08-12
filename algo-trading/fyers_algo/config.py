"""Load config.yaml + .env into a single settings object."""

import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT / ".env")


@dataclass
class Settings:
    raw: dict = field(default_factory=dict)

    # broker credentials
    fyers_client_id: str = ""
    fyers_secret_key: str = ""
    fyers_redirect_uri: str = ""
    anthropic_api_key: str = ""

    @property
    def mode(self) -> str:
        return self.raw.get("mode", "paper")

    @property
    def capital(self) -> float:
        return float(self.raw.get("capital", 5000))

    @property
    def targets(self) -> dict:
        return self.raw.get("targets", {})

    @property
    def risk(self) -> dict:
        return self.raw.get("risk", {})

    @property
    def watchlist(self) -> list:
        return self.raw.get("watchlist", [])

    @property
    def session(self) -> dict:
        return self.raw.get("session", {})

    @property
    def claude(self) -> dict:
        return self.raw.get("claude", {})


def load_settings() -> Settings:
    cfg_path = ROOT / "config.yaml"
    with open(cfg_path) as f:
        raw = yaml.safe_load(f)
    return Settings(
        raw=raw,
        fyers_client_id=os.getenv("FYERS_CLIENT_ID", ""),
        fyers_secret_key=os.getenv("FYERS_SECRET_KEY", ""),
        fyers_redirect_uri=os.getenv("FYERS_REDIRECT_URI", ""),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
    )

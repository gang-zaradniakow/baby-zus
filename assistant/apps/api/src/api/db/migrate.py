"""Migracje Alembic bez pliku ini – działa tak samo w repo i w obrazie Dockera.

    python -m api.db.migrate upgrade head
    python -m api.db.migrate downgrade base
    python -m api.db.migrate upgrade head --sql     # tylko SQL (tryb offline)

Adres bazy: argument ``--url`` albo ``DATABASE_URL``. Skrypty migracji leżą w pakiecie
(``api/db/migrations``), więc trafiają do obrazu razem z kodem.
"""

import argparse
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config

from api.settings import get_settings

MIGRATIONS_DIR = Path(__file__).with_name("migrations")


def alembic_config(database_url: str) -> Config:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    # ConfigParser interpoluje "%" – hasła z "%" (np. kodowanie URL) trzeba podwoić.
    config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return config


def upgrade(database_url: str, revision: str = "head", *, sql: bool = False) -> None:
    command.upgrade(alembic_config(database_url), revision, sql=sql)


def downgrade(database_url: str, revision: str = "base", *, sql: bool = False) -> None:
    command.downgrade(alembic_config(database_url), revision, sql=sql)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Migracje bazy API (Alembic).")
    parser.add_argument("action", choices=["upgrade", "downgrade"])
    parser.add_argument("revision", nargs="?")
    parser.add_argument("--url", help="adres bazy (domyślnie DATABASE_URL)")
    parser.add_argument("--sql", action="store_true", help="wypisz SQL zamiast wykonywać")
    args = parser.parse_args(argv)

    url = args.url or get_settings().database_url
    if args.action == "upgrade":
        upgrade(url, args.revision or "head", sql=args.sql)
    else:
        downgrade(url, args.revision or "base", sql=args.sql)
    return 0


if __name__ == "__main__":
    sys.exit(main())

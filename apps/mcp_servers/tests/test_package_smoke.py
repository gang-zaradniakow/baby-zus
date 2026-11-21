import importlib
import pkgutil

import pytest

import mcp_servers

# Serwery z §7 – każdy musi mieć własny podpakiet.
EXPECTED_SERVERS = [
    "zus_ubezpieczenia",
    "zus_ezla",
    "zus_naleznosci",
    "zus_pue",
    "kalkulator",
    "dokumenty",
    "usc",
    "wiedza",
    "profil",
]


def test_package_exposes_version_from_metadata() -> None:
    assert mcp_servers.__version__ == "0.1.0"


def test_all_modules_import() -> None:
    for module in pkgutil.walk_packages(mcp_servers.__path__, prefix="mcp_servers."):
        importlib.import_module(module.name)


@pytest.mark.parametrize("server", EXPECTED_SERVERS)
def test_every_server_from_spec_has_a_package(server: str) -> None:
    importlib.import_module(f"mcp_servers.{server}")

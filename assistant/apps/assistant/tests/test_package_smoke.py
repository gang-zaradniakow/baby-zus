import importlib
import pkgutil

import assistant


def test_package_exposes_version_from_metadata() -> None:
    assert assistant.__version__ == "0.1.0"


def test_all_modules_import() -> None:
    for module in pkgutil.walk_packages(assistant.__path__, prefix="assistant."):
        importlib.import_module(module.name)

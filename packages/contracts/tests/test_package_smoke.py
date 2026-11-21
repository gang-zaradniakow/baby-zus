import importlib
import pkgutil

import contracts


def test_package_exposes_version_from_metadata() -> None:
    assert contracts.__version__ == "0.1.0"


def test_all_modules_import() -> None:
    for module in pkgutil.walk_packages(contracts.__path__, prefix="contracts."):
        importlib.import_module(module.name)

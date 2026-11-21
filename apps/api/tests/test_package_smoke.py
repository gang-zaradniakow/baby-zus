import importlib
import pkgutil

import api


def test_package_exposes_version_from_metadata() -> None:
    assert api.__version__ == "0.1.0"


def test_all_modules_import() -> None:
    for module in pkgutil.walk_packages(api.__path__, prefix="api."):
        importlib.import_module(module.name)

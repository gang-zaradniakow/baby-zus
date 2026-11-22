import importlib
import pkgutil

import admin


def test_package_exposes_version_from_metadata() -> None:
    assert admin.__version__ == "0.1.0"


def test_all_modules_import() -> None:
    for module in pkgutil.walk_packages(admin.__path__, prefix="admin."):
        importlib.import_module(module.name)

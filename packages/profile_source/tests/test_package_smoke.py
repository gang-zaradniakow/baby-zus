import importlib
import pkgutil

import profile_source


def test_package_exposes_version_from_metadata() -> None:
    assert profile_source.__version__ == "0.1.0"


def test_all_modules_import() -> None:
    for module in pkgutil.walk_packages(profile_source.__path__, prefix="profile_source."):
        importlib.import_module(module.name)

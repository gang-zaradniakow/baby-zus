import importlib
import pkgutil

import rules_engine


def test_package_exposes_version_from_metadata() -> None:
    assert rules_engine.__version__ == "0.1.0"


def test_all_modules_import() -> None:
    for module in pkgutil.walk_packages(rules_engine.__path__, prefix="rules_engine."):
        importlib.import_module(module.name)


def test_engine_has_no_third_party_runtime_dependencies() -> None:
    """Silnik ma zależeć wyłącznie od kontraktów (zasada: bez I/O, bez frameworków)."""
    from importlib.metadata import requires

    assert requires("zus-rules-engine") == ["zus-contracts"]

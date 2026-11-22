"""Port ``ProfileSource`` i jego adaptery: mock (persony) oraz http (zewnętrzny backend).

Reszta systemu zna tylko port; adapter wybiera zmienna ``PROFILE_SOURCE`` (ZUS-30).
"""

from importlib.metadata import version

from profile_source.errors import (
    BackendContractError,
    BackendUnavailableError,
    ConfigurationError,
    ConsentRequiredError,
    ProfileNotFoundError,
    ProfileSourceError,
)
from profile_source.factory import create_profile_source
from profile_source.http_source import HttpProfileSource
from profile_source.mock import MockEntry, MockProfileSource
from profile_source.port import ProfileSource

__version__ = version("zus-profile-source")

__all__ = [
    "BackendContractError",
    "BackendUnavailableError",
    "ConfigurationError",
    "ConsentRequiredError",
    "HttpProfileSource",
    "MockEntry",
    "MockProfileSource",
    "ProfileNotFoundError",
    "ProfileSource",
    "ProfileSourceError",
    "__version__",
    "create_profile_source",
]

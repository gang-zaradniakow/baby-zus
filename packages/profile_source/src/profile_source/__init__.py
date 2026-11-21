"""Port ``ProfileSource`` i jego adaptery: mock (fixtures) oraz http (zewnętrzny backend).

Reszta systemu zna tylko port; adapter wybiera zmienna ``PROFILE_SOURCE`` (ZUS-30).
"""

from importlib.metadata import version

__version__ = version("zus-profile-source")

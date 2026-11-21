"""Serwery MCP z §7. Na hackathon to mocki; w produkcji podmienia się implementację, nie interfejs.

Każdy serwer ma własny podpakiet; wspólne elementy (audyt, zakres sesji) są w ``common``.
"""

from importlib.metadata import version

__version__ = version("zus-mcp-servers")

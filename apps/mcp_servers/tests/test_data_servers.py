"""ZUS-32: serwery zus-ubezpieczenia, zus-ezla, zus-naleznosci, profil (TM-01…TM-08)."""

from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

import pytest
from mcp.server.mcpserver import MCPServer
from mcp_types import CallToolResult

from contracts import ParentProfile, Profile, StageInfo
from mcp_servers import snapshot
from mcp_servers.common.audit import AuditEntry, InMemoryAuditSink
from mcp_servers.common.errors import ErrorCode, ToolFailureError, handles_errors
from mcp_servers.common.runtime import ServerDeps
from mcp_servers.profil import server as profil
from mcp_servers.zus_ezla import server as zus_ezla
from mcp_servers.zus_naleznosci import server as zus_naleznosci
from mcp_servers.zus_ubezpieczenia import server as zus_ubezpieczenia
from profile_source import (
    BackendUnavailableError,
    ConfigurationError,
    ConsentRequiredError,
    ProfileSourceError,
)

ROOT = Path(__file__).resolve().parents[3]
Call = Callable[..., Awaitable[CallToolResult]]


def ok(result: CallToolResult) -> dict[str, Any]:
    assert not result.is_error, result.structured_content
    assert result.structured_content is not None
    return result.structured_content


def error_code(result: CallToolResult) -> str:
    assert result.is_error
    assert result.structured_content is not None
    code: str = result.structured_content["code"]
    return code


# --- TM-01 -------------------------------------------------------------------------------


def test_tm01_tool_lists_match_snapshots() -> None:
    assert snapshot.main(["--out", str(ROOT / "docs" / "contracts" / "mcp"), "--check"]) == 0


def test_tm01_snapshot_cli_writes_and_checks(tmp_path: Path) -> None:
    assert snapshot.main(["--out", str(tmp_path), "--check"]) == 1
    assert snapshot.main(["--out", str(tmp_path)]) == 0
    assert snapshot.main(["--out", str(tmp_path)]) == 0
    assert snapshot.main(["--out", str(tmp_path), "--check"]) == 0
    assert {p.stem for p in tmp_path.glob("*.json")} == {
        "zus-ubezpieczenia",
        "zus-ezla",
        "zus-naleznosci",
        "profil",
        "kalkulator",
        "wiedza",
        "zus-pue",
        "dokumenty",
        "usc",
    }


# --- TM-02 -------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("tool", "arguments", "fields"),
    [
        ("get_insurance_periods", {}, ["user_ref"]),
        ("get_insurance_periods", {"user_ref": 7}, ["user_ref"]),
    ],
)
async def test_tm02_bad_arguments(
    deps: ServerDeps, call: Call, tool: str, arguments: dict[str, Any], fields: list[str]
) -> None:
    result = await call(zus_ubezpieczenia.build(deps), tool, arguments)
    assert error_code(result) == "INVALID_ARGUMENTS"
    assert result.structured_content is not None
    assert result.structured_content["details"] == {"fields": fields}


async def test_tm02_bad_date_does_not_echo_value(deps: ServerDeps, call: Call) -> None:
    result = await call(
        zus_naleznosci.build(deps),
        "get_debt_status",
        {"user_ref": "persona-t03", "on_date": "PESEL 90010112345"},
        user="persona-t03",
    )
    assert error_code(result) == "INVALID_ARGUMENTS"
    assert "90010112345" not in str(result.content)


async def test_unknown_tool(deps: ServerDeps, call: Call) -> None:
    result = await call(zus_ezla.build(deps), "drop_database", {})
    assert error_code(result) == "UNKNOWN_TOOL"


# --- TM-03…TM-06: dane z person ----------------------------------------------------------


async def test_tm03_insurance_periods_for_t02(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            zus_ubezpieczenia.build(deps),
            "get_insurance_periods",
            {"user_ref": "persona-t02"},
            user="persona-t02",
        )
    )
    assert data["source"] == "ZUS"
    assert data["periods"] == [
        {
            "title": "MANDATE_CONTRACT",
            "sickness": "VOLUNTARY",
            "dateFrom": "2026-09-01",
            "dateTo": None,
            "endReason": None,
        }
    ]


async def test_tm04_payer_and_count_date_for_t01(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(zus_ubezpieczenia.build(deps), "get_payer_info", {"user_ref": "persona-t01"})
    )
    assert data["payer"] == {"insuredCountNov30": 45, "countDate": "2025-11-30"}


async def test_contribution_data_for_t01(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            zus_ubezpieczenia.build(deps), "get_contribution_base", {"user_ref": "persona-t01"}
        )
    )
    assert len(data["salaries"]) == 12
    assert data["deductionRate"] == "0.1371"


async def test_tm05_sick_leave_with_code_b(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            zus_ezla.build(deps),
            "list_sick_leaves",
            {"user_ref": "persona-t02"},
            user="persona-t02",
        )
    )
    assert [leave["code"] for leave in data["sickLeaves"]] == ["B"]


async def test_tm06_debt_for_t03(deps: ServerDeps, call: Call) -> None:
    server = zus_naleznosci.build(deps)
    data = ok(
        await call(
            server,
            "get_debt_status",
            {"user_ref": "persona-t03", "on_date": "2026-11-12"},
            user="persona-t03",
        )
    )
    assert data["contributionDebt"] == "350.00"
    assert data["hasDebt"] is True
    assert data["onDate"] == "2026-11-12"
    certificate = ok(
        await call(
            server, "issue_debt_certificate", {"user_ref": "persona-t03"}, user="persona-t03"
        )
    )
    assert certificate["hasDebt"] is True
    assert certificate["issuedOn"] == "2026-11-22"
    assert certificate["certificateId"].startswith("ZAS-SIM-")


async def test_no_debt_information(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            zus_naleznosci.build(deps),
            "get_debt_status",
            {"user_ref": "persona-t01", "on_date": "2026-11-12"},
        )
    )
    assert data["contributionDebt"] is None
    assert data["hasDebt"] is None


async def test_profile_with_stage(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            profil.build(deps), "get_profile", {"user_ref": "persona-t07"}, user="persona-t07"
        )
    )
    assert Profile.model_validate(data["profile"]).profile_id == "persona-t07"
    assert StageInfo.model_validate(data["stage"]).flags == ["DIFFICULT"]


async def test_partner_only_with_consent(deps: ServerDeps, call: Call) -> None:
    server = profil.build(deps)
    refused = await call(
        server, "get_partner_profile", {"user_ref": "persona-t08"}, user="persona-t08"
    )
    assert error_code(refused) == "CONSENT_REQUIRED"
    partner = ok(
        await call(server, "get_partner_profile", {"user_ref": "persona-t09"}, user="persona-t09")
    )
    assert ParentProfile.model_validate(partner).role == "FATHER"


async def test_unknown_user_is_not_found(deps: ServerDeps, call: Call) -> None:
    result = await call(
        zus_ezla.build(deps), "list_sick_leaves", {"user_ref": "persona-t99"}, user="persona-t99"
    )
    assert error_code(result) == "NOT_FOUND"


# --- TM-07: zakres tokenu ----------------------------------------------------------------


async def test_tm07_token_a_cannot_read_user_b(deps: ServerDeps, call: Call) -> None:
    for build, tool in [
        (zus_ubezpieczenia.build, "get_insurance_periods"),
        (zus_ezla.build, "list_sick_leaves"),
        (profil.build, "get_profile"),
    ]:
        result = await call(build(deps), tool, {"user_ref": "persona-t02"}, user="persona-t01")
        assert error_code(result) == "FORBIDDEN"
        assert "persona-t02" not in str(result.content)


@pytest.mark.parametrize("raw_token", ["", "zmyslony.token"])
async def test_missing_or_bad_token_is_unauthorized(
    deps: ServerDeps, call: Call, raw_token: str
) -> None:
    server = zus_ezla.build(deps)
    result = await call(
        server, "list_sick_leaves", {"user_ref": "persona-t01"}, raw_token=raw_token
    )
    assert error_code(result) == "UNAUTHORIZED"
    without = await call(server, "list_sick_leaves", {"user_ref": "persona-t01"}, user=None)
    assert error_code(without) == "UNAUTHORIZED"


async def test_expired_token_is_unauthorized(
    deps: ServerDeps, call: Call, token: Callable[..., str]
) -> None:
    result = await call(
        zus_ezla.build(deps),
        "list_sick_leaves",
        {"user_ref": "persona-t01"},
        raw_token=token("persona-t01", minutes=0),
    )
    assert error_code(result) == "UNAUTHORIZED"


# --- TM-08: audyt ------------------------------------------------------------------------


async def test_tm08_success_and_failure_are_audited(
    deps: ServerDeps, call: Call, audit: InMemoryAuditSink, token: Callable[..., str]
) -> None:
    server = zus_ezla.build(deps)
    sid = "0b6f1c3e-6a51-4c5e-9d7e-2f1a3b4c5d6e"
    await call(server, "list_sick_leaves", {"user_ref": "persona-t01"}, raw_token=token(sid=sid))
    await call(server, "list_sick_leaves", {"user_ref": "persona-t02"})
    assert audit.entries == [
        AuditEntry(
            occurred_at=audit.entries[0].occurred_at,
            tool="zus-ezla.list_sick_leaves",
            outcome="OK",
            actor_ref="persona-t01",
            session_id=sid,
        ),
        AuditEntry(
            occurred_at=audit.entries[1].occurred_at,
            tool="zus-ezla.list_sick_leaves",
            outcome="ERROR",
            actor_ref="persona-t01",
            details={"code": "FORBIDDEN"},
        ),
    ]


async def test_list_tools_is_not_audited(deps: ServerDeps, audit: InMemoryAuditSink) -> None:
    from mcp import Client

    async with Client(zus_ezla.build(deps)) as client:
        assert [t.name for t in (await client.list_tools()).tools] == ["list_sick_leaves"]
    assert audit.entries == []


class _BrokenAudit:
    async def record(self, entry: AuditEntry) -> None:
        raise RuntimeError("baza audytu niedostępna")


async def test_audit_failure_does_not_break_the_call(deps: ServerDeps, call: Call) -> None:
    broken = ServerDeps(deps.profile_source, deps.signer, _BrokenAudit(), deps.clock)
    result = await call(zus_ezla.build(broken), "list_sick_leaves", {"user_ref": "persona-t01"})
    assert not result.is_error


# --- błędy źródła i błędy wewnętrzne -----------------------------------------------------


class _FailingSource:
    def __init__(self, error: Exception) -> None:
        self.error = error

    async def get_profile(self, user_ref: str) -> Profile:
        raise self.error

    async def get_partner_profile(self, user_ref: str) -> ParentProfile:
        raise self.error

    async def get_child_stage(self, user_ref: str) -> StageInfo:
        raise self.error

    async def aclose(self) -> None:
        return None


@pytest.mark.parametrize(
    ("error", "code"),
    [
        (BackendUnavailableError("timeout 10.0.0.7", 3), "BACKEND_UNAVAILABLE"),
        (ConsentRequiredError("u"), "CONSENT_REQUIRED"),
        (ConfigurationError("x"), "INTERNAL"),
        (RuntimeError("sekret w stack trace"), "INTERNAL"),
    ],
)
async def test_source_errors_are_mapped_without_details(
    deps: ServerDeps, call: Call, error: Exception, code: str
) -> None:
    failing = ServerDeps(_FailingSource(error), deps.signer, deps.audit, deps.clock)
    result = await call(zus_ezla.build(failing), "list_sick_leaves", {"user_ref": "persona-t01"})
    assert error_code(result) == code
    assert "10.0.0.7" not in str(result.content)
    assert "sekret" not in str(result.content)
    assert isinstance(error, ProfileSourceError | RuntimeError)


async def test_sdk_level_failure_becomes_internal(deps: ServerDeps, call: Call) -> None:
    server: MCPServer = zus_ezla.build(deps)

    @server.tool()
    async def broken(user_ref: str) -> zus_ezla.SickLeaves:
        return "to nie jest model"  # type: ignore[return-value]

    result = await call(server, "broken", {"user_ref": "persona-t01"})
    assert error_code(result) == "INTERNAL"


async def test_tool_failure_keeps_its_code(deps: ServerDeps, call: Call) -> None:
    server: MCPServer = zus_ezla.build(deps)

    @server.tool()
    @handles_errors
    async def refuses(user_ref: str) -> zus_ezla.SickLeaves:
        raise ToolFailureError(ErrorCode.NOT_FOUND, "Brak e-ZLA w tym okresie.")

    result = await call(server, "refuses", {"user_ref": "persona-t01"})
    assert error_code(result) == "NOT_FOUND"
    assert result.structured_content is not None
    assert result.structured_content["message"] == "Brak e-ZLA w tym okresie."

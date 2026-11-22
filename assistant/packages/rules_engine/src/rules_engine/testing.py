"""Budowanie profili w testach silnika i w sprawach golden (ZUS-20). Bez logiki biznesowej."""

from typing import Any

from contracts import Profile


def period(
    title: str = "EMPLOYMENT",
    sickness: str = "MANDATORY",
    start: str = "2023-01-02",
    end: str | None = None,
    reason: str | None = None,
) -> dict[str, Any]:
    data: dict[str, Any] = {"title": title, "sickness": sickness, "dateFrom": start}
    if end:
        data["dateTo"] = end
        data["endReason"] = reason or "OTHER"
    return data


def make_profile(
    periods: list[dict[str, Any]] | None = None,
    child: dict[str, Any] | None = None,
    *,
    sick_leaves: list[dict[str, Any]] | None = None,
    debt: str | None = None,
    salaries: dict[str, str] | None = None,
    payer: tuple[int, str] | None = None,
    events: list[dict[str, Any]] | None = None,
) -> Profile:
    insurance: dict[str, Any] = {
        "source": "ZUS",
        "periods": [period()] if periods is None else periods,
        "sickLeaves": sick_leaves or [],
        "salaries": [{"month": m, "gross": g} for m, g in (salaries or {}).items()],
    }
    if debt is not None:
        insurance["contributionDebt"] = debt
    if payer is not None:
        insurance["payer"] = {"insuredCountNov30": payer[0], "countDate": payer[1]}
    return Profile.model_validate(
        {
            "profileId": "p-test",
            "applicant": {"role": "MOTHER", "insurance": insurance},
            "child": {
                "source": "USER",
                **({"birthDate": "2026-11-12"} if child is None else child),
            },
            "specialEvents": events or [],
        }
    )

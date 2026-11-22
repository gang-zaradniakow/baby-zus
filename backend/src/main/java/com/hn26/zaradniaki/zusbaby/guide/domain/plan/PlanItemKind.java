package com.hn26.zaradniaki.zusbaby.guide.domain.plan;

/** Kind of a row of the benefit plan. */
public enum PlanItemKind {
    /** No benefits from ZUS: what to do about it. */
    NOTICE,
    /** One benefit in a row. */
    BENEFIT,
    /** The leaves one after another, with their weeks and rates. */
    LEAVES
}

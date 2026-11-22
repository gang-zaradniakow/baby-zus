package com.hn26.zaradniaki.zusbaby.guide.domain.survey;

/** How the parent works; a parent may have several. */
public enum WorkForm {
    /** Employment contract (mandatory sickness insurance). */
    EMPLOYMENT,
    /** Own firm with voluntary sickness insurance. */
    SELF_EMPLOYMENT,
    /** Own firm without sickness insurance. */
    SELF_EMPLOYMENT_WITHOUT_SICKNESS,
    /** Mandate contract with voluntary sickness insurance. */
    MANDATE_CONTRACT,
    /**
     * Mandate contract without sickness insurance, or a contract for specific work.
     */
    MANDATE_CONTRACT_WITHOUT_SICKNESS,
    /** Own firm on the startup relief (no social insurance for 6 months). */
    STARTUP_RELIEF,
    /** Farmer insured in KRUS. */
    FARMER,
    /** Not working, studying or unemployed. */
    NOT_WORKING
}

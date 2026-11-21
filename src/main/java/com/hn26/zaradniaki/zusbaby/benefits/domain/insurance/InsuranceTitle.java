package com.hn26.zaradniaki.zusbaby.benefits.domain.insurance;

/**
 * Insurance title with sickness insurance in ZUS; {@code label} is the Polish
 * word used in messages.
 */
public enum InsuranceTitle {

    EMPLOYMENT("etat"),
    MANDATE_CONTRACT("zlecenie"),
    SELF_EMPLOYMENT("firma");

    private final String label;

    InsuranceTitle(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}

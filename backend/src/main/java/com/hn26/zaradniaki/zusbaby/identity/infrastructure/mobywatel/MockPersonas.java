package com.hn26.zaradniaki.zusbaby.identity.infrastructure.mobywatel;

import java.util.List;
import java.util.Optional;

/**
 * The six personas of the frontend prototype ({@code PERSONAS} in js/data.js).
 */
final class MockPersonas {

    static final List<MockPersona> ALL = List.of(
            new MockPersona("anna", "Anna", "Anna — 28. tydzień ciąży, etat + mała firma",
                    "L4 z kodem B, zbieg UoP i JDG, duży pracodawca.", "96041212302"),
            new MockPersona("kasia", "Kasia", "Kasia — JDG, synek ma 16 dni",
                    "Termin 81,5% za 5 dni, zaległość w składkach 62,40 zł.", "93090312304"),
            new MockPersona("ola", "Ola", "Ola — samodzielna mama wcześniaczki",
                    "27. tc, 950 g, 6 tyg. w szpitalu: urlop uzupełniający do 15 tyg.", "98012712307"),
            new MockPersona("marek", "Marek", "Marek — tata, córka ma 10,5 mies.",
                    "Urlop ojcowski wygasa za ~5 tygodni, 9 nieprzenoszalnych tygodni rodzicielskiego.",
                    "91061812318"),
            new MockPersona("ewa", "Ewa", "Ewa — rodzina zastępcza, Kuba (2 lata)",
                    "Przyjęcie 5 dni temu: wniosek o urlop w ciągu 7 dni.", "85110512308"),
            new MockPersona("zofia", "Zofia", "Zofia — Zosia (14 mies.) + druga ciąża",
                    "Zasiłek opiekuńczy (e-ZLA kod C), druga ciąża, przełączanie profili dzieci.", "94022112308"));

    private MockPersonas() {
    }

    static Optional<MockPersona> byId(String id) {
        return ALL.stream().filter(persona -> persona.id().equals(id)).findFirst();
    }
}

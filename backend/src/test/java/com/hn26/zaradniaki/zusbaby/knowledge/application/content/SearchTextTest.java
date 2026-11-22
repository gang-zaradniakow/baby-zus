package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SearchTextTest {

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource(delimiter = ';', value = {"Zasiłek macierzyński;zasilek macierzynski", "ŁÓDŹ, żłobek;lodz, zlobek",
            "ĄĆĘŃŚŹŻ;acenszz", "<b>WAŻNE!</b> Wniosek;wazne! wniosek",
            "<div class=\"wazne\">tekst</div>;tekst", "'  dwa \t  odstępy  ';dwa odstepy", "Kod B;kod b"})
    void normalizesLikeTheMockup(String text, String expected) {
        assertThat(SearchText.normalize(text)).isEqualTo(expected);
    }
}

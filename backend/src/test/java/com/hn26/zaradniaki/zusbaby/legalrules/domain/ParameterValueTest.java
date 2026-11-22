package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class ParameterValueTest {

    @Test
    void parsesSingleValue() {
        var value = ParameterValue.parse(ParameterKey.MINIMUM_BENEFIT_BASE, " 4147.10 ");

        assertThat(value).isEqualTo(ParameterValue.of("4147.10"));
        assertThat(value.asText()).isEqualTo("4147.1");
    }

    @Test
    void parsesValuesByNumberOfChildren() {
        var value = (ParameterValue.ByChildren) ParameterValue.parse(ParameterKey.MATERNITY_LEAVE_WEEKS,
                "20, 31,33,35,37");

        assertThat(value.asText()).isEqualTo("20,31,33,35,37");
        assertThat(value.forChildren(1)).isEqualByComparingTo("20");
        assertThat(value.forChildren(2)).isEqualByComparingTo("31");
        assertThat(value.forChildren(5)).isEqualByComparingTo("37");
        assertThat(value.forChildren(8)).as("5 and more share the last value").isEqualByComparingTo("37");
    }

    @ParameterizedTest
    @CsvSource(delimiter = ';', value = {
            "PARENTAL_LEAVE_RATE; 1.2; ułamek od 0 do 1",
            "MINIMUM_WAGE; -1; nie może być ujemny",
            "SICK_PAY_DAYS; 33.5; liczbą całkowitą",
            "NON_TRANSFERABLE_PARENTAL_WEEKS; 9,9; nie jest liczbą",
            "MATERNITY_LEAVE_WEEKS; 20,31,33; wymaga 5 wartości",
            "MATERNITY_LEAVE_WEEKS; 20,31,33,35,37.5; nieujemnymi liczbami całkowitymi",
            "MINIMUM_WAGE; abc; nie jest liczbą"})
    void rejectsValuesNotFittingTheKind(ParameterKey key, String text, String message) {
        assertThatThrownBy(() -> ParameterValue.parse(key, text)).isInstanceOf(InvalidLegalParametersException.class)
                .hasMessageContaining(message).hasMessageContaining(key.label());
    }

    @Test
    void rejectsListForSingleValuedParameter() {
        assertThatThrownBy(() -> ParameterValue.ofChildren(41, 41, 43, 43, 43)
                .validateFor(ParameterKey.PARENTAL_LEAVE_WEEKS_ONE_CHILD))
                .isInstanceOf(InvalidLegalParametersException.class).hasMessageContaining("jedną wartość");
    }

    @Test
    void rejectsSingleValueForListParameter() {
        assertThatThrownBy(() -> ParameterValue.of(BigDecimal.TEN).validateFor(ParameterKey.MATERNITY_LEAVE_WEEKS))
                .isInstanceOf(InvalidLegalParametersException.class).hasMessageContaining("wymaga 5 wartości");
    }
}

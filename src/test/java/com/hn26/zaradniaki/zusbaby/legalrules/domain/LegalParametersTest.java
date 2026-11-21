package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.EnumMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class LegalParametersTest {

    private final LegalParameters parameters = LegalParametersFixtures.defaults();

    @Test
    void containsEveryParameter() {
        assertThat(parameters.asMap()).containsOnlyKeys(ParameterKey.values());
    }

    @Test
    void rejectsIncompleteSet() {
        Map<ParameterKey, ParameterValue> values = new EnumMap<>(parameters.asMap());
        values.remove(ParameterKey.MINIMUM_WAGE);
        values.remove(ParameterKey.FUNERAL_GRANT);

        assertThatThrownBy(() -> new LegalParameters(values)).isInstanceOf(InvalidLegalParametersException.class)
                .hasMessageContaining("Płaca minimalna").hasMessageContaining("Zasiłek pogrzebowy");
    }

    @Test
    void rejectsValueNotFittingItsKind() {
        Map<ParameterKey, ParameterValue> values = new EnumMap<>(parameters.asMap());
        values.put(ParameterKey.AVERAGED_RATE, ParameterValue.of("81.5"));

        assertThatThrownBy(() -> new LegalParameters(values)).isInstanceOf(InvalidLegalParametersException.class);
    }

    @Test
    void readsTypedValues() {
        assertThat(parameters.amount(ParameterKey.MINIMUM_WAGE)).isEqualTo(Money.of(4806));
        assertThat(parameters.amount(ParameterKey.DEBT_THRESHOLD)).isEqualTo(Money.of("48.06"));
        assertThat(parameters.rate(ParameterKey.AVERAGED_RATE)).isEqualTo(Rate.of("0.815"));
        assertThat(parameters.weeks(ParameterKey.NON_TRANSFERABLE_PARENTAL_WEEKS)).isEqualTo(Weeks.of(9));
        assertThat(parameters.days(ParameterKey.PREGNANCY_BENEFIT_PERIOD_DAYS)).isEqualTo(270);
        assertThat(parameters.months(ParameterKey.REHABILITATION_MAX_MONTHS)).isEqualTo(12);
        assertThat(parameters.years(ParameterKey.ADOPTED_CHILD_AGE_LIMIT)).isEqualTo(14);
    }

    @Test
    void refusesToReadValueAsWrongKind() {
        assertThatIllegalArgumentException().isThrownBy(() -> parameters.rate(ParameterKey.MINIMUM_WAGE));
        assertThatIllegalArgumentException().isThrownBy(() -> parameters.weeks(ParameterKey.MATERNITY_LEAVE_WEEKS));
    }

    @ParameterizedTest
    @CsvSource({"1, 20", "2, 31", "3, 33", "4, 35", "5, 37", "6, 37"})
    void maternityLeaveDependsOnNumberOfChildren(int children, int weeks) {
        assertThat(parameters.maternityLeaveWeeks(children)).isEqualTo(Weeks.of(weeks));
    }

    @ParameterizedTest
    @CsvSource({"1, false, 41, 82", "2, false, 43, 86", "1, true, 65, 130", "3, true, 67, 134"})
    void parentalLeaveDependsOnChildrenAndZaZyciem(int children, boolean zaZyciem, int weeks, int withWorkMax) {
        assertThat(parameters.parentalLeaveWeeks(children, zaZyciem)).isEqualTo(Weeks.of(weeks));
        assertThat(parameters.parentalLeaveWithWorkMaxWeeks(children, zaZyciem)).isEqualTo(Weeks.of(withWorkMax));
    }

    @Test
    void overridesSelectedValues() {
        var changed = LegalParametersFixtures.withOverrides(Map.of(ParameterKey.PARENTAL_LEAVE_RATE, "0.75"));

        assertThat(changed.rate(ParameterKey.PARENTAL_LEAVE_RATE)).isEqualTo(Rate.of("0.75"));
        assertThat(changed).isNotEqualTo(parameters);
        assertThat(LegalParametersFixtures.defaults()).isEqualTo(parameters);
    }
}

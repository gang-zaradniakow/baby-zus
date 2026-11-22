package com.hn26.zaradniaki.zusbaby.legalrules.application.handler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.hn26.zaradniaki.zusbaby.legalrules.api.exception.LegalParametersNotFoundException;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.mapper.LegalParametersDtoMapper;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetLegalParametersEffectiveOnQuery;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.LegalParametersFixtures;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSet;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSetRepository;
import com.hn26.zaradniaki.zusbaby.shared.time.FixedDateTimeGenerator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class LegalParametersHandlersTest {

    private static final LocalDate VALID_FROM = LocalDate.of(2026, 1, 1);
    private static final ParameterSet SET = ParameterSet.of(1, VALID_FROM, "Stan prawny 2026",
            LegalParametersFixtures.defaults());

    /** Fake repository with one version starting on 1 January 2026. */
    private final ParameterSetRepository repository = day -> SET.hasStartedOn(day)
            ? Optional.of(SET)
            : Optional.empty();
    private final LegalParametersDtoMapper mapper = Mappers.getMapper(LegalParametersDtoMapper.class);
    private final FixedDateTimeGenerator time = FixedDateTimeGenerator.onDay("2026-11-21");

    @Test
    void currentParametersAreTheOnesInForceToday() {
        var handler = new GetCurrentLegalParametersHandler(repository, mapper, time);

        LegalParametersDto result = handler.handle(new GetCurrentLegalParametersQuery());

        assertThat(result.version()).isEqualTo(1);
        assertThat(result.validFrom()).isEqualTo(VALID_FROM);
        assertThat(result.description()).isEqualTo("Stan prawny 2026");
        assertThat(result.parameters()).hasSize(ParameterKey.values().length).first()
                .isEqualTo(new ParameterDto(ParameterKey.MINIMUM_WAGE, ParameterKind.AMOUNT, "Płaca minimalna",
                        new BigDecimal("4806"), null));
        assertThat(result.parameters()).filteredOn(p -> p.key() == ParameterKey.MATERNITY_LEAVE_WEEKS).singleElement()
                .satisfies(p -> {
                    assertThat(p.value()).isNull();
                    assertThat(p.values()).extracting(BigDecimal::intValue).containsExactly(20, 31, 33, 35, 37);
                });
    }

    @Test
    void currentParametersAreMissingBeforeTheFirstVersion() {
        time.setDay(LocalDate.of(2025, 12, 31));
        var handler = new GetCurrentLegalParametersHandler(repository, mapper, time);

        assertThatThrownBy(() -> handler.handle(new GetCurrentLegalParametersQuery()))
                .isInstanceOf(LegalParametersNotFoundException.class);
    }

    @Test
    void parametersCanBeReadForAnyDay() {
        var handler = new GetLegalParametersEffectiveOnHandler(repository, mapper);

        assertThat(handler.handle(new GetLegalParametersEffectiveOnQuery(VALID_FROM)).version()).isEqualTo(1);
        assertThatThrownBy(() -> handler.handle(new GetLegalParametersEffectiveOnQuery(LocalDate.of(2025, 6, 1))))
                .isInstanceOf(LegalParametersNotFoundException.class);
    }
}

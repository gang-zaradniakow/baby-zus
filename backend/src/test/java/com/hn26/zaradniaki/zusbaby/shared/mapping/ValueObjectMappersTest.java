package com.hn26.zaradniaki.zusbaby.shared.mapping;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

/**
 * Checks a sample mapper generated with {@link MapStructConfig}: records on
 * both sides (canonical constructors) and value objects converted by
 * {@link ValueObjectMappers}.
 */
class ValueObjectMappersTest {

    private final SampleMapper mapper = Mappers.getMapper(SampleMapper.class);

    @Test
    void mapsWireRecordToCommandWithValueObjects() {
        var request = new SampleRequest("4147.10", new BigDecimal("0.815"), new BigDecimal("20"), 9);

        var command = mapper.toCommand(request);

        assertThat(command).isEqualTo(
                new SampleCommand(Money.of("4147.1"), Rate.of("0.815"), Weeks.of(20), Weeks.of(9)));
    }

    @Test
    void mapsResultBackWithMoneyAsTwoDecimalString() {
        var result = new SampleCommand(Money.of("1000"), Rate.of("0.7"), Weeks.of("4.5"), Weeks.of(9));

        var response = mapper.toResponse(result);

        assertThat(response).isEqualTo(new SampleResponse("1000.00", new BigDecimal("0.7"), new BigDecimal("4.5"),
                new BigDecimal("9")));
    }

    @Test
    void roundsMoneyOnTheWire() {
        assertThat(ValueObjectMappers.toAmountString(Money.of("4147.0974"))).isEqualTo("4147.10");
        assertThat(ValueObjectMappers.toAmountString(Money.of("0.005"))).isEqualTo("0.01");
    }

    @Test
    void keepsNullsAsNulls() {
        var command = mapper.toCommand(new SampleRequest(null, null, null, null));

        assertThat(command).isEqualTo(new SampleCommand(null, null, null, null));
    }

    record SampleRequest(String amount, BigDecimal rate, BigDecimal weeks, Integer fatherWeeks) {
    }

    record SampleCommand(Money amount, Rate rate, Weeks weeks, Weeks fatherWeeks) {
    }

    record SampleResponse(String amount, BigDecimal rate, BigDecimal weeks, BigDecimal fatherWeeks) {
    }

    @Mapper(config = MapStructConfig.class)
    interface SampleMapper {

        SampleCommand toCommand(SampleRequest request);

        SampleResponse toResponse(SampleCommand command);
    }
}

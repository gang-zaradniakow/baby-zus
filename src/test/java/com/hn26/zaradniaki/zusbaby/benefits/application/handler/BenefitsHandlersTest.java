package com.hn26.zaradniaki.zusbaby.benefits.application.handler;

import static org.assertj.core.api.Assertions.assertThat;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Notification;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitParametersMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitsDtoMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateBenefitBaseQuery;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateLeaveDimensionsQuery;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.ResolveInsuranceQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.base.BenefitBaseCalculator;
import com.hn26.zaradniaki.zusbaby.benefits.domain.base.MonthlyPay;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionType;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.LeaveDimensionsPolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.SupplementaryLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.TakenInChild;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

/**
 * Handlers take the legal parameters from the legalrules query; here a changed
 * 2027 legal state answers it.
 */
class BenefitsHandlersTest {

    private static final Map<ParameterKey, String> LEGAL_STATE_2027 = Map.ofEntries(
            Map.entry(ParameterKey.MINIMUM_WAGE, "5000"), Map.entry(ParameterKey.EMPLOYEE_CONTRIBUTION_RATE, "0.1371"),
            Map.entry(ParameterKey.MINIMUM_BENEFIT_BASE, "4314.50"),
            Map.entry(ParameterKey.MAXIMUM_VOLUNTARY_BENEFIT_BASE, "21000"),
            Map.entry(ParameterKey.DEBT_THRESHOLD, "50"), Map.entry(ParameterKey.PARENTAL_LEAVE_WEEKS_ONE_CHILD, "41"),
            Map.entry(ParameterKey.PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN, "43"),
            Map.entry(ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD, "65"),
            Map.entry(ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN, "67"),
            Map.entry(ParameterKey.ADOPTION_MINIMUM_WEEKS, "9"),
            Map.entry(ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS, "38"),
            Map.entry(ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM, "62"),
            Map.entry(ParameterKey.FOSTER_CHILD_AGE_LIMIT, "7"),
            Map.entry(ParameterKey.FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL, "10"),
            Map.entry(ParameterKey.ADOPTED_CHILD_AGE_LIMIT, "16"),
            Map.entry(ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM, "15"),
            Map.entry(ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS, "8"));

    private final Pipeline pipeline = new Pipeline() {
        @Override
        @SuppressWarnings("unchecked")
        public <R, C extends Command<R>> R send(C command) {
            assertThat(command).isInstanceOf(GetCurrentLegalParametersQuery.class);
            List<ParameterDto> parameters = new ArrayList<>();
            LEGAL_STATE_2027.forEach((key, value) -> parameters
                    .add(new ParameterDto(key, key.kind(), key.label(), new BigDecimal(value), null)));
            parameters.add(new ParameterDto(ParameterKey.MATERNITY_LEAVE_WEEKS,
                    ParameterKey.MATERNITY_LEAVE_WEEKS.kind(), ParameterKey.MATERNITY_LEAVE_WEEKS.label(), null,
                    List.of(BigDecimal.valueOf(20), BigDecimal.valueOf(31), BigDecimal.valueOf(33),
                            BigDecimal.valueOf(35), BigDecimal.valueOf(37))));
            return (R) new LegalParametersDto(2, LocalDate.of(2027, 1, 1), "Stan prawny 2027", parameters);
        }

        @Override
        public <N extends Notification> void send(N notification) {
            throw new UnsupportedOperationException();
        }
    };

    private final BenefitsDtoMapper mapper = Mappers.getMapper(BenefitsDtoMapper.class);
    private final BenefitParametersMapper parametersMapper = new BenefitParametersMapper();

    @Test
    void resolvesInsuranceWithTheCurrentLegalParameters() {
        var handler = new ResolveInsuranceHandler(pipeline, new InsuranceTitleResolver(), parametersMapper, mapper);

        var result = handler.handle(new ResolveInsuranceQuery(
                new InsuranceTitles(new InsuranceTitles.Employment(Money.of(3000), true), null, null, false)));

        assertThat(result.mainTitle()).isEqualTo(InsuranceTitle.EMPLOYMENT);
        assertThat(result.base()).isEqualTo(Money.of("4314.50"));
        assertThat(result.checks().getFirst().message()).contains("4314,50 zł");
    }

    @Test
    void calculatesBenefitBaseWithTheCurrentLegalParameters() {
        var handler = new CalculateBenefitBaseHandler(pipeline, new BenefitBaseCalculator(), parametersMapper,
                mapper);

        var result = handler.handle(new CalculateBenefitBaseQuery(List.of(new MonthlyPay(Money.of(3000), false)),
                InsuranceTitle.EMPLOYMENT, true));

        assertThat(result.base()).isEqualTo(Money.of("4314.50"));
        assertThat(result.monthsCounted()).isEqualTo(1);
    }

    @Test
    void calculatesLeaveForChildTakenInWithTheCurrentAgeLimit() {
        var handler = leaveHandler();

        // 15-year-old: too old under the 14-year limit, still entitled under the
        // changed 16-year limit
        var result = handler.handle(new CalculateLeaveDimensionsQuery(1, false,
                new TakenInChild(AdoptionType.ADOPTION, BigDecimal.valueOf(15), false), null));

        assertThat(result.adoption().ageLimit()).isEqualTo(16);
        assertThat(result.maternityWeeks()).isEqualTo(Weeks.of(20));
        assertThat(result.supplementary()).isNull();
    }

    @Test
    void addsSupplementaryLeaveForPrematureBirth() {
        var result = leaveHandler().handle(new CalculateLeaveDimensionsQuery(1, true, null,
                new PretermBirth(27, 950, 49, 5)));

        assertThat(result.maternityWeeks()).isEqualTo(Weeks.of(20));
        assertThat(result.parentalWeeks()).isEqualTo(Weeks.of(65));
        assertThat(result.supplementary().weeks()).isEqualTo(Weeks.of(7));
        assertThat(result.adoption()).isNull();
    }

    private CalculateLeaveDimensionsHandler leaveHandler() {
        var dimensions = new LeaveDimensionsPolicy();
        return new CalculateLeaveDimensionsHandler(pipeline, dimensions, new AdoptionLeavePolicy(dimensions),
                new SupplementaryLeavePolicy(), parametersMapper, mapper);
    }
}

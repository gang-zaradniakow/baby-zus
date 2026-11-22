package com.hn26.zaradniaki.zusbaby.guide.domain.survey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class SurveyTest {

    private static final LocalDate DATE = LocalDate.of(2026, 11, 1);

    @ParameterizedTest
    @EnumSource(value = WorkForm.class, names = {"EMPLOYMENT", "SELF_EMPLOYMENT", "MANDATE_CONTRACT"})
    void sicknessInsuranceComesFromEmploymentOrVoluntaryInsurance(WorkForm form) {
        assertThat(survey(CareStage.CHILD, null, Set.of(form)).hasSicknessInsurance()).isTrue();
    }

    @ParameterizedTest
    @EnumSource(value = WorkForm.class, names = {"SELF_EMPLOYMENT_WITHOUT_SICKNESS",
            "MANDATE_CONTRACT_WITHOUT_SICKNESS", "STARTUP_RELIEF", "FARMER", "NOT_WORKING"})
    void otherFormsGiveNoSicknessInsurance(WorkForm form) {
        assertThat(survey(CareStage.CHILD, null, Set.of(form)).hasSicknessInsurance()).isFalse();
    }

    @Test
    void birthDateIsTheDateForABornChildAndTheGivenOneForAChildTakenIn() {
        assertThat(survey(CareStage.PREGNANCY, null, Set.of(WorkForm.EMPLOYMENT)).birthDate()).isNull();
        assertThat(survey(CareStage.CHILD, null, Set.of(WorkForm.EMPLOYMENT)).birthDate()).isEqualTo(DATE);
        assertThat(survey(CareStage.ADOPTION, DATE.minusYears(2), Set.of(WorkForm.EMPLOYMENT)).birthDate())
                .isEqualTo(DATE.minusYears(2));
    }

    @Test
    void needsAFormOfWork() {
        assertThatIllegalArgumentException().isThrownBy(() -> survey(CareStage.CHILD, null, Set.of()));
    }

    @Test
    void needsBirthDateExactlyForAChildTakenIn() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> survey(CareStage.ADOPTION, null, Set.of(WorkForm.EMPLOYMENT)));
        assertThatIllegalArgumentException()
                .isThrownBy(() -> survey(CareStage.CHILD, DATE, Set.of(WorkForm.EMPLOYMENT)));
    }

    @Test
    void rejectsPrematureBabyInPregnancy() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new Survey(ParentRole.MOTHER, CareStage.PREGNANCY, DATE, null, 1,
                        new PretermDetails(30, 1500, 20), Set.of(WorkForm.EMPLOYMENT), PartnerTracking.SHOW_PARTNER));
    }

    private static Survey survey(CareStage stage, LocalDate childBirthDate, Set<WorkForm> work) {
        return new Survey(ParentRole.MOTHER, stage, DATE, childBirthDate, 1, null, work, PartnerTracking.SHOW_PARTNER);
    }
}

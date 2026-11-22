package com.hn26.zaradniaki.zusbaby.guide.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.guide.application.dto.GuestGuideDto;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.ParentRole;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PartnerTracking;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PretermDetails;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.WorkForm;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;

/** Guide of a guest from the survey answers; nothing is stored. */
public record PreviewGuideQuery(@NotNull ParentRole role, @NotNull CareStage stage, @NotNull LocalDate date,
        LocalDate childBirthDate, @Min(1) @Max(5) int children, PretermDetails preterm, @NotEmpty Set<WorkForm> work,
        @NotNull PartnerTracking partner) implements Command<GuestGuideDto> {

    @AssertTrue(message = "przy przyjęciu dziecka podaj jego datę urodzenia (i tylko wtedy)")
    boolean isChildBirthDateGivenOnlyForAdoption() {
        return stage == null || (stage == CareStage.ADOPTION) == (childBirthDate != null);
    }

    @AssertTrue(message = "wcześniaka zaznacz po narodzinach dziecka")
    boolean isPretermOnlyAfterBirth() {
        return stage != CareStage.PREGNANCY || preterm == null;
    }
}

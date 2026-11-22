package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;

public record MaternitySimulationDto(Weeks maternityWeeks, Weeks parentalWeeks, Weeks supplementaryWeeks,
        ParentLeaveShareDto mother, ParentLeaveShareDto father, boolean averagedVariant,
        List<LeaveSegmentDto> segments, MaternityTotalsDto totals, List<Check> checks, List<String> notes,
        AlternativeBenefitDto alternative) {
}

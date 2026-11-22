package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;

/**
 * Result of the simulator.
 * @param maternityWeeks maternity leave (or leave on maternity terms) of the
 *            family
 * @param parentalWeeks parental leave of the family
 * @param supplementaryWeeks supplementary maternity leave
 * @param mother mother's share
 * @param father father's share
 * @param averagedVariant the 81.5% variant applies
 * @param segments leaves on the timeline
 * @param checks entitlement of each parent (Polish)
 * @param notes remarks (Polish)
 */
public record MaternitySimulation(Weeks maternityWeeks, Weeks parentalWeeks, Weeks supplementaryWeeks,
        ParentLeaveShare mother, ParentLeaveShare father, boolean averagedVariant, List<LeaveSegment> segments,
        List<Check> checks, List<String> notes) {

    public MaternitySimulation {
        segments = List.copyOf(segments);
        checks = List.copyOf(checks);
        notes = List.copyOf(notes);
    }
}

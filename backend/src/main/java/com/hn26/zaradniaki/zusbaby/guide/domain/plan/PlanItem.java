package com.hn26.zaradniaki.zusbaby.guide.domain.plan;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;

/**
 * Row of the benefit plan ("Co Ci przysługuje").
 * @param kind notice, single benefit or the leaves
 * @param icon name of the frontend icon of a benefit row, otherwise
 *            {@code null}
 * @param title Polish title
 * @param text Polish text; for the leaves HTML with {@code <b>}
 * @param articleId article of the guide
 * @param totalWeeks weeks of all leaves (only for the leaves)
 * @param leaves leaves one after another (only for the leaves)
 */
public record PlanItem(PlanItemKind kind, String icon, String title, String text, String articleId,
        Weeks totalWeeks, List<PlannedLeave> leaves) {

    public PlanItem {
        leaves = List.copyOf(leaves);
    }

    static PlanItem notice(String title, String text, String articleId) {
        return new PlanItem(PlanItemKind.NOTICE, null, title, text, articleId, null, List.of());
    }

    static PlanItem benefit(String icon, String title, String text, String articleId) {
        return new PlanItem(PlanItemKind.BENEFIT, icon, title, text, articleId, null, List.of());
    }
}

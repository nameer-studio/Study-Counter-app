package com.studycounter.app.ui.theme

import androidx.compose.ui.graphics.Color
import com.studycounter.app.domain.model.ActivityType
import com.studycounter.app.domain.model.PaperCategory

/** Activity-chip dot colours, ported from the DS file's Chips·09 section. These reuse
 *  the same six hex values as the paper palette (coincidence in the source design, not
 *  a semantic link to any paper) — kept as a separate lookup so the two concepts don't
 *  get tangled if either palette changes independently later. */
fun ActivityType.dotColor(): Color = when (this) {
    ActivityType.Concept -> StudyCounterColors.paperAccounts // filled with primary at call site, dot unused
    ActivityType.Revision -> StudyCounterColors.paperCosting
    ActivityType.Practice -> StudyCounterColors.paperTaxation
    ActivityType.MockTest -> StudyCounterColors.paperLawCorp
    ActivityType.Lecture -> StudyCounterColors.paperAccounts
}

/** Paper-category → fixed colour, resolved from the current [PaperColorSet] (identical
 *  across themes, but routed through composition local so a future re-skin is one place). */
fun PaperCategory.color(papers: PaperColorSet): Color = when (this) {
    PaperCategory.Accounts -> papers.accounts
    PaperCategory.LawAndCorporate -> papers.lawCorp
    PaperCategory.Taxation -> papers.taxation
    PaperCategory.Costing -> papers.costing
    PaperCategory.Audit -> papers.audit
    PaperCategory.FinancialAndStrategicManagement -> papers.fmSm
}

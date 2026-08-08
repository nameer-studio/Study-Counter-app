package com.studycounter.app.domain.model

/** Computed by `PaceCalculator` from planned-vs-actual syllabus coverage against days
 *  remaining — never stored (see PLAN.md §5, "never stored, always derived"). */
enum class PaceStatus { Ahead, OnPace, Behind, NotStarted }

/** [dayDelta] is signed: positive = days ahead, negative = days behind. Null when
 *  [status] is [PaceStatus.NotStarted] (no data yet to compute a delta from). */
data class PaceState(
    val status: PaceStatus,
    val dayDelta: Int? = null,
)

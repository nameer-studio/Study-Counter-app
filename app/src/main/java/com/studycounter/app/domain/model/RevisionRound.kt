package com.studycounter.app.domain.model

/** Per-chapter status. Ordinal order matters — the pip indicator fills segments
 *  0..ordinal-1 and only shows the checkmark at [FinalRevision]. See
 *  `RevisionRoundIndicator` for the shared component that renders this. */
enum class RevisionRound(val shortLabel: String) {
    NotStarted("—"),
    FirstReading("1st read"),
    FirstRevision("1st rev"),
    SecondRevision("2nd rev"),
    FinalRevision("final"),
}

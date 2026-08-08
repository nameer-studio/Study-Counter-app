package com.studycounter.app.domain.model

/** Tagged on every study session (PLAN.md §3.3) — this is what lets the app tell the
 *  difference between "reading a chapter" and "actually practicing questions", which
 *  matters more for passing than raw hours logged. */
enum class ActivityType(val label: String) {
    Concept("Read"),
    Revision("Revise"),
    Practice("Practice"),
    MockTest("Mock test"),
    Lecture("Lecture"),
}

package com.studycounter.app.domain.model

/** Drives the daily-hour target used across Dashboard, D9, and H3 (see PLAN.md §2.5 —
 *  Foundation students are usually School/College, Final students cycle through
 *  Articleship then Study leave as their exam approaches). */
enum class SituationMode(val label: String) {
    SchoolOrCollege("School / college"),
    FullTimeStudy("Full-time study"),
    Articleship("Articleship"),
    StudyLeave("Study leave"),
}

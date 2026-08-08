package com.studycounter.app.domain.model

/** The six fixed, colour-coded paper categories used across charts, planner blocks and
 *  chapter trees (PLAN.md / DS file "Six paper colours" — deliberately colour-blind-safe,
 *  no red/green pair). Every ICAI paper across all three levels maps to exactly one of
 *  these; the label shown to the user is the paper's own name (e.g. "Direct Tax Laws"),
 *  this enum only decides *which colour* it renders in. */
enum class PaperCategory(val shortCode: String, val displayLabel: String) {
    Accounts("P1", "Accounts"),
    LawAndCorporate("P2", "Law & Corp"),
    Taxation("P3", "Taxation"),
    Costing("P4", "Costing"),
    Audit("P5", "Audit"),
    FinancialAndStrategicManagement("P6", "FM / SM"),
}

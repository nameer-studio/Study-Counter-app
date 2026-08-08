package com.studycounter.app.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Ported 1:1 from `Study Counter Design System.dc.html`'s `T` token map (the
 * design's single source of truth — do not hand-tune these against Figma/screenshots).
 * Three themes: Light (secondary), Dark (primary/default), AMOLED (true black).
 */
object StudyCounterColors {

    // ---- Dark (primary/default) ----
    val darkBackground = Color(0xFF0F111A)
    val darkSurface = Color(0xFF181B26)
    val darkSurface2 = Color(0xFF212533)
    val darkBorder = Color(0xFF2C3140)
    val darkText = Color(0xFFE9EBF2)
    val darkDim = Color(0xFF9BA2B4)
    val darkPrimary = Color(0xFF7C88F2)
    val darkOnPrimary = Color(0xFF0F111A)
    val darkGreen = Color(0xFF34C77B)
    val darkAmber = Color(0xFFE8A33D)
    val darkRed = Color(0xFFF2666A)
    val darkGrey = Color(0xFF8790A0)
    val darkStreak = Color(0xFFFFB020)
    val darkRing = Color(0xFF252A38)

    // ---- Light (secondary) ----
    val lightBackground = Color(0xFFEEF0F4)
    val lightSurface = Color(0xFFFFFFFF)
    val lightSurface2 = Color(0xFFF3F5F9)
    val lightBorder = Color(0xFFDFE3EB)
    val lightText = Color(0xFF15171E)
    val lightDim = Color(0xFF5B6270)
    val lightPrimary = Color(0xFF3D49C9)
    val lightOnPrimary = Color(0xFFFFFFFF)
    val lightGreen = Color(0xFF12925A)
    val lightAmber = Color(0xFFB7791F)
    val lightRed = Color(0xFFCE3438)
    val lightGrey = Color(0xFF8A8F98)
    val lightStreak = Color(0xFFDA7A00)
    val lightRing = Color(0xFFE4E7EE)

    // ---- AMOLED (true black) ----
    val amoledBackground = Color(0xFF000000)
    val amoledSurface = Color(0xFF0A0C12)
    val amoledSurface2 = Color(0xFF13161F)
    val amoledBorder = Color(0xFF23262F)
    val amoledText = Color(0xFFF1F2F8)
    val amoledDim = Color(0xFF8E95A7)
    val amoledPrimary = Color(0xFF8B96F5)
    val amoledOnPrimary = Color(0xFF000000)
    val amoledGreen = Color(0xFF3AD07F)
    val amoledAmber = Color(0xFFF0AC46)
    val amoledRed = Color(0xFFF76D71)
    val amoledGrey = Color(0xFF8790A0)
    val amoledStreak = Color(0xFFFFB522)
    val amoledRing = Color(0xFF181B24)

    // ---- Six paper colours (fixed mapping, colour-blind-safe, identical across themes) ----
    val paperAccounts = Color(0xFF4C8DFF) // Accounts / Financial Reporting
    val paperLawCorp = Color(0xFFF5822A) // Law & Corporate
    val paperTaxation = Color(0xFF2AB7CA) // Taxation
    val paperCosting = Color(0xFFA970FF) // Costing
    val paperAudit = Color(0xFFE255A1) // Audit
    val paperFmSm = Color(0xFFC9A227) // FM / SM
}

/**
 * One theme's full set of role colours — mirrors the `T[themeName]` objects in the
 * DS file exactly so `AppTheme` -> palette lookup stays a straight 1:1 mapping.
 */
data class StudyCounterPalette(
    val background: Color,
    val surface: Color,
    val surface2: Color,
    val border: Color,
    val text: Color,
    val dim: Color,
    val primary: Color,
    val onPrimary: Color,
    val green: Color,
    val amber: Color,
    val red: Color,
    val grey: Color,
    val streak: Color,
    val ring: Color,
)

val LightPalette = StudyCounterPalette(
    background = StudyCounterColors.lightBackground,
    surface = StudyCounterColors.lightSurface,
    surface2 = StudyCounterColors.lightSurface2,
    border = StudyCounterColors.lightBorder,
    text = StudyCounterColors.lightText,
    dim = StudyCounterColors.lightDim,
    primary = StudyCounterColors.lightPrimary,
    onPrimary = StudyCounterColors.lightOnPrimary,
    green = StudyCounterColors.lightGreen,
    amber = StudyCounterColors.lightAmber,
    red = StudyCounterColors.lightRed,
    grey = StudyCounterColors.lightGrey,
    streak = StudyCounterColors.lightStreak,
    ring = StudyCounterColors.lightRing,
)

val DarkPalette = StudyCounterPalette(
    background = StudyCounterColors.darkBackground,
    surface = StudyCounterColors.darkSurface,
    surface2 = StudyCounterColors.darkSurface2,
    border = StudyCounterColors.darkBorder,
    text = StudyCounterColors.darkText,
    dim = StudyCounterColors.darkDim,
    primary = StudyCounterColors.darkPrimary,
    onPrimary = StudyCounterColors.darkOnPrimary,
    green = StudyCounterColors.darkGreen,
    amber = StudyCounterColors.darkAmber,
    red = StudyCounterColors.darkRed,
    grey = StudyCounterColors.darkGrey,
    streak = StudyCounterColors.darkStreak,
    ring = StudyCounterColors.darkRing,
)

val AmoledPalette = StudyCounterPalette(
    background = StudyCounterColors.amoledBackground,
    surface = StudyCounterColors.amoledSurface,
    surface2 = StudyCounterColors.amoledSurface2,
    border = StudyCounterColors.amoledBorder,
    text = StudyCounterColors.amoledText,
    dim = StudyCounterColors.amoledDim,
    primary = StudyCounterColors.amoledPrimary,
    onPrimary = StudyCounterColors.amoledOnPrimary,
    green = StudyCounterColors.amoledGreen,
    amber = StudyCounterColors.amoledAmber,
    red = StudyCounterColors.amoledRed,
    grey = StudyCounterColors.amoledGrey,
    streak = StudyCounterColors.amoledStreak,
    ring = StudyCounterColors.amoledRing,
)

package com.studycounter.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

// Inter is not yet bundled as a font resource (needs res/font/inter_*.ttf — see the
// handoff README's Assets section). Falls back to the system default until added;
// swapping FontFamily.Default for the real Inter FontFamily is the only change needed.
val StudyCounterFontFamily: FontFamily = FontFamily.Default

/** Tabular-figure feature — required on every timer, countdown and marks display so
 *  digits never shift width while ticking (a hard requirement, not a nicety). */
const val TabularNumsFeature = "tnum"

/** Direct port of the DS file's `type` scale array — one entry per row, same order. */
object StudyCounterType {
    val displayCountdown = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.ExtraBold, // 800
        fontSize = 60.sp,
        lineHeight = 60.sp,
        letterSpacing = (-0.03).em,
    )

    /** Dashboard hero only — scales further per README (~76–128px). Same weight/tracking. */
    val heroCountdown = displayCountdown.copy(fontSize = 96.sp, lineHeight = 96.sp)

    val headline = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.Bold, // 700
        fontSize = 34.sp,
        lineHeight = 38.sp,
        letterSpacing = (-0.01).em,
    )

    val title = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.SemiBold, // 600
        fontSize = 22.sp,
        lineHeight = 26.sp,
        letterSpacing = (-0.01).em,
    )

    val subtitle = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
    )

    val bodyLarge = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp, // 1.5
    )

    val body = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 21.sp, // 1.5
    )

    val label = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.Medium, // 500
        fontSize = 13.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.005.em,
    )

    val caption = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 15.sp,
        letterSpacing = 0.01.em,
    )

    /** Uppercase at call sites — TextStyle doesn't transform case. */
    val overline = TextStyle(
        fontFamily = StudyCounterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.14.em,
    )

    /** Timer / countdown / marks — always paired with tabular figures at the call site
     *  (`Text(..., style = tabularNumberStyle(StudyCounterType.title))`). */
    fun tabular(base: TextStyle): TextStyle = base.copy(
        fontFeatureSettings = TabularNumsFeature,
    )
}

/** Material3 Typography mapping so standard components (buttons, TopAppBar, etc.)
 *  pick up the same family/weights without every screen redeclaring styles. */
val StudyCounterMaterialTypography = Typography(
    displayLarge = StudyCounterType.heroCountdown,
    displayMedium = StudyCounterType.displayCountdown,
    headlineLarge = StudyCounterType.headline,
    titleLarge = StudyCounterType.title,
    titleMedium = StudyCounterType.subtitle,
    bodyLarge = StudyCounterType.bodyLarge,
    bodyMedium = StudyCounterType.body,
    labelLarge = StudyCounterType.label,
    labelMedium = StudyCounterType.caption,
    labelSmall = StudyCounterType.overline,
)

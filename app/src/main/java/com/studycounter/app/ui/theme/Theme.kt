package com.studycounter.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.staticCompositionLocalOf

/** Persisted user setting (see H3 Settings) — Dark is the default/primary experience. */
enum class AppTheme { Light, Dark, Amoled }

private fun paletteFor(theme: AppTheme): StudyCounterPalette = when (theme) {
    AppTheme.Light -> LightPalette
    AppTheme.Dark -> DarkPalette
    AppTheme.Amoled -> AmoledPalette
}

/** The full role palette (pace colours, paper ring colour, dim text, etc.) that M3's
 *  ColorScheme has no slot for. Custom components read this directly. */
val LocalStudyCounterPalette = staticCompositionLocalOf { DarkPalette }

/** The six fixed paper colours — identical across all three themes. */
val LocalPaperColors = compositionLocalOf { PaperColorSet.Default }

data class PaperColorSet(
    val accounts: androidx.compose.ui.graphics.Color,
    val lawCorp: androidx.compose.ui.graphics.Color,
    val taxation: androidx.compose.ui.graphics.Color,
    val costing: androidx.compose.ui.graphics.Color,
    val audit: androidx.compose.ui.graphics.Color,
    val fmSm: androidx.compose.ui.graphics.Color,
) {
    companion object {
        val Default = PaperColorSet(
            accounts = StudyCounterColors.paperAccounts,
            lawCorp = StudyCounterColors.paperLawCorp,
            taxation = StudyCounterColors.paperTaxation,
            costing = StudyCounterColors.paperCosting,
            audit = StudyCounterColors.paperAudit,
            fmSm = StudyCounterColors.paperFmSm,
        )
    }
}

private fun ColorScheme.applyPalette(p: StudyCounterPalette, isLight: Boolean): ColorScheme {
    val base = if (isLight) lightColorScheme() else darkColorScheme()
    return base.copy(
        primary = p.primary,
        onPrimary = p.onPrimary,
        background = p.background,
        onBackground = p.text,
        surface = p.surface,
        onSurface = p.text,
        surfaceVariant = p.surface2,
        onSurfaceVariant = p.dim,
        outline = p.border,
        error = p.red,
        onError = p.onPrimary,
    )
}

@Composable
fun StudyCounterTheme(
    appTheme: AppTheme = AppTheme.Dark,
    content: @Composable () -> Unit,
) {
    val palette = paletteFor(appTheme)
    val isLight = appTheme == AppTheme.Light
    val colorScheme = MaterialTheme.colorScheme.applyPalette(palette, isLight)

    CompositionLocalProvider(
        LocalStudyCounterPalette provides palette,
        LocalPaperColors provides PaperColorSet.Default,
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = StudyCounterMaterialTypography,
            shapes = StudyCounterShapes,
            content = content,
        )
    }
}

/** Convenience accessor: `StudyCounterTheme.palette` inside any composable. */
object StudyCounterTheme {
    val palette: StudyCounterPalette
        @Composable get() = LocalStudyCounterPalette.current
    val papers: PaperColorSet
        @Composable get() = LocalPaperColors.current
}

/** Followed system dark-mode as the initial theme choice before a user preference is
 *  loaded from DataStore (H3 Settings persists the explicit override afterward). */
@Composable
fun systemDefaultAppTheme(): AppTheme = if (isSystemInDarkTheme()) AppTheme.Dark else AppTheme.Light

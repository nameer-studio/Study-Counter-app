package com.studycounter.app.ui.scaffold

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.studycounter.app.domain.model.ActivityType
import com.studycounter.app.domain.model.PaceState
import com.studycounter.app.domain.model.PaceStatus
import com.studycounter.app.domain.model.PaperCategory
import com.studycounter.app.domain.model.RevisionRound
import com.studycounter.app.ui.components.ActivityChip
import com.studycounter.app.ui.components.PaceBadge
import com.studycounter.app.ui.components.PaperChip
import com.studycounter.app.ui.components.ProgressRing
import com.studycounter.app.ui.components.RevisionRoundIndicator
import com.studycounter.app.ui.theme.AppTheme
import com.studycounter.app.ui.theme.StudyCounterTheme
import com.studycounter.app.ui.theme.StudyCounterType
import com.studycounter.app.ui.theme.TabularNumsFeature

/**
 * Not a real screen — a single-page proof that the theme port (Color/Type/Shape) and
 * the four shared components (revision pips, pace badge, progress ring, chips) match
 * the DS file before any of the 44 real screens get built on top of them. Delete once
 * B1 Dashboard and D7 Papers & syllabus exist for real.
 */
@Composable
fun SkeletonPreviewScreen() {
    val palette = StudyCounterTheme.palette
    var selectedActivity by remember { mutableStateOf(ActivityType.Concept) }

    Surface(modifier = Modifier.fillMaxSize(), color = palette.background) {
        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            Text("Study Counter — theme proof", style = StudyCounterType.overline, color = palette.streak)

            // Dual countdown, condensed.
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(palette.surface, RoundedCornerShape(20.dp))
                    .padding(24.dp),
            ) {
                Row(verticalAlignment = androidx.compose.ui.Alignment.Bottom) {
                    Text(
                        text = "42",
                        style = StudyCounterType.heroCountdown.copy(fontFeatureSettings = TabularNumsFeature),
                        color = palette.text,
                    )
                    Column(modifier = Modifier.padding(start = 12.dp, bottom = 8.dp)) {
                        Text("DAYS", style = StudyCounterType.subtitle, color = palette.text)
                        Text(
                            "until CA Final · Paper 1 · Financial Reporting",
                            style = StudyCounterType.caption,
                            color = palette.dim,
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                PaceBadge(state = PaceState(PaceStatus.OnPace))
            }

            // Three pace states side by side, per the design challenge in the handoff.
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PaceBadge(state = PaceState(PaceStatus.Ahead, dayDelta = 6))
                PaceBadge(state = PaceState(PaceStatus.Behind, dayDelta = -3))
                PaceBadge(state = PaceState(PaceStatus.Behind, dayDelta = -12))
                PaceBadge(state = PaceState(PaceStatus.NotStarted))
            }

            // Progress rings.
            Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                ProgressRing(progress = 0.72f, color = palette.green)
                ProgressRing(progress = 0.45f, color = palette.amber)
                ProgressRing(progress = 0.28f, color = palette.red)
            }

            // Revision round indicator across all five states, chapter-list style.
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                RevisionRound.entries.forEach { round ->
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Text(
                            text = round.shortLabel,
                            style = StudyCounterType.label,
                            color = palette.dim,
                            modifier = Modifier.padding(end = 12.dp),
                        )
                        RevisionRoundIndicator(round = round)
                    }
                }
            }

            // Paper chips — all six fixed colours.
            Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                PaperCategory.entries.forEach { category ->
                    PaperChip(category = category, label = category.displayLabel)
                }
            }

            // Activity chips — selectable.
            Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                ActivityType.entries.forEach { type ->
                    ActivityChip(
                        type = type,
                        selected = selectedActivity == type,
                        onClick = { selectedActivity = type },
                    )
                }
            }
        }
    }
}

@Preview(name = "Dark", showBackground = true)
@Composable
private fun SkeletonPreviewDark() {
    StudyCounterTheme(appTheme = AppTheme.Dark) { SkeletonPreviewScreen() }
}

@Preview(name = "Light", showBackground = true)
@Composable
private fun SkeletonPreviewLight() {
    StudyCounterTheme(appTheme = AppTheme.Light) { SkeletonPreviewScreen() }
}

@Preview(name = "AMOLED", showBackground = true)
@Composable
private fun SkeletonPreviewAmoled() {
    StudyCounterTheme(appTheme = AppTheme.Amoled) { SkeletonPreviewScreen() }
}

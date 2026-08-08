package com.studycounter.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.studycounter.app.domain.model.PaceState
import com.studycounter.app.domain.model.PaceStatus
import com.studycounter.app.ui.theme.StudyCounterTheme
import com.studycounter.app.ui.theme.StudyCounterType
import com.studycounter.app.ui.theme.TabularNumsFeature

/**
 * Small status pill beside the countdown and on paper cards (DS Components·07).
 * Honest states, stated plainly — colour is never the only signal, text always
 * accompanies it (accessibility rule from the handoff). "Behind" turns from amber to
 * red past [amberToRedThresholdDays], matching the DS examples ("3 days behind" =
 * amber, "12 days behind" = red).
 */
@Composable
fun PaceBadge(
    state: PaceState,
    modifier: Modifier = Modifier,
    amberToRedThresholdDays: Int = 7,
) {
    val palette = StudyCounterTheme.palette
    val delta = state.dayDelta

    val (color, label, showChevron) = when (state.status) {
        PaceStatus.OnPace -> Triple(palette.green, "On pace", false)
        PaceStatus.Ahead -> Triple(palette.green, "${delta ?: 0} days ahead", true)
        PaceStatus.Behind -> {
            val magnitude = kotlin.math.abs(delta ?: 0)
            val c = if (magnitude > amberToRedThresholdDays) palette.red else palette.amber
            Triple(c, "$magnitude days behind", false)
        }
        PaceStatus.NotStarted -> Triple(palette.grey, "Not started", false)
    }

    Row(
        modifier = modifier
            .background(color.copy(alpha = 0.16f), CircleShape)
            .padding(PaddingValues(horizontal = 13.dp, vertical = 6.dp)),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        if (showChevron) {
            Icon(
                imageVector = Icons.Filled.KeyboardArrowUp,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(13.dp),
            )
        } else {
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .background(color, CircleShape),
            )
        }
        Text(
            text = label,
            color = color,
            style = StudyCounterType.label.copy(fontFeatureSettings = TabularNumsFeature),
            textAlign = TextAlign.Center,
        )
    }
}

package com.studycounter.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.studycounter.app.domain.model.RevisionRound
import com.studycounter.app.ui.theme.StudyCounterTheme

/**
 * The app's most-repeated custom component — appears on ~240 chapter rows (D7), the
 * session log sheet (C4/C5), and planner block summaries (D1/D4). Four pips fill as a
 * chapter advances through [RevisionRound]; the final round turns green with a
 * checkmark to signal exam-ready. Ported from the DS file's Components·06 section.
 *
 * @param pipWidth / [pipHeight] default to the dense chapter-list size (18x7dp, 3dp gap);
 *   pass the larger standalone-card size (22x8dp) when showing this outside a list row.
 */
@Composable
fun RevisionRoundIndicator(
    round: RevisionRound,
    modifier: Modifier = Modifier,
    pipWidth: Dp = 18.dp,
    pipHeight: Dp = 7.dp,
    pipGap: Dp = 3.dp,
) {
    val palette = StudyCounterTheme.palette
    val filledCount = round.ordinal // 0..4
    val isFinal = round == RevisionRound.FinalRevision

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(pipGap),
    ) {
        repeat(4) { index ->
            val filled = index < filledCount
            val pipColor = when {
                isFinal -> palette.green
                filled -> palette.primary
                else -> null
            }
            val borderColor = when {
                isFinal -> palette.green
                filled -> palette.primary
                round == RevisionRound.NotStarted -> palette.grey.copy(alpha = 0.6f)
                else -> palette.border
            }
            Pip(width = pipWidth, height = pipHeight, fillColor = pipColor, borderColor = borderColor)
        }
        if (isFinal) {
            Icon(
                imageVector = Icons.Filled.Check,
                contentDescription = "Final revision complete",
                tint = palette.green,
                modifier = Modifier.size(pipHeight + 6.dp),
            )
        }
    }
}

@Composable
private fun Pip(width: Dp, height: Dp, fillColor: Color?, borderColor: Color) {
    val shape = RoundedCornerShape(3.dp)
    Box(
        modifier = Modifier
            .size(width, height)
            .let { m ->
                if (fillColor != null) m.background(fillColor, shape) else m.border(1.5.dp, borderColor, shape)
            },
    )
}

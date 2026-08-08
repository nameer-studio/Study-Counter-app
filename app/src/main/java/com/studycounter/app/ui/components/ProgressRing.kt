package com.studycounter.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.studycounter.app.ui.theme.StudyCounterTheme
import com.studycounter.app.ui.theme.StudyCounterType
import com.studycounter.app.ui.theme.TabularNumsFeature

/**
 * Circular progress ring (DS Components·08) — used for per-paper syllabus completion
 * and the Dashboard's daily-hours ring. Ring colour follows the pace language; the
 * centre figure is always tabular. [progress] is 0f..1f; pass `null` for the
 * dashed "not started" state (see [ProgressRingNotStarted]) or use
 * [ProgressRingComplete] for the 100%-with-checkmark state.
 */
@Composable
fun ProgressRing(
    progress: Float,
    color: Color,
    modifier: Modifier = Modifier,
    diameter: Dp = 90.dp,
    strokeWidth: Dp = 8.dp,
    centerLabel: String? = null,
    centerSuffix: String? = "%",
) {
    val palette = StudyCounterTheme.palette
    Box(modifier = modifier.size(diameter), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(diameter)) {
            val stroke = Stroke(width = strokeWidth.toPx(), cap = StrokeCap.Round)
            drawArc(
                color = palette.ring,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(width = strokeWidth.toPx()),
            )
            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = 360f * progress.coerceIn(0f, 1f),
                useCenter = false,
                style = stroke,
            )
        }
        val label = centerLabel ?: "${(progress.coerceIn(0f, 1f) * 100).toInt()}"
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = label,
                style = StudyCounterType.title.copy(fontFeatureSettings = TabularNumsFeature),
                color = palette.text,
            )
            if (centerSuffix != null) {
                Text(
                    text = centerSuffix,
                    style = StudyCounterType.caption,
                    color = palette.dim,
                )
            }
        }
    }
}

/** 100%-complete variant — full ring + checkmark, no percentage text (DS "Complete" state). */
@Composable
fun ProgressRingComplete(
    modifier: Modifier = Modifier,
    diameter: Dp = 90.dp,
    strokeWidth: Dp = 8.dp,
) {
    val palette = StudyCounterTheme.palette
    Box(modifier = modifier.size(diameter), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(diameter)) {
            drawArc(
                color = palette.green,
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(width = strokeWidth.toPx()),
            )
        }
        Icon(
            imageVector = Icons.Filled.Check,
            contentDescription = "Complete",
            tint = palette.green,
            modifier = Modifier.size(diameter * 0.35f),
        )
    }
}

/** Dashed, empty ring — no data logged yet (DS "Not started" state). */
@Composable
fun ProgressRingNotStarted(
    modifier: Modifier = Modifier,
    diameter: Dp = 90.dp,
    strokeWidth: Dp = 8.dp,
) {
    val palette = StudyCounterTheme.palette
    Box(modifier = modifier.size(diameter), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(diameter)) {
            drawArc(
                color = palette.ring,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(
                    width = strokeWidth.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 7.dp.toPx())),
                ),
            )
        }
        Text(
            text = "0",
            style = StudyCounterType.title,
            color = palette.grey,
        )
    }
}

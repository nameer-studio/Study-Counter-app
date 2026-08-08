package com.studycounter.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/** 4dp base grid — the only spacing scale used across the app. */
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val xl = 24.dp
    val xxl = 32.dp
}

/** Corner radius family — `r` token is 16dp base per the DS file; cards commonly
 *  13-22dp, pills/chips fully rounded. */
object StudyCounterRadius {
    val card = 16.dp
    val cardElevated = 20.dp // r + 4, used for the countdown hero card
    val sheet = 16.dp
    val chip = 999.dp // fully rounded pill
    val button = 11.dp
}

val StudyCounterShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(11.dp),
    medium = RoundedCornerShape(StudyCounterRadius.card),
    large = RoundedCornerShape(StudyCounterRadius.cardElevated),
    extraLarge = RoundedCornerShape(28.dp),
)

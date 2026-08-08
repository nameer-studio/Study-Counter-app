package com.studycounter.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.studycounter.app.domain.model.ActivityType
import com.studycounter.app.domain.model.PaperCategory
import com.studycounter.app.ui.theme.StudyCounterRadius
import com.studycounter.app.ui.theme.StudyCounterTheme
import com.studycounter.app.ui.theme.StudyCounterType
import com.studycounter.app.ui.theme.color
import com.studycounter.app.ui.theme.dotColor

/** Paper tag — carries the paper's fixed colour at 16% background tint (DS Chips·09).
 *  [label] is the paper's actual name (e.g. "Direct Tax Laws"); [category] only
 *  decides which of the six fixed colours it renders in. */
@Composable
fun PaperChip(category: PaperCategory, label: String, modifier: Modifier = Modifier) {
    val color = category.color(StudyCounterTheme.papers)
    Row(
        modifier = modifier
            .background(color.copy(alpha = 0.16f), RoundedCornerShape(8.dp))
            .padding(PaddingValues(horizontal = 11.dp, vertical = 5.dp)),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(modifier = Modifier.size(6.dp).background(color, RoundedCornerShape(2.dp)))
        Text(text = label, color = color, style = StudyCounterType.label)
    }
}

/** Activity-type chip (📖 Concept / ✍️ Practice / 🔁 Revision / 📝 Mock / 🎧 Lecture).
 *  Selected fills with primary; unselected is a neutral outlined pill with a coloured
 *  dot (DS Chips·09). Used in C1 Timer setup and C4/C5 session logging. */
@Composable
fun ActivityChip(
    type: ActivityType,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val palette = StudyCounterTheme.palette
    val shape = RoundedCornerShape(StudyCounterRadius.chip)
    Row(
        modifier = modifier
            .clip(shape)
            .let {
                if (selected) it.background(palette.primary, shape)
                else it.background(palette.surface2, shape).border(1.dp, palette.border, shape)
            }
            .clickable(onClick = onClick)
            .padding(PaddingValues(horizontal = 13.dp, vertical = 6.dp)),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        val dotColor = if (selected) palette.onPrimary else type.dotColor()
        Box(modifier = Modifier.size(6.dp).background(dotColor, CircleShape))
        Text(
            text = type.label,
            color = if (selected) palette.onPrimary else palette.text,
            style = StudyCounterType.label,
        )
    }
}

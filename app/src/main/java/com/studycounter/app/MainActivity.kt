package com.studycounter.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import dagger.hilt.android.AndroidEntryPoint
import com.studycounter.app.ui.scaffold.SkeletonPreviewScreen
import com.studycounter.app.ui.theme.AppTheme
import com.studycounter.app.ui.theme.StudyCounterTheme

/**
 * Single-Activity host. Real navigation (Navigation Compose graph across the 44
 * screens) lands in Phase 1 step 3 onward — this currently hosts
 * [SkeletonPreviewScreen] only, to prove the theme/component port end-to-end before
 * screens are wired up.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            // TODO(phase-1): replace AppTheme.Dark with the persisted DataStore preference.
            StudyCounterTheme(appTheme = AppTheme.Dark) {
                SkeletonPreviewScreen()
            }
        }
    }
}

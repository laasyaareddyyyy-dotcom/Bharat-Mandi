package com.example.markethub.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val PhoolMitraColorScheme = lightColorScheme(
    primary = PhoolMitraGreen,
    onPrimary = Color.White,
    primaryContainer = PhoolMitraLightGreen,
    onPrimaryContainer = PhoolMitraGreen,
    secondary = PhoolMitraGold,
    onSecondary = PhoolMitraTextDark,
    background = PhoolMitraBackground,
    onBackground = PhoolMitraTextDark,
    surface = PhoolMitraSurface,
    onSurface = PhoolMitraTextDark,
    surfaceVariant = PhoolMitraSurfaceVariant,
    onSurfaceVariant = PhoolMitraTextMuted,
    outline = PhoolMitraBorder,
    outlineVariant = PhoolMitraBorder
)

@Composable
fun MarkethubTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = PhoolMitraColorScheme,
        typography = Typography,
        content = content
    )
}

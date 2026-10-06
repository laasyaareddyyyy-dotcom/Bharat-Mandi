package com.example.markethub.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.markethub.data.model.*
import com.example.markethub.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarketHubHeader(
    currentRole: UserRole,
    onRoleChange: (UserRole) -> Unit,
    currentLanguage: Language,
    onLanguageChange: (Language) -> Unit,
    onOpenSupport: () -> Unit
) {
    var langMenuExpanded by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        // Dark Green PhoolMitra Top Notification Bar
        Surface(
            color = PhoolMitraGreen,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.VerifiedUser,
                        contentDescription = null,
                        tint = PhoolMitraGold,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "FLOWER MANDI",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        ),
                        color = PhoolMitraGold
                    )
                    Text(
                        text = " • Shop #42 Gudur APMC",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.Black.copy(alpha = 0.25f),
                    modifier = Modifier.clickable {
                        onRoleChange(if (currentRole == UserRole.MERCHANT) UserRole.FARMER else UserRole.MERCHANT)
                    }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (currentRole == UserRole.MERCHANT) Icons.Default.Storefront else Icons.Default.Agriculture,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (currentRole == UserRole.MERCHANT) "Merchant Portal" else "Farmer Portal",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Main White Header Navbar
        Surface(
            color = PhoolMitraSurface,
            shadowElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(PhoolMitraGreen),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("🌸", fontSize = 20.sp)
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = if (currentRole == UserRole.MERCHANT) "Sri Lakshmi Flower Traders" else "Ramesh Patel (Rythu)",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = PhoolMitraTextDark
                            )
                            Text(
                                text = "PhoolMitra Wholesale Form C Adathiya",
                                style = MaterialTheme.typography.bodySmall,
                                color = PhoolMitraTextMuted
                            )
                        }
                    }

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Language Dropdown
                        Box {
                            AssistChip(
                                onClick = { langMenuExpanded = true },
                                label = { Text(currentLanguage.displayName) },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Language,
                                        contentDescription = "Language",
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            )
                            DropdownMenu(
                                expanded = langMenuExpanded,
                                onDismissRequest = { langMenuExpanded = false }
                            ) {
                                Language.entries.forEach { lang ->
                                    DropdownMenuItem(
                                        text = { Text(lang.displayName) },
                                        onClick = {
                                            onLanguageChange(lang)
                                            langMenuExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        // Support Button
                        IconButton(onClick = onOpenSupport) {
                            Icon(
                                imageVector = Icons.Default.Headphones,
                                contentDescription = "Support",
                                tint = PhoolMitraGreen
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Role Segmented Switcher Control
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = PhoolMitraSurfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(3.dp)
                    ) {
                        val merchantBg by animateColorAsState(
                            targetValue = if (currentRole == UserRole.MERCHANT) PhoolMitraGreen else Color.Transparent,
                            label = "merchantBg"
                        )
                        val merchantText = if (currentRole == UserRole.MERCHANT) Color.White else PhoolMitraTextDark

                        val farmerBg by animateColorAsState(
                            targetValue = if (currentRole == UserRole.FARMER) PhoolMitraGreen else Color.Transparent,
                            label = "farmerBg"
                        )
                        val farmerText = if (currentRole == UserRole.FARMER) Color.White else PhoolMitraTextDark

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(16.dp))
                                .background(merchantBg)
                                .clickable { onRoleChange(UserRole.MERCHANT) }
                                .padding(vertical = 7.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Storefront,
                                    contentDescription = null,
                                    tint = merchantText,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Merchant (Aadhtiya)",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = merchantText,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(16.dp))
                                .background(farmerBg)
                                .clickable { onRoleChange(UserRole.FARMER) }
                                .padding(vertical = 7.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Agriculture,
                                    contentDescription = null,
                                    tint = farmerText,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Farmer (Rythu)",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = farmerText,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommodityCategoryBar(
    selectedCategory: CommodityCategory,
    onCategorySelected: (CommodityCategory) -> Unit
) {
    SecondaryScrollableTabRow(
        selectedTabIndex = CommodityCategory.entries.indexOf(selectedCategory),
        edgePadding = 14.dp,
        containerColor = PhoolMitraSurfaceVariant
    ) {
        CommodityCategory.entries.forEach { category ->
            Tab(
                selected = selectedCategory == category,
                onClick = { onCategorySelected(category) },
                text = {
                    Text(
                        text = "${category.emoji} ${category.displayName}",
                        fontWeight = if (selectedCategory == category) FontWeight.Bold else FontWeight.Normal,
                        color = if (selectedCategory == category) PhoolMitraGreen else PhoolMitraTextDark
                    )
                }
            )
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    icon: ImageVector,
    containerColor: Color = PhoolMitraLightGreen,
    contentColor: Color = PhoolMitraGreen
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = contentColor.copy(alpha = 0.85f)
                )
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(contentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = contentColor,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = contentColor
            )
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = contentColor.copy(alpha = 0.75f)
                )
            }
        }
    }
}

@Composable
fun StatusChip(status: PaymentStatus) {
    val (bgColor, textColor, text) = when (status) {
        PaymentStatus.PAID -> Triple(Color(0xFFE8F5E9), Color(0xFF2E7D32), "PAID")
        PaymentStatus.PARTIAL -> Triple(Color(0xFFFFF3E0), Color(0xFFE65100), "PARTIAL")
        PaymentStatus.UNPAID -> Triple(Color(0xFFFFEBEE), Color(0xFFC62828), "UNPAID")
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = textColor
        )
    }
}

@Composable
fun SaleLotCard(
    lot: SaleLot,
    onViewParchi: (SaleLot) -> Unit,
    onRecordPayment: ((SaleLot) -> Unit)? = null
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = PhoolMitraSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = lot.parchiNumber,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = PhoolMitraGreen
                    )
                }
                StatusChip(status = lot.paymentStatus)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = lot.farmerName,
                        style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                        color = PhoolMitraTextDark
                    )
                    Text(
                        text = "📍 ${lot.farmerVillage}",
                        style = MaterialTheme.typography.bodySmall,
                        color = PhoolMitraTextMuted
                    )
                }
                Text(
                    text = "${lot.date} | ${lot.time}",
                    style = MaterialTheme.typography.bodySmall,
                    color = PhoolMitraTextMuted
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 10.dp),
                color = PhoolMitraBorder
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Crop Variety",
                        style = MaterialTheme.typography.labelSmall,
                        color = PhoolMitraTextMuted
                    )
                    Text(
                        text = lot.varietyName,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = PhoolMitraTextDark
                    )
                }
                Column {
                    Text(
                        text = "Quantity & Rate",
                        style = MaterialTheme.typography.labelSmall,
                        color = PhoolMitraTextMuted
                    )
                    Text(
                        text = "${lot.quantity} ${lot.unit} @ ₹${lot.rate}/${lot.unit.take(3)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = PhoolMitraTextDark
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Net Payable",
                        style = MaterialTheme.typography.labelSmall,
                        color = PhoolMitraTextMuted
                    )
                    Text(
                        text = "₹${lot.farmerNetPayable.toInt()}",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = PhoolMitraGreen
                        )
                    )
                }
            }

            if (lot.balanceDue > 0) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Text(
                        text = "Balance Due: ₹${lot.balanceDue.toInt()}",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFC62828)
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = { onViewParchi(lot) },
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Receipt,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = PhoolMitraGreen
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Parchi Receipt", color = PhoolMitraGreen)
                }

                if (onRecordPayment != null && lot.balanceDue > 0) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onRecordPayment(lot) },
                        colors = ButtonDefaults.buttonColors(containerColor = PhoolMitraGreen),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Payment,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Pay Farmer")
                    }
                }
            }
        }
    }
}

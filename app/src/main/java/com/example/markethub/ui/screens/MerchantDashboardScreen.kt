package com.example.markethub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.markethub.data.model.*
import com.example.markethub.ui.MarketHubViewModel
import com.example.markethub.ui.components.MetricCard
import com.example.markethub.ui.components.SaleLotCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MerchantDashboardScreen(
    viewModel: MarketHubViewModel,
    onNavigateToNewSale: () -> Unit,
    onNavigateToPayment: () -> Unit,
    onViewParchi: (SaleLot) -> Unit
) {
    val saleLots by viewModel.saleLots.collectAsState()
    val farmers by viewModel.farmers.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()

    val categoryFilteredLots = saleLots.filter { it.commodityCategory == selectedCategory }
    val totalGross = categoryFilteredLots.sumOf { it.grossTotal }
    val totalCommission = categoryFilteredLots.sumOf { it.commissionAmount }
    val totalNetDues = categoryFilteredLots.sumOf { it.balanceDue }
    val totalLotsCount = categoryFilteredLots.size

    val paidCount = categoryFilteredLots.count { it.paymentStatus == PaymentStatus.PAID }
    val partialCount = categoryFilteredLots.count { it.paymentStatus == PaymentStatus.PARTIAL }
    val unpaidCount = categoryFilteredLots.count { it.paymentStatus == PaymentStatus.UNPAID }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                shape = RoundedCornerShape(20.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Sri Lakshmi Flower Traders",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "APMC Shop #42 | ${farmers.size} Connected Farmers",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                        )
                    }
                    Button(
                        onClick = onNavigateToNewSale,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("+ Parchi")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }

        item {
            Text(
                text = "${selectedCategory.emoji} ${selectedCategory.displayName} Summary Today",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Total Gross",
                    value = "₹${totalGross.toInt()}",
                    subtitle = "$totalLotsCount Lots Today",
                    icon = Icons.Default.Payments,
                    containerColor = Color(0xFFE3F2FD),
                    contentColor = Color(0xFF1565C0),
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Commission (Aadht)",
                    value = "₹${totalCommission.toInt()}",
                    subtitle = "${selectedCategory.defaultCommissionRate}% Rate",
                    icon = Icons.Default.AccountBalanceWallet,
                    containerColor = Color(0xFFE8F5E9),
                    contentColor = Color(0xFF2E7D32),
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Farmer Net Dues",
                    value = "₹${totalNetDues.toInt()}",
                    subtitle = "$unpaidCount Unpaid Lots",
                    icon = Icons.Default.PendingActions,
                    containerColor = Color(0xFFFFEBEE),
                    contentColor = Color(0xFFC62828),
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Connected Farmers",
                    value = "${farmers.size}",
                    subtitle = "Gudur & Kovur APMC",
                    icon = Icons.Default.People,
                    containerColor = Color(0xFFFFF3E0),
                    contentColor = Color(0xFFE65100),
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Payment Status Breakdown",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Paid: $paidCount | Partial: $partialCount | Unpaid: $unpaidCount",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    val progress = if (totalLotsCount > 0) paidCount.toFloat() / totalLotsCount else 0f
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp),
                        color = Color(0xFF2E7D32),
                        trackColor = Color(0xFFFFCDD2)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Sale Lots (Parchis)",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                TextButton(onClick = onNavigateToNewSale) {
                    Text("+ New Parchi")
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        if (categoryFilteredLots.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ReceiptLong,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.outline
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No sale lots recorded today for ${selectedCategory.displayName}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.outline
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(onClick = onNavigateToNewSale) {
                            Text("Record First Sale Lot")
                        }
                    }
                }
            }
        } else {
            items(categoryFilteredLots, key = { it.id }) { lot ->
                SaleLotCard(
                    lot = lot,
                    onViewParchi = onViewParchi,
                    onRecordPayment = { onNavigateToPayment() }
                )
            }
        }
    }
}

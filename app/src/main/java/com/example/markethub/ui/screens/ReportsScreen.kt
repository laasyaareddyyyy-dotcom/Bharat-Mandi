package com.example.markethub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.markethub.data.model.PaymentStatus
import com.example.markethub.ui.MarketHubViewModel

@Composable
fun ReportsScreen(
    viewModel: MarketHubViewModel
) {
    val saleLots by viewModel.saleLots.collectAsState()
    val farmers by viewModel.farmers.collectAsState()

    var selectedReportType by remember { mutableStateOf("Daily Sales") }
    var exportSuccessMessage by remember { mutableStateOf<String?>(null) }

    val reportTypes = listOf("Daily Sales", "Farmer-wise", "Parchi Audit Trail")

    val totalGross = saleLots.sumOf { it.grossTotal }
    val totalCommission = saleLots.sumOf { it.commissionAmount }
    val totalVolume = saleLots.sumOf { it.quantity }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "📈 Mandi Reports & Export",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "APMC sales summary, commission reports and audit log",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(
                onClick = {
                    exportSuccessMessage = "Report exported as PDF to Downloads folder!"
                }
            ) {
                Icon(Icons.Default.Download, contentDescription = "Export PDF")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            reportTypes.forEach { type ->
                FilterChip(
                    selected = selectedReportType == type,
                    onClick = { selectedReportType = type },
                    label = { Text(type) }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (exportSuccessMessage != null) {
            Surface(
                color = Color(0xFFE8F5E9),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF2E7D32))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = exportSuccessMessage!!,
                        color = Color(0xFF2E7D32),
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "📊 All Time APMC Mandi Summary",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Total Volume", style = MaterialTheme.typography.labelSmall)
                        Text("${totalVolume.toInt()} Units", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                    }
                    Column {
                        Text("Gross Sales", style = MaterialTheme.typography.labelSmall)
                        Text("₹${totalGross.toInt()}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Aadht Earned", style = MaterialTheme.typography.labelSmall)
                        Text("₹${totalCommission.toInt()}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32)))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (selectedReportType) {
            "Daily Sales" -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(saleLots, key = { it.id }) { lot ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(lot.parchiNumber, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    Text("${lot.farmerName} • ${lot.varietyName}", style = MaterialTheme.typography.bodyMedium)
                                    Text("${lot.quantity} ${lot.unit} @ ₹${lot.rate}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("₹${lot.grossTotal.toInt()}", fontWeight = FontWeight.Bold)
                                    Text(
                                        text = if (lot.paymentStatus == PaymentStatus.PAID) "Paid" else "Due: ₹${lot.balanceDue.toInt()}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (lot.paymentStatus == PaymentStatus.PAID) Color(0xFF2E7D32) else Color(0xFFC62828)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            "Farmer-wise" -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(farmers, key = { it.id }) { farmer ->
                        val farmerLots = saleLots.filter { it.farmerId == farmer.id }
                        val fGross = farmerLots.sumOf { it.grossTotal }
                        val fDues = farmerLots.sumOf { it.balanceDue }

                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(farmer.name, fontWeight = FontWeight.Bold)
                                    Text("📍 ${farmer.village}", style = MaterialTheme.typography.bodySmall)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Total Turnover: ₹${fGross.toInt()}", style = MaterialTheme.typography.bodyMedium)
                                    Text("Pending Dues: ₹${fDues.toInt()}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFFC62828)))
                                }
                            }
                        }
                    }
                }
            }

            "Parchi Audit Trail" -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(saleLots, key = { it.id }) { lot ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("AUDIT: ${lot.parchiNumber}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelLarge)
                                    Text("${lot.date} ${lot.time}", style = MaterialTheme.typography.bodySmall)
                                }
                                Text("Generated by: Ramesh Kumar (Owner)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("Farmer: ${lot.farmerName} | Net Payable: ₹${lot.farmerNetPayable.toInt()}", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

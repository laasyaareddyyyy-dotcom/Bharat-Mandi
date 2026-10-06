package com.example.markethub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.markethub.ui.MarketHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentsSettlementScreen(
    viewModel: MarketHubViewModel
) {
    val farmers by viewModel.farmers.collectAsState()
    val payments by viewModel.payments.collectAsState()
    val settlements by viewModel.settlements.collectAsState()

    var activeTab by remember { mutableIntStateOf(0) }

    var selectedFarmer by remember { mutableStateOf(farmers.firstOrNull()) }
    var farmerDropdownExpanded by remember { mutableStateOf(false) }

    var amountStr by remember { mutableStateOf("") }
    var paymentMode by remember { mutableStateOf("UPI") }
    var referenceNumber by remember { mutableStateOf("") }
    var notesStr by remember { mutableStateOf("") }

    var paymentSuccessMessage by remember { mutableStateOf<String?>(null) }

    val paymentModes = listOf("Cash", "UPI", "PhonePe", "Google Pay", "Paytm", "Bank Transfer")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "💳 Payments & 15-Day Settlements",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = "Record farmer payments and manage fortnightly APMC settlements",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        SecondaryTabRow(selectedTabIndex = activeTab) {
            Tab(selected = activeTab == 0, onClick = { activeTab = 0 }, text = { Text("Record Payment") })
            Tab(selected = activeTab == 1, onClick = { activeTab = 1 }, text = { Text("15-Day Settlement") })
            Tab(selected = activeTab == 2, onClick = { activeTab = 2 }, text = { Text("History (${payments.size})") })
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (activeTab) {
            0 -> {
                val scrollState = rememberScrollState()
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "💸 Make Farmer Payment",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            Text("Select Farmer", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                            Spacer(modifier = Modifier.height(4.dp))
                            ExposedDropdownMenuBox(
                                expanded = farmerDropdownExpanded,
                                onExpandedChange = { farmerDropdownExpanded = !farmerDropdownExpanded }
                            ) {
                                OutlinedTextField(
                                    value = selectedFarmer?.let { "${it.name} (${it.village})" } ?: "Select Farmer",
                                    onValueChange = {},
                                    readOnly = true,
                                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = farmerDropdownExpanded) },
                                    modifier = Modifier
                                        .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
                                        .fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                ExposedDropdownMenu(
                                    expanded = farmerDropdownExpanded,
                                    onDismissRequest = { farmerDropdownExpanded = false }
                                ) {
                                    farmers.forEach { farmer ->
                                        DropdownMenuItem(
                                            text = { Text("${farmer.name} - ${farmer.village}") },
                                            onClick = {
                                                selectedFarmer = farmer
                                                farmerDropdownExpanded = false
                                            }
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            OutlinedTextField(
                                value = amountStr,
                                onValueChange = { amountStr = it },
                                label = { Text("Payment Amount (₹)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            Text("Payment Mode", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                paymentModes.take(3).forEach { mode ->
                                    FilterChip(
                                        selected = paymentMode == mode,
                                        onClick = { paymentMode = mode },
                                        label = { Text(mode) }
                                    )
                                }
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                paymentModes.drop(3).forEach { mode ->
                                    FilterChip(
                                        selected = paymentMode == mode,
                                        onClick = { paymentMode = mode },
                                        label = { Text(mode) }
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            OutlinedTextField(
                                value = referenceNumber,
                                onValueChange = { referenceNumber = it },
                                label = { Text("UTR / Reference # (Optional)") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            OutlinedTextField(
                                value = notesStr,
                                onValueChange = { notesStr = it },
                                label = { Text("Notes") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            )

                            Spacer(modifier = Modifier.height(20.dp))

                            if (paymentSuccessMessage != null) {
                                Surface(
                                    color = Color(0xFFE8F5E9),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = paymentSuccessMessage!!,
                                        modifier = Modifier.padding(12.dp),
                                        color = Color(0xFF2E7D32),
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            Button(
                                onClick = {
                                    val farmer = selectedFarmer
                                    val amt = amountStr.toDoubleOrNull() ?: 0.0
                                    if (farmer != null && amt > 0) {
                                        viewModel.recordPayment(
                                            farmerId = farmer.id,
                                            amount = amt,
                                            paymentMode = paymentMode,
                                            referenceNumber = referenceNumber,
                                            notes = notesStr
                                        )
                                        paymentSuccessMessage = "₹${amt.toInt()} payment successfully recorded for ${farmer.name} via $paymentMode!"
                                        amountStr = ""
                                        referenceNumber = ""
                                        notesStr = ""
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(16.dp),
                                enabled = selectedFarmer != null && (amountStr.toDoubleOrNull() ?: 0.0) > 0
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Record Payment Now", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            1 -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(settlements, key = { it.id }) { settlement ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = settlement.settlementNumber,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Surface(
                                        color = if (settlement.status == "Settled") Color(0xFFE8F5E9) else Color(0xFFFFF3E0),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(
                                            text = settlement.status,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                            color = if (settlement.status == "Settled") Color(0xFF2E7D32) else Color(0xFFE65100)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = "${settlement.farmerName} (${settlement.farmerVillage})",
                                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Period: ${settlement.periodLabel} | ${settlement.totalShipments} Lots",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("Total Gross", style = MaterialTheme.typography.labelSmall)
                                        Text("₹${settlement.totalGross.toInt()}", style = MaterialTheme.typography.bodyMedium)
                                    }
                                    Column {
                                        Text("Deductions", style = MaterialTheme.typography.labelSmall)
                                        Text("- ₹${settlement.totalDeductions.toInt()}", style = MaterialTheme.typography.bodyMedium, color = Color(0xFFC62828))
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Final Settlement", style = MaterialTheme.typography.labelSmall)
                                        Text(
                                            "₹${settlement.finalPayment.toInt()}",
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            2 -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(payments, key = { it.id }) { payment ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(payment.farmerName, fontWeight = FontWeight.Bold)
                                    Text("₹${payment.amount.toInt()}", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Mode: ${payment.paymentMode} | ${payment.referenceNumber}", style = MaterialTheme.typography.bodySmall)
                                    Text(payment.date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

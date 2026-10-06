package com.example.markethub.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.markethub.data.model.Farmer
import com.example.markethub.data.model.SaleLot
import com.example.markethub.ui.MarketHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmersKhataScreen(
    viewModel: MarketHubViewModel,
    onSelectFarmerKhata: (Farmer) -> Unit
) {
    val farmers by viewModel.farmers.collectAsState()
    val saleLots by viewModel.saleLots.collectAsState()

    var showAddFarmerDialog by remember { mutableStateOf(false) }

    var newFarmerName by remember { mutableStateOf("") }
    var newFarmerPhone by remember { mutableStateOf("") }
    var newFarmerVillage by remember { mutableStateOf("") }
    var newFarmerCrops by remember { mutableStateOf("Rose, Jasmine") }

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
                    text = "👨‍🌾 Farmers Directory & Khata",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "${farmers.size} Registered Farmers in APMC Mandi",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Button(
                onClick = { showAddFarmerDialog = true },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add Farmer")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(farmers, key = { it.id }) { farmer ->
                val farmerLots = saleLots.filter { it.farmerId == farmer.id }
                val totalTurnover = farmerLots.sumOf { it.grossTotal }
                val totalPendingDues = farmerLots.sumOf { it.balanceDue }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectFarmerKhata(farmer) },
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
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Icon(
                                        Icons.Default.Person,
                                        contentDescription = null,
                                        modifier = Modifier
                                            .padding(8.dp)
                                            .size(24.dp),
                                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = farmer.name,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = "📍 ${farmer.village} | 📞 ${farmer.phone}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Icon(
                                Icons.Default.ChevronRight,
                                contentDescription = "View Khata",
                                tint = MaterialTheme.colorScheme.outline
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = "Primary Crops",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = farmer.primaryCrops.joinToString(", "),
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                            Column {
                                Text(
                                    text = "Total Turnover",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "₹${totalTurnover.toInt()}",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "Pending Dues",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "₹${totalPendingDues.toInt()}",
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = if (totalPendingDues > 0) Color(0xFFC62828) else Color(0xFF2E7D32)
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddFarmerDialog) {
        AlertDialog(
            onDismissRequest = { showAddFarmerDialog = false },
            title = { Text("👨‍🌾 Register New Farmer", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = newFarmerName,
                        onValueChange = { newFarmerName = it },
                        label = { Text("Farmer Name") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newFarmerPhone,
                        onValueChange = { newFarmerPhone = it },
                        label = { Text("Phone Number") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newFarmerVillage,
                        onValueChange = { newFarmerVillage = it },
                        label = { Text("Village / Mandal") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newFarmerCrops,
                        onValueChange = { newFarmerCrops = it },
                        label = { Text("Primary Crops (comma separated)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newFarmerName.isNotBlank() && newFarmerPhone.isNotBlank()) {
                            viewModel.addFarmer(
                                name = newFarmerName,
                                phone = newFarmerPhone,
                                village = newFarmerVillage,
                                primaryCrops = newFarmerCrops.split(",").map { it.trim() }
                            )
                            showAddFarmerDialog = false
                            newFarmerName = ""
                            newFarmerPhone = ""
                            newFarmerVillage = ""
                        }
                    }
                ) {
                    Text("Save Farmer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddFarmerDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun FarmerKhataDetailScreen(
    farmer: Farmer,
    saleLots: List<SaleLot>,
    onBack: () -> Unit
) {
    val farmerLots = saleLots.filter { it.farmerId == farmer.id }
    val totalGross = farmerLots.sumOf { it.grossTotal }
    val totalPaid = farmerLots.sumOf { it.amountPaid }
    val totalPending = farmerLots.sumOf { it.balanceDue }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "${farmer.name}'s Khata Ledger",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "📍 ${farmer.village} | 📞 ${farmer.phone}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Gross Sales", style = MaterialTheme.typography.labelMedium)
                    Text("₹${totalGross.toInt()}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }
                Column {
                    Text("Total Received", style = MaterialTheme.typography.labelMedium)
                    Text("₹${totalPaid.toInt()}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32)))
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Balance Due", style = MaterialTheme.typography.labelMedium)
                    Text("₹${totalPending.toInt()}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFFC62828)))
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Transaction History (${farmerLots.size} Parchis)",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(farmerLots, key = { it.id }) { lot ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(lot.parchiNumber, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Text(lot.date, style = MaterialTheme.typography.bodySmall)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("${lot.varietyName} (${lot.quantity} ${lot.unit})")
                            Text("Net Payable: ₹${lot.farmerNetPayable.toInt()}", fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Paid: ₹${lot.amountPaid.toInt()}", style = MaterialTheme.typography.bodySmall, color = Color(0xFF2E7D32))
                            Text("Due: ₹${lot.balanceDue.toInt()}", style = MaterialTheme.typography.bodySmall, color = Color(0xFFC62828))
                        }
                    }
                }
            }
        }
    }
}

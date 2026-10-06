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
import com.example.markethub.data.model.MerchantProfile
import com.example.markethub.data.model.SaleLot
import com.example.markethub.ui.MarketHubViewModel
import com.example.markethub.ui.components.SaleLotCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerPortalScreen(
    viewModel: MarketHubViewModel,
    onViewParchi: (SaleLot) -> Unit
) {
    val saleLots by viewModel.saleLots.collectAsState()
    val merchantProfile = remember { MerchantProfile() }

    var selectedTab by remember { mutableIntStateOf(0) }

    val farmerLots = saleLots.filter { it.farmerId == "FM-001" || it.farmerName == "Ramesh Patel" }
    val totalNetPayable = farmerLots.sumOf { it.farmerNetPayable }
    val totalReceived = farmerLots.sumOf { it.amountPaid }
    val balanceDue = farmerLots.sumOf { it.balanceDue }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9)),
            shape = RoundedCornerShape(20.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🌾 Ramesh Patel (Rythu Portal)",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF1B5E20)
                    )
                    Text(
                        text = "Gudur Village | Primary Crop: Rose & Jasmine",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF2E7D32)
                    )
                }
                Surface(
                    color = Color(0xFF2E7D32),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Farmer Verified",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall.copy(color = Color.White)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        SecondaryTabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("My Parchis (${farmerLots.size})") })
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("My Khata") })
            Tab(selected = selectedTab == 2, onClick = { selectedTab = 2 }, text = { Text("Merchants") })
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (selectedTab) {
            0 -> {
                if (farmerLots.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No Parchis received yet.")
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(farmerLots, key = { it.id }) { lot ->
                            SaleLotCard(
                                lot = lot,
                                onViewParchi = onViewParchi,
                                onRecordPayment = null
                            )
                        }
                    }
                }
            }

            1 -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("📒 Earnings & Dues Ledger Summary", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Net Earnings", style = MaterialTheme.typography.labelSmall)
                                    Text("₹${totalNetPayable.toInt()}", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                                }
                                Column {
                                    Text("Received", style = MaterialTheme.typography.labelSmall)
                                    Text("₹${totalReceived.toInt()}", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32)))
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Balance Pending", style = MaterialTheme.typography.labelSmall)
                                    Text("₹${balanceDue.toInt()}", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = Color(0xFFC62828)))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text("Detailed Transactions", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(8.dp))

                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(farmerLots, key = { it.id }) { lot ->
                            Card(modifier = Modifier.fillMaxWidth()) {
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
                                        Text("Net: ₹${lot.farmerNetPayable.toInt()}", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            2 -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    Text("🏪 Connected APMC Commission Agents", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(12.dp))

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(merchantProfile.shopName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                    Text("Aadhtiya: ${merchantProfile.ownerName}", style = MaterialTheme.typography.bodySmall)
                                    Text("📍 ${merchantProfile.apmcMarketName} | ${merchantProfile.shopNumber}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Surface(
                                    color = Color(0xFFE8F5E9),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Connected", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold))
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = {},
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Call Merchant (${merchantProfile.phone})")
                            }
                        }
                    }
                }
            }
        }
    }
}

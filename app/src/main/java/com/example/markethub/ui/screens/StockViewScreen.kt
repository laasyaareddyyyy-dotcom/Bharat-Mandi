package com.example.markethub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import com.example.markethub.data.model.CommodityCategory
import com.example.markethub.ui.MarketHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StockViewScreen(
    viewModel: MarketHubViewModel
) {
    val stocks by viewModel.stocks.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var showAddStockDialog by remember { mutableStateOf(false) }

    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(CommodityCategory.GRAINS) }
    var qtyStr by remember { mutableStateOf("100") }
    var unitStr by remember { mutableStateOf("Quintals") }
    var pkgsStr by remember { mutableStateOf("200") }
    var pkgType by remember { mutableStateOf("Bags") }
    var costPriceStr by remember { mutableStateOf("2200") }
    var sellPriceStr by remember { mutableStateOf("2450") }
    var locationStr by remember { mutableStateOf("Godown Shed #1") }

    val filteredStocks = stocks.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
                it.storageLocation.contains(searchQuery, ignoreCase = true)
    }

    val totalValuation = stocks.sumOf { it.quantityOnHand * it.avgCostPrice }
    val totalPackages = stocks.sumOf { it.packagesCount }
    val lowStockCount = stocks.count { it.quantityOnHand <= it.minReorderLevel }

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
                    text = "📦 Mandi Godown Stock & Inventory",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Warehouse stock level tracking, valuation & reorder alerts",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Button(
                onClick = { showAddStockDialog = true },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add Stock")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Total Valuation", style = MaterialTheme.typography.labelSmall)
                    Text("₹${totalValuation.toInt()}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Total Packages", style = MaterialTheme.typography.labelSmall)
                    Text("$totalPackages Pkgs", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = if (lowStockCount > 0) Color(0xFFFFEBEE) else Color(0xFFE8F5E9))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Low Stock Alert", style = MaterialTheme.typography.labelSmall)
                    Text("$lowStockCount Items", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = if (lowStockCount > 0) Color(0xFFC62828) else Color(0xFF2E7D32)))
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search commodity name or godown location...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(filteredStocks, key = { it.id }) { item ->
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
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "${item.category.emoji} ${item.name}",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                            IconButton(onClick = { viewModel.deleteStockItem(item.id) }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFC62828), modifier = Modifier.size(18.dp))
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("📍 Location: ${item.storageLocation}", style = MaterialTheme.typography.bodySmall)
                            Text("Pkgs: ${item.packagesCount} ${item.packageType}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Stock On Hand", style = MaterialTheme.typography.labelSmall)
                                Text("${item.quantityOnHand} ${item.unit}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary))
                            }
                            Column {
                                Text("Cost Price", style = MaterialTheme.typography.labelSmall)
                                Text("₹${item.avgCostPrice.toInt()}/${item.unit.take(3)}", style = MaterialTheme.typography.bodyMedium)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Target Sell Price", style = MaterialTheme.typography.labelSmall)
                                Text("₹${item.targetSellingPrice.toInt()}/${item.unit.take(3)}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32)))
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddStockDialog) {
        var catDropdownExpanded by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAddStockDialog = false },
            title = { Text("📦 Add Warehouse Stock Item", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Commodity Stock Name") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    ExposedDropdownMenuBox(
                        expanded = catDropdownExpanded,
                        onExpandedChange = { catDropdownExpanded = !catDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = "${category.emoji} ${category.displayName}",
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = catDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = catDropdownExpanded,
                            onDismissRequest = { catDropdownExpanded = false }
                        ) {
                            CommodityCategory.entries.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text("${cat.emoji} ${cat.displayName}") },
                                    onClick = {
                                        category = cat
                                        unitStr = cat.allowedUnits.firstOrNull() ?: "Kgs"
                                        catDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = qtyStr,
                            onValueChange = { qtyStr = it },
                            label = { Text("Qty ($unitStr)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = pkgsStr,
                            onValueChange = { pkgsStr = it },
                            label = { Text("Pkgs Count") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = costPriceStr,
                            onValueChange = { costPriceStr = it },
                            label = { Text("Avg Cost (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = sellPriceStr,
                            onValueChange = { sellPriceStr = it },
                            label = { Text("Target Price (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    OutlinedTextField(
                        value = locationStr,
                        onValueChange = { locationStr = it },
                        label = { Text("Storage Location / Godown #") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank() && (qtyStr.toDoubleOrNull() ?: 0.0) > 0) {
                            viewModel.addStockItem(
                                name = name,
                                category = category,
                                quantityOnHand = qtyStr.toDoubleOrNull() ?: 0.0,
                                unit = unitStr,
                                packagesCount = pkgsStr.toIntOrNull() ?: 0,
                                packageType = pkgType,
                                avgCostPrice = costPriceStr.toDoubleOrNull() ?: 0.0,
                                targetSellingPrice = sellPriceStr.toDoubleOrNull() ?: 0.0,
                                minReorderLevel = 10.0,
                                storageLocation = locationStr
                            )
                            showAddStockDialog = false
                            name = ""
                        }
                    }
                ) {
                    Text("Save Stock")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddStockDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

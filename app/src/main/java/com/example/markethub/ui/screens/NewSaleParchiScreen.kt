package com.example.markethub.ui.screens

import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.markethub.data.model.*
import com.example.markethub.ui.MarketHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewSaleParchiScreen(
    viewModel: MarketHubViewModel,
    onParchiCreated: (SaleLot) -> Unit
) {
    val farmers by viewModel.farmers.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val language by viewModel.language.collectAsState()

    var selectedFarmer by remember { mutableStateOf(farmers.firstOrNull()) }
    var farmerDropdownExpanded by remember { mutableStateOf(false) }

    val varieties = selectedCategory.varieties
    var selectedVariety by remember { mutableStateOf(varieties.firstOrNull()) }
    var varietyDropdownExpanded by remember { mutableStateOf(false) }

    var selectedGrade by remember { mutableStateOf(QualityGrade.GRADE_A) }

    var quantityStr by remember { mutableStateOf("50") }
    var unitStr by remember { mutableStateOf(selectedCategory.allowedUnits.firstOrNull() ?: "Kgs") }
    var rateStr by remember { mutableStateOf(selectedVariety?.defaultRate?.toInt()?.toString() ?: "50") }

    var commissionRateStr by remember { mutableStateOf(selectedCategory.defaultCommissionRate.toString()) }
    var ammaliChargesStr by remember { mutableStateOf(selectedCategory.defaultHamaliRate.toInt().toString()) }
    var transportChargesStr by remember { mutableStateOf(selectedCategory.defaultTransportRate.toInt().toString()) }
    var kantaChargesStr by remember { mutableStateOf(selectedCategory.defaultKantaRate.toInt().toString()) }
    var apmcCessStr by remember { mutableStateOf(selectedCategory.defaultApmcCessPercent.toString()) }
    var notesStr by remember { mutableStateOf("") }

    var paymentChoice by remember { mutableStateOf("credit") } // "now" vs "credit"

    val quantity = quantityStr.toDoubleOrNull() ?: 0.0
    val rate = rateStr.toDoubleOrNull() ?: 0.0
    val commissionPercent = commissionRateStr.toDoubleOrNull() ?: 4.0
    val ammaliCharges = ammaliChargesStr.toDoubleOrNull() ?: 0.0
    val transportCharges = transportChargesStr.toDoubleOrNull() ?: 0.0
    val kantaCharges = kantaChargesStr.toDoubleOrNull() ?: 0.0
    val apmcCessPercent = apmcCessStr.toDoubleOrNull() ?: 1.0

    val grossTotal = quantity * rate
    val commissionAmount = grossTotal * (commissionPercent / 100.0)
    val apmcCessAmount = grossTotal * (apmcCessPercent / 100.0)
    val totalDeductions = commissionAmount + ammaliCharges + transportCharges + kantaCharges + apmcCessAmount
    val farmerNetPayable = maxOf(0.0, grossTotal - totalDeductions)

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "📝 Mandi Parchi (Form C) Entry",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Mandi Ledger 3.0 • Automated Multi-tier APMC Deduction Calculator",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Select Farmer
                Text(
                    text = "Farmer / Kisan (Producer)",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                )
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
                                text = { Text("${farmer.name} - ${farmer.village} (${farmer.phone})") },
                                onClick = {
                                    selectedFarmer = farmer
                                    farmerDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Select Commodity Variety
                Text(
                    text = "${selectedCategory.emoji} Commodity Variety",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(4.dp))
                ExposedDropdownMenuBox(
                    expanded = varietyDropdownExpanded,
                    onExpandedChange = { varietyDropdownExpanded = !varietyDropdownExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedVariety?.getName(language) ?: "Select Variety",
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = varietyDropdownExpanded) },
                        modifier = Modifier
                            .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = varietyDropdownExpanded,
                        onDismissRequest = { varietyDropdownExpanded = false }
                    ) {
                        varieties.forEach { variety ->
                            DropdownMenuItem(
                                text = { Text(variety.getName(language)) },
                                onClick = {
                                    selectedVariety = variety
                                    rateStr = variety.defaultRate.toInt().toString()
                                    unitStr = variety.defaultUnit
                                    varietyDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Quality Grade Selector
                Text(
                    text = "Quality Grade",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    QualityGrade.entries.forEach { grade ->
                        FilterChip(
                            selected = selectedGrade == grade,
                            onClick = { selectedGrade = grade },
                            label = { Text(grade.displayName) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Quantity, Unit & Rate
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = quantityStr,
                        onValueChange = { quantityStr = it },
                        label = { Text("Quantity") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = rateStr,
                        onValueChange = { rateStr = it },
                        label = { Text("Rate (₹ per $unitStr)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Mandi Multi-Tier Deductions Formula Section
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Automated APMC Multi-Tier Deductions Math",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.secondary
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = commissionRateStr,
                        onValueChange = { commissionRateStr = it },
                        label = { Text("Aadht %") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = ammaliChargesStr,
                        onValueChange = { ammaliChargesStr = it },
                        label = { Text("Hamali (₹)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = transportChargesStr,
                        onValueChange = { transportChargesStr = it },
                        label = { Text("Freight (₹)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = kantaChargesStr,
                        onValueChange = { kantaChargesStr = it },
                        label = { Text("Weighbridge (₹)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = apmcCessStr,
                        onValueChange = { apmcCessStr = it },
                        label = { Text("APMC Cess %") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = notesStr,
                    onValueChange = { notesStr = it },
                    label = { Text("Mandi Yard Notes / Consignment #") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Calculation Breakdown Card
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Gross Value ($quantity $unitStr @ ₹$rate):", style = MaterialTheme.typography.bodyMedium)
                            Text("₹${grossTotal.toInt()}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Aadht Commission ($commissionPercent%):", style = MaterialTheme.typography.bodySmall)
                            Text("- ₹${commissionAmount.toInt()}", style = MaterialTheme.typography.bodySmall)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Hamali + Freight + Weighbridge:", style = MaterialTheme.typography.bodySmall)
                            Text("- ₹${(ammaliCharges + transportCharges + kantaCharges).toInt()}", style = MaterialTheme.typography.bodySmall)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("APMC Cess ($apmcCessPercent%):", style = MaterialTheme.typography.bodySmall)
                            Text("- ₹${apmcCessAmount.toInt()}", style = MaterialTheme.typography.bodySmall)
                        }

                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 8.dp),
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Farmer Net Payable:",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Text(
                                "₹${farmerNetPayable.toInt()}",
                                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        val farmer = selectedFarmer
                        val variety = selectedVariety
                        if (farmer != null && variety != null) {
                            val newLot = viewModel.addSaleLot(
                                farmerId = farmer.id,
                                varietyName = variety.getName(language),
                                quantity = quantity,
                                unit = unitStr,
                                rate = rate,
                                qualityGrade = selectedGrade,
                                commissionPercent = commissionPercent,
                                ammaliCharges = ammaliCharges,
                                transportCharges = transportCharges,
                                kantaCharges = kantaCharges,
                                apmcCessPercent = apmcCessPercent,
                                miscCharges = 0.0,
                                notes = notesStr
                            )
                            onParchiCreated(newLot)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    enabled = selectedFarmer != null && selectedVariety != null && quantity > 0 && rate > 0
                ) {
                    Icon(Icons.Default.Receipt, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Generate Parchi (Form C Slip)",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
        }
    }
}

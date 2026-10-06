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
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.markethub.data.model.EmployeeRecord
import com.example.markethub.ui.MarketHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeesViewScreen(
    viewModel: MarketHubViewModel
) {
    val employeesState by viewModel.employees.collectAsState()

    var showAddEmpDialog by remember { mutableStateOf(false) }
    var payEmpTarget by remember { mutableStateOf<EmployeeRecord?>(null) }
    var payAmtStr by remember { mutableStateOf("") }

    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("Weighman (Taula)") }
    var wageStr by remember { mutableStateOf("600") }
    var wageType by remember { mutableStateOf("daily") }
    var notes by remember { mutableStateOf("") }

    val roles = listOf("Weighman (Taula)", "Hamali Supervisor", "Clerk (Munim)", "Account Asst", "Cashier")

    val totalPaid = employeesState.sumOf { it.totalPaid }
    val totalDues = employeesState.sumOf { it.balanceDue }

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
                    text = "👨‍💼 Mandi Staff & Wage Register",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "${employeesState.size} Active Mandi Staff Members (Taula, Coolie Supervisors, Munim)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Button(
                onClick = { showAddEmpDialog = true },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add Staff")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Total Wages Paid", style = MaterialTheme.typography.labelSmall)
                    Text("₹${totalPaid.toInt()}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32)))
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Wage Dues Pending", style = MaterialTheme.typography.labelSmall)
                    Text("₹${totalDues.toInt()}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFFC62828)))
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(employeesState, key = { it.id }) { emp ->
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
                                Text(emp.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                Text("📞 ${emp.phone} | Role: ${emp.role}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Button(
                                onClick = {
                                    payEmpTarget = emp
                                    payAmtStr = emp.dailyWageOrSalary.toInt().toString()
                                },
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Payments, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Pay Wage")
                            }
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Wage Rate", style = MaterialTheme.typography.labelSmall)
                                Text("₹${emp.dailyWageOrSalary.toInt()}/${emp.wageType}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            }
                            Column {
                                Text("Total Paid", style = MaterialTheme.typography.labelSmall)
                                Text("₹${emp.totalPaid.toInt()}", style = MaterialTheme.typography.bodyMedium.copy(color = Color(0xFF2E7D32)))
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Due Balance", style = MaterialTheme.typography.labelSmall)
                                Text("₹${emp.balanceDue.toInt()}", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = Color(0xFFC62828)))
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddEmpDialog) {
        var roleDropdownExpanded by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAddEmpDialog = false },
            title = { Text("👨‍💼 Add Mandi Staff Member", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Staff Full Name") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    ExposedDropdownMenuBox(
                        expanded = roleDropdownExpanded,
                        onExpandedChange = { roleDropdownExpanded = !roleDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = role,
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = roleDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = roleDropdownExpanded,
                            onDismissRequest = { roleDropdownExpanded = false }
                        ) {
                            roles.forEach { r ->
                                DropdownMenuItem(
                                    text = { Text(r) },
                                    onClick = {
                                        role = r
                                        roleDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = wageStr,
                            onValueChange = { wageStr = it },
                            label = { Text("Wage Rate (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = wageType == "daily",
                            onClick = { wageType = "daily" },
                            label = { Text("Daily") },
                            modifier = Modifier.align(Alignment.CenterVertically)
                        )
                        FilterChip(
                            selected = wageType == "monthly",
                            onClick = { wageType = "monthly" },
                            label = { Text("Monthly") },
                            modifier = Modifier.align(Alignment.CenterVertically)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank() && phone.isNotBlank()) {
                            viewModel.addEmployee(
                                name = name,
                                phone = phone,
                                role = role,
                                dailyWageOrSalary = wageStr.toDoubleOrNull() ?: 0.0,
                                wageType = wageType,
                                notes = notes
                            )
                            showAddEmpDialog = false
                            name = ""
                            phone = ""
                        }
                    }
                ) {
                    Text("Save Staff")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddEmpDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    payEmpTarget?.let { emp ->
        AlertDialog(
            onDismissRequest = { payEmpTarget = null },
            title = { Text("💵 Pay Wage to ${emp.name}", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = payAmtStr,
                        onValueChange = { payAmtStr = it },
                        label = { Text("Amount Paid (₹)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = payAmtStr.toDoubleOrNull() ?: 0.0
                        if (amt > 0) {
                            viewModel.recordEmployeePayment(emp.id, amt)
                            payEmpTarget = null
                        }
                    }
                ) {
                    Text("Confirm Payment")
                }
            },
            dismissButton = {
                TextButton(onClick = { payEmpTarget = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

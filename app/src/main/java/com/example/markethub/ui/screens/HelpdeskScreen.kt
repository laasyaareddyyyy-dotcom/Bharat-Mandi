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
import com.example.markethub.ui.MarketHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpdeskScreen(
    viewModel: MarketHubViewModel
) {
    val helpTickets by viewModel.helpTickets.collectAsState()

    var showCreateTicketDialog by remember { mutableStateOf(false) }

    var category by remember { mutableStateOf("Payment/Settlement Issue") }
    var priority by remember { mutableStateOf("Medium") }
    var subject by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    val categories = listOf(
        "Payment/Settlement Issue",
        "Parchi/Invoice Error",
        "Account & Login Issue",
        "Feature Request",
        "Other"
    )
    val priorities = listOf("Low", "Medium", "High", "Critical")

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
                    text = "🎧 Mandi Helpdesk & Support",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Get technical support or report payment/parchi discrepancies",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Button(
                onClick = { showCreateTicketDialog = true },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.SupportAgent, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Ticket")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(helpTickets, key = { it.id }) { ticket ->
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
                            Text(ticket.ticketNumber, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Surface(
                                color = when (ticket.status) {
                                    "Resolved" -> Color(0xFFE8F5E9)
                                    "In Progress" -> Color(0xFFE3F2FD)
                                    else -> Color(0xFFFFF3E0)
                                },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    text = ticket.status,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = when (ticket.status) {
                                            "Resolved" -> Color(0xFF2E7D32)
                                            "In Progress" -> Color(0xFF1565C0)
                                            else -> Color(0xFFE65100)
                                        }
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(ticket.subject, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(ticket.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Category: ${ticket.category}", style = MaterialTheme.typography.bodySmall)
                            Text("Priority: ${ticket.priority}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    if (showCreateTicketDialog) {
        var categoryDropdownExpanded by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showCreateTicketDialog = false },
            title = { Text("🎧 Raise Support Ticket", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Category", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                    ExposedDropdownMenuBox(
                        expanded = categoryDropdownExpanded,
                        onExpandedChange = { categoryDropdownExpanded = !categoryDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = category,
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryDropdownExpanded) },
                            modifier = Modifier
                                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = categoryDropdownExpanded,
                            onDismissRequest = { categoryDropdownExpanded = false }
                        ) {
                            categories.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text(cat) },
                                    onClick = {
                                        category = cat
                                        categoryDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Text("Priority", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        priorities.forEach { prio ->
                            FilterChip(
                                selected = priority == prio,
                                onClick = { priority = prio },
                                label = { Text(prio) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = subject,
                        onValueChange = { subject = it },
                        label = { Text("Subject / Title") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Detailed Description") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (subject.isNotBlank() && description.isNotBlank()) {
                            viewModel.submitHelpTicket(
                                category = category,
                                priority = priority,
                                subject = subject,
                                description = description
                            )
                            showCreateTicketDialog = false
                            subject = ""
                            description = ""
                        }
                    }
                ) {
                    Text("Submit Ticket")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateTicketDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

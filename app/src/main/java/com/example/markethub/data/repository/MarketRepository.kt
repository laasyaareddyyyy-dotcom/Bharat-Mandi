package com.example.markethub.data.repository

import com.example.markethub.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*

class MarketRepository {

    private val _farmers = MutableStateFlow<List<Farmer>>(
        listOf(
            Farmer("FM-001", "Ramesh Patel", "+91 98480 12345", "Gudur Village", listOf("Rose", "Jasmine")),
            Farmer("FM-002", "Srinivas Rao", "+91 94401 67890", "Kovur", listOf("Marigold", "Paddy")),
            Farmer("FM-003", "Venkat Reddy", "+91 98852 34567", "Buchireddypalem", listOf("Dutch Rose", "Toor Dal")),
            Farmer("FM-004", "K. Apparao", "+91 91773 89012", "Venkatagiri", listOf("Paddy", "Tomato")),
            Farmer("FM-005", "M. Chennaiah", "+91 99634 56789", "Atmakur", listOf("Mango", "Red Chilli"))
        )
    )
    val farmers: StateFlow<List<Farmer>> = _farmers.asStateFlow()

    private val _stocks = MutableStateFlow<List<StockItem>>(
        listOf(
            StockItem(
                id = "STK-001",
                name = "Sona Masoori Paddy",
                category = CommodityCategory.GRAINS,
                quantityOnHand = 250.0,
                unit = "Quintals",
                packagesCount = 500,
                packageType = "Bags",
                avgCostPrice = 2100.0,
                targetSellingPrice = 2350.0,
                minReorderLevel = 50.0,
                storageLocation = "Godown Shed #1"
            ),
            StockItem(
                id = "STK-002",
                name = "Red Rose Flowers",
                category = CommodityCategory.FLOWERS,
                quantityOnHand = 120.0,
                unit = "Kgs",
                packagesCount = 12,
                packageType = "Boxes",
                avgCostPrice = 45.0,
                targetSellingPrice = 65.0,
                minReorderLevel = 25.0,
                storageLocation = "Cold Storage #A"
            ),
            StockItem(
                id = "STK-003",
                name = "Hybrid Tomato Crates",
                category = CommodityCategory.VEGETABLES,
                quantityOnHand = 40.0,
                unit = "Crates",
                packagesCount = 40,
                packageType = "Crates",
                avgCostPrice = 320.0,
                targetSellingPrice = 400.0,
                minReorderLevel = 10.0,
                storageLocation = "Main Shed Yard"
            )
        )
    )
    val stocks: StateFlow<List<StockItem>> = _stocks.asStateFlow()

    private val _employees = MutableStateFlow<List<EmployeeRecord>>(
        listOf(
            EmployeeRecord(
                id = "EMP-001",
                name = "Balu (Weighman)",
                phone = "9876543210",
                role = "Weighman (Taula)",
                dailyWageOrSalary = 600.0,
                wageType = "daily",
                status = "active",
                totalPaid = 3600.0,
                balanceDue = 600.0,
                notes = "Primary weighbridge operator"
            ),
            EmployeeRecord(
                id = "EMP-002",
                name = "Subbaiah (Munim)",
                phone = "9441234567",
                role = "Clerk (Munim)",
                dailyWageOrSalary = 18000.0,
                wageType = "monthly",
                status = "active",
                totalPaid = 18000.0,
                balanceDue = 0.0,
                notes = "Senior accounts clerk"
            ),
            EmployeeRecord(
                id = "EMP-003",
                name = "Kondaiah (Hamali Supervisor)",
                phone = "9177112233",
                role = "Hamali Supervisor",
                dailyWageOrSalary = 500.0,
                wageType = "daily",
                status = "active",
                totalPaid = 3000.0,
                balanceDue = 500.0,
                notes = "Coolie & loading head"
            )
        )
    )
    val employees: StateFlow<List<EmployeeRecord>> = _employees.asStateFlow()

    private val _saleLots = MutableStateFlow<List<SaleLot>>(
        listOf(
            SaleLot(
                id = "LOT-101",
                parchiNumber = "PK-20260919-001",
                date = "2026-09-19",
                time = "07:30 AM",
                commodityCategory = CommodityCategory.FLOWERS,
                farmerId = "FM-001",
                farmerName = "Ramesh Patel",
                farmerVillage = "Gudur Village",
                farmerPhone = "+91 98480 12345",
                varietyName = "Rose (Red)",
                quantity = 50.0,
                unit = "Kgs",
                rate = 60.0,
                qualityGrade = QualityGrade.GRADE_A,
                grossTotal = 3000.0,
                commissionPercent = 4.0,
                commissionAmount = 120.0,
                ammaliCharges = 50.0,
                transportCharges = 75.0,
                kantaCharges = 15.0,
                apmcCessPercent = 0.5,
                apmcCessAmount = 15.0,
                miscCharges = 0.0,
                totalDeductions = 275.0,
                farmerNetPayable = 2725.0,
                paymentStatus = PaymentStatus.UNPAID,
                amountPaid = 0.0,
                balanceDue = 2725.0,
                notes = "Grade A quality roses"
            ),
            SaleLot(
                id = "LOT-102",
                parchiNumber = "PK-20260919-002",
                date = "2026-09-19",
                time = "08:15 AM",
                commodityCategory = CommodityCategory.FLOWERS,
                farmerId = "FM-002",
                farmerName = "Srinivas Rao",
                farmerVillage = "Kovur",
                farmerPhone = "+91 94401 67890",
                varietyName = "Marigold",
                quantity = 100.0,
                unit = "Kgs",
                rate = 45.0,
                qualityGrade = QualityGrade.GRADE_B,
                grossTotal = 4500.0,
                commissionPercent = 4.0,
                commissionAmount = 180.0,
                ammaliCharges = 50.0,
                transportCharges = 75.0,
                kantaCharges = 15.0,
                apmcCessPercent = 0.5,
                apmcCessAmount = 22.5,
                miscCharges = 0.0,
                totalDeductions = 342.5,
                farmerNetPayable = 4157.5,
                paymentStatus = PaymentStatus.PARTIAL,
                amountPaid = 2000.0,
                balanceDue = 2157.5,
                notes = "Festival demand high"
            ),
            SaleLot(
                id = "LOT-103",
                parchiNumber = "PK-20260918-005",
                date = "2026-09-18",
                time = "06:45 AM",
                commodityCategory = CommodityCategory.PULSES_OILSEEDS,
                farmerId = "FM-003",
                farmerName = "Venkat Reddy",
                farmerVillage = "Buchireddypalem",
                farmerPhone = "+91 98852 34567",
                varietyName = "Toor / Arhar Dal",
                quantity = 10.0,
                unit = "Quintals",
                rate = 7200.0,
                qualityGrade = QualityGrade.GRADE_A,
                grossTotal = 72000.0,
                commissionPercent = 2.0,
                commissionAmount = 1440.0,
                ammaliCharges = 450.0,
                transportCharges = 1300.0,
                kantaCharges = 200.0,
                apmcCessPercent = 1.0,
                apmcCessAmount = 720.0,
                miscCharges = 0.0,
                totalDeductions = 4110.0,
                farmerNetPayable = 67890.0,
                paymentStatus = PaymentStatus.PAID,
                amountPaid = 67890.0,
                balanceDue = 0.0,
                notes = "Settled in full via Bank Transfer"
            )
        )
    )
    val saleLots: StateFlow<List<SaleLot>> = _saleLots.asStateFlow()

    private val _payments = MutableStateFlow<List<PaymentRecord>>(
        listOf(
            PaymentRecord(
                id = "PAY-001",
                date = "2026-09-18",
                farmerId = "FM-003",
                farmerName = "Venkat Reddy",
                amount = 67890.0,
                paymentMode = "Bank Transfer",
                referenceNumber = "UTR9823719283",
                notes = "Settled Toor Dal lot PK-20260918-005"
            ),
            PaymentRecord(
                id = "PAY-002",
                date = "2026-09-19",
                farmerId = "FM-002",
                farmerName = "Srinivas Rao",
                amount = 2000.0,
                paymentMode = "Cash",
                referenceNumber = "CSH-9921",
                notes = "Advance payment on Marigold lot"
            )
        )
    )
    val payments: StateFlow<List<PaymentRecord>> = _payments.asStateFlow()

    private val _settlements = MutableStateFlow<List<FifteenDaySettlement>>(
        listOf(
            FifteenDaySettlement(
                id = "STL-001",
                settlementNumber = "STL-202609-01",
                periodLabel = "Sep 01 - Sep 15, 2026",
                farmerId = "FM-001",
                farmerName = "Ramesh Patel",
                farmerVillage = "Gudur Village",
                totalShipments = 8,
                totalGross = 28400.0,
                totalDeductions = 1950.0,
                finalPayment = 26450.0,
                status = "Settled"
            )
        )
    )
    val settlements: StateFlow<List<FifteenDaySettlement>> = _settlements.asStateFlow()

    private val _auditLogs = MutableStateFlow<List<ParchiAuditLog>>(
        listOf(
            ParchiAuditLog(
                id = "AUD-001",
                parchiNumber = "PK-20260916-004",
                farmerName = "K. Apparao",
                actionBy = "Ramesh Kumar (Owner)",
                actionType = "REPRINTED",
                timestamp = "2026-09-16 10:15 AM",
                reason = "Thermal printer paper roll gap mismatch"
            )
        )
    )
    val auditLogs: StateFlow<List<ParchiAuditLog>> = _auditLogs.asStateFlow()

    private val _helpTickets = MutableStateFlow<List<HelpTicket>>(
        listOf(
            HelpTicket(
                id = "TK-001",
                ticketNumber = "TICKET-2026-001",
                category = "Payment/Settlement Issue",
                priority = "High",
                status = "In Progress",
                subject = "UPI payment UTR reference verification for Srinivas Rao",
                description = "Transferred ₹2000 via PhonePe but receipt status shows Partial.",
                createdAt = "2026-09-19"
            )
        )
    )
    val helpTickets: StateFlow<List<HelpTicket>> = _helpTickets.asStateFlow()

    fun addStockItem(item: StockItem) {
        _stocks.value = listOf(item) + _stocks.value
    }

    fun updateStockItem(id: String, newQty: Double, newPkgs: Int) {
        _stocks.value = _stocks.value.map { stock ->
            if (stock.id == id) {
                stock.copy(quantityOnHand = newQty, packagesCount = newPkgs)
            } else stock
        }
    }

    fun deleteStockItem(id: String) {
        _stocks.value = _stocks.value.filter { it.id != id }
    }

    fun addEmployee(emp: EmployeeRecord) {
        _employees.value = listOf(emp) + _employees.value
    }

    fun recordEmployeePayment(id: String, amount: Double) {
        _employees.value = _employees.value.map { emp ->
            if (emp.id == id) {
                val newPaid = emp.totalPaid + amount
                val newDue = maxOf(0.0, emp.balanceDue - amount)
                emp.copy(totalPaid = newPaid, balanceDue = newDue)
            } else emp
        }
    }

    fun addSaleLot(
        farmerId: String,
        varietyName: String,
        commodityCategory: CommodityCategory,
        quantity: Double,
        unit: String,
        rate: Double,
        qualityGrade: QualityGrade,
        commissionPercent: Double,
        ammaliCharges: Double,
        transportCharges: Double,
        kantaCharges: Double,
        apmcCessPercent: Double,
        miscCharges: Double,
        notes: String
    ): SaleLot {
        val farmer = _farmers.value.find { it.id == farmerId }
            ?: Farmer("FM-999", "Unknown Farmer", "+91 00000 00000", "Local Village", emptyList())

        val grossTotal = quantity * rate
        val commissionAmount = grossTotal * (commissionPercent / 100.0)
        val apmcCessAmount = grossTotal * (apmcCessPercent / 100.0)
        val totalDeductions = commissionAmount + ammaliCharges + transportCharges + kantaCharges + apmcCessAmount + miscCharges
        val farmerNetPayable = maxOf(0.0, grossTotal - totalDeductions)

        val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
        val parchiNum = "PK-${SimpleDateFormat("yyyyMMdd", Locale.getDefault()).format(Date())}-${(100..999).random()}"

        val newLot = SaleLot(
            id = "LOT-${UUID.randomUUID().toString().take(6)}",
            parchiNumber = parchiNum,
            date = dateStr,
            time = timeStr,
            commodityCategory = commodityCategory,
            farmerId = farmer.id,
            farmerName = farmer.name,
            farmerVillage = farmer.village,
            farmerPhone = farmer.phone,
            varietyName = varietyName,
            quantity = quantity,
            unit = unit,
            rate = rate,
            qualityGrade = qualityGrade,
            grossTotal = grossTotal,
            commissionPercent = commissionPercent,
            commissionAmount = commissionAmount,
            ammaliCharges = ammaliCharges,
            transportCharges = transportCharges,
            kantaCharges = kantaCharges,
            apmcCessPercent = apmcCessPercent,
            apmcCessAmount = apmcCessAmount,
            miscCharges = miscCharges,
            totalDeductions = totalDeductions,
            farmerNetPayable = farmerNetPayable,
            paymentStatus = PaymentStatus.UNPAID,
            amountPaid = 0.0,
            balanceDue = farmerNetPayable,
            notes = notes
        )

        _saleLots.value = listOf(newLot) + _saleLots.value
        return newLot
    }

    fun recordPayment(
        farmerId: String,
        amount: Double,
        paymentMode: String,
        referenceNumber: String,
        notes: String
    ) {
        val farmer = _farmers.value.find { it.id == farmerId } ?: return

        val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val newPayment = PaymentRecord(
            id = "PAY-${UUID.randomUUID().toString().take(6)}",
            date = dateStr,
            farmerId = farmerId,
            farmerName = farmer.name,
            amount = amount,
            paymentMode = paymentMode,
            referenceNumber = referenceNumber,
            notes = notes
        )

        _payments.value = listOf(newPayment) + _payments.value

        var remainingPayment = amount
        val updatedLots = _saleLots.value.map { lot ->
            if (lot.farmerId == farmerId && lot.balanceDue > 0 && remainingPayment > 0) {
                val payToThisLot = minOf(remainingPayment, lot.balanceDue)
                val newAmountPaid = lot.amountPaid + payToThisLot
                val newBalanceDue = lot.farmerNetPayable - newAmountPaid
                val newStatus = when {
                    newBalanceDue <= 0.01 -> PaymentStatus.PAID
                    newAmountPaid > 0 -> PaymentStatus.PARTIAL
                    else -> PaymentStatus.UNPAID
                }
                remainingPayment -= payToThisLot
                lot.copy(
                    amountPaid = newAmountPaid,
                    balanceDue = maxOf(0.0, newBalanceDue),
                    paymentStatus = newStatus,
                    paymentMode = paymentMode
                )
            } else {
                lot
            }
        }
        _saleLots.value = updatedLots
    }

    fun addFarmer(name: String, phone: String, village: String, primaryCrops: List<String>) {
        val newId = "FM-${(100..999).random()}"
        val newFarmer = Farmer(
            id = newId,
            name = name,
            phone = phone,
            village = village,
            primaryCrops = primaryCrops
        )
        _farmers.value = _farmers.value + newFarmer
    }

    fun submitHelpTicket(category: String, priority: String, subject: String, description: String) {
        val ticketNum = "TICKET-2026-${(100..999).random()}"
        val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val newTicket = HelpTicket(
            id = "TK-${UUID.randomUUID().toString().take(6)}",
            ticketNumber = ticketNum,
            category = category,
            priority = priority,
            status = "Open",
            subject = subject,
            description = description,
            createdAt = dateStr
        )
        _helpTickets.value = listOf(newTicket) + _helpTickets.value
    }
}

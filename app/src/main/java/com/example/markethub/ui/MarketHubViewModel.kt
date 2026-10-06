package com.example.markethub.ui

import androidx.lifecycle.ViewModel
import com.example.markethub.data.model.*
import com.example.markethub.data.repository.MarketRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class MarketHubViewModel(
    private val repository: MarketRepository = MarketRepository()
) : ViewModel() {

    private val _userRole = MutableStateFlow(UserRole.MERCHANT)
    val userRole: StateFlow<UserRole> = _userRole.asStateFlow()

    private val _selectedCategory = MutableStateFlow(CommodityCategory.FLOWERS)
    val selectedCategory: StateFlow<CommodityCategory> = _selectedCategory.asStateFlow()

    private val _language = MutableStateFlow(Language.ENGLISH)
    val language: StateFlow<Language> = _language.asStateFlow()

    private val _selectedTab = MutableStateFlow("dashboard")
    val selectedTab: StateFlow<String> = _selectedTab.asStateFlow()

    private val _selectedFarmerForKhata = MutableStateFlow<Farmer?>(null)
    val selectedFarmerForKhata: StateFlow<Farmer?> = _selectedFarmerForKhata.asStateFlow()

    val saleLots: StateFlow<List<SaleLot>> = repository.saleLots
    val farmers: StateFlow<List<Farmer>> = repository.farmers
    val stocks: StateFlow<List<StockItem>> = repository.stocks
    val employees: StateFlow<List<EmployeeRecord>> = repository.employees
    val payments: StateFlow<List<PaymentRecord>> = repository.payments
    val settlements: StateFlow<List<FifteenDaySettlement>> = repository.settlements
    val helpTickets: StateFlow<List<HelpTicket>> = repository.helpTickets
    val auditLogs: StateFlow<List<ParchiAuditLog>> = repository.auditLogs

    fun setRole(role: UserRole) {
        _userRole.value = role
        if (role == UserRole.FARMER) {
            _selectedTab.value = "farmer-parchis"
        } else {
            _selectedTab.value = "dashboard"
        }
    }

    fun setCategory(category: CommodityCategory) {
        _selectedCategory.value = category
    }

    fun setLanguage(lang: Language) {
        _language.value = lang
    }

    fun setSelectedTab(tab: String) {
        _selectedTab.value = tab
    }

    fun selectFarmerForKhata(farmer: Farmer?) {
        _selectedFarmerForKhata.value = farmer
        if (farmer != null) {
            _selectedTab.value = "khata-detail"
        }
    }

    fun addStockItem(
        name: String,
        category: CommodityCategory,
        quantityOnHand: Double,
        unit: String,
        packagesCount: Int,
        packageType: String,
        avgCostPrice: Double,
        targetSellingPrice: Double,
        minReorderLevel: Double,
        storageLocation: String
    ) {
        val newStock = StockItem(
            id = "STK-${UUID.randomUUID().toString().take(6)}",
            name = name,
            category = category,
            quantityOnHand = quantityOnHand,
            unit = unit,
            packagesCount = packagesCount,
            packageType = packageType,
            avgCostPrice = avgCostPrice,
            targetSellingPrice = targetSellingPrice,
            minReorderLevel = minReorderLevel,
            storageLocation = storageLocation
        )
        repository.addStockItem(newStock)
    }

    fun updateStockItem(id: String, newQty: Double, newPkgs: Int) {
        repository.updateStockItem(id, newQty, newPkgs)
    }

    fun deleteStockItem(id: String) {
        repository.deleteStockItem(id)
    }

    fun addEmployee(
        name: String,
        phone: String,
        role: String,
        dailyWageOrSalary: Double,
        wageType: String,
        notes: String
    ) {
        val newEmp = EmployeeRecord(
            id = "EMP-${UUID.randomUUID().toString().take(6)}",
            name = name,
            phone = phone,
            role = role,
            dailyWageOrSalary = dailyWageOrSalary,
            wageType = wageType,
            status = "active",
            totalPaid = 0.0,
            balanceDue = dailyWageOrSalary,
            notes = notes
        )
        repository.addEmployee(newEmp)
    }

    fun recordEmployeePayment(id: String, amount: Double) {
        repository.recordEmployeePayment(id, amount)
    }

    fun addSaleLot(
        farmerId: String,
        varietyName: String,
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
        val lot = repository.addSaleLot(
            farmerId = farmerId,
            varietyName = varietyName,
            commodityCategory = _selectedCategory.value,
            quantity = quantity,
            unit = unit,
            rate = rate,
            qualityGrade = qualityGrade,
            commissionPercent = commissionPercent,
            ammaliCharges = ammaliCharges,
            transportCharges = transportCharges,
            kantaCharges = kantaCharges,
            apmcCessPercent = apmcCessPercent,
            miscCharges = miscCharges,
            notes = notes
        )
        _selectedTab.value = "dashboard"
        return lot
    }

    fun recordPayment(
        farmerId: String,
        amount: Double,
        paymentMode: String,
        referenceNumber: String,
        notes: String
    ) {
        repository.recordPayment(farmerId, amount, paymentMode, referenceNumber, notes)
    }

    fun addFarmer(name: String, phone: String, village: String, primaryCrops: List<String>) {
        repository.addFarmer(name, phone, village, primaryCrops)
    }

    fun submitHelpTicket(category: String, priority: String, subject: String, description: String) {
        repository.submitHelpTicket(category, priority, subject, description)
    }
}

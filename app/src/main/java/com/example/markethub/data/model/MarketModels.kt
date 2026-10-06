package com.example.markethub.data.model

enum class UserRole {
    MERCHANT,
    FARMER
}

enum class Language(val code: String, val displayName: String) {
    ENGLISH("en", "English"),
    TELUGU("te", "తెలుగు"),
    HINDI("hi", "हिंदी")
}

enum class QualityGrade(val displayName: String, val labelTe: String, val labelHi: String) {
    GRADE_A("Grade A (Premium)", "గ్రేడ్ A (ప్రీమియం)", "ग्रेड A (प्रीमियम)"),
    GRADE_B("Grade B (Standard)", "గ్రేడ్ B (సాధారణ)", "ग्रेड B (मानक)"),
    GRADE_C("Grade C (Fair)", "గ్రేడ్ C (సగటు)", "ग्रेड C (औसत)")
}

enum class CommodityCategory(
    val id: String,
    val displayName: String,
    val emoji: String,
    val defaultCommissionRate: Double,
    val defaultHamaliRate: Double,
    val defaultTransportRate: Double,
    val defaultKantaRate: Double,
    val defaultApmcCessPercent: Double,
    val allowedUnits: List<String>,
    val varieties: List<CommodityVariety>
) {
    FLOWERS(
        id = "flowers",
        displayName = "Flowers",
        emoji = "🌸",
        defaultCommissionRate = 4.0,
        defaultHamaliRate = 50.0,
        defaultTransportRate = 75.0,
        defaultKantaRate = 10.0,
        defaultApmcCessPercent = 0.5,
        allowedUnits = listOf("Kgs", "Boxes", "Bunches"),
        varieties = listOf(
            CommodityVariety("Rose (Red)", "గులాబీ", "गुलाब", 50.0, "Kgs"),
            CommodityVariety("Marigold (Genda)", "బంతి పూలు", "गेंदा", 40.0, "Kgs"),
            CommodityVariety("Jasmine (Mogra)", "మల్లెపూలు", "मोगरा", 120.0, "Kgs"),
            CommodityVariety("Chrysanthemum (Sevanti)", "చామంతి", "गुलदाउदी", 60.0, "Kgs"),
            CommodityVariety("Dutch Rose (Greenhouse)", "డచ్ గులాబీ", "डच गुलाब", 90.0, "Bunches"),
            CommodityVariety("Tuberose", "సుగంధరాజ", "रजनीगंधा", 80.0, "Kgs"),
            CommodityVariety("Crossandra", "కనకాంబరాలు", "क्रॉसेंड्रा", 180.0, "Kgs")
        )
    ),
    GRAINS(
        id = "grains",
        displayName = "Grains",
        emoji = "🌾",
        defaultCommissionRate = 2.5,
        defaultHamaliRate = 40.0,
        defaultTransportRate = 120.0,
        defaultKantaRate = 20.0,
        defaultApmcCessPercent = 1.0,
        allowedUnits = listOf("Quintals", "Bags", "Kgs"),
        varieties = listOf(
            CommodityVariety("Wheat (Sharbati / Lokwan)", "గోధుమలు", "गेहूं", 2400.0, "Quintals"),
            CommodityVariety("Paddy (Sona Masoori / Basmati)", "వరి / వడ్లు", "धान", 2200.0, "Quintals"),
            CommodityVariety("Maize / Corn", "మొక్కజొన్న", "मक्का", 1950.0, "Quintals"),
            CommodityVariety("Bajra / Pearl Millet", "సజ్జలు", "बाजरा", 2150.0, "Quintals"),
            CommodityVariety("Jowar / Sorghum", "జొన్నలు", "ज्वार", 2800.0, "Quintals")
        )
    ),
    PULSES_OILSEEDS(
        id = "pulses",
        displayName = "Pulses & Oilseeds",
        emoji = "🫘",
        defaultCommissionRate = 2.0,
        defaultHamaliRate = 45.0,
        defaultTransportRate = 130.0,
        defaultKantaRate = 20.0,
        defaultApmcCessPercent = 1.0,
        allowedUnits = listOf("Quintals", "Bags"),
        varieties = listOf(
            CommodityVariety("Toor / Arhar Dal", "కందిపప్పు", "तूर दाल", 7200.0, "Quintals"),
            CommodityVariety("Chana (Bengal Gram)", "శనగలు", "चना", 5400.0, "Quintals"),
            CommodityVariety("Moong (Green Gram)", "పెసలు", "मूंग दाल", 6800.0, "Quintals"),
            CommodityVariety("Urad (Black Gram)", "మినుములు", "उड़द दाल", 7100.0, "Quintals"),
            CommodityVariety("Mustard / Sarson", "ఆవాలు", "सरसों", 5200.0, "Quintals"),
            CommodityVariety("Soybean (Yellow)", "సోయాబీన్", "सोयाबीन", 4600.0, "Quintals")
        )
    ),
    VEGETABLES(
        id = "vegetables",
        displayName = "Vegetables",
        emoji = "🥦",
        defaultCommissionRate = 5.0,
        defaultHamaliRate = 35.0,
        defaultTransportRate = 80.0,
        defaultKantaRate = 15.0,
        defaultApmcCessPercent = 0.8,
        allowedUnits = listOf("Crates", "Kgs", "Bags"),
        varieties = listOf(
            CommodityVariety("Tomato (Hybrid)", "టమాటా", "टमाटर", 30.0, "Kgs"),
            CommodityVariety("Onion (Nasik / Red)", "ఉల్లిపాయలు", "प्याज", 35.0, "Kgs"),
            CommodityVariety("Potato (Jyoti)", "బంగాళాదుంపలు", "आलू", 25.0, "Kgs"),
            CommodityVariety("Green Chilli (Teja)", "పచ్చిమిర్చి", "हरी मिर्च", 60.0, "Kgs"),
            CommodityVariety("Ginger / Adrak", "అల్లం", "अदरक", 90.0, "Kgs"),
            CommodityVariety("Garlic / Lahsun", "వెల్లుల్లి", "लहसुन", 130.0, "Kgs")
        )
    ),
    FRUITS(
        id = "fruits",
        displayName = "Fruits",
        emoji = "🍎",
        defaultCommissionRate = 6.0,
        defaultHamaliRate = 45.0,
        defaultTransportRate = 90.0,
        defaultKantaRate = 15.0,
        defaultApmcCessPercent = 1.0,
        allowedUnits = listOf("Baskets", "Crates", "Boxes", "Kgs"),
        varieties = listOf(
            CommodityVariety("Mango (Banganapalli)", "మామిడి", "आम", 85.0, "Kgs"),
            CommodityVariety("Banana (Robusta)", "అరటిపండ్లు", "केला", 25.0, "Kgs"),
            CommodityVariety("Pomegranate (Bhagwa)", "దానిమ్మ", "अनार", 140.0, "Kgs"),
            CommodityVariety("Sweet Lime (Mosambi)", "బత్తాయి", "मौसम्बी", 45.0, "Kgs"),
            CommodityVariety("Apple (Shimla)", "యాపిల్", "सेब", 120.0, "Kgs")
        )
    ),
    SPICES_CASH(
        id = "spices",
        displayName = "Spices & Cash Crops",
        emoji = "🌶️",
        defaultCommissionRate = 3.0,
        defaultHamaliRate = 60.0,
        defaultTransportRate = 150.0,
        defaultKantaRate = 25.0,
        defaultApmcCessPercent = 1.0,
        allowedUnits = listOf("Quintals", "Bags", "Kgs"),
        varieties = listOf(
            CommodityVariety("Cotton / Kapas", "ప్రత్తి", "कपास / कपास", 6800.0, "Quintals"),
            CommodityVariety("Red Chilli (Guntur)", "ఎండుమిర్చి", "लाल मिर्च", 18500.0, "Quintals"),
            CommodityVariety("Turmeric / Haldi", "పసుపు", "हल्दी", 12400.0, "Quintals"),
            CommodityVariety("Cumin / Jeera", "జీలకర్ర", "जीरा", 2600.0, "Quintals")
        )
    )
}

data class CommodityVariety(
    val nameEn: String,
    val nameTe: String,
    val nameHi: String,
    val defaultRate: Double,
    val defaultUnit: String
) {
    fun getName(language: Language): String = when (language) {
        Language.TELUGU -> "$nameEn ($nameTe)"
        Language.HINDI -> "$nameEn ($nameHi)"
        Language.ENGLISH -> nameEn
    }
}

enum class PaymentStatus {
    PAID,
    PARTIAL,
    UNPAID
}

data class Farmer(
    val id: String,
    val name: String,
    val phone: String,
    val village: String,
    val primaryCrops: List<String>,
    val connectedMerchantIds: List<String> = listOf("MCH-001")
)

data class SaleLot(
    val id: String,
    val parchiNumber: String,
    val date: String,
    val time: String,
    val commodityCategory: CommodityCategory,
    val farmerId: String,
    val farmerName: String,
    val farmerVillage: String,
    val farmerPhone: String = "",
    val varietyName: String,
    val quantity: Double,
    val unit: String,
    val rate: Double,
    val qualityGrade: QualityGrade = QualityGrade.GRADE_A,
    val grossTotal: Double,
    val commissionPercent: Double,
    val commissionAmount: Double,
    val ammaliCharges: Double,
    val transportCharges: Double,
    val kantaCharges: Double = 15.0,
    val apmcCessPercent: Double = 1.0,
    val apmcCessAmount: Double = 0.0,
    val miscCharges: Double = 0.0,
    val totalDeductions: Double,
    val farmerNetPayable: Double,
    val paymentStatus: PaymentStatus,
    val amountPaid: Double,
    val balanceDue: Double,
    val paymentMode: String = "Cash",
    val notes: String = ""
)

data class StockItem(
    val id: String,
    val name: String,
    val category: CommodityCategory,
    val quantityOnHand: Double,
    val unit: String,
    val packagesCount: Int,
    val packageType: String,
    val avgCostPrice: Double,
    val targetSellingPrice: Double,
    val minReorderLevel: Double,
    val storageLocation: String
)

data class EmployeeRecord(
    val id: String,
    val name: String,
    val phone: String,
    val role: String,
    val dailyWageOrSalary: Double,
    val wageType: String,
    val status: String = "active",
    val totalPaid: Double = 0.0,
    val balanceDue: Double = 0.0,
    val notes: String = ""
)

data class FifteenDaySettlement(
    val id: String,
    val settlementNumber: String,
    val periodLabel: String,
    val farmerId: String,
    val farmerName: String,
    val farmerVillage: String,
    val totalShipments: Int,
    val totalGross: Double,
    val totalDeductions: Double,
    val finalPayment: Double,
    val status: String
)

data class PaymentRecord(
    val id: String,
    val date: String,
    val farmerId: String,
    val farmerName: String,
    val amount: Double,
    val paymentMode: String,
    val referenceNumber: String = "",
    val notes: String = ""
)

data class ParchiAuditLog(
    val id: String,
    val parchiNumber: String,
    val farmerName: String,
    val actionBy: String,
    val actionType: String, // "REMOVED" / "REPRINTED" / "VOIDED"
    val timestamp: String,
    val reason: String
)

data class HelpTicket(
    val id: String,
    val ticketNumber: String,
    val category: String,
    val priority: String,
    val status: String,
    val subject: String,
    val description: String,
    val createdAt: String
)

data class MerchantProfile(
    val shopName: String = "Sri Lakshmi Agri & Flower Mandi Traders",
    val ownerName: String = "Ramesh Kumar (Adathiya)",
    val shopNumber: String = "Shop #42 Form C",
    val apmcMarketName: String = "Gudur APMC Agricultural Wholesale Yard",
    val phone: String = "+91 98765 43210",
    val merchantId: String = "MCH-001"
)

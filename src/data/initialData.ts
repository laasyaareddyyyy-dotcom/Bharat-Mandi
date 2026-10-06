import {
  Farmer,
  MerchantProfile,
  PaymentRecord,
  SaleLot,
  ConnectionRequest,
  Shipment,
  FifteenDaySettlement,
  CommodityCategory,
  WeightUnit,
  QualityGrade,
  HelpTicket,
  StockItem,
  EmployeeRecord,
} from '../types';

export interface CommodityCategoryMeta {
  id: CommodityCategory;
  name: string;
  nameHi: string;
  nameTe: string;
  icon: string;
  color: string;
  bgLight: string;
  borderLight: string;
  badgeBg: string;
  badgeText: string;
  defaultCommissionRate: number;
  defaultHamaliRate: number;
  defaultTransportRate: number;
  defaultStorageRate: number;
  allowedUnits: WeightUnit[];
  packagingLabel: string;
  weightLabel: string;
  varieties: { id: string; en: string; hi: string; te: string; defaultRate: number; unit: WeightUnit }[];
}

export const COMMODITY_CONFIGS: Record<CommodityCategory, CommodityCategoryMeta> = {
  flowers: {
    id: 'flowers',
    name: 'Flowers',
    nameHi: 'फूल (Flowers)',
    nameTe: 'పూలు (Flowers)',
    icon: '🌸',
    color: '#D97706',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-900',
    badgeText: 'text-amber-800',
    defaultCommissionRate: 4,
    defaultHamaliRate: 50,
    defaultTransportRate: 75,
    defaultStorageRate: 20,
    allowedUnits: ['Kgs', 'Boxes', 'Bunches'],
    packagingLabel: 'Boxes',
    weightLabel: 'Kgs / Weight',
    varieties: [
      { id: 'rose', en: 'Rose (Gulab)', hi: 'गुलाब (Rose)', te: 'గులాబీ (Rose)', defaultRate: 50, unit: 'Kgs' },
      { id: 'marigold', en: 'Marigold (Genda)', hi: 'गेंदा (Marigold)', te: 'బంతి పూలు (Marigold)', defaultRate: 40, unit: 'Kgs' },
      { id: 'jasmine', en: 'Jasmine (Mogra / Malli)', hi: 'मोगरा (Jasmine)', te: 'మల్లెపూలు (Jasmine)', defaultRate: 120, unit: 'Kgs' },
      { id: 'chrysanthemum', en: 'Chrysanthemum (Sevanti)', hi: 'गुलदाउदी (Sevanti)', te: 'చామంతి (Sevanti)', defaultRate: 60, unit: 'Kgs' },
      { id: 'dutch-rose', en: 'Dutch Rose (Greenhouse)', hi: 'डच गुलाब (Dutch Rose)', te: 'డచ్ గులాబీ (Dutch Rose)', defaultRate: 90, unit: 'Bunches' },
      { id: 'tuberose', en: 'Tuberose (Sugandharaja)', hi: 'रजनीगंधा (Tuberose)', te: 'సుగంధరాజ (Tuberose)', defaultRate: 80, unit: 'Kgs' },
      { id: 'crossandra', en: 'Crossandra (Kanakambaram)', hi: 'क्रॉसेंड्रा (Kanakambaram)', te: 'కనకాంబరాలు (Crossandra)', defaultRate: 180, unit: 'Kgs' },
    ],
  },
  grains: {
    id: 'grains',
    name: 'Grains & Pulses',
    nameHi: 'अनाज व दालें (Grains)',
    nameTe: 'ధాన్యాలు & పప్పుదినుసులు (Grains)',
    icon: '🌾',
    color: '#059669',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-900',
    badgeText: 'text-emerald-800',
    defaultCommissionRate: 2.5,
    defaultHamaliRate: 40,
    defaultTransportRate: 120,
    defaultStorageRate: 30,
    allowedUnits: ['Quintals', 'Bags', 'Kgs'],
    packagingLabel: 'Bags (Bori)',
    weightLabel: 'Quintals / Kgs',
    varieties: [
      { id: 'wheat', en: 'Wheat (Sharbati / Lokwan)', hi: 'गेहूं (Wheat)', te: 'గోధుమలు (Wheat)', defaultRate: 2400, unit: 'Quintals' },
      { id: 'paddy', en: 'Paddy / Rice (Sona Masoori)', hi: 'धान / चावल (Paddy)', te: 'వరి / వడ్లు (Paddy/Rice)', defaultRate: 2200, unit: 'Quintals' },
      { id: 'maize', en: 'Maize / Corn (Makka)', hi: 'मक्का (Maize)', te: 'మొక్కజొన్న (Maize)', defaultRate: 1950, unit: 'Quintals' },
      { id: 'toor-dal', en: 'Toor Dal / Red Gram (Arhar)', hi: 'अरहर / तूर दाल (Toor Dal)', te: 'కందిపప్పు / కందులు (Toor Dal)', defaultRate: 7200, unit: 'Quintals' },
      { id: 'chana', en: 'Chana / Bengal Gram', hi: 'चना (Chana / Gram)', te: 'శనగలు (Chana)', defaultRate: 5400, unit: 'Quintals' },
      { id: 'soybean', en: 'Soybean (Yellow)', hi: 'सोयाबीन (Soybean)', te: 'సోయాబీన్ (Soybean)', defaultRate: 4600, unit: 'Quintals' },
      { id: 'moong', en: 'Moong Dal / Green Gram', hi: 'मूंग दाल (Moong Dal)', te: 'పెసలు / పెసరపప్పు (Moong)', defaultRate: 6800, unit: 'Quintals' },
    ],
  },
  vegetables: {
    id: 'vegetables',
    name: 'Vegetables',
    nameHi: 'सब्जियां (Vegetables)',
    nameTe: 'కూరగాయలు (Vegetables)',
    icon: '🥦',
    color: '#16A34A',
    bgLight: 'bg-green-50',
    borderLight: 'border-green-200',
    badgeBg: 'bg-green-100 text-green-900',
    badgeText: 'text-green-800',
    defaultCommissionRate: 5,
    defaultHamaliRate: 35,
    defaultTransportRate: 80,
    defaultStorageRate: 15,
    allowedUnits: ['Crates', 'Kgs', 'Bags'],
    packagingLabel: 'Crates',
    weightLabel: 'Kgs / Crates',
    varieties: [
      { id: 'tomato', en: 'Tomato (Hybrid / Local)', hi: 'टमाटर (Tomato)', te: 'టమాటా (Tomato)', defaultRate: 30, unit: 'Kgs' },
      { id: 'onion', en: 'Onion (Nasik / Red)', hi: 'प्याज (Onion)', te: 'ఉల్లిపాయలు (Onion)', defaultRate: 35, unit: 'Kgs' },
      { id: 'potato', en: 'Potato (Jyoti / Chipsona)', hi: 'आलू (Potato)', te: 'బంగాళాదుంపలు (Potato)', defaultRate: 25, unit: 'Kgs' },
      { id: 'green-chilli', en: 'Green Chilli (G4 / Teja)', hi: 'हरी मिर्च (Green Chilli)', te: 'పచ్చిమిర్చి (Green Chilli)', defaultRate: 60, unit: 'Kgs' },
      { id: 'brinjal', en: 'Brinjal / Eggplant', hi: 'बैंगन (Brinjal)', te: 'వంకాయ (Brinjal)', defaultRate: 28, unit: 'Kgs' },
      { id: 'cabbage', en: 'Cabbage (Green)', hi: 'पत्तागोभी (Cabbage)', te: 'క్యాబేజీ (Cabbage)', defaultRate: 18, unit: 'Kgs' },
      { id: 'cauliflower', en: 'Cauliflower', hi: 'फूलगोभी (Cauliflower)', te: 'కాలీఫ్లవర్ (Cauliflower)', defaultRate: 32, unit: 'Kgs' },
      { id: 'ginger', en: 'Ginger (Adrak)', hi: 'अदरक (Ginger)', te: 'అల్లం (Ginger)', defaultRate: 90, unit: 'Kgs' },
    ],
  },
  fruits: {
    id: 'fruits',
    name: 'Fruits',
    nameHi: 'फल (Fruits)',
    nameTe: 'పండ్లు (Fruits)',
    icon: '🍎',
    color: '#EA580C',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    badgeBg: 'bg-orange-100 text-orange-900',
    badgeText: 'text-orange-800',
    defaultCommissionRate: 6,
    defaultHamaliRate: 45,
    defaultTransportRate: 90,
    defaultStorageRate: 25,
    allowedUnits: ['Baskets', 'Crates', 'Boxes', 'Kgs'],
    packagingLabel: 'Baskets / Boxes',
    weightLabel: 'Kgs / Baskets',
    varieties: [
      { id: 'mango', en: 'Mango (Banganapalli / Alphonso)', hi: 'आम (Mango)', te: 'మామిడి (Mango)', defaultRate: 85, unit: 'Kgs' },
      { id: 'banana', en: 'Banana (Robusta / Yelakki)', hi: 'केला (Banana)', te: 'అరటిపండ్లు (Banana)', defaultRate: 25, unit: 'Kgs' },
      { id: 'pomegranate', en: 'Pomegranate (Bhagwa Anar)', hi: 'अनार (Pomegranate)', te: 'దానిమ్మ (Pomegranate)', defaultRate: 140, unit: 'Kgs' },
      { id: 'sweet-lime', en: 'Sweet Lime / Mosambi', hi: 'मौसम्बी (Sweet Lime)', te: 'బత్తాయి (Mosambi)', defaultRate: 45, unit: 'Kgs' },
      { id: 'papaya', en: 'Papaya (Taiwan 786)', hi: 'पपीता (Papaya)', te: 'బొప్పాయి (Papaya)', defaultRate: 22, unit: 'Kgs' },
      { id: 'apple', en: 'Apple (Shimla / Kinnaur)', hi: 'सेब (Apple)', te: 'యాపిల్ (Apple)', defaultRate: 120, unit: 'Kgs' },
      { id: 'grapes', en: 'Grapes (Thompson Seedless)', hi: 'अंगूर (Grapes)', te: 'ద్రాక్ష (Grapes)', defaultRate: 80, unit: 'Kgs' },
      { id: 'watermelon', en: 'Watermelon (Kiran)', hi: 'तरबूज (Watermelon)', te: 'పుచ్చకాయ (Watermelon)', defaultRate: 15, unit: 'Kgs' },
    ],
  },
  spices: {
    id: 'spices',
    name: 'Spices & Commercial Crops',
    nameHi: 'मसाले व वाणिज्य फसलें (Spices)',
    nameTe: 'మసాలా దినుసులు (Spices)',
    icon: '🌶️',
    color: '#DC2626',
    bgLight: 'bg-red-50',
    borderLight: 'border-red-200',
    badgeBg: 'bg-red-100 text-red-900',
    badgeText: 'text-red-800',
    defaultCommissionRate: 3,
    defaultHamaliRate: 40,
    defaultTransportRate: 100,
    defaultStorageRate: 25,
    allowedUnits: ['Quintals', 'Bags', 'Kgs'],
    packagingLabel: 'Bags / Sacks',
    weightLabel: 'Quintals / Kgs',
    varieties: [
      { id: 'dry-chilli', en: 'Dry Red Chilli (Teja / Wonder Hot)', hi: 'सूखी लाल मिर्च (Dry Chilli)', te: 'ఎండుమిర్చి (Dry Chilli)', defaultRate: 18000, unit: 'Quintals' },
      { id: 'turmeric', en: 'Turmeric (Finger / Bulb)', hi: 'हल्दी (Turmeric)', te: 'పసుపు (Turmeric)', defaultRate: 14000, unit: 'Quintals' },
      { id: 'garlic', en: 'Garlic (Desi / Ooty)', hi: 'लहसुन (Garlic)', te: 'వెల్లుల్లి (Garlic)', defaultRate: 12000, unit: 'Quintals' },
      { id: 'coriander', en: 'Coriander Seeds (Dhania)', hi: 'धनिया (Coriander)', te: 'ధనియాలు (Coriander)', defaultRate: 8500, unit: 'Quintals' },
      { id: 'tamarind', en: 'Tamarind (Seeded / Seedless)', hi: 'इमली (Tamarind)', te: 'చింతపండు (Tamarind)', defaultRate: 9500, unit: 'Quintals' },
    ],
  },
};

export const ALL_COMMODITIES: CommodityCategory[] = ['flowers', 'grains', 'vegetables', 'fruits', 'spices'];

export const DEFAULT_MARKET_YARD_NAME = 'Gudimalkapur Market Yard';

export const initialMerchantProfile: MerchantProfile = {
  shopName: "Mandi Wholesale Merchant",
  ownerName: "Mandi Trader",
  photoUrl: "",
  shopNumber: "Shop No. 1",
  apmcMarketName: "Gudimalkapur Market Yard",
  merchantId: "MND-1001",
  phoneNumber: "+91 9849012345",
  licenseNumber: "Verified Adathiya",
  defaultCommissionRate: 4,
  defaultExpenditureRate: 6,
  selectedCommodities: ['flowers', 'grains', 'vegetables', 'fruits', 'spices'],
  commoditySettings: {
    flowers: { defaultCommissionRate: 4, defaultHamaliRate: 50, defaultTransportRate: 75, defaultStorageRate: 20 },
    grains: { defaultCommissionRate: 2.5, defaultHamaliRate: 40, defaultTransportRate: 120, defaultStorageRate: 30 },
    vegetables: { defaultCommissionRate: 5, defaultHamaliRate: 35, defaultTransportRate: 80, defaultStorageRate: 15 },
    fruits: { defaultCommissionRate: 6, defaultHamaliRate: 45, defaultTransportRate: 90, defaultStorageRate: 25 },
    spices: { defaultCommissionRate: 3, defaultHamaliRate: 40, defaultTransportRate: 100, defaultStorageRate: 25 },
  },
  address: "Gudimalkapur Market Yard, Hyderabad"
};

export const initialFarmers: Farmer[] = [];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export const generateInitialShipments = (_sessionDate: string = '2024-09-15'): Shipment[] => {
  return [];
};

export const generateInitialLots = (_sessionDate: string = getTodayDateString()): SaleLot[] => {
  return [];
};

export const initialPayments: PaymentRecord[] = [];

export const initialConnectionRequests: ConnectionRequest[] = [];

export const SUPPORT_STAFF_MEMBERS = [
  'Unassigned',
  'Ramesh Kumar (Mandi Tech Lead)',
  'Priya Sharma (Settlement & Billing)',
  'Vikram Varma (Farmer Care & Liaison)',
  'Anand Patil (Print & Hardware Support)',
];

export interface MandiFAQ {
  id: string;
  category: string;
  question: string;
  questionTe: string;
  questionHi: string;
  answer: string;
  answerTe: string;
  answerHi: string;
  tag: string;
}

export const MANDI_FAQS: MandiFAQ[] = [
  {
    id: 'faq-1',
    category: 'Settlement & Billing',
    question: 'How is the 4% Form C Mandi Commission calculated?',
    questionTe: '4% ఫారమ్ సి మండి కమీషన్ ఎలా లెక్కించబడుతుంది?',
    questionHi: '4% फॉर्म सी मंडी कमीशन की गणना कैसे की जाती है?',
    answer: 'Commission is statutory under APMC Act. It is calculated as Gross Sales Value × 4%. For example, if a farmer brings 100 kg marigold sold at ₹40/kg = ₹4,000 gross, the 4% commission is ₹160. Hamali and Transport are deducted from gross before arriving at Net Payable.',
    answerTe: 'కమీషన్ APMC చట్టం ప్రకారం చట్టబద్ధమైనది. ఇది మొత్తం విక్రయ విలువ × 4%గా లెక్కించబడుతుంది. ఉదాహరణకు, 100 కిలోల బంతి పూలు ₹40/కిలో చొప్పున అమ్ముడైతే = ₹4,000 స్థూల విక్రయం, 4% కమీషన్ ₹160 అవుతుంది.',
    answerHi: 'कमीशन एपीएमसी अधिनियम के तहत वैधानिक है। इसकी गणना कुल बिक्री मूल्य × 4% के रूप में की जाती है। उदाहरण के लिए, यदि 100 किलो गेंदा ₹40/किलो पर बेचा जाता है = ₹4,000, तो 4% कमीशन ₹160 होगा।',
    tag: 'Commission',
  },
  {
    id: 'faq-2',
    category: '15-Day Settlement',
    question: 'How does the 15-Day Settlement Cycle work for registered farmers?',
    questionTe: 'నమోదిత రైతులకు 15 రోజుల సెటిల్‌మెంట్ సైకిల్ ఎలా పనిచేస్తుంది?',
    questionHi: 'पंजीकृत किसानों के लिए 15-दिवसीय निपटान चक्र कैसे काम करता है?',
    answer: 'Bharat Mandi aggregates all arrival lots between the 1st-15th and 16th-end of every month. Merchants can generate consolidated Form C Settlement Statements, apply deductions, review advance adjustments, and issue instant payouts via Cash, UPI, or Bank NEFT with automated PDF receipts.',
    answerTe: 'ప్రతి నెల 1-15 మరియు 16-ఆఖరు తేదీల మధ్య వచ్చిన అన్ని లాట్లను భారత్ మండి సమగ్రపరుస్తుంది. వ్యాపారులు 15 రోజుల సెటిల్‌మెంట్ స్టేట్‌మెంట్‌ను రూపొందించి UPI/నగదు/బ్యాంక్ ద్వారా చెల్లించవచ్చు.',
    answerHi: 'भारत मंडी हर महीने की 1-15 और 16-अंतिम तारीख के बीच सभी लॉट को जोड़ता है। व्यापारी समेकित फॉर्म सी निपटान विवरण बना सकते हैं और नकद/यूपीआई/बैंक के माध्यम से भुगतान कर सकते हैं।',
    tag: 'Settlement',
  },
  {
    id: 'faq-3',
    category: 'Hardware & Printing',
    question: 'How to connect and print receipts on 80mm Bluetooth Thermal Printers?',
    questionTe: '80mm బ్లూటూత్ థర్మల్ ప్రింటర్లలో రసీదులను ఎలా ప్రింట్ చేయాలి?',
    questionHi: '80 मिमी ब्लूटूथ थर्मल प्रिंटर पर रसीदें कैसे प्रिंट करें?',
    answer: 'Connect your ESC/POS thermal printer via Bluetooth or USB. When clicking "Print Parchi" or "Download PDF", select the "Thermal (80mm)" format option. The output is pre-formatted to 72mm printable width with clear Devanagari & Telugu font rendering.',
    answerTe: 'బ్లూటూత్ లేదా USB ద్వారా మీ థర్మల్ ప్రింటర్‌ను కనెక్ట్ చేయండి. "ప్రింట్ పర్చి" లేదా "PDF డౌన్‌లోడ్" క్లిక్ చేసినప్పుడు "థర్మల్ (80mm)" ఆప్షన్‌ను ఎంచుకోండి.',
    answerHi: 'ब्लूटूथ या यूएसबी के जरिए अपने थर्मल प्रिंटर को कनेक्ट करें। "प्रिंट पर्ची" या "डाउनलोड पीडीएफ" पर क्लिक करते समय "थर्मल (80 मिमी)" प्रारूप चुनें।',
    tag: 'Printer',
  },
  {
    id: 'faq-4',
    category: 'Offline Storage',
    question: 'Will my Mandi data be safe if the internet goes down at the morning auction?',
    questionTe: 'ఉదయం వేలంలో ఇంటర్నెట్ పోయినా నా డేటా సురక్షితంగా ఉంటుందా?',
    questionHi: 'क्या सुबह की नीलामी में इंटरनेट बंद होने पर मेरा डेटा सुरक्षित रहेगा?',
    answer: 'Yes, 100%! Bharat Mandi uses local browser persistence and IndexedDB caches. You can record lots, calculate rates, issue parchis, and view farmer khatas without an active internet connection. All records sync automatically once reconnected.',
    answerTe: 'అవును, ఖచ్చితంగా! భారత్ మండి ఆఫ్‌లైన్-ఫస్ట్ టెక్నాలజీని ఉపయోగిస్తుంది. ఇంటర్నెట్ లేకపోయినా మీరు లాట్లను నమోదు చేయవచ్చు, రశీదులు ముద్రించవచ్చు మరియు ఖాతాలను చూడవచ్చు.',
    answerHi: 'हाँ, बिल्कुल! भारत मंडी ऑफ़लाइन-प्रथम तकनीक का उपयोग करता है। आप इंटरनेट के बिना भी लॉट दर्ज कर सकते हैं, पर्चियां निकाल सकते हैं और खाता देख सकते हैं।',
    tag: 'Offline',
  },
  {
    id: 'faq-5',
    category: 'Accounts & Khata',
    question: 'How do farmers track their daily sales and pending balance from home?',
    questionTe: 'రైతులు ఇంటి నుండి తమ రోజువారీ విక్రయాలు మరియు బ్యాలెన్స్‌ను ఎలా ట్రాక్ చేయవచ్చు?',
    questionHi: 'किसान घर बैठे अपनी दैनिक बिक्री और बकाया राशि कैसे ट्रैक कर सकते हैं?',
    answer: 'Farmers can switch to the "Farmer Portal", enter their registered mobile number, and instantly see live auction prices, today\'s parchi slips with QR codes, 15-day settlement histories, and download PDF statements.',
    answerTe: 'రైతులు "రైతు పోర్టల్" కు మారి తమ ఫోన్ నంబర్‌తో లాగిన్ అయి రోజువారీ అమ్మకాలు, డిజిటల్ పర్చీలు మరియు ఖాతా వివరాలను నేరుగా మొబైల్‌లో చూడవచ్చు.',
    answerHi: 'किसान "किसान पोर्टल" पर स्विच करके अपने मोबाइल नंबर के साथ लॉग इन कर सकते हैं और वास्तविक समय की बिक्री, डिजिटल पर्चियां और खाता विवरण देख सकते हैं।',
    tag: 'Farmer Portal',
  },
];

export const initialHelpTickets: HelpTicket[] = [];

export const INITIAL_STOCKS: StockItem[] = [];

export const INITIAL_EMPLOYEES: EmployeeRecord[] = [];


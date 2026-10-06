import React, { useState } from 'react';
import {
  Store,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Check,
  ChevronRight,
  AlertCircle,
  Mail,
  Lock,
  KeyRound,
  Layers,
  Sparkles,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  ChevronDown,
  MapPin,
  Building,
  FileText,
} from 'lucide-react';
import { useMandi } from '../../context/MandiContext';
import { CommodityCategory, WeightUnit } from '../../types';
import { sounds } from '../../utils/audio';
import { COMMODITY_CONFIGS, DEFAULT_MARKET_YARD_NAME, ALL_COMMODITIES } from '../../data/initialData';
import { LanguageSettingsModal } from '../common/LanguageSettingsModal';
import { getLanguageInfo } from '../../data/indianLanguages';
import { validateIndianMobile, cleanIndianMobile } from '../../utils/phoneValidation';
import { sendPhoneOtp, verifyPhoneOtp, isSupabaseConfigured } from '../../services/supabase';

type AuthViewMode = 'login' | 'signup' | 'forgot-password';
type SignupStep = 'details' | 'otp' | 'commodities';
type AuthMethod = 'phone' | 'email';

const INDIAN_STATES = [
  'Telangana',
  'Andhra Pradesh',
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Gujarat',
  'Uttar Pradesh',
  'Punjab',
  'Haryana',
  'Madhya Pradesh',
  'Rajasthan',
  'West Bengal',
  'Kerala',
  'Bihar',
  'Odisha',
  'Delhi Market Yard',
  'Assam',
  'Other State',
];

interface SignupTranslations {
  merchantSignUp: string;
  stepOf4: (current: number) => string;
  heading: string;
  subtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;

  fullNameLabel: string;
  mobileLabel: string;
  emailLabel: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  shopNameLabel: string;
  shopNumberLabel: string;
  stateLabel: string;
  marketYardLabel: string;
  shopAddressLabel: string;

  fullNamePlaceholder: string;
  mobilePlaceholder: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  shopNamePlaceholder: string;
  shopNumberPlaceholder: string;
  marketYardPlaceholder: string;
  shopAddressPlaceholder: string;

  btnNext: string;
  btnBack: string;
  btnGetOtp: string;
  alreadyHaveAccount: string;
  loginLink: string;

  errFullNameRequired: string;
  errFullNameNoNumbers: string;
  errPhoneRequired: string;
  errPasswordMinLength: string;
  errPasswordMismatch: string;
  errShopNameRequired: string;
  errMarketYardRequired: string;
  errShopAddressRequired: string;

  otpHeading: string;
  otpSubtitle: (phone: string) => string;
  btnVerifyOtp: string;
  commodityHeading: string;
  commoditySubtitle: string;
  btnCompleteSignup: string;
}

const SIGNUP_TRANSLATIONS: Record<string, SignupTranslations> = {
  en: {
    merchantSignUp: 'Merchant Sign Up',
    stepOf4: (current) => `Step ${current} of 4`,
    heading: 'Create Your Mandi Merchant Account',
    subtitle: 'Register your wholesale mandi shop in easy step-by-step process',
    step1Title: 'Personal Details',
    step1Desc: 'Enter your full name, mobile number, and email address',
    step2Title: 'Password',
    step2Desc: 'Set a secure login password for your merchant account',
    step3Title: 'Shop Details',
    step3Desc: 'Provide your registered shop / firm name and stall number',
    step4Title: 'Market Details',
    step4Desc: 'Select your state, market yard, and shop address',

    fullNameLabel: 'Full Name (Owner / Trader) *',
    mobileLabel: 'Mobile Number (10 Digits) *',
    emailLabel: 'Email Address (Optional)',
    passwordLabel: 'Create Log In Password *',
    confirmPasswordLabel: 'Re-enter Password to Confirm *',
    shopNameLabel: 'Shop / Firm Name *',
    shopNumberLabel: 'Shop / Stall Number',
    stateLabel: 'State *',
    marketYardLabel: 'Market Yard / Mandi Name *',
    shopAddressLabel: 'Shop / Yard Full Address *',

    fullNamePlaceholder: 'e.g. Ramesh Kumar',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'e.g. ramesh@manditrader.com',
    passwordPlaceholder: 'Set password for future logins',
    confirmPasswordPlaceholder: 'Re-enter same password',
    shopNamePlaceholder: 'e.g. Sri Venkateswara Trading Co.',
    shopNumberPlaceholder: 'e.g. Stall #27, Gate 3',
    marketYardPlaceholder: 'e.g. Wholesale Market Yard',
    shopAddressPlaceholder: 'e.g. Shop #1, Gate 2, Market Yard',

    btnNext: 'Next',
    btnBack: 'Back',
    btnGetOtp: 'Get One-Time Verification OTP',
    alreadyHaveAccount: 'Already have an account?',
    loginLink: 'Log In',

    errFullNameRequired: 'Please enter your full name',
    errFullNameNoNumbers: 'Full name cannot contain numbers',
    errPhoneRequired: 'Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)',
    errPasswordMinLength: 'Password must be at least 4 characters long',
    errPasswordMismatch: 'Passwords do not match! Please re-enter the exact same password.',
    errShopNameRequired: 'Please enter your shop or firm name',
    errMarketYardRequired: 'Please enter your market yard or mandi name',
    errShopAddressRequired: 'Please enter your shop address',

    otpHeading: 'One-Time Verification OTP',
    otpSubtitle: (phone) => `Enter the 6-digit verification code sent to +91 ${phone}`,
    btnVerifyOtp: 'Verify OTP Code & Select Commodity',
    commodityHeading: 'Select Commodity Types You Trade',
    commoditySubtitle: 'Choose the crops and produce you handle in the market',
    btnCompleteSignup: 'Complete Mandi Sign Up',
  },
  te: {
    merchantSignUp: 'వ్యాపారి సైన్ అప్',
    stepOf4: (current) => `దశ ${current} / 4`,
    heading: 'మీ మండి వ్యాపారి ఖాతాను సృష్టించండి',
    subtitle: 'సులభమైన దశలవారీ ప్రక్రియలో మీ టోకు మండి దుకాణాన్ని నమోదు చేయండి',
    step1Title: 'వ్యక్తిగత వివరాలు',
    step1Desc: 'మీ పూర్తి పేరు, మొబైల్ సంఖ్య మరియు ఇమెయిల్ నమోదు చేయండి',
    step2Title: 'పాస్‌వర్డ్',
    step2Desc: 'మీ ఖాతా కోసం సురక్షితమైన లాగిన్ పాస్‌వర్డ్‌ను సెట్ చేయండి',
    step3Title: 'దుకాణం వివరాలు',
    step3Desc: 'మీ దుకాణం లేదా సంస్థ పేరు మరియు స్టాల్ సంఖ్యను అందించండి',
    step4Title: 'మార్కెట్ వివరాలు',
    step4Desc: 'మీ APMC మార్కెట్ యార్డ్, రాష్ట్రం మరియు చిరునామాను ఎంచుకోండి',

    fullNameLabel: 'పూర్తి పేరు (యజమాని / వ్యాపారి) *',
    mobileLabel: 'మొబైల్ సంఖ్య (10 అంకెలు) *',
    emailLabel: 'ఇమెయిల్ చిరునామా (ఐచ్ఛికం)',
    passwordLabel: 'లాగిన్ పాస్‌వర్డ్‌ను సృష్టించండి *',
    confirmPasswordLabel: 'సృష్టించిన పాస్‌వర్డ్‌ను సరిచూడండి *',
    shopNameLabel: 'దుకాణం / సంస్థ పేరు *',
    shopNumberLabel: 'దుకాణం / స్టాల్ సంఖ్య',
    stateLabel: 'రాష్ట్రం *',
    marketYardLabel: 'మార్కెట్ యార్డ్ / మండి పేరు *',
    shopAddressLabel: 'దుకాణం / యార్డ్ పూర్తి చిరునామా *',

    fullNamePlaceholder: 'ఉదా. రమేష్ కుమార్',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'ఉదా. ramesh@manditrader.com',
    passwordPlaceholder: 'భవిష్యత్ లాగిన్‌ల కోసం పాస్‌వర్డ్ సెట్ చేయండి',
    confirmPasswordPlaceholder: 'అదే పాస్‌వర్డ్‌ను మళ్లీ నమోదు చేయండి',
    shopNamePlaceholder: 'ఉదా. శ్రీ వేంకటేశ్వర ట్రేడింగ్ కంపెనీ',
    shopNumberPlaceholder: 'ఉదా. స్టాల్ #27, గేట్ 3',
    marketYardPlaceholder: 'ఉదా. హోల్‌సేల్ మార్కెట్ యార్డ్',
    shopAddressPlaceholder: 'ఉదా. షాప్ #1, గేట్ 2, మార్కెట్ యార్డ్',

    btnNext: 'తరువాత',
    btnBack: 'వెనుకకు',
    btnGetOtp: 'వన్‌టైమ్ వెరిఫికేషన్ OTP పొందండి',
    alreadyHaveAccount: 'ఇప్పటికే ఖాతా ఉందా?',
    loginLink: 'లాగిన్ అవ్వండి',

    errFullNameRequired: 'దయచేసి మీ పూర్తి పేరును నమోదు చేయండి',
    errFullNameNoNumbers: 'పూర్తి పేరులో అంకెలు ఉండకూడదు',
    errPhoneRequired: 'చెల్లుబాటు అయ్యే 10 అంకెల భారతీయ మొబైల్ సంఖ్యను నమోదు చేయండి (6, 7, 8, లేదా 9 తో ప్రారంభం కావాలి)',
    errPasswordMinLength: 'పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి',
    errPasswordMismatch: 'పాస్‌వర్డ్‌లు సరిపోలలేదు! దయచేసి రెండు చోట్లా ఒకే పాస్‌వర్డ్‌ను నమోదు చేయండి.',
    errShopNameRequired: 'దయచేసి మీ దుకాణం లేదా సంస్థ పేరును నమోదు చేయండి',
    errMarketYardRequired: 'దయచేసి మీ మార్కెట్ యార్డ్ లేదా మండి పేరును నమోదు చేయండి',
    errShopAddressRequired: 'దయచేసి మీ దుకాణం చిరునామాను నమోదు చేయండి',

    otpHeading: 'వన్‌టైమ్ వెరిఫికేషన్ OTP',
    otpSubtitle: (phone) => `+91 ${phone} కి పంపిన 6-అంకెల కోడ్‌ను నమోదు చేయండి`,
    btnVerifyOtp: 'OTP సరిచూడండి & కొనసాగండి',
    commodityHeading: 'మీరు వ్యాపారం చేసే సరుకుల రకాలను ఎంచుకోండి',
    commoditySubtitle: 'మార్కెట్ యార్డ్‌లో మీరు విక్రయించే పంటలు మరియు సరుకులను ఎంచుకోండి',
    btnCompleteSignup: 'మండి సైన్ అప్‌ పూర్తి చేయండి',
  },
  hi: {
    merchantSignUp: 'व्यापारी साइन अप',
    stepOf4: (current) => `चरण ${current} / 4`,
    heading: 'अपना मंडी आढ़तिया खाता बनाएं',
    subtitle: 'आसान चरण-दर-चरण प्रक्रिया में अपनी थोक मंडी दुकान पंजीकृत करें',
    step1Title: 'व्यक्तिगत विवरण',
    step1Desc: 'अपना पूरा नाम, मोबाइल नंबर और ईमेल दर्ज करें',
    step2Title: 'पासवर्ड',
    step2Desc: 'अपने खाते में लॉगिन करने के लिए एक सुरक्षित पासवर्ड बनाएं',
    step3Title: 'दुकान का विवरण',
    step3Desc: 'अपनी दुकान या फर्म का नाम और स्टॉल नंबर दर्ज करें',
    step4Title: 'मंडी विवरण',
    step4Desc: 'अपना राज्य, APMC मंडी प्रांगण और पूरा पता चुनें',

    fullNameLabel: 'पूरा नाम (मालिक / व्यापारी) *',
    mobileLabel: 'मोबाइल नंबर (10 अंक) *',
    emailLabel: 'ईमेल पता (वैकल्पिक)',
    passwordLabel: 'लॉगिन पासवर्ड बनाएं *',
    confirmPasswordLabel: 'पुष्टि के लिए पासवर्ड पुनः दर्ज करें *',
    shopNameLabel: 'दुकान / फर्म का नाम *',
    shopNumberLabel: 'दुकान / स्टॉल संख्या',
    stateLabel: 'राज्य *',
    marketYardLabel: 'मार्केट यार्ड / मंडी का नाम *',
    shopAddressLabel: 'दुकान / यार्ड का पूरा पता *',

    fullNamePlaceholder: 'जैसे: रमेश कुमार',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'जैसे: ramesh@manditrader.com',
    passwordPlaceholder: 'भविष्य के लॉगिन के लिए पासवर्ड बनाएं',
    confirmPasswordPlaceholder: 'वही पासवर्ड दोबारा दर्ज करें',
    shopNamePlaceholder: 'जैसे: श्री वेंकटेश्वर ट्रेडिंग कं.',
    shopNumberPlaceholder: 'जैसे: स्टॉल #27, गेट 3',
    marketYardPlaceholder: 'जैसे: थोक मंडी प्रांगण',
    shopAddressPlaceholder: 'जैसे: दुकान #1, गेट 2, मंडी प्रांगण',

    btnNext: 'आगे बढ़ें',
    btnBack: 'पीछे जाएं',
    btnGetOtp: 'एक-बार सत्यापन OTP प्राप्त करें',
    alreadyHaveAccount: 'पहले से खाता है?',
    loginLink: 'लॉगिन करें',

    errFullNameRequired: 'कृपया अपना पूरा नाम दर्ज करें',
    errFullNameNoNumbers: 'पूरे नाम में संख्याएं नहीं हो सकतीं',
    errPhoneRequired: 'वैध 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8, या 9 से शुरू होना चाहिए)',
    errPasswordMinLength: 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए',
    errPasswordMismatch: 'पासवर्ड मेल नहीं खाते! कृपया दोनों फ़ील्ड में सटीक समान पासवर्ड दर्ज करें।',
    errShopNameRequired: 'कृपया अपनी दुकान या फर्म का नाम दर्ज करें',
    errMarketYardRequired: 'कृपया अपने मार्केट यार्ड या मंडी का नाम दर्ज करें',
    errShopAddressRequired: 'कृपया अपनी दुकान का पता दर्ज करें',

    otpHeading: 'एक-बार सत्यापन OTP',
    otpSubtitle: (phone) => `+91 ${phone} पर भेजा गया 6-अंकीय कोड दर्ज करें`,
    btnVerifyOtp: 'OTP सत्यापित करें और आगे बढ़ें',
    commodityHeading: 'आपके द्वारा व्यापार की जाने वाली फसलों को चुनें',
    commoditySubtitle: 'मंडी प्रांगण में आपके द्वारा बेचे जाने वाले उत्पादों को चुनें',
    btnCompleteSignup: 'मंडी साइन अप पूरा करें',
  },
  kn: {
    merchantSignUp: 'ವರ್ತಕರ ಸೈನ್ ಅಪ್',
    stepOf4: (current) => `ಹಂತ ${current} / 4`,
    heading: 'ನಿಮ್ಮ ಮಂಡಿ ವರ್ತಕರ ಖಾತೆಯನ್ನು ರಚಿಸಿ',
    subtitle: 'ಸುಲಭ ಹಂತ-ಹಂತದ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ ನಿಮ್ಮ ಮಂಡಿ ಅಂಗಡಿಯನ್ನು ನೋಂದಾಯಿಸಿ',
    step1Title: 'ವೈಯಕ್ತಿಕ ವಿವರಗಳು',
    step1Desc: 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಇಮೇಲ್ ನಮೂದಿಸಿ',
    step2Title: 'ಪಾಸ್‌ವರ್ಡ್',
    step2Desc: 'ನಿಮ್ಮ ಖಾತೆಗೆ ಸುರಕ್ಷಿತ ಲಾಗಿನ್ ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಸಿ',
    step3Title: 'ಅಂಗಡಿ ವಿವರಗಳು',
    step3Desc: 'ನಿಮ್ಮ ಅಂಗಡಿ/ಸಂಸ್ಥೆಯ ಹೆಸರು ಮತ್ತು ಸ್ಟಾಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ',
    step4Title: 'ಮಾರುಕಟ್ಟೆ ವಿವರಗಳು',
    step4Desc: 'ನಿಮ್ಮ ರಾಜ್ಯ, APMC ಮಾರುಕಟ್ಟೆ ಮತ್ತು ವಿಳಾಸವನ್ನು ಆಯ್ಕೆಮಾಡಿ',

    fullNameLabel: 'ಪೂರ್ಣ ಹೆಸರು (ಮಾಲೀಕರು / ವರ್ತಕರು) *',
    mobileLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (10 ಅಂಕೆಗಳು) *',
    emailLabel: 'ಇಮೇಲ್ ವಿಳಾಸ (ಐಚ್ಛಿಕ)',
    passwordLabel: 'ಲಾಗಿನ್ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ *',
    confirmPasswordLabel: 'ಖಚಿತಪಡಿಸಲು ಪಾಸ್‌ವರ್ಡ್ ಮರು ನಮೂದಿಸಿ *',
    shopNameLabel: 'ಅಂಗಡಿ / ಸಂಸ್ಥೆಯ ಹೆಸರು *',
    shopNumberLabel: 'ಅಂಗಡಿ / ಸ್ಟಾಲ್ ಸಂಖ್ಯೆ',
    stateLabel: 'ರಾಜ್ಯ *',
    marketYardLabel: 'ಮಾರುಕಟ್ಟೆ ಯಾರ್ಡ್ / ಮಂಡಿ ಹೆಸರು *',
    shopAddressLabel: 'ಅಂಗಡಿ / ಯಾರ್ಡ್ ಪೂರ್ಣ ವಿಳಾಸ *',

    fullNamePlaceholder: 'ಉದಾ: ರಮೇಶ್ ಕುಮಾರ್',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'ಉದಾ: ramesh@manditrader.com',
    passwordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಸಿ',
    confirmPasswordPlaceholder: 'ಅದೇ ಪಾಸ್‌ವರ್ಡ್ ಮರು ನಮೂದಿಸಿ',
    shopNamePlaceholder: 'ಉದಾ: ಶ್ರೀ ವೆಂಕಟೇಶ್ವರ ಟ್ರೇಡಿಂಗ್',
    shopNumberPlaceholder: 'ಉದಾ: ಸ್ಟಾಲ್ #27, ಗೇಟ್ 3',
    marketYardPlaceholder: 'ಉದಾ: ಸಗಟು ಮಾರುಕಟ್ಟೆ ಯಾರ್ಡ್',
    shopAddressPlaceholder: 'ಉದಾ: ಅಂಗಡಿ #1, ಗೇಟ್ 2, ಮಾರ್ಕೆಟ್ ಯಾರ್ಡ್',

    btnNext: 'ಮುಂದೆ',
    btnBack: 'ಹಿಂದೆ',
    btnGetOtp: 'ಒಂದು-ಬಾರಿಯ ಪರಿಶೀಲನೆ OTP ಪಡೆಯಿರಿ',
    alreadyHaveAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
    loginLink: 'ಲಾಗಿನ್ ಮಾಡಿ',

    errFullNameRequired: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    errFullNameNoNumbers: 'ಹೆಸರಿನಲ್ಲಿ ಸಂಖ್ಯೆಗಳು ಇರಬಾರದು',
    errPhoneRequired: 'ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (6, 7, 8, ಅಥವಾ 9 ರಿಂದ ಪ್ರಾರಂಭವಾಗಬೇಕು)',
    errPasswordMinLength: 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 4 ಅಕ್ಷರಗಳಿರಬೇಕು',
    errPasswordMismatch: 'ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ತಾಳೆಯಾಗುತ್ತಿಲ್ಲ!',
    errShopNameRequired: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಂಗಡಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    errMarketYardRequired: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮಂಡಿ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    errShopAddressRequired: 'ದಯವಿಟ್ಟು ಅಂಗಡಿ ವಿಳಾಸ ನಮೂದಿಸಿ',

    otpHeading: 'ಒಂದು-ಬಾರಿಯ ಪರಿಶೀಲನೆ OTP',
    otpSubtitle: (phone) => `+91 ${phone} ಗೆ ಕಳುಹಿಸಲಾದ 6-ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ`,
    btnVerifyOtp: 'OTP ಪರಿಶೀಲಿಸಿ & ಮುಂದುವರಿಯಿರಿ',
    commodityHeading: 'ನೀವು ವ್ಯಾಪಾರ ಮಾಡುವ ಬೆಳೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    commoditySubtitle: 'ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ನೀವು ಮಾರಾಟ ಮಾಡುವ ಉತ್ಪನ್ನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    btnCompleteSignup: 'ಮಂಡಿ ಸೈನ್ ಅಪ್ ಪೂರ್ಣಗೊಳಿಸಿ',
  },
  ta: {
    merchantSignUp: 'வியாபாரி பதிவு',
    stepOf4: (current) => `படி ${current} / 4`,
    heading: 'உங்கள் மண்டி வியாபாரி கணக்கை உருவாக்கவும்',
    subtitle: 'எளிய படிப்படியான முறையில் உங்கள் மண்டி கடையைப் பதிவு செய்யவும்',
    step1Title: 'தனிப்பட்ட விவரங்கள்',
    step1Desc: 'உங்கள் முழு பெயர், மொபைல் எண் மற்றும் மின்னஞ்சலை உள்ளிடவும்',
    step2Title: 'கடவுச்சொல்',
    step2Desc: 'உங்கள் கணக்கிற்கு பாதுகாப்பான கடவுச்சொல்லை அமைக்கவும்',
    step3Title: 'கடை விவரங்கள்',
    step3Desc: 'உங்கள் கடை/நிறுவன பெயர் மற்றும் கடை எண்ணை வழங்கவும்',
    step4Title: 'சந்தை விவரங்கள்',
    step4Desc: 'உங்கள் மாநிலம், APMC சந்தை மற்றும் முகவரியைத் தேர்ந்தெடுக்கவும்',

    fullNameLabel: 'முழு பெயர் (உரிமையாளர் / வியாபாரி) *',
    mobileLabel: 'மொபைல் எண் (10 இலக்கங்கள்) *',
    emailLabel: 'மின்னஞ்சல் முகவரி (விருப்பத்தேர்வு)',
    passwordLabel: 'கடவுச்சொல்லை உருவாக்கவும் *',
    confirmPasswordLabel: 'உறுதிப்படுத்த கடவுச்சொல்லை மீண்டும் உள்ளிடவும் *',
    shopNameLabel: 'கடை / நிறுவன பெயர் *',
    shopNumberLabel: 'கடை / ஸ்டால் எண்',
    stateLabel: 'மாநிலம் *',
    marketYardLabel: 'சந்தை கூடம் / மண்டி பெயர் *',
    shopAddressLabel: 'கடை / கூடத்தின் முழு முகவரி *',

    fullNamePlaceholder: 'எ.கா: ரமேஷ் குமார்',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'எ.கா: ramesh@manditrader.com',
    passwordPlaceholder: 'கடவுச்சொல்லை அமைக்கவும்',
    confirmPasswordPlaceholder: 'அதே கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
    shopNamePlaceholder: 'எ.கா: ஸ்ரீ வெங்கடேஸ்வரா டிரேடிங்',
    shopNumberPlaceholder: 'எ.கா: ஸ்டால் #27, கேட் 3',
    marketYardPlaceholder: 'எ.கா: மொத்த விற்பனை சந்தை',
    shopAddressPlaceholder: 'எ.கா: கடை #1, கேட் 2, சந்தை',

    btnNext: 'அடுத்து',
    btnBack: 'பின்னால்',
    btnGetOtp: 'ஒரு முறை சரிபார்ப்பு OTP பெறவும்',
    alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    loginLink: 'உள்நுழையவும்',

    errFullNameRequired: 'தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடவும்',
    errFullNameNoNumbers: 'பெயரில் எண்கள் இருக்கக்கூடாது',
    errPhoneRequired: 'செல்லுபடியாகும் 10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும் (6, 7, 8, அல்லது 9 இல் தொடங்க வேண்டும்)',
    errPasswordMinLength: 'கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும்',
    errPasswordMismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை!',
    errShopNameRequired: 'தயவுசெய்து உங்கள் கடை பெயரை உள்ளிடவும்',
    errMarketYardRequired: 'தயவுசெய்து சந்தை பெயரை உள்ளிடவும்',
    errShopAddressRequired: 'தயவுசெய்து கடை முகவரியை உள்ளிடவும்',

    otpHeading: 'ஒரு முறை சரிபார்ப்பு OTP',
    otpSubtitle: (phone) => `+91 ${phone} க்கு அனுப்பப்பட்ட 6 இலக்க குறியீட்டை உள்ளிடவும்`,
    btnVerifyOtp: 'OTP சரிபார்த்து தொடரவும்',
    commodityHeading: 'நீங்கள் வர்த்தகம் செய்யும் பயிர்களைத் தேர்ந்தெடுக்கவும்',
    commoditySubtitle: 'சந்தையில் நீங்கள் கையாளும பொருட்களைத் தேர்ந்தெடுக்கவும்',
    btnCompleteSignup: 'மண்டி பதிவை முடிக்கவும்',
  },
  mr: {
    merchantSignUp: 'व्यापारी नोंदणी',
    stepOf4: (current) => `टप्पा ${current} / 4`,
    heading: 'तुमचे मंडी व्यापारी खाते तयार करा',
    subtitle: 'सोप्या टप्प्याटप्प्याने तुमचे मंडी दुकान नोंदणीकृत करा',
    step1Title: 'वैयक्तिक तपशील',
    step1Desc: 'तुमचे पूर्ण नाव, मोबाईल नंबर आणि ईमेल प्रविष्ट करा',
    step2Title: 'पासवर्ड',
    step2Desc: 'तुमच्या खात्यासाठी सुरक्षित पासवर्ड सेट करा',
    step3Title: 'दुकानाचा तपशील',
    step3Desc: 'तुमच्या दुकानाचे/फर्मचे नाव आणि गाळा क्रमांक प्रविष्ट करा',
    step4Title: 'बाजार समिती तपशील',
    step4Desc: 'तुमचे राज्य, APMC बाजार समिती आणि पत्ता निवडा',

    fullNameLabel: 'पूर्ण नाव (मालक / व्यापारी) *',
    mobileLabel: 'मोबाईल नंबर (10 अंक) *',
    emailLabel: 'ईमेल पत्ता (ऐच्छिक)',
    passwordLabel: 'लॉगिन पासवर्ड तयार करा *',
    confirmPasswordLabel: 'खात्री करण्यासाठी पासवर्ड पुन्हा टाका *',
    shopNameLabel: 'दुकानाचा / फर्मचे नाव *',
    shopNumberLabel: 'दुकान / गाळा क्रमांक',
    stateLabel: 'राज्य *',
    marketYardLabel: 'बाजार समिती / मंडीचे नाव *',
    shopAddressLabel: 'दुकानाचा / यार्डचा पूर्ण पत्ता *',

    fullNamePlaceholder: 'उदा: रमेश कुमार',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'उदा: ramesh@manditrader.com',
    passwordPlaceholder: 'पासवर्ड सेट करा',
    confirmPasswordPlaceholder: 'तोच पासवर्ड पुन्हा टाका',
    shopNamePlaceholder: 'उदा: श्री व्यंकटेश ट्रेडिंग कं.',
    shopNumberPlaceholder: 'उदा: गाळा #27, गेट 3',
    marketYardPlaceholder: 'उदा: घाऊक बाजार समिती',
    shopAddressPlaceholder: 'उदा: दुकान #1, गेट 2, मार्केट यार्ड',

    btnNext: 'पुढे जा',
    btnBack: 'मागे जा',
    btnGetOtp: 'वन-टाईम पडताळणी OTP मिळवा',
    alreadyHaveAccount: 'आधीच खाते आहे का?',
    loginLink: 'लॉगिन करा',

    errFullNameRequired: 'कृपया तुमचे पूर्ण नाव टाका',
    errFullNameNoNumbers: 'नावात अंक असणार नाहीत',
    errPhoneRequired: 'वैध 10-अंकी भारतीय मोबाईल नंबर टाका (6, 7, 8, किंवा 9 ने सुरू होणारा)',
    errPasswordMinLength: 'पासवर्ड किमान 4 अक्षरांचा असावा',
    errPasswordMismatch: 'पासवर्ड जुळत नाहीत!',
    errShopNameRequired: 'कृपया तुमच्या दुकानाचे नाव टाका',
    errMarketYardRequired: 'कृपया बाजार समितीचे नाव टाका',
    errShopAddressRequired: 'कृपया दुकानाचा पत्ता टाका',

    otpHeading: 'वन-टाईम पडताळणी OTP',
    otpSubtitle: (phone) => `+91 ${phone} वर पाठवलेला 6-अंकी कोड टाका`,
    btnVerifyOtp: 'OTP पडताळा आणि पुढे जा',
    commodityHeading: 'तुम्ही व्यापार करत असलेला माल निवडा',
    commoditySubtitle: 'बाजार समितीत तुम्ही खरेदी-विक्री करणारी पिके निवडा',
    btnCompleteSignup: 'मंडी नोंदणी पूर्ण करा',
  },
  gu: {
    merchantSignUp: 'વેપારી સાઇન અપ',
    stepOf4: (current) => `પગલું ${current} / 4`,
    heading: 'તમારું મંડી વેપારી ખાતું બનાવો',
    subtitle: 'સરળ પગલાં દ્વારા તમારી મંડી દુકાનની નોંધણી કરો',
    step1Title: 'અંગત વિગતો',
    step1Desc: 'તમારું પૂરૂં નામ, મોબાઇલ નંબર અને ઇમેઇલ દાખલ કરો',
    step2Title: 'પાસવર્ડ',
    step2Desc: 'તમારા ખાતા માટે સુરક્ષિત પાસવર્ડ સેટ કરો',
    step3Title: 'દુકાનની વિગતો',
    step3Desc: 'તમારી દુકાન/ફર્મનું નામ અને સ્ટોલ નંબર આપો',
    step4Title: 'માર્કેટ વિગતો',
    step4Desc: 'તમારું રાજ્ય, APMC માર્કેટ યાર્ડ અને સરનામું પસંદ કરો',

    fullNameLabel: 'પૂરું નામ (માલિક / વેપારી) *',
    mobileLabel: 'મોબાઇલ નંબર (10 અંક) *',
    emailLabel: 'ઇમેઇલ સરનામું (વૈકલ્પિક)',
    passwordLabel: 'લોગિન પાસવર્ડ બનાવો *',
    confirmPasswordLabel: 'પાસવર્ડ ફરીથી દાખલ કરો *',
    shopNameLabel: 'દુકાન / ફર્મનું નામ *',
    shopNumberLabel: 'દુકાન / સ્ટોલ નંબર',
    stateLabel: 'રાજ્ય *',
    marketYardLabel: 'માર્કેટ યાર્ડ / મંડીનું નામ *',
    shopAddressLabel: 'દુકાન / યાર્ડનું પૂરું સરનામું *',

    fullNamePlaceholder: 'દા.ત. રમેશ કુમાર',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'દા.ત. ramesh@manditrader.com',
    passwordPlaceholder: 'પાસવર્ડ સેટ કરો',
    confirmPasswordPlaceholder: 'એ જ પાસવર્ડ ફરીથી લખો',
    shopNamePlaceholder: 'દા.ત. શ્રી વેંકટેશ્વરા ટ્રેડિંગ કો.',
    shopNumberPlaceholder: 'દા.ત. સ્ટોલ #27, ગેટ 3',
    marketYardPlaceholder: 'દા.ત. હોલસેલ માર્કેટ યાર્ડ',
    shopAddressPlaceholder: 'દા.ત. દુકાન #1, ગેટ 2, માર્કેટ યાર્ડ',

    btnNext: 'આગળ વધો',
    btnBack: 'પાછા જાઓ',
    btnGetOtp: 'વન-ટાઇમ ચકાસણી OTP મેળવો',
    alreadyHaveAccount: 'પહેલેથી ખાતું છે?',
    loginLink: 'લોગિન કરો',

    errFullNameRequired: 'કૃપા કરીને તમારું પૂરું નામ લખો',
    errFullNameNoNumbers: 'નામમાં આંકડા હોઈ શકે નહીં',
    errPhoneRequired: 'માન્ય 10-અંકનો ભારતીય મોબાઇલ નંબર લખો (6, 7, 8, અથવા 9 થી શરૂ થવો જોઈએ)',
    errPasswordMinLength: 'પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરોનો હોવો જોઈએ',
    errPasswordMismatch: 'પાસવર્ડ મેચ થતા નથી!',
    errShopNameRequired: 'કૃપા કરીને તમારી દુકાનનું નામ લખો',
    errMarketYardRequired: 'કૃપા કરીને માર્કેટ યાર્ડનું નામ લખો',
    errShopAddressRequired: 'કૃપા કરીને દુકાનનું સરનામું લખો',

    otpHeading: 'વન-ટાઇમ ચકાસણી OTP',
    otpSubtitle: (phone) => `+91 ${phone} પર મોકલેલ 6-અંકનો કોડ લખો`,
    btnVerifyOtp: 'OTP ચકાસો અને આગળ વધો',
    commodityHeading: 'તમે જે પાકનો વેપાર કરો છો તે પસંદ કરો',
    commoditySubtitle: 'માર્કેટ યાર્ડમાં તમે વેચતા પાકો પસંદ કરો',
    btnCompleteSignup: 'મંડી સાઇન અપ પૂર્ણ કરો',
  },
  bn: {
    merchantSignUp: 'বণিক সাইন আপ',
    stepOf4: (current) => `ধাপ ${current} / 4`,
    heading: 'আপনার মান্ডি ব্যবসায়ী অ্যাকাউন্ট তৈরি করুন',
    subtitle: 'সহজ ধাপে ধাপে আপনার পাইকারি মান্ডি দোকান নিবন্ধন করুন',
    step1Title: 'ব্যক্তিগত বিবরণ',
    step1Desc: 'আপনার পুরো নাম, মোবাইল নম্বর এবং ইমেল দিন',
    step2Title: 'পাসওয়ার্ড',
    step2Desc: 'আপনার অ্যাকাউন্টের জন্য একটি সুরক্ষিত পাসওয়ার্ড সেট করুন',
    step3Title: 'দোকানের বিবরণ',
    step3Desc: 'আপনার দোকান/ফার্মের নাম এবং স্টল নম্বর দিন',
    step4Title: 'বাজারের বিবরণ',
    step4Desc: 'আপনার রাজ্য, APMC বাজার ইয়ার্ড এবং ঠিকানা নির্বাচন করুন',

    fullNameLabel: 'পুরো নাম (মালিক / ব্যবসায়ী) *',
    mobileLabel: 'মোবাইল নম্বর (১০ ডিজিট) *',
    emailLabel: 'ইমেল ঠিকানা (ঐচ্ছিক)',
    passwordLabel: 'লগইন পাসওয়ার্ড তৈরি করুন *',
    confirmPasswordLabel: 'পাসওয়ার্ড নিশ্চিত করতে পুনরায় লিখুন *',
    shopNameLabel: 'দোকান / ফার্মের নাম *',
    shopNumberLabel: 'দোকান / স্টল নম্বর',
    stateLabel: 'রাজ্য *',
    marketYardLabel: 'মার্কেট ইয়ার্ড / মান্ডির নাম *',
    shopAddressLabel: 'দোকান / ইয়ার্ডের সম্পূর্ণ ঠিকানা *',

    fullNamePlaceholder: 'যেমন: রমেশ কুমার',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'যেমন: ramesh@manditrader.com',
    passwordPlaceholder: 'পাসওয়ার্ড সেট করুন',
    confirmPasswordPlaceholder: 'একই পাসওয়ার্ড পুনরায় লিখুন',
    shopNamePlaceholder: 'যেমন: শ্রী ভেঙ্কটেশ্বর ট্রেডিং কোং',
    shopNumberPlaceholder: 'যেমন: স্টল #২৭, গেট ৩',
    marketYardPlaceholder: 'যেমন: পাইকারি মার্কেট ইয়ার্ড',
    shopAddressPlaceholder: 'যেমন: দোকান #১, গেট ২, মার্কেট ইয়ার্ড',

    btnNext: 'পরবর্তী',
    btnBack: 'পিছনে',
    btnGetOtp: 'ওয়ান-টাইম ভেরিফিকেশন OTP পান',
    alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    loginLink: 'লগইন করুন',

    errFullNameRequired: 'দয়া করে আপনার পুরো নাম লিখুন',
    errFullNameNoNumbers: 'নামে কোনো সংখ্যা থাকতে পারবে না',
    errPhoneRequired: 'সঠিক ১০ সংখ্যার ভারতীয় মোবাইল নম্বর লিখুন (৬, ৭, ৮, বা ৯ দিয়ে শুরু হতে হবে)',
    errPasswordMinLength: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে',
    errPasswordMismatch: 'পাসওয়ার্ড মিলছে না!',
    errShopNameRequired: 'দয়া করে আপনার দোকানের নাম লিখুন',
    errMarketYardRequired: 'দয়া করে বাজারের নাম লিখুন',
    errShopAddressRequired: 'দয়া করে দোকানের ঠিকানা লিখুন',

    otpHeading: 'ওয়ান-টাইম ভেরিফিকেশন OTP',
    otpSubtitle: (phone) => `+91 ${phone} এ পাঠানো ৬ সংখ্যার কোড লিখুন`,
    btnVerifyOtp: 'OTP যাচাই করুন এবং এগিয়ে যান',
    commodityHeading: 'আপনার ব্যবসার পণ্যসমূহ নির্বাচন করুন',
    commoditySubtitle: 'বাজারে আপনি যে ফসল বেচাকেনা করেন তা বাছুন',
    btnCompleteSignup: 'মান্ডি সাইন আপ সম্পন্ন করুন',
  },
  pa: {
    merchantSignUp: 'ਵਪਾਰੀ ਸਾਈਨ ਅੱਪ',
    stepOf4: (current) => `ਕਦਮ ${current} / 4`,
    heading: 'ਆਪਣਾ ਮੰਡੀ ਵਪਾਰੀ ਖਾਤਾ ਬਣਾਓ',
    subtitle: 'ਆਪਣੀ ਮੰਡੀ ਦੀ ਦੁਕਾਨ ਰਜਿਸਟਰ ਕਰੋ',
    step1Title: 'ਨਿੱਜੀ ਵੇਰਵੇ',
    step1Desc: 'ਆਪਣਾ ਪੂਰਾ ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ ਈਮੇਲ ਦਰਜ ਕਰੋ',
    step2Title: 'ਪਾਸਵਰਡ',
    step2Desc: 'ਲਾਗਇਨ ਪਾਸਵਰਡ ਸੈੱਟ ਕਰੋ',
    step3Title: 'ਦੁਕਾਨ ਦੇ ਵੇਰਵੇ',
    step3Desc: 'ਆਪਣੀ ਦੁਕਾਨ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    step4Title: 'ਮੰਡੀ ਦੇ ਵੇਰਵੇ',
    step4Desc: 'ਆਪਣੀ ਮੰਡੀ ਅਤੇ ਪਤਾ ਚੁਣੋ',

    fullNameLabel: 'ਪੂਰਾ ਨਾਮ (ਮਾਲਕ / ਵਪਾਰੀ) *',
    mobileLabel: 'ਮੋਬਾਈਲ ਨੰਬਰ (10 ਅੰਕ) *',
    emailLabel: 'ਈਮੇਲ ਪਤਾ (ਵਿਕਲਪਿਕ)',
    passwordLabel: 'ਲਾਗਇਨ ਪਾਸਵਰਡ ਬਣਾਓ *',
    confirmPasswordLabel: 'ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ *',
    shopNameLabel: 'ਦੁਕਾਨ / ਫਰਮ ਦਾ ਨਾਮ *',
    shopNumberLabel: 'ਦੁਕਾਨ / ਸਟਾਲ ਨੰਬਰ',
    stateLabel: 'ਰਾਜ *',
    marketYardLabel: 'ਮਾਰਕੀਟ ਯਾਰਡ / ਮੰਡੀ ਦਾ ਨਾਮ *',
    shopAddressLabel: 'ਦੁਕਾਨ ਦਾ ਪੂਰਾ ਪਤਾ *',

    fullNamePlaceholder: 'ਜਿਵੇਂ: ਰਮੇਸ਼ ਕੁਮਾਰ',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'ਜਿਵੇਂ: ramesh@manditrader.com',
    passwordPlaceholder: 'ਪਾਸਵਰਡ ਸੈੱਟ ਕਰੋ',
    confirmPasswordPlaceholder: 'ਉਹੀ ਪਾਸਵਰਡ ਦੁਬਾਰਾ ਦਰਜ ਕਰੋ',
    shopNamePlaceholder: 'ਜਿਵੇਂ: ਸ਼੍ਰੀ ਵੈਂਕਟੇਸ਼ਵਰਾ ਟ੍ਰੇਡਿੰਗ',
    shopNumberPlaceholder: 'ਜਿਵੇਂ: ਸਟਾਲ #27, ਗੇਟ 3',
    marketYardPlaceholder: 'ਜਿਵੇਂ: ਥੋਕ ਮੰਡੀ',
    shopAddressPlaceholder: 'ਜਿਵੇਂ: ਦੁਕਾਨ #1, ਮੰਡੀ ਯਾਰਡ',

    btnNext: 'ਅੱਗੇ',
    btnBack: 'ਪਿੱਛੇ',
    btnGetOtp: 'ਇੱਕ-ਵਾਰੀ ਜਾਂਚ OTP ਪ੍ਰਾਪਤ ਕਰੋ',
    alreadyHaveAccount: 'ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?',
    loginLink: 'ਲਾਗਇਨ ਕਰੋ',

    errFullNameRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    errFullNameNoNumbers: 'ਨਾਮ ਵਿੱਚ ਅੰਕ ਨਹੀਂ ਹੋ ਸਕਦੇ',
    errPhoneRequired: 'ਮਾਨਤਾ ਪ੍ਰਾਪਤ 10-ਅੰਕਾਂ ਦਾ ਭਾਰਤੀ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ (6, 7, 8, ਜਾਂ 9 ਤੋਂ ਸ਼ੁਰੂ)',
    errPasswordMinLength: 'ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 4 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
    errPasswordMismatch: 'ਪਾਸਵਰਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ!',
    errShopNameRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਦੁਕਾਨ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    errMarketYardRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਮੰਡੀ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    errShopAddressRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਦੁਕਾਨ ਦਾ ਪਤਾ ਦਰਜ ਕਰੋ',

    otpHeading: 'ਇੱਕ-ਵਾਰੀ ਜਾਂਚ OTP',
    otpSubtitle: (phone) => `+91 ${phone} 'ਤੇ ਭੇਜਿਆ 6-ਅੰਕੀ ਕੋਡ ਦਰਜ ਕਰੋ`,
    btnVerifyOtp: 'OTP ਦੀ ਜਾਂਚ ਕਰੋ & ਅੱਗੇ ਵਧੋ',
    commodityHeading: 'ਵਪਾਰ ਦੀਆਂ ਫਸਲਾਂ ਚੁਣੋ',
    commoditySubtitle: 'ਮੰਡੀ ਵਿੱਚ ਵੇਚੀਆਂ ਜਾਣ ਵਾਲੀਆਂ ਫਸਲਾਂ ਚੁਣੋ',
    btnCompleteSignup: 'ਮੰਡੀ ਸਾਈਨ ਅੱਪ ਪੂਰਾ ਕਰੋ',
  },
  ml: {
    merchantSignUp: 'വ്യാപാരി സൈൻ അപ്പ്',
    stepOf4: (current) => `ഘട്ടം ${current} / 4`,
    heading: 'മണ്ടി വ്യാപാരി അക്കൗണ്ട് ഉണ്ടാക്കുക',
    subtitle: 'നിങ്ങളുടെ മണ്ടി കട രജിസ്റ്റർ ചെയ്യുക',
    step1Title: 'വ്യക്തിഗത വിവരങ്ങൾ',
    step1Desc: 'പേരും മൊബൈൽ നമ്പറും നൽകുക',
    step2Title: 'പാസ്‌വേഡ്',
    step2Desc: 'ലോഗിൻ പാസ്‌വേഡ് സെറ്റ് ചെയ്യുക',
    step3Title: 'കടയുടെ വിവരങ്ങൾ',
    step3Desc: 'കടയുടെ പേര് നൽകുക',
    step4Title: 'മാർക്കറ്റ് വിവരങ്ങൾ',
    step4Desc: 'മണ്ടിയും വിലാസവും തിരഞ്ഞെടുക്കുക',

    fullNameLabel: 'പൂർണ്ണ പേര് (ഉടമ / വ്യാപാരി) *',
    mobileLabel: 'മൊബൈൽ നമ്പർ (10 അക്കങ്ങൾ) *',
    emailLabel: 'ഇമെയിൽ വിലാസം (ഓപ്ഷണൽ)',
    passwordLabel: 'ലോഗിൻ പാസ്‌വേഡ് ഉണ്ടാക്കുക *',
    confirmPasswordLabel: 'പാസ്‌വേഡ് ഉറപ്പാക്കുക *',
    shopNameLabel: 'കട / സ്ഥാപനത്തിന്റെ പേര് *',
    shopNumberLabel: 'കട / സ്റ്റാൾ നമ്പർ',
    stateLabel: 'സംസ്ഥാനം *',
    marketYardLabel: 'മാർക്കറ്റ് യാർഡ് / മണ്ടിയുടെ പേര് *',
    shopAddressLabel: 'കടയുടെ പൂർണ്ണ വിലാസം *',

    fullNamePlaceholder: 'ഉദാ: രമേഷ് കുമാർ',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'ഉദാ: ramesh@manditrader.com',
    passwordPlaceholder: 'പാസ്‌വേഡ് നൽകുക',
    confirmPasswordPlaceholder: 'അതേ പാസ്‌വേഡ് വീണ്ടും നൽകുക',
    shopNamePlaceholder: 'ഉദാ: ശ്രീ വെങ്കടേശ്വര ട്രേഡിംഗ്',
    shopNumberPlaceholder: 'ഉദാ: സ്റ്റാൾ #27, ഗേറ്റ് 3',
    marketYardPlaceholder: 'ഉദാ: ഹോൾസെയിൽ മാർക്കറ്റ് യാർഡ്',
    shopAddressPlaceholder: 'ഉദാ: കട #1, മാർക്കറ്റ് യാർഡ്',

    btnNext: 'അടുത്തത്',
    btnBack: 'പിന്നോട്ട്',
    btnGetOtp: 'ഒറ്റത്തവണ പരിശോധന OTP നേടുക',
    alreadyHaveAccount: 'അക്കൗണ്ട് ഉണ്ടോ?',
    loginLink: 'ലോഗിൻ ചെയ്യുക',

    errFullNameRequired: 'ദയവായി നിങ്ങളുടെ പൂർണ്ണ പേര് നൽകുക',
    errFullNameNoNumbers: 'പേരിൽ അക്കങ്ങൾ പാടില്ല',
    errPhoneRequired: 'സാധുവായ 10 അക്ക ഇന്ത്യൻ മൊബൈൽ നമ്പർ നൽകുക (6, 7, 8, അല്ലെങ്കിൽ 9 ൽ ആരംഭിക്കണം)',
    errPasswordMinLength: 'പാസ്‌വേഡ് കുറഞ്ഞത് 4 അക്ഷരങ്ങൾ വേണം',
    errPasswordMismatch: 'പാസ്‌വേഡുകൾ ചേരുന്നില്ല!',
    errShopNameRequired: 'ദയവായി കടയുടെ പേര് നൽകുക',
    errMarketYardRequired: 'ദയവായി മണ്ടിയുടെ പേര് നൽകുക',
    errShopAddressRequired: 'ദയവായി വിലാസം നൽകുക',

    otpHeading: 'ഒറ്റത്തവണ പരിശോധന OTP',
    otpSubtitle: (phone) => `+91 ${phone} ലേക്ക് അയച്ച 6 അക്ക കോഡ് നൽകുക`,
    btnVerifyOtp: 'OTP പരിശോധിച്ച് തുടരുക',
    commodityHeading: 'വ്യാപാരം ചെയ്യുന്ന ഉൽപ്പന്നങ്ങൾ തിരഞ്ഞെടുക്കുക',
    commoditySubtitle: 'മാർക്കറ്റിൽ കൈകാര്യം ചെയ്യുന്ന വിളകൾ തിരഞ്ഞെടുക്കുക',
    btnCompleteSignup: 'മണ്ടി സൈൻ അപ്പ് പൂർത്തിയാക്കുക',
  },
  or: {
    merchantSignUp: 'ବ୍ୟବସାୟୀ ସାଇନ୍ ଅପ୍',
    stepOf4: (current) => `ପଦକ୍ଷେପ ${current} / 4`,
    heading: 'ଆପଣଙ୍କ ମଣ୍ଡି ବ୍ୟବସାୟୀ ଆକାଉଣ୍ଟ୍ ସୃଷ୍ଟି କରନ୍ତୁ',
    subtitle: 'ଆପଣଙ୍କ ମଣ୍ଡି ଦୋକାନ ପଞ୍ଜିକରଣ କରନ୍ତୁ',
    step1Title: 'ବ୍ୟକ୍ତିଗତ ବିବରଣୀ',
    step1Desc: 'ପୂରା ନାମ ଓ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ',
    step2Title: 'ପାସୱାର୍ଡ',
    step2Desc: 'ଲଗଇନ୍ ପାସୱାର୍ଡ ସେଟ୍ କରନ୍ତୁ',
    step3Title: 'ଦୋକାନ ବିବରଣୀ',
    step3Desc: 'ଦୋକାନର ନାମ ଦିଅନ୍ତୁ',
    step4Title: 'ମାର୍କେଟ ବିବରଣୀ',
    step4Desc: 'ମଣ୍ଡି ଓ ଠିକଣା ବାଛନ୍ତୁ',

    fullNameLabel: 'ପୂରା ନାମ (ମାଲିକ / ବ୍ୟବସାୟୀ) *',
    mobileLabel: 'ମୋବାଇଲ୍ ନମ୍ବର (10 ଅଙ୍କ) *',
    emailLabel: 'ଇମେଲ୍ ଠିକଣା (ବିକଳ୍ପ)',
    passwordLabel: 'ଲଗଇନ୍ ପାସୱାର୍ଡ ତିଆରି କରନ୍ତୁ *',
    confirmPasswordLabel: 'ପାସୱାର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ *',
    shopNameLabel: 'ଦୋକାନ / ଫାର୍ମର ନାମ *',
    shopNumberLabel: 'ଦୋକାନ / ଷ୍ଟଲ୍ ନମ୍ବର',
    stateLabel: 'ରାଜ୍ୟ *',
    marketYardLabel: 'ମାର୍କେଟ ୟାର୍ଡ / ମଣ୍ଡି ନାମ *',
    shopAddressLabel: 'ଦୋକାନର ସମ୍ପୂର୍ଣ୍ଣ ଠିକଣା *',

    fullNamePlaceholder: 'ଯଥା: ରମେଶ କୁମାର',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'ଯଥା: ramesh@manditrader.com',
    passwordPlaceholder: 'ପାସୱାର୍ଡ ଦିଅନ୍ତୁ',
    confirmPasswordPlaceholder: 'ସେହି ପାସୱାର୍ଡ ପୁଣି ଲେଖନ୍ତୁ',
    shopNamePlaceholder: 'ଯଥା: ଶ୍ରୀ ଭେଙ୍କଟେଶ୍ୱର ଟ୍ରେଡିଂ',
    shopNumberPlaceholder: 'ଯଥା: ଷ୍ଟଲ୍ #27, ଗେଟ୍ 3',
    marketYardPlaceholder: 'ଯଥା: ହୋଲସେଲ ମାର୍କେଟ ୟାର୍ଡ',
    shopAddressPlaceholder: 'ଯଥା: ଦୋକାନ #1, ମାର୍କେଟ ୟାର୍ଡ',

    btnNext: 'ପରବର୍ତ୍ତୀ',
    btnBack: 'ପଛକୁ',
    btnGetOtp: 'ୱାନ-ଟାଇମ୍ ଯାଞ୍ଚ OTP ପାଆନ୍ତୁ',
    alreadyHaveAccount: 'ପୂର୍ବରୁ ଆକାଉଣ୍ଟ୍ ଅଛି?',
    loginLink: 'ଲଗଇନ୍ କରନ୍ତୁ',

    errFullNameRequired: 'ଦୟାକରି ଆପଣଙ୍କ ପୂରା ନାମ ଲେଖନ୍ତୁ',
    errFullNameNoNumbers: 'ନାମରେ କୌଣସି ଅଙ୍କ ରହିପାରିବ ନାହିଁ',
    errPhoneRequired: 'ବୈଧ 10-ଅଙ୍କ ବିଶିଷ୍ଟ ଭାରତୀୟ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ (6, 7, 8, କିମ୍ବା 9 ରୁ ଆରମ୍ଭ)',
    errPasswordMinLength: 'ପାସୱାର୍ଡ ଅତି କମରେ 4 ଅକ୍ଷର ହେବା ଆବଶ୍ୟକ',
    errPasswordMismatch: 'ପାସୱାର୍ଡ ମେଳ ଖାଉନାହିଁ!',
    errShopNameRequired: 'ଦୟାକରି ଦୋକାନର ନାମ ଦିଅନ୍ତୁ',
    errMarketYardRequired: 'ଦୟାକରି ମଣ୍ଡିର ନାମ ଦିଅନ୍ତୁ',
    errShopAddressRequired: 'ଦୟାକରି ଠିକଣା ଦିଅନ୍ତୁ',

    otpHeading: 'ୱାନ-ଟାଇମ୍ ଯାଞ୍ଚ OTP',
    otpSubtitle: (phone) => `+91 ${phone} କୁ ପଠାଯାଇଥିବା 6 ਅଙ୍କର କୋଡ୍ ଦିଅନ୍ତୁ`,
    btnVerifyOtp: 'OTP ଯାଞ୍ଚ କରନ୍ତୁ & ଆଗକୁ ବଢନ୍ତୁ',
    commodityHeading: 'ବ୍ୟବସାୟ କରୁଥିବା ଫସଲ ବାଛନ୍ତୁ',
    commoditySubtitle: 'ମଣ୍ଡିରେ ବିକ୍ରି ହେଉଥିବା ଜିନିଷ ବାଛନ୍ତୁ',
    btnCompleteSignup: 'ମଣ୍ଡି ସାଇନ୍ ଅପ୍ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ',
  },
  as: {
    merchantSignUp: 'ব্যৱসায়ী ছাইন আপ',
    stepOf4: (current) => `পদক্ষেপ ${current} / 4`,
    heading: 'আপোনাৰ মাণ্ডি ব্যৱসায়ী একাউন্ট সৃষ্টি কৰক',
    subtitle: 'আপোনাৰ মাণ্ডি দোকান পঞ্জীয়ন কৰক',
    step1Title: 'ব্যক্তিগত বিৱৰণ',
    step1Desc: 'সম্পূৰ্ণ নাম আৰু মোবাইল নম্বৰ দিয়ক',
    step2Title: 'পাছৱৰ্ড',
    step2Desc: 'লগইন পাছৱৰ্ড ছেট কৰক',
    step3Title: 'দোকানৰ বিৱৰণ',
    step3Desc: 'দোকানৰ নাম দিয়ক',
    step4Title: 'বজাৰৰ বিৱৰণ',
    step4Desc: 'মাণ্ডি আৰু ঠিকানা বাছনি কৰক',

    fullNameLabel: 'সম্পূৰ্ণ নাম (মালিক / ব্যৱসায়ী) *',
    mobileLabel: 'মোবাইল নম্বৰ (১০ টা অংক) *',
    emailLabel: 'ইমেইল ঠিকনা (ঐচ্ছিক)',
    passwordLabel: 'লগইন পাছৱৰ্ড সৃষ্টি কৰক *',
    confirmPasswordLabel: 'পাছৱৰ্ড নিশ্চিত কৰক *',
    shopNameLabel: 'দোকান / ফাৰ্মৰ নাম *',
    shopNumberLabel: 'দোকান / ষ্টল নম্বৰ',
    stateLabel: 'ৰাজ্য *',
    marketYardLabel: 'মাৰ্কেট ইয়াৰ্ড / মাণ্ডিৰ নাম *',
    shopAddressLabel: 'দোকানৰ সম্পূৰ্ণ ঠিকনা *',

    fullNamePlaceholder: 'যেনে: ৰমেশ কুমাৰ',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'যেনে: ramesh@manditrader.com',
    passwordPlaceholder: 'পাছৱৰ্ড দিয়ক',
    confirmPasswordPlaceholder: 'একে পাছৱৰ্ড আকৌ লিখক',
    shopNamePlaceholder: 'যেনে: শ্ৰী ভেঙ্কটেশ্বৰ ট্ৰেডিং',
    shopNumberPlaceholder: 'যেনে: ষ্টল #২৭, গেট ৩',
    marketYardPlaceholder: 'যেনে: পাইকাৰী মাৰ্কেট ইয়াৰ্ড',
    shopAddressPlaceholder: 'যেনে: দোকান #১, মাৰ্কেট ইয়াৰ্ড',

    btnNext: 'পৰৱৰ্তী',
    btnBack: 'পাছলৈ',
    btnGetOtp: 'ৱান-টাইম সত্যাপন OTP পাওক',
    alreadyHaveAccount: 'আগতে একাউন্ট আছে?',
    loginLink: 'লগইন কৰক',

    errFullNameRequired: 'অনুগ্ৰহ কৰি আপোনাৰ সম্পূৰ্ণ নাম লিখক',
    errFullNameNoNumbers: 'নামত কোনো অংক থাকিব নোৱাৰে',
    errPhoneRequired: 'বৈধ ১০ অংকৰ ভাৰতীয় মোবাইল নম্বৰ দিয়ক (৬, ৭, ৮, বা ৯ ৰে আৰম্ভ)',
    errPasswordMinLength: 'পাছৱৰ্ড কমেও ৪ টা আখৰৰ হ’ব লাগিব',
    errPasswordMismatch: 'পাছৱৰ্ড মিলা নাই!',
    errShopNameRequired: 'অনুগ্ৰহ কৰি দোকানৰ নাম দিয়ক',
    errMarketYardRequired: 'অনুগ্ৰহ কৰি মাণ্ডিৰ নাম দিয়ক',
    errShopAddressRequired: 'অনুগ্ৰহ কৰি ঠিকনা দিয়ক',

    otpHeading: 'ৱান-টাইম সত্যাপন OTP',
    otpSubtitle: (phone) => `+91 ${phone} লৈ প্ৰেৰণ কৰা ৬ অংকৰ ক’ড দিয়ক`,
    btnVerifyOtp: 'OTP সত্যাপন কৰক & আগবাঢ়ক',
    commodityHeading: 'ব্যৱসায় কৰা শস্য বাছনি কৰক',
    commoditySubtitle: 'বজাৰত বিক্ৰী কৰা সামগ্ৰী বাছক',
    btnCompleteSignup: 'মাণ্ডি ছাইন আপ সম্পূৰ্ণ কৰক',
  },
  ur: {
    merchantSignUp: 'تاجر سائن اپ',
    stepOf4: (current) => `مرحلہ ${current} / 4`,
    heading: 'اپنا منڈی مرچنٹ اکاؤنٹ بنائیں',
    subtitle: 'اپنی منڈی کی دکان رجسٹر کریں',
    step1Title: 'ذاتی تفصیلات',
    step1Desc: 'اپنا پورا نام اور موبائل نمبر درج کریں',
    step2Title: 'پاس ورڈ',
    step2Desc: 'لاگ ان پاس ورڈ سیٹ کریں',
    step3Title: 'دکان کی تفصیلات',
    step3Desc: 'اپنی دکان کا نام درج کریں',
    step4Title: 'منڈی کی تفصیلات',
    step4Desc: 'اپنی منڈی اور پتہ منتخب کریں',

    fullNameLabel: 'پورا نام (مالک / تاجر) *',
    mobileLabel: 'موبائل نمبر (10 ہندسے) *',
    emailLabel: 'ای میل پتہ (اختیاری)',
    passwordLabel: 'لاگ ان پاس ورڈ بنائیں *',
    confirmPasswordLabel: 'پاس ورڈ کی تصدیق کریں *',
    shopNameLabel: 'دکان / فرم کا نام *',
    shopNumberLabel: 'دکان / اسٹال نمبر',
    stateLabel: 'ریاست *',
    marketYardLabel: 'مارکیٹ یارڈ / منڈی کا نام *',
    shopAddressLabel: 'دکان کا مکمل پتہ *',

    fullNamePlaceholder: 'مثلاً: رمیش کمار',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'مثلاً: ramesh@manditrader.com',
    passwordPlaceholder: 'پاس ورڈ درج کریں',
    confirmPasswordPlaceholder: 'وہی پاس ورڈ دوبارہ درج کریں',
    shopNamePlaceholder: 'مثلاً: شری وینکٹیشور ٹریڈنگ',
    shopNumberPlaceholder: 'مثلاً: اسٹال #27، گیٹ 3',
    marketYardPlaceholder: 'مثلاً: ہول سیل مارکیٹ یارڈ',
    shopAddressPlaceholder: 'مثلاً: دکان #1، مارکیٹ یارڈ',

    btnNext: 'آگے',
    btnBack: 'پیچھے',
    btnGetOtp: 'ون ٹائم تصدیقی OTP حاصل کریں',
    alreadyHaveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    loginLink: 'لاگ ان کریں',

    errFullNameRequired: 'برائے مہربانی اپنا پورا نام درج کریں',
    errFullNameNoNumbers: 'نام میں ہندسے نہیں ہو سکتے',
    errPhoneRequired: 'معتبر 10 ہندسوں کا بھارتی موبائل نمبر درج کریں (6، 7، 8، یا 9 سے شروع)',
    errPasswordMinLength: 'پاس ورڈ کم از کم 4 حروف کا ہونا چاہیے',
    errPasswordMismatch: 'پاس ورڈ مطابقت نہیں رکھتے!',
    errShopNameRequired: 'برائے مہربانی اپنی دکان کا نام درج کریں',
    errMarketYardRequired: 'برائے مہربانی منڈی کا نام درج کریں',
    errShopAddressRequired: 'برائے مہربانی پتہ درج کریں',

    otpHeading: 'ون ٹائم تصدیقی OTP',
    otpSubtitle: (phone) => `+91 ${phone} پر بھیجا گیا 6 ہندسوں کا کوڈ درج کریں`,
    btnVerifyOtp: 'OTP کی تصدیق کریں & آگے بڑھیں',
    commodityHeading: 'تجارت کی اجناس منتخب کریں',
    commoditySubtitle: 'منڈی میں فروخت ہونے والی فصلیں منتخب کریں',
    btnCompleteSignup: 'منڈی سائن اپ مکمل کریں',
  },
  mai: {
    merchantSignUp: 'व्यापारी साइन अप',
    stepOf4: (current) => `चरण ${current} / 4`,
    heading: 'अपन मंडी व्यापारी खाता बनाबू',
    subtitle: 'अपन थोक मंडी दुकान पंजीकृत करू',
    step1Title: 'व्यक्तिगत विवरण',
    step1Desc: 'अपन पूरा नाम आ मोबाइल नंबर दर्ज करू',
    step2Title: 'पासवर्ड',
    step2Desc: 'सुरक्षित पासवर्ड सेट करू',
    step3Title: 'दुकान विवरण',
    step3Desc: 'दुकानक नाम दर्ज करू',
    step4Title: 'मंडी विवरण',
    step4Desc: 'अपन राज्य आ मंडी चुनू',

    fullNameLabel: 'पूरा नाम (मालिक / व्यापारी) *',
    mobileLabel: 'मोबाइल नंबर (10 अंक) *',
    emailLabel: 'ईमेल पता (वैकल्पिक)',
    passwordLabel: 'लॉगिन पासवर्ड बनाबू *',
    confirmPasswordLabel: 'पासवर्ड पुनः दर्ज करू *',
    shopNameLabel: 'दुकान / फर्मक नाम *',
    shopNumberLabel: 'दुकान / स्टॉल संख्या',
    stateLabel: 'राज्य *',
    marketYardLabel: 'मार्केट यार्ड / मंडीक नाम *',
    shopAddressLabel: 'दुकानक पूरा पता *',

    fullNamePlaceholder: 'जैसे: रमेश कुमार',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'जैसे: ramesh@manditrader.com',
    passwordPlaceholder: 'पासवर्ड बनाबू',
    confirmPasswordPlaceholder: 'वही पासवर्ड दोबारा दर्ज करू',
    shopNamePlaceholder: 'जैसे: श्री वेंकटेश्वर ट्रेडिंग',
    shopNumberPlaceholder: 'जैसे: स्टॉल #27, गेट 3',
    marketYardPlaceholder: 'जैसे: थोक मंडी प्रांगण',
    shopAddressPlaceholder: 'जैसे: दुकान #1, मंडी प्रांगण',

    btnNext: 'आगे बढ़ू',
    btnBack: 'पाछा जाबू',
    btnGetOtp: 'एक-बार सत्यापन OTP प्राप्त करू',
    alreadyHaveAccount: 'पहले सँ खाता अछि?',
    loginLink: 'लॉगिन करू',

    errFullNameRequired: 'कृपया अपन पूरा नाम दर्ज करू',
    errFullNameNoNumbers: 'नाम में संख्या नहि भऽ सकैत अछि',
    errPhoneRequired: 'वैध 10-अंकीय भारतीय मोबाइल नंबर दर्ज करू (6, 7, 8, या 9 सँ शुरू)',
    errPasswordMinLength: 'पासवर्ड कम सँ कम 4 अक्षर होना आवश्यक अछि',
    errPasswordMismatch: 'पासवर्ड मेल नहि खा रहल अछि!',
    errShopNameRequired: 'कृपया अपन दुकानक नाम दर्ज करू',
    errMarketYardRequired: 'कृपया मंडीक नाम दर्ज करू',
    errShopAddressRequired: 'कृपया दुकानक पता दर्ज करू',

    otpHeading: 'एक-बार सत्यापन OTP',
    otpSubtitle: (phone) => `+91 ${phone} पर पठाओल गेल 6-अंकीय कोड दर्ज करू`,
    btnVerifyOtp: 'OTP सत्यापित करू आ आगे बढ़ू',
    commodityHeading: 'व्यापार कयल जाय वाला फसल चुनू',
    commoditySubtitle: 'मंडी में बेचल जाय वाला उत्पाद चुनू',
    btnCompleteSignup: 'मंडी साइन अप पूरा करू',
  },
  sat: {
    merchantSignUp: 'ᱵᱮᱯᱟᱨᱤ ᱥᱟᱭᱤᱱ ᱟᱯ',
    stepOf4: (current) => `ᱫᱷᱟᱯ ${current} / 4`,
    heading: 'ᱟᱢᱟᱜ ᱢᱟᱱᱰᱤ ᱵᱮᱯᱟᱨᱤ ᱠᱷᱟᱛᱟ ᱵᱮᱱᱟᱣ ᱢᱮ',
    subtitle: 'ᱟᱢᱟᱜ ᱢᱟᱱᱰᱤ ᱫᱩᱠᱟᱱ ᱨᱮᱡᱤᱥᱴᱟᱨ ᱢᱮ',
    step1Title: 'ᱱᱤᱡᱮᱨᱟᱜ ᱵᱤᱵᱚᱨᱚᱱ',
    step1Desc: 'ᱟᱢᱟᱜ ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ ᱟᱨ ᱢᱚᱵᱟᱭᱤᱞ ᱱᱚᱢᱵᱚᱨ ᱮᱢ ᱢᱮ',
    step2Title: 'ᱯᱟᱥᱣᱟᱨᱰ',
    step2Desc: 'ᱞᱚᱜᱤᱱ ᱯᱟᱥᱣᱟᱨᱰ ᱥᱮᱴ ᱢᱮ',
    step3Title: 'ᱫᱩᱠᱟᱱ ᱵᱤᱵᱚᱨᱚᱱ',
    step3Desc: 'ᱫᱩᱠᱟᱱ ᱧᱩᱛᱩᱢ ᱮᱢ ᱢᱮ',
    step4Title: 'ᱢᱟᱱᱰᱤ ᱵᱤᱵᱚᱨᱚᱱ',
    step4Desc: 'ᱢᱟᱱᱰᱤ ᱟᱨ ᱴᱷᱤᱠᱟᱹᱱᱟ ᱪᱚᱭᱚᱱ ᱢᱮ',

    fullNameLabel: 'ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ (ᱢᱟᱞᱤᱠ / ᱵᱮᱯᱟᱨᱤ) *',
    mobileLabel: 'ᱢᱚᱵᱟᱭᱤᱞ ᱱᱚᱢᱵᱚᱨ (10 ᱰᱤᱡᱤᱴ) *',
    emailLabel: 'ᱤᱢᱮᱞ ᱴᱷᱤᱠᱟᱹᱱᱟ (ᱚᱯᱥᱚᱱᱟᱞ)',
    passwordLabel: 'ᱞᱚᱜᱤᱱ ᱯᱟᱥᱣᱟᱨᱰ ᱵᱮᱱᱟᱣ ᱢᱮ *',
    confirmPasswordLabel: 'ᱯᱟᱥᱣᱟᱨᱰ ᱫᱚᱦᱲᱟ ᱮᱢ ᱢᱮ *',
    shopNameLabel: 'ᱫᱩᱠᱟᱱ / ᱯᱷᱟᱨᱢ ᱧᱩᱛᱩᱢ *',
    shopNumberLabel: 'ᱫᱩᱠᱟᱱ / ᱥᱴᱚᱞ ᱱᱚᱢᱵᱚᱨ',
    stateLabel: 'ᱯᱚᱱᱚᱛ *',
    marketYardLabel: 'ᱢᱟᱨᱠᱮᱴ ᱭᱟᱨᱰ / ᱢᱟᱱᱰᱤ ᱧᱩᱛᱩᱢ *',
    shopAddressLabel: 'ᱫᱩᱠᱟᱱ ᱨᱮᱱᱟᱜ ᱯᱩᱨᱟᱹ ᱴᱷᱤᱠᱟᱹᱱᱟ *',

    fullNamePlaceholder: 'ᱡᱮᱞᱮᱠᱟ: ᱨᱟᱢᱮᱥ ᱠᱩᱢᱟᱨ',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'ᱡᱮᱞᱮᱠᱟ: ramesh@manditrader.com',
    passwordPlaceholder: 'ᱯᱟᱥᱣᱟᱨᱰ ᱥᱮᱴ ᱢᱮ',
    confirmPasswordPlaceholder: 'ᱚᱱᱟ ᱯᱟᱥᱣᱟᱨᱰ ᱜᱮ ᱫᱚᱦᱲᱟ ᱮᱢ ᱢᱮ',
    shopNamePlaceholder: 'ᱡᱮᱞᱮᱠᱟ: ᱥᱨᱤ ᱵᱮᱝᱠᱚᱴᱮᱥᱣᱚᱨ ᱴᱨᱮᱰᱤᱝ',
    shopNumberPlaceholder: 'ᱡᱮᱞᱮᱠᱟ: ᱥᱴᱚᱞ #27, ᱜᱮᱴ 3',
    marketYardPlaceholder: 'ᱡᱮᱞᱮᱠᱟ: ᱦᱳᱞᱥᱮᱞ ᱢᱟᱨᱠᱮᱴ',
    shopAddressPlaceholder: 'ᱡᱮᱞᱮᱠᱟ: ᱫᱩᱠᱟᱱ #1, ᱢᱟᱨᱠᱮᱴ ᱭᱟᱨᱰ',

    btnNext: 'ᱞᱟᱦᱟ',
    btnBack: 'ᱛᱟᱭᱚᱢ',
    btnGetOtp: 'ᱢᱤᱫ-ᱫᱷᱟᱣ ᱡᱟᱸᱪ OTP ᱧᱟᱢ ᱢᱮ',
    alreadyHaveAccount: 'ᱢᱟᱲᱟᱝ ᱠᱷᱚᱱ ᱠᱷᱟᱛᱟ ᱢᱮᱱᱟᱜᱼᱟ?',
    loginLink: 'ᱞᱚᱜᱤᱱ ᱢᱮ',

    errFullNameRequired: 'ᱫᱚᱭᱟ ᱠᱟᱛᱮ ᱟᱢᱟᱜ ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ ᱮᱢ ᱢᱮ',
    errFullNameNoNumbers: 'ᱧᱩᱛᱩᱢ ᱨᱮ ᱱᱚᱢᱵᱚᱨ ᱵᱟᱝ ᱛᱟᱦᱮᱸ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ',
    errPhoneRequired: '10 ᱰᱤᱡᱤᱴ ᱨᱮᱱᱟᱜ ᱥᱟᱹᱨᱤ ᱤᱱᱰᱤᱭᱟᱱ ᱢᱚᱵᱟᱭᱤᱞ ᱱᱚᱢᱵᱚᱨ ᱮᱢ ᱢᱮ (6, 7, 8, 9 ᱠᱷᱚᱱ ᱮᱛᱚᱦᱚᱵ)',
    errPasswordMinLength: 'ᱯᱟᱥᱣᱟᱨᱰ ᱠᱚᱢ ᱠᱷᱚᱱ ᱠᱚᱢ 4 ᱴᱟᱠᱷᱚᱨ ᱦᱩᱭᱩᱜ ᱞᱟᱹᱠᱛᱤᱭᱟ',
    errPasswordMismatch: 'ᱯᱟᱥᱣᱟᱨᱰ ᱵᱟᱝ ᱢᱤᱞᱟᱹᱣ ᱠᱟᱱᱟ!',
    errShopNameRequired: 'ᱫᱚᱭᱟ ᱠᱟᱛᱮ ᱫᱩᱠᱟᱱ ᱧᱩᱛᱩᱢ ᱮᱢ ᱢᱮ',
    errMarketYardRequired: 'ᱫᱚᱭᱟ ᱠᱟᱛᱮ ᱢᱟᱱᱰᱤ ᱧᱩᱛᱩᱢ ᱮᱢ ᱢᱮ',
    errShopAddressRequired: 'ᱫᱚᱭᱟ ᱠᱟᱛᱮ ᱴᱷᱤᱠᱟᱹᱱᱟ ᱮᱢ ᱢᱮ',

    otpHeading: 'ᱢᱤᱫ-ᱫᱷᱟᱣ ᱡᱟᱸᱪ OTP',
    otpSubtitle: (phone) => `+91 ${phone} ᱨᱮ ᱵᱷᱮᱡᱟ ᱟᱠᱟᱱ 6 ᱰᱤᱡᱤᱴ ᱠᱳᱰ ᱮᱢ ᱢᱮ`,
    btnVerifyOtp: 'OTP ᱡᱟᱸᱪ ᱢᱮ & ᱞᱟᱦᱟᱜ ᱢᱮ',
    commodityHeading: 'ᱵᱮᱯᱟᱨᱮᱫ ᱯᱷᱚᱥᱚᱞ ᱪᱚᱭᱚᱱ ᱢᱮ',
    commoditySubtitle: 'ᱢᱟᱱᱰᱤ ᱨᱮ ᱟᱹᱠᱷᱨᱤᱧᱚᱜ ᱠᱟᱱ ᱡᱤᱱᱤᱥ ᱪᱚᱭᱚᱱ ᱢᱮ',
    btnCompleteSignup: 'ᱢᱟᱱᱰᱤ ᱥᱟᱭᱤᱱ ᱟᱯ ᱯᱩᱨᱟᱹᱣ ᱢᱮ',
  },
  ks: {
    merchantSignUp: 'تاجر سائن اپ',
    stepOf4: (current) => `مرحلہ ${current} / 4`,
    heading: 'منڈی تاجر اکاؤنٹ بناوِو',
    subtitle: 'پننہ منڈی دکان رجسٹر کریو',
    step1Title: 'ذاتی تفصیلات',
    step1Desc: 'پورا ناو تہٕ موبائل نمبر درج کریو',
    step2Title: 'پاسورڈ',
    step2Desc: 'لاگ ان پاسورڈ سیٹ کریو',
    step3Title: 'دکان تفصیلات',
    step3Desc: 'دکان ناو درج کریو',
    step4Title: 'منڈی تفصیلات',
    step4Desc: 'منڈی تہٕ پتہ منتخب کریو',

    fullNameLabel: 'پورا ناو (مالک / تاجر) *',
    mobileLabel: 'موبائل نمبر (10 ہندسے) *',
    emailLabel: 'ای میل پتہ (اختیاری)',
    passwordLabel: 'لاگ ان پاسورڈ بناوِو *',
    confirmPasswordLabel: 'پاسورڈ تصدیق کریو *',
    shopNameLabel: 'دکان / فرم ناو *',
    shopNumberLabel: 'دکان / اسٹال نمبر',
    stateLabel: 'ریاست *',
    marketYardLabel: 'مارکیٹ یارڈ / منڈی ناو *',
    shopAddressLabel: 'دکانک مکمل پتہ *',

    fullNamePlaceholder: 'مثلاً: رمیش کمار',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'مثلاً: ramesh@manditrader.com',
    passwordPlaceholder: 'پاسورڈ درج کریو',
    confirmPasswordPlaceholder: 'سوئی پاسورڈ دوبارہ درج کریو',
    shopNamePlaceholder: 'مثلاً: شری وینکٹیشور ٹریڈنگ',
    shopNumberPlaceholder: 'مثلاً: اسٹال #27، گیٹ 3',
    marketYardPlaceholder: 'مثلاً: ہول سیل مارکیٹ',
    shopAddressPlaceholder: 'مثلاً: دکان #1، مارکیٹ یارڈ',

    btnNext: 'برونہہ',
    btnBack: 'پتھ',
    btnGetOtp: 'ایک-بار تصدیقی OTP حاصل کریو',
    alreadyHaveAccount: 'برونہہ اکاؤنٹ چھا؟',
    loginLink: 'لاگ ان کریو',

    errFullNameRequired: 'مہربانی کٔرتھ پنُن پورا ناو درج کریو',
    errFullNameNoNumbers: 'ناوس منز ہیکہِ نہٕ ہندسہِ ٲستھ',
    errPhoneRequired: '10 ہندسین ہند معتبر بھارتی موبائل نمبر درج کریو (6، 7، 8، یا 9 پیٹھہٕ شروع)',
    errPasswordMinLength: 'پاسورڈ گژھہِ کم از کم 4 حرفن ہند ٲسنہٕ',
    errPasswordMismatch: 'پاسورڈ چھُ نہٕ رلان!',
    errShopNameRequired: 'مہربانی کٔرتھ دکان ناو درج کریو',
    errMarketYardRequired: 'مہربانی کٔرتھ منڈی ناو درج کریو',
    errShopAddressRequired: 'مہربانی کٔرتھ پتہ درج کریو',

    otpHeading: 'ایک-بار تصدیقی OTP',
    otpSubtitle: (phone) => `+91 ${phone} پؠٹھ سوزنہٕ آمُت 6 ہندسین ہند کوڈ درج کریو`,
    btnVerifyOtp: 'OTP تصدیق کریو & برونہہ پکِو',
    commodityHeading: 'تجارت کی اجناس منتخب کریو',
    commoditySubtitle: 'منڈی منز کٕنن واجؠن فصلن ہند انتخاب کریو',
    btnCompleteSignup: 'منڈی سائن اپ مکمل کریو',
  },
  ne: {
    merchantSignUp: 'व्यापारी साइन अप',
    stepOf4: (current) => `चरण ${current} / 4`,
    heading: 'आफ्नो मण्डी व्यापारी खाता बनाउनुहोस्',
    subtitle: 'आफ्नो थोक मण्डी पसल दर्ता गर्नुहोस्',
    step1Title: 'व्यक्तिगत विवरण',
    step1Desc: 'आफ्नो पूरा नाम र मोबाइल नम्बर राख्नुहोस्',
    step2Title: 'पासवर्ड',
    step2Desc: 'लगइन पासवर्ड सेट गर्नुहोस्',
    step3Title: 'पसल विवरण',
    step3Desc: 'पसलको नाम राख्नुहोस्',
    step4Title: 'मण्डी विवरण',
    step4Desc: 'मण्डी र ठेगाना छान्नुहोस्',

    fullNameLabel: 'पूरा नाम (मालिक / व्यापारी) *',
    mobileLabel: 'मोबाइल नम्बर (१० अंक) *',
    emailLabel: 'इमेल ठेगाना (ऐच्छिक)',
    passwordLabel: 'लगइन पासवर्ड बनाउनुहोस् *',
    confirmPasswordLabel: 'पासवर्ड पुनः राख्नुहोस् *',
    shopNameLabel: 'पसल / फर्मको नाम *',
    shopNumberLabel: 'पसल / स्टल नम्बर',
    stateLabel: 'राज्य *',
    marketYardLabel: 'मार्केट यार्ड / मण्डीको नाम *',
    shopAddressLabel: 'पसलको पूरा ठेगाना *',

    fullNamePlaceholder: 'जस्तै: रमेश कुमार',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'जस्तै: ramesh@manditrader.com',
    passwordPlaceholder: 'पासवर्ड सेट गर्नुहोस्',
    confirmPasswordPlaceholder: 'उही पासवर्ड पुनः राख्नुहोस्',
    shopNamePlaceholder: 'जस्तै: श्री वेङ्कटेश्वर ट्रेडिङ',
    shopNumberPlaceholder: 'जस्तै: स्टल #२७, गेट ३',
    marketYardPlaceholder: 'जस्तै: थोक मण्डी प्राङ्गण',
    shopAddressPlaceholder: 'जस्तै: पसल #१, मण्डी प्राङ्गण',

    btnNext: 'अगाडि',
    btnBack: 'पछाडि',
    btnGetOtp: 'एक-पटक प्रमाणीकरण OTP प्राप्त गर्नुहोस्',
    alreadyHaveAccount: 'पहिले नै खाता छ?',
    loginLink: 'लगइन गर्नुहोस्',

    errFullNameRequired: 'कृपया आफ्नो पूरा नाम राख्नुहोस्',
    errFullNameNoNumbers: 'नाममा अंक हुनुहुँदैन',
    errPhoneRequired: 'मान्य १०-अङ्कको भारतीय मोबाइल नम्बर राख्नुहोस् (६, ७, ८, वा ९ बाट सुरु)',
    errPasswordMinLength: 'पासवर्ड कम्तिमा ४ अक्षरको हुनुपर्छ',
    errPasswordMismatch: 'पासवर्ड मिलेन!',
    errShopNameRequired: 'कृपया पसलको नाम राख्नुहोस्',
    errMarketYardRequired: 'कृपया मण्डीको नाम राख्नुहोस्',
    errShopAddressRequired: 'कृपया ठेगाना राख्नुहोस्',

    otpHeading: 'एक-पटक प्रमाणीकरण OTP',
    otpSubtitle: (phone) => `+91 ${phone} मा पठाइएको ६ अंकको कोड राख्नुहोस्`,
    btnVerifyOtp: 'OTP प्रमाणीकरण गर्नुहोस् & अगाडि बढ्नुहोस्',
    commodityHeading: 'व्यापार गर्ने बाली छान्नुहोस्',
    commoditySubtitle: 'मण्डीमा बिक्री हुने उपज छान्नुहोस्',
    btnCompleteSignup: 'मण्डी साइन अप पूरा गर्नुहोस्',
  },
  kok: {
    merchantSignUp: 'वेपारी सायन अप',
    stepOf4: (current) => `पावंडो ${current} / 4`,
    heading: 'तुमचें मंडी वेपारी खातें तयार करात',
    subtitle: 'तुमचें मंडी दुकान नोंदव्यात',
    step1Title: 'व्यक्तिगत माहिती',
    step1Desc: 'तुमचें पुराय नांव आणी मोबाईल नंबर घालात',
    step2Title: 'पासवर्ड',
    step2Desc: 'लॉगिन पासवर्ड सेट करात',
    step3Title: 'दुकानाची माहिती',
    step3Desc: 'दुकानाचें नांव घालात',
    step4Title: 'मंडीची माहिती',
    step4Desc: 'मंडी आणी पत्तो निवडाात',

    fullNameLabel: 'पुराय नांव (धनी / वेपारी) *',
    mobileLabel: 'मोबाईल नंबर (10 आंकडे) *',
    emailLabel: 'ईमेल पत्तो (ऐच्छिक)',
    passwordLabel: 'लॉगिन पासवर्ड तयार करात *',
    confirmPasswordLabel: 'पासवर्ड परत घालात *',
    shopNameLabel: 'दुकान / फर्मान्चें नांव *',
    shopNumberLabel: 'दुकान / स्टॉल नंबर',
    stateLabel: 'राज्य *',
    marketYardLabel: 'मार्केट यार्ड / मंडीचें नांव *',
    shopAddressLabel: 'दुकानाचा पुराय पत्तो *',

    fullNamePlaceholder: 'देखील: रमेश कुमार',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'देखील: ramesh@manditrader.com',
    passwordPlaceholder: 'पासवर्ड सेट करात',
    confirmPasswordPlaceholder: 'तोच पासवर्ड परत घालात',
    shopNamePlaceholder: 'देखील: श्री व्यंकटेश्वर ट्रेडिंग',
    shopNumberPlaceholder: 'देखील: स्टॉल #27, गेट 3',
    marketYardPlaceholder: 'देखील: होलसेल मार्केट',
    shopAddressPlaceholder: 'देखील: दुकान #1, मार्केट यार्ड',

    btnNext: 'मुखार',
    btnBack: 'फाटीं',
    btnGetOtp: 'वन-टाईम तपासणी OTP मेळवाात',
    alreadyHaveAccount: 'पयलींच खातें आसा?',
    loginLink: 'लॉगिन करात',

    errFullNameRequired: 'उपकार करून तुमचें पुराय नांव घालात',
    errFullNameNoNumbers: 'नांवांत आंकडे आसूंक नजॉत',
    errPhoneRequired: 'सारको 10-आंकड्यांचो भारतीय मोबाईल नंबर घालात (6, 7, 8, वा 9 थान सुरू)',
    errPasswordMinLength: 'पासवर्ड उण्यांत उणो 4 अक्षरांचो आसूंक जाय',
    errPasswordMismatch: 'पासवर्ड जुळनात!',
    errShopNameRequired: 'उपकार करून दुकानाचें नांव घालात',
    errMarketYardRequired: 'उपकार करून मंडीचें नांव घालात',
    errShopAddressRequired: 'उपकार करून पत्तो घालात',

    otpHeading: 'वन-टाईम तपासणी OTP',
    otpSubtitle: (phone) => `+91 ${phone} रार धाडिल्लो 6-आंकड्यांचो कोड घालात`,
    btnVerifyOtp: 'OTP तपासात & मुखार वचाात',
    commodityHeading: 'व्यापार करपाची पिकां निवडाात',
    commoditySubtitle: 'मंडींत विक्री करपाचो माल निवडाात',
    btnCompleteSignup: 'मंडी सायन अप पुराय करात',
  },
  doi: {
    merchantSignUp: 'व्यापारी साइन अप',
    stepOf4: (current) => `चरण ${current} / 4`,
    heading: 'अपना मंडी व्यापारी खाता बनाओ',
    subtitle: 'अपनी मंडी दुकान पंजीकृत करो',
    step1Title: 'व्यक्तिगत विवरण',
    step1Desc: 'अपना पूरा नांअ ते मोबाइल नंबर पाओ',
    step2Title: 'पासवर्ड',
    step2Desc: 'लॉगिन पासवर्ड सेट करो',
    step3Title: 'दुकान विवरण',
    step3Desc: 'दुकान दा नांअ पाओ',
    step4Title: 'मंडी विवरण',
    step4Desc: 'मंडी ते पता चुनो',

    fullNameLabel: 'पूरा नांअ (मालिक / व्यापारी) *',
    mobileLabel: 'मोबाइल नंबर (10 अंक) *',
    emailLabel: 'ईमेल पता (ऐच्छिक)',
    passwordLabel: 'लॉगिन पासवर्ड बनाओ *',
    confirmPasswordLabel: 'पासवर्ड दोबारा पाओ *',
    shopNameLabel: 'दुकान / फर्म दा नांअ *',
    shopNumberLabel: 'दुकान / स्टॉल नंबर',
    stateLabel: 'राज्य *',
    marketYardLabel: 'मार्केट यार्ड / मंडी दा नांअ *',
    shopAddressLabel: 'दुकान दा पूरा पता *',

    fullNamePlaceholder: 'जिच्छन: रमेश कुमार',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'जिच्छन: ramesh@manditrader.com',
    passwordPlaceholder: 'पासवर्ड सेट करो',
    confirmPasswordPlaceholder: 'ओह गै पासवर्ड दोबारा पाओ',
    shopNamePlaceholder: 'जिच्छन: श्री वेंकटेश्वर ट्रेडिंग',
    shopNumberPlaceholder: 'जिच्छन: स्टॉल #27, गेट 3',
    marketYardPlaceholder: 'जिच्छन: थोक मंडी यार्ड',
    shopAddressPlaceholder: 'जिच्छन: दुकान #1, मंडी यार्ड',

    btnNext: 'अग्गें',
    btnBack: 'पिच्छें',
    btnGetOtp: 'इक्क-बारी जांच OTP हासिल करो',
    alreadyHaveAccount: 'पैलें थमा खाता ऐ?',
    loginLink: 'लॉगिन करो',

    errFullNameRequired: 'किरपा करियै अपना पूरा नांअ पाओ',
    errFullNameNoNumbers: 'नांअ च अंक नेईं होई सकदे',
    errPhoneRequired: 'मान्य 10-अंकें दा भारतीय मोबाइल नंबर पाओ (6, 7, 8, या 9 थमां शुरू)',
    errPasswordMinLength: 'पासवर्ड घट्ट-शा-घट्ट 4 अक्खरें दा होना चाहिदा',
    errPasswordMismatch: 'पासवर्ड मेल नेईं खांदे!',
    errShopNameRequired: 'किरपा करियै दुकान दा नांअ पाओ',
    errMarketYardRequired: 'किरपा करियै मंडी दा नांअ पाओ',
    errShopAddressRequired: 'किरपा करियै पता पाओ',

    otpHeading: 'इक्क-बारी जांच OTP',
    otpSubtitle: (phone) => `+91 ${phone} पर भेजेदा 6-अंकें दा कोड पाओ`,
    btnVerifyOtp: 'OTP जांचो ते अग्गें बधो',
    commodityHeading: 'व्यापार आह्ली फसल चुनो',
    commoditySubtitle: 'मंडी च बिक्कने आह्ली उपज चुनो',
    btnCompleteSignup: 'मंडी साइन अप पूरा करो',
  },
  mni: {
    merchantSignUp: 'ᱞꯥꯂꯩꯕ ꯁꯥꯏꯟ ꯑꯞ',
    stepOf4: (current) => `ꯈꯣꯡꯊꯥꯡ ${current} / 4`,
    heading: 'ꯅꯍꯥꯛꯀꯤ ꯃꯟꯗꯤ ꯃꯔꯆꯦꯟ꯭ꯇ ꯑꯀꯥꯎꯟ꯭ꯇ ꯁꯦᱢꯕꯤꯌꯨ',
    subtitle: 'ꯅꯍꯥꯛꯀꯤ ꯃꯟꯗꯤ ꯗꯨꯀꯥꯟ ꯔꯦꯖꯤꯁ꯭ꯇꯔ ꯇꯧꯕꯤꯌꯨ',
    step1Title: 'ꯏꯁꯥꯒꯤ ꯑꯀꯨꯞꯄ ꯃꯔꯣꯜ',
    step1Desc: 'ꯃꯃꯤꯡ ꯑꯃꯁꯨꯡ ꯃꯣꯕꯥꯏꯜ ꯅꯝꯕꯔ ꯏꯕꯤꯌꯨ',
    step2Title: 'ꯄꯥꯁꯋꯥꯔ꯭ꯗ',
    step2Desc: 'ꯂꯣꯒꯏꯟ ꯄꯥꯁꯋꯥꯔ꯭ꯗ ꯁꯦꯠ ꯇꯧꯕꯤꯌꯨ',
    step3Title: 'ꯗꯨꯀꯥꯟꯒꯤ ꯃꯔꯣꯜ',
    step3Desc: 'ꯗꯨꯀꯥꯟꯒꯤ ꯃꯃꯤꯡ ꯏꯕꯤꯌꯨ',
    step4Title: 'ꯃꯥꯔꯀꯦꯠꯀꯤ ꯃꯔꯣꯜ',
    step4Desc: 'ꯃꯟꯗꯤ ꯑꯃꯁꯨꯡ ꯂꯩꯐꯝ ꯈꯟꯕꯤꯌꯨ',

    fullNameLabel: 'ꯑꯄꯨꯟꯕ ꯃꯃꯤꯡ (ꯃꯄꯨ / ꯂꯥꯂꯩꯕ) *',
    mobileLabel: 'ꯃꯣꯕꯥꯏꯜ ꯅꯝꯕꯔ (10 ꯗꯤꯖꯤꯠ) *',
    emailLabel: 'ꯏꯃꯦꯜ ꯑꯦꯗ꯭ꯔꯦꯁ (ꯑꯣꯞꯁꯅꯦꯜ)',
    passwordLabel: 'ꯂꯣꯒꯏꯟ ꯄꯥꯁꯋꯥꯔ꯭ꯗ ꯁꯦᱢꯕꯤꯌꯨ *',
    confirmPasswordLabel: 'ꯄꯥꯁꯋꯥꯔ꯭ꯗ ꯑꯃꯨꯛ ꯏꯕꯤꯌꯨ *',
    shopNameLabel: 'ꯗꯨꯀꯥꯟ / ꯐꯔ꯭ᱢꯒꯤ ꯃꯃꯤꯡ *',
    shopNumberLabel: 'ꯗꯨꯀꯥꯟ / ꯁ꯭ꯇꯣꯜ ꯅꯝꯕꯔ',
    stateLabel: 'ꯁ꯭ꯇꯦꯠ *',
    marketYardLabel: 'ꯃꯥꯔꯀꯦꯠ ꯌꯥꯔ꯭ꯗ / ꯃꯟꯗꯤ ꯃꯃꯤꯡ *',
    shopAddressLabel: 'ꯗꯨꯀꯥꯟꯒꯤ ꯑꯄꯨꯟꯕ ꯂꯩꯐꯝ *',

    fullNamePlaceholder: 'ꯈꯨꯗꯝ: ꯔꯃꯦꯁ ꯀꯨꯃꯥꯔ',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'ꯈꯨꗯ: ramesh@manditrader.com',
    passwordPlaceholder: 'ꯄꯥꯁꯋꯥꯔ꯭ꯗ ꯁꯦꯠ ꯇꯧꯕꯤꯌꯨ',
    confirmPasswordPlaceholder: 'ꯑꯗꯨꯃꯛ ꯑꯃꯨꯛ ꯏꯕꯤꯌꯨ',
    shopNamePlaceholder: 'ꯈꯨꯗꝨ: ꯁ꯭ꯔꯤ ꯋꯦꯡꯀꯇꯦꯁ꯭ꯋꯔ ꯇ꯭ꯔꯦꯗꯤꯡ',
    shopNumberPlaceholder: 'ꯈꯨꯗꯝ: ꯁ꯭ꯇꯣꯜ #27, ꯒꯦꯠ 3',
    marketYardPlaceholder: 'ꯈꯨꯗꯝ: ꯍꯣꯜꯁꯦꯜ ꯃꯥꯔꯀꯦꯠ',
    shopAddressPlaceholder: 'ꯈꯨꯗꯝ: ꯗꯨꯀꯥꯟ #1, ꯃꯥꯔꯀꯦꯠ ꯌꯥꯔ꯭ꯗ',

    btnNext: 'ꯃꯥꯡꯗꯥ',
    btnBack: 'ꯇꯨꯡꯗꯥ',
    btnGetOtp: 'ꯑꯃꯛ-ꯈꯛꯇ ꯆꯦꯛ ꯇꯧꯕ OTP ꯂꯧꯕꯤꯌꯨ',
    alreadyHaveAccount: 'ꯃꯃꯥꯡꯗꯒꯤ ꯑꯀꯥꯎꯟ꯭ꯇ ꯂꯩꯕ꯭ꯔꯥ?',
    loginLink: 'ꯂꯣꯒꯏꯟ ꯇꯧꯕꯤꯌꯨ',

    errFullNameRequired: 'ꯆꯥꯅꯕꯤꯗꯨꯅ ꯑꯄꯨꯟꯕ ꯃꯃꯤꯡ ꯏꯕꯤꯌꯨ',
    errFullNameNoNumbers: 'ꯃꯃꯤꯡꯗ ꯃꯁꯤꯡ ꯌꯥꯎꯕ ꯌꯥꯔꯣꯏ',
    errPhoneRequired: '10 ꯗꯤꯖꯤꯠꯀꯤ ꯑꯆᱩꯝꯕ ꯏꯟꯗꯤꯌꯥꯟ ꯃꯣꯕꯥꯏꯜ ꯅꯝꯕꯔ ꯏꯕꯤꯌꯨ (6, 7, 8, ꯅꯠꯇ꯭ꯔꯒ 9 ꯗꯒꯤ ꯍꯧꯕ)',
    errPasswordMinLength: 'ꯄꯥꯁꯋꯥꯔ꯭ꯗ ꯌꯥꯝꯗ꯭ꯔꯕꯗ ꯃꯌꯦꯛ 4 ꯑꯣꯏꯒꯗꯕꯅꯤ',
    errPasswordMismatch: 'ꯄꥥꯁꯋꯥꯔ꯭ꯗ ꯃꯥꯟꯅꯗ꯭ꯔꯦ!',
    errShopNameRequired: 'ꯆꯥꯅꯕꯤꯗꯨꯅ ꯗꯨꯀꥥꯟ ꯃꯃꯤꯡ ꯏꯕꯤꯌꯨ',
    errMarketYardRequired: 'ꯆꯥꯅꯕꯤꯗꯨꯅ ꯃꯟꯗꯤ ꯃꯃꯤꯡ ꯏꯕꯤꯌꯨ',
    errShopAddressRequired: 'ꯆꯥꯅꯕꯤꯗꯨꯅ ꯂꯩꯐꯝ ꯏꯕꯤꯌꯨ',

    otpHeading: 'ꯑꯃꯛ-ꯈꯛꯇ ꯆꯦꯛ ꯇꯧꯕ OTP',
    otpSubtitle: (phone) => `+91 ${phone} ꯗ ꯊꯥꯔꯛꯄ 6 ꯗꯤꯖꯤꯠ ꯀꯣꯗ ꯏꯕꯤꯌꯨ`,
    btnVerifyOtp: 'OTP ꯆꯦꯛ ꯇꯧꯕꯤꯌꯨ & ꯃꯥꯡꯗꯥ ꯆꯠꯄꯤꯌꯨ',
    commodityHeading: 'ꯂꯥꯂꯩ-ꯏꯇꯤꯛ ꯇꯧꯕ ꯄꯣꯠꯊꯣꯛ ꯈꯟꯕꯤꯌꯨ',
    commoditySubtitle: 'ꯃꯥꯔꯀꯦꯠꯇ ꯌꯣꯟꯕ ꯄꯣꯠꯊꯣꯛꯁꯤꯡ ꯈꯟꯕꯤꯌꯨ',
    btnCompleteSignup: 'ꯃꯟꯗꯤ ꯁꯥꯏꯟ ꯑꯞ ꯂꯣꯏꯁꯤꯟꯕꯤꯌꯨ',
  },
  brx: {
    merchantSignUp: 'फालांगिरि साइन आप',
    stepOf4: (current) => `खोन्दोब ${current} / 4`,
    heading: 'नोंथांनि मन्दि फालांगिरि एकाउन्ट सोरजौ',
    subtitle: 'नोंथांनि मन्दि दुलारि दकान रेजिस्टार खालाम',
    step1Title: 'गावनि विवरण',
    step1Desc: 'मुं आरो मबाइल नम्बर लिर',
    step2Title: 'पासवार्ड',
    step2Desc: 'लगइन पासवार्ड सेट खालाम',
    step3Title: 'दकान विवरण',
    step3Desc: 'दकाननि मुं लिर',
    step4Title: 'हाथाय विवरण',
    step4Desc: 'मन्दि आरो ठिकाना सायखौ',

    fullNameLabel: 'आबुं मुं (मालिक / फालांगिरि) *',
    mobileLabel: 'मबाइल नम्बर (10 अंक) *',
    emailLabel: 'इमेल ठिकाना (बायदि)',
    passwordLabel: 'लगइन पासवार्ड सोरजौ *',
    confirmPasswordLabel: 'पासवार्ड फिन लिर *',
    shopNameLabel: 'दकान / फार्मनि मुं *',
    shopNumberLabel: 'दकान / स्टल नम्बर',
    stateLabel: 'रायजो *',
    marketYardLabel: 'मार्केट यार्ड / मन्दिनि मुं *',
    shopAddressLabel: 'दकाननि आबुं ठिकाना *',

    fullNamePlaceholder: 'जेरै: रमेश कुमार',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'जेरै: ramesh@manditrader.com',
    passwordPlaceholder: 'पासवार्ड सेट खालाम',
    confirmPasswordPlaceholder: 'बे पासवार्डनो फिन लिर',
    shopNamePlaceholder: 'जेरै: श्री वेंकटेश्वर ट्रेडिं',
    shopNumberPlaceholder: 'जेरै: स्टल #27, गेट 3',
    marketYardPlaceholder: 'जेरै: थोक मार्केट यार्ड',
    shopAddressPlaceholder: 'जेरै: दकान #1, मार्केट यार्ड',

    btnNext: 'सिगांङाव',
    btnBack: 'उनाव',
    btnGetOtp: 'मोनसे-खेब आनजाद OTP मोन्दों',
    alreadyHaveAccount: 'सिगांनिफ्रायनो एकाउन्ट दं?',
    loginLink: 'लगइन खालाम',

    errFullNameRequired: 'अननानै गावनि आबुं मुंखौ लिर',
    errFullNameNoNumbers: 'मुङाव अनजिमा थानो हाया',
    errPhoneRequired: 'गनायथिगोनां 10-अंकनि भारतारि मबाइल नम्बर लिर (6, 7, 8, एबा 9 निफ्राय जागायनाय)',
    errPasswordMinLength: 'पासवार्डा खोमसेयावबो 4 हांखोनि जानांगोन',
    errPasswordMismatch: 'पासवार्डा गोरोबासै!',
    errShopNameRequired: 'अननानै दकाननि मुंखौ लिर',
    errMarketYardRequired: 'अननानै मन्दिनि मुंखौ लिर',
    errShopAddressRequired: 'अननानै ठिकानाखौ लिर',

    otpHeading: 'मोनसे-खेब आनजाद OTP',
    otpSubtitle: (phone) => `+91 ${phone} आव दैथायनाय 6 अंकनि कडाव लिर`,
    btnVerifyOtp: 'OTP आनजाद खालाम & सिगां आवगाय',
    commodityHeading: 'फालांगि खालामनाय फसल सायखौ',
    commoditySubtitle: 'मन्दियाव फाननाय बेसाद सायखौ',
    btnCompleteSignup: 'मन्दि साइन आप फुंखा खालाम',
  },
  sa: {
    merchantSignUp: 'व्यापारी पञ्जीकरणम्',
    stepOf4: (current) => `सोपानम् ${current} / 4`,
    heading: 'स्वकीय मण्डी व्यापारी खाते रचयतु',
    subtitle: 'आपणस्य पञ्जीकरणं करोतु',
    step1Title: 'व्यक्तिगतविवरणम्',
    step1Desc: 'पूर्णनाम चलभाषसङ्ख्यां च लिखतु',
    step2Title: 'कूटशब्दः',
    step2Desc: 'सुरक्षितकूटशब्दं स्थापयतु',
    step3Title: 'आपणविवरणम्',
    step3Desc: 'आपणनाम लिखतु',
    step4Title: 'विपणि विवरणम्',
    step4Desc: 'विपणिस्थानं सङ्केतं च चिनोतु',

    fullNameLabel: 'पूर्णं नाम (स्वामी / व्यापारी) *',
    mobileLabel: 'चलभाषसङ्ख्या (10 अङ्काः) *',
    emailLabel: 'ईमेल-सङ्केतः (ऐच्छिकः)',
    passwordLabel: 'प्रवेशकूटशब्दं रचयतु *',
    confirmPasswordLabel: 'कूटशब्दं पुनर्विलिखतु *',
    shopNameLabel: 'आपणस्य / संस्थायाः नाम *',
    shopNumberLabel: 'आपण / स्टॉल सङ्ख्या',
    stateLabel: 'राज्यम् *',
    marketYardLabel: 'विपणिप्राङ्गणम् / मण्डीनाम *',
    shopAddressLabel: 'आपणस्य पूर्णसङ्केतः *',

    fullNamePlaceholder: 'यथा: रमेश कुमारः',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'यथा: ramesh@manditrader.com',
    passwordPlaceholder: 'कूटशब्दं स्थापयतु',
    confirmPasswordPlaceholder: 'तमेव कूटशब्दं पुनर्लिखतु',
    shopNamePlaceholder: 'यथा: श्री वेङ्कटेश्वर ट्रेडिङ्ग',
    shopNumberPlaceholder: 'यथा: स्टॉल #27, द्वारम् 3',
    marketYardPlaceholder: 'यथा: थोक विपणिप्राङ्गणम्',
    shopAddressPlaceholder: 'यथा: आपणम् #1, मण्डीप्राङ्गणम्',

    btnNext: 'अग्रे',
    btnBack: 'पृष्ठे',
    btnGetOtp: 'एकवारं प्रमाणीकरण OTP प्राप्नोतु',
    alreadyHaveAccount: 'पूर्वमेव खाता अस्ति?',
    loginLink: 'प्रविशतु (लॉगिन)',

    errFullNameRequired: 'कृपया स्वकीय पूर्णं नाम लिखतु',
    errFullNameNoNumbers: 'नामनि सङ्ख्याः न भवेयुः',
    errPhoneRequired: 'मांस्य 10-अङ्कीयां भारतीयचलभाषसङ्ख्यां लिखतु (6, 7, 8, वा 9 तः आरभ्य)',
    errPasswordMinLength: 'कूटशब्दः न्‍यूनतमम् 4 अक्षराणि भवेत्',
    errPasswordMismatch: 'कूटशब्दौ न मेलतः!',
    errShopNameRequired: 'कृपया आपणस्य नाम लिखतु',
    errMarketYardRequired: 'कृपया मण्ड्याः नाम लिखतु',
    errShopAddressRequired: 'कृपया सङ्केतं लिखतु',

    otpHeading: 'एकवारं प्रमाणीकरण OTP',
    otpSubtitle: (phone) => `+91 ${phone} इत्यत्र प्रेषितं 6-अङ्कीयं कोडं लिखतु`,
    btnVerifyOtp: 'OTP सत्यापयतु & अग्रे सरतु',
    commodityHeading: 'व्यापारयोग्याः सस्याः चिनोतु',
    commoditySubtitle: 'विपणौ विक्रययोग्यान् उत्पादान् चिनोतु',
    btnCompleteSignup: 'मण्डी पञ्जीकरणं पूर्णं करोतु',
  },
  sd: {
    merchantSignUp: 'واپاري سائن اپ',
    stepOf4: (current) => `قدم ${current} / 4`,
    heading: 'پنهنجو منڊي واپاري کاتو جوڙيو',
    subtitle: 'پنهنجي منڊي دڪان جي رجسٽريشن ڪريو',
    step1Title: 'ذاتي تفصيل',
    step1Desc: 'پورو نالو ۽ موبائل نمبر درج ڪريو',
    step2Title: 'پاسورڊ',
    step2Desc: 'لاگ ان پاسورڊ سيٽ ڪريو',
    step3Title: 'دڪان تفصيل',
    step3Desc: 'دڪان جو نالو درج ڪريو',
    step4Title: 'منڊي تفصيل',
    step4Desc: 'منڊي ۽ پتو چونڊيو',

    fullNameLabel: 'پورو نالو (مالڪ / واپاري) *',
    mobileLabel: 'موبائل نمبر (10 انگ) *',
    emailLabel: 'اي ميل پتو (اختياري)',
    passwordLabel: 'لاگ ان پاسورڊ جوڙيو *',
    confirmPasswordLabel: 'پاسورڊ جي تصديق ڪريو *',
    shopNameLabel: 'دڪان / فرم جو نالو *',
    shopNumberLabel: 'دڪان / اسٽال نمبر',
    stateLabel: 'ریاست *',
    marketYardLabel: 'مارڪيٽ يارڊ / منڊي جو نالو *',
    shopAddressLabel: 'دڪان جو مڪمل پتو *',

    fullNamePlaceholder: 'مثال: رميش ڪمار',
    mobilePlaceholder: '9849012345',
    emailPlaceholder: 'مثال: ramesh@manditrader.com',
    passwordPlaceholder: 'پاسورڊ سيٽ ڪريو',
    confirmPasswordPlaceholder: 'اهو ئي پاسورڊ ٻيهر درج ڪريو',
    shopNamePlaceholder: 'مثال: شري وينڪٽيشور ٽريڊنگ',
    shopNumberPlaceholder: 'مثال: اسٽال #27، گيٽ 3',
    marketYardPlaceholder: 'مثال: هول سيل مارڪيٽ',
    shopAddressPlaceholder: 'مثال: دڪان #1، مارڪيٽ يارڈ',

    btnNext: 'اڳتي',
    btnBack: 'پوئتي',
    btnGetOtp: 'هڪ-باري تصديقي OTP حاصل ڪريو',
    alreadyHaveAccount: 'پهرين کان کاتو آهي؟',
    loginLink: 'لاگ ان ڪريو',

    errFullNameRequired: 'مهرباني ڪري پنهنجو پورونالو درج ڪريو',
    errFullNameNoNumbers: 'نالي ۾ انگ نٿا ٿي سگهن',
    errPhoneRequired: '10 انگن جو معتبر انڊين موبائل نمبر درج ڪريو (6, 7, 8, يا 9 کان شروعات)',
    errPasswordMinLength: 'پاسورڊ گھٽ ۾ گھٽ 4 اکرن جو هجڻ گهرجي',
    errPasswordMismatch: 'پاسورڊ مچ نٿا ٿين!',
    errShopNameRequired: 'مهرباني ڪري دڪان جو نالو درج ڪريو',
    errMarketYardRequired: 'مهرباني ڪري منڊي جو نالو درج ڪريو',
    errShopAddressRequired: 'مهرباني ڪري پتو درج ڪريو',

    otpHeading: 'هڪ-باري تصديقي OTP',
    otpSubtitle: (phone) => `+91 ${phone} تي موڪليل 6 انگن جو ڪوڊ درج ڪريو`,
    btnVerifyOtp: 'OTP تصديق ڪريو & اڳتي وڌو',
    commodityHeading: 'تجارت واريون فصلون چونڊيو',
    commoditySubtitle: 'منڊي ۾ وکرو ٿيندڙ جنسون چونڊيو',
    btnCompleteSignup: 'منڊي سائن اپ مڪمل ڪريو',
  },
};

interface Props {
  onComplete: () => void;
}

export const OnboardingAuthScreen: React.FC<Props> = ({ onComplete }) => {
  const {
    language,
    setLanguage,
    setPortalMode,
    merchantProfile,
    updateMerchantProfile,
    registeredAccounts,
    registerNewAccount,
    switchUserAccount,
    verifyPasswordAndLogin,
    resetUserPassword,
    setUserCommodities,
    deleteRegisteredAccount,
  } = useMandi();

  // Auth Mode State
  const [authMode, setAuthMode] = useState<AuthViewMode>('signup');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');

  // Input Fields
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<'request' | 'otp' | 'new-password'>('request');
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string[]>(['1', '2', '3', '4', '5', '6']);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  // Sign Up Form State
  const [signupStep, setSignupStep] = useState<SignupStep>('details');
  const [signupSubStep, setSignupSubStep] = useState<1 | 2 | 3 | 4>(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [shopName, setShopName] = useState<string>('');
  const [shopNumber, setShopNumber] = useState<string>('');
  const [shopAddress, setShopAddress] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('Telangana');
  const [marketYard, setMarketYard] = useState<string>('');
  const [apmcLicense, setApmcLicense] = useState<string>('');

  // Sign Up OTP state
  const [signupOtp, setSignupOtp] = useState<string[]>(['1', '2', '3', '4', '5', '6']);

  // Sign Up Commodity Selection
  const [selectedCommodities, setSelectedCommodities] = useState<CommodityCategory[]>(['flowers']);

  // UI status
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Saved accounts deletion confirmation
  const [confirmingDeletePhone, setConfirmingDeletePhone] = useState<string | null>(null);

  const currentLangInfo = getLanguageInfo(language);

  // Quick 1-Click Login for Saved Accounts
  const handleQuickAccountLogin = (acct: (typeof registeredAccounts)[0]) => {
    sounds.playBidTick();
    switchUserAccount(acct.phoneNumber);
    setPortalMode('merchant');

    const restoredCommodities: CommodityCategory[] =
      acct.selectedCommodities && acct.selectedCommodities.length > 0
        ? (acct.selectedCommodities as CommodityCategory[])
        : (['flowers'] as CommodityCategory[]);
    setUserCommodities(restoredCommodities);

    try {
      localStorage.setItem('bharatmandi_onboarding_completed', 'true');
      localStorage.setItem('bharatmandi_user_role', 'merchant');
      localStorage.setItem('bharatmandi_active_phone_v1', acct.phoneNumber);
      localStorage.setItem('bharatmandi_user_commodities', JSON.stringify(restoredCommodities));
    } catch {}

    sounds.playGavelStrike();
    onComplete();
  };

  // Standard Password Login (No OTP)
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your mobile number or email address');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    sounds.playBidTick();

    setTimeout(() => {
      const result = verifyPasswordAndLogin(loginIdentifier, loginPassword);
      setIsSubmitting(false);

      if (!result.success) {
        setErrorMsg(result.error || 'Invalid credentials');
        sounds.playTrashSound?.();
        return;
      }

      // Login Successful
      sounds.playCashChime();
      setPortalMode('merchant');
      if (result.account?.selectedCommodities && result.account.selectedCommodities.length > 0) {
        setUserCommodities(result.account.selectedCommodities);
      }

      try {
        localStorage.setItem('bharatmandi_onboarding_completed', 'true');
        localStorage.setItem('bharatmandi_user_role', 'merchant');
        if (result.account?.phoneNumber) {
          localStorage.setItem('bharatmandi_active_phone_v1', result.account.phoneNumber);
        }
      } catch {}

      onComplete();
    }, 400);
  };

  // Forgot Password Flow
  const handleForgotRequestOtp = async () => {
    setErrorMsg('');
    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your registered mobile number or email');
      return;
    }

    setIsSubmitting(true);
    if (authMethod === 'phone') {
      const res = await sendPhoneOtp(forgotIdentifier);
      setIsSubmitting(false);
      if (res.simulated) {
        setForgotOtp(['1', '2', '3', '4', '5', '6']);
      } else {
        setForgotOtp(['', '', '', '', '', '']);
      }
    } else {
      setIsSubmitting(false);
      setForgotOtp(['1', '2', '3', '4', '5', '6']);
    }

    setForgotStep('otp');
    sounds.playBidTick();
  };

  const handleForgotVerifyOtp = () => {
    const code = forgotOtp.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP code');
      return;
    }
    setErrorMsg('');
    setForgotStep('new-password');
    sounds.playCashChime();
  };

  const handleForgotResetSubmit = () => {
    setErrorMsg('');
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    const res = resetUserPassword(forgotIdentifier, newPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to reset password');
      return;
    }

    setSuccessMsg('Password reset successfully! Logging you in...');
    sounds.playGavelStrike();

    setTimeout(() => {
      verifyPasswordAndLogin(forgotIdentifier, newPassword);
      setPortalMode('merchant');
      try {
        localStorage.setItem('bharatmandi_onboarding_completed', 'true');
      } catch {}
      onComplete();
    }, 1000);
  };

  const signupTrans = SIGNUP_TRANSLATIONS[language] || SIGNUP_TRANSLATIONS.en;

  // Sign Up Flow Sub-Step Navigation Handlers
  const handleStep1Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = signupTrans.errFullNameRequired;
    } else if (/[0-9]/.test(fullName)) {
      errors.fullName = signupTrans.errFullNameNoNumbers;
    }

    const phoneVal = validateIndianMobile(signupPhone);
    if (!phoneVal.isValid) {
      errors.signupPhone = signupTrans.errPhoneRequired;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    sounds.playBidTick();
    setSignupSubStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!signupPassword || signupPassword.length < 4) {
      errors.signupPassword = signupTrans.errPasswordMinLength;
    }
    if (signupPassword !== signupConfirmPassword) {
      errors.signupConfirmPassword = signupTrans.errPasswordMismatch;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    sounds.playBidTick();
    setSignupSubStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep3Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!shopName.trim()) {
      errors.shopName = signupTrans.errShopNameRequired;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    sounds.playBidTick();
    setSignupSubStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep4Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!marketYard.trim()) {
      errors.marketYard = signupTrans.errMarketYardRequired;
    }
    if (!shopAddress.trim()) {
      errors.shopAddress = signupTrans.errShopAddressRequired;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    sounds.playBidTick();

    const phoneVal = validateIndianMobile(signupPhone);
    const cleanPhone = phoneVal.cleanNumber || cleanIndianMobile(signupPhone);

    const res = await sendPhoneOtp(cleanPhone);
    setIsSubmitting(false);

    if (res.simulated) {
      setSignupOtp(['1', '2', '3', '4', '5', '6']);
    } else {
      setSignupOtp(['', '', '', '', '', '']);
    }

    setSignupStep('otp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sounds.playCashChime();
  };

  const handleStepBack = () => {
    setFieldErrors({});
    sounds.playBidTick();
    if (signupSubStep > 1) {
      setSignupSubStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToStep = (targetStep: 1 | 2 | 3 | 4) => {
    if (targetStep === signupSubStep) return;
    if (targetStep < signupSubStep) {
      setErrorMsg('');
      sounds.playBidTick();
      setSignupSubStep(targetStep);
      return;
    }

    // Validate sequentially if jumping forward
    if (signupSubStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg(signupTrans.errFullNameRequired);
        return;
      }
      if (/[0-9]/.test(fullName)) {
        setErrorMsg(signupTrans.errFullNameNoNumbers);
        return;
      }
      const phoneVal = validateIndianMobile(signupPhone);
      if (!phoneVal.isValid) {
        setErrorMsg(signupTrans.errPhoneRequired);
        return;
      }
      if (targetStep === 2) {
        setSignupSubStep(2);
        return;
      }
    }

    if (signupSubStep <= 2 && targetStep >= 3) {
      if (!signupPassword || signupPassword.length < 4) {
        setErrorMsg(signupTrans.errPasswordMinLength);
        return;
      }
      if (signupPassword !== signupConfirmPassword) {
        setErrorMsg(signupTrans.errPasswordMismatch);
        return;
      }
      if (targetStep === 3) {
        setSignupSubStep(3);
        return;
      }
    }

    if (signupSubStep <= 3 && targetStep === 4) {
      if (!shopName.trim()) {
        setErrorMsg(signupTrans.errShopNameRequired);
        return;
      }
      setSignupSubStep(4);
    }
  };

  // Sign Up Flow - Step 2: Verify One-Time OTP
  const handleSignupVerifyOtp = async () => {
    const entered = signupOtp.join('');
    if (entered.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    setIsSubmitting(true);
    if (isSupabaseConfigured()) {
      const verifyRes = await verifyPhoneOtp(signupPhone, entered);
      if (!verifyRes.success) {
        setIsSubmitting(false);
        setErrorMsg(verifyRes.error || 'Invalid OTP code. Please check and try again.');
        return;
      }
    }

    setIsSubmitting(false);
    setSignupStep('commodities');
    sounds.playCashChime();
  };

  // Sign Up Flow - Step 3: Complete Sign Up & Select Commodities
  const handleSignupComplete = () => {
    if (selectedCommodities.length === 0) {
      setErrorMsg('Please select at least one commodity category (e.g. Flowers, Vegetables, Grains)');
      return;
    }

    const cleanPhone = cleanIndianMobile(signupPhone);

    const regResult = registerNewAccount({
      role: 'merchant',
      fullName,
      phoneNumber: cleanPhone,
      email: signupEmail,
      password: signupPassword,
      shopOrVillage: shopName,
      shopAddress,
      shopNumber: shopNumber || 'Shop 1',
      state: selectedState,
      marketName: marketYard,
      apmcLicense,
      licenseOrCrop: apmcLicense || selectedCommodities.join(', '),
      selectedCommodities,
    });

    if (!regResult.success) {
      setErrorMsg(regResult.error || 'Registration failed');
      return;
    }

    updateMerchantProfile({
      shopName,
      ownerName: fullName,
      shopNumber: shopNumber || 'Shop 1',
      apmcMarketName: marketYard,
      address: `${shopAddress}, ${selectedState}`,
      licenseNumber: apmcLicense || 'Verified Mandi Adathiya',
      phoneNumber: cleanPhone,
    });

    setUserCommodities(selectedCommodities);
    setPortalMode('merchant');

    try {
      localStorage.setItem('bharatmandi_onboarding_completed', 'true');
      localStorage.setItem('bharatmandi_user_role', 'merchant');
      localStorage.setItem('bharatmandi_active_phone_v1', cleanPhone);
      localStorage.setItem('bharatmandi_user_commodities', JSON.stringify(selectedCommodities));
    } catch {}

    sounds.playGavelStrike();
    onComplete();
  };

  const toggleCommodity = (cat: CommodityCategory) => {
    sounds.playBidTick();
    if (selectedCommodities.includes(cat)) {
      if (selectedCommodities.length > 1) {
        setSelectedCommodities(selectedCommodities.filter((c) => c !== cat));
      }
    } else {
      setSelectedCommodities([...selectedCommodities, cat]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col justify-between font-sans relative selection:bg-[#1a3a52] selection:text-white p-3 sm:p-6 md:p-8">
      {/* Header Bar with Logo and Language Selector */}
      <header className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <img
            src="/bharat_mandi_logo.png"
            alt="Bharat Mandi Logo"
            referrerPolicy="no-referrer"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 bg-transparent"
          />
          <div>
            <h1 className="font-black text-lg sm:text-xl text-[#1a3a52] tracking-tight">
              भारत MANDI • Merchant Ledger
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Multi-Commodity Adathiya Settlement &amp; Parchi System
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLangModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-[#1a3a52] text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition cursor-pointer"
        >
          <Globe className="w-4 h-4 text-[#1a3a52]" />
          <span className="font-black text-slate-800">{currentLangInfo.nativeName}</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">
            Language
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <LanguageSettingsModal
          isOpen={isLangModalOpen}
          onClose={() => setIsLangModalOpen(false)}
          currentLanguage={language}
          onSelectLanguage={(lang) => setLanguage(lang)}
        />
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-auto py-6 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 text-xs font-bold space-y-2 animate-in fade-in duration-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-sm font-extrabold">{errorMsg}</span>
            </div>
            {(errorMsg.toLowerCase().includes('not registered') || errorMsg.toLowerCase().includes('sign up first')) && (
              <div className="pt-2 border-t border-red-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-red-700 font-medium">Create your merchant account now in 1 minute:</span>
                <button
                  type="button"
                  id="error-banner-signup-btn"
                  onClick={() => {
                    sounds.playBidTick();
                    setAuthMode('signup');
                    setSignupStep('details');
                    if (loginIdentifier.replace(/\D/g, '').length === 10) {
                      setSignupPhone(loginIdentifier.replace(/\D/g, ''));
                    } else if (loginIdentifier.includes('@')) {
                      setSignupEmail(loginIdentifier);
                    }
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="px-4 py-2 bg-[#1a3a52] hover:bg-[#122839] text-white rounded-xl text-xs font-black transition cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5"
                >
                  <span>Sign Up New Merchant Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
                </button>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =========================================================================
            MODE 1: LOG IN (Password Based, No OTP required)
           ========================================================================= */}
        {authMode === 'login' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#1a3a52] bg-[#eef3f7] px-3.5 py-1 rounded-full inline-block">
                Merchant Sign In
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1e293b]">
                Log In to Your Mandi Ledger
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Enter your mobile number or email and password to log in directly
              </p>
            </div>

            {/* Saved Accounts on Device */}
            {registeredAccounts.length > 0 && (
              <div className="bg-[#f8fafc] rounded-2xl border-2 border-[#d4af37]/40 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1a3a52]">
                      Saved Accounts on this Device
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {registeredAccounts.length} saved
                  </span>
                </div>

                <div className="space-y-2">
                  {registeredAccounts.map((acct) => (
                    <div
                      key={acct.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#1a3a52] transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#1a3a52] text-[#d4af37] flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-[#1e293b] truncate">
                            {acct.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {acct.shopOrVillage} • +91 {acct.phoneNumber}
                          </p>
                        </div>
                      </div>

                      {confirmingDeletePhone === acct.phoneNumber ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-1.5 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              deleteRegisteredAccount(acct.phoneNumber);
                              setConfirmingDeletePhone(null);
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-red-600 text-white rounded-lg cursor-pointer"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeletePhone(null)}
                            className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickAccountLogin(acct)}
                            className="px-3.5 py-2 text-xs font-black rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <span>Log In Directly</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmingDeletePhone(acct.phoneNumber)}
                            title="Remove account from device"
                            className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="login-identifier-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                  Mobile Number or Email Address *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <Phone className="w-5 h-5" />
                  </span>
                  <input
                    id="login-identifier-input"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 9849012345 or merchant@mandi.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-semibold text-sm text-[#1e293b] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password-input" className="text-xs font-black uppercase tracking-wider text-[#1a3a52]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playBidTick();
                      setAuthMode('forgot-password');
                      setForgotStep('request');
                      setForgotIdentifier(loginIdentifier);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-[#1a3a52] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your merchant password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-semibold text-sm text-[#1e293b] outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Log In to Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#d4af37]" />
              </button>

              {/* Small letters switch to Sign Up */}
              <div className="text-center pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    id="switch-to-signup-btn"
                    onClick={() => {
                      sounds.playBidTick();
                      setAuthMode('signup');
                      setSignupStep('details');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="font-black text-[#1a3a52] hover:underline cursor-pointer ml-1"
                  >
                    Sign Up New Merchant
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            MODE 2: FORGOT PASSWORD FLOW
           ========================================================================= */}
        {authMode === 'forgot-password' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-xl font-black text-[#1e293b]">Reset Merchant Password</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-[#1a3a52] cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>

            {forgotStep === 'request' && (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Enter your registered mobile number or email address. We will send a 6-digit OTP code to verify your identity.
                </p>

                <div>
                  <label htmlFor="forgot-identifier-input" className="block text-xs font-black uppercase text-[#1a3a52] mb-1">
                    Registered Mobile Number or Email *
                  </label>
                  <input
                    id="forgot-identifier-input"
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="9849012345 or email@domain.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-semibold text-sm text-[#1e293b] outline-none"
                  />
                </div>

                <button
                  type="button"
                  id="btn-forgot-send-otp"
                  onClick={handleForgotRequestOtp}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-md cursor-pointer"
                >
                  Send Reset OTP Code
                </button>
              </div>
            )}

            {forgotStep === 'otp' && (
              <div className="space-y-4 text-center">
                <p className="text-xs sm:text-sm text-slate-600">
                  Enter the 6-digit reset code sent to <strong>{forgotIdentifier}</strong>:
                </p>

                <div className="flex justify-center gap-2 my-2">
                  {forgotOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`forgot-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newOtp = [...forgotOtp];
                        newOtp[idx] = val;
                        setForgotOtp(newOtp);
                        if (val && idx < 5) {
                          document.getElementById(`forgot-otp-${idx + 1}`)?.focus();
                        }
                      }}
                      className="w-10 h-12 text-center text-xl font-mono font-black border-2 border-slate-300 focus:border-[#1a3a52] rounded-xl outline-none"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  id="btn-forgot-verify-otp"
                  onClick={handleForgotVerifyOtp}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1a3a52] text-white font-black text-sm transition shadow-md cursor-pointer"
                >
                  Verify Reset Code
                </button>
              </div>
            )}

            {forgotStep === 'new-password' && (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600">
                  Set a new password for your account:
                </p>

                <div>
                  <label htmlFor="new-password-input" className="block text-xs font-black uppercase text-[#1a3a52] mb-1">
                    New Password *
                  </label>
                  <input
                    id="new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-semibold text-sm text-[#1e293b] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-new-password-input" className="block text-xs font-black uppercase text-[#1a3a52] mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    id="confirm-new-password-input"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-semibold text-sm text-[#1e293b] outline-none"
                  />
                </div>

                <button
                  type="button"
                  id="btn-forgot-save-password"
                  onClick={handleForgotResetSubmit}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition shadow-md cursor-pointer"
                >
                  Reset Password &amp; Log In
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            MODE 3: SIGN UP (Compact Step-by-Step Flow with Zero Scrolling)
           ========================================================================= */}
        {authMode === 'signup' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-slate-200 shadow-md space-y-4 max-w-lg mx-auto">
            {/* Header / Single Thin Progress Bar */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#1a3a52] pb-0.5">
                <span>{signupTrans.merchantSignUp}</span>
                <span>
                  {signupSubStep === 1
                    ? signupTrans.step1Title
                    : signupSubStep === 2
                    ? signupTrans.step2Title
                    : signupSubStep === 3
                    ? signupTrans.step3Title
                    : signupTrans.step4Title}
                </span>
              </div>

              {signupStep === 'details' && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-[#1a3a52] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(signupSubStep / 4) * 100}%` }}
                  />
                </div>
              )}

              <h2 className="text-lg sm:text-xl font-black text-[#1e293b] pt-1">
                {signupStep === 'details'
                  ? signupTrans.heading
                  : signupStep === 'otp'
                  ? signupTrans.otpHeading
                  : signupTrans.commodityHeading}
              </h2>

              {(signupStep === 'otp' || signupStep === 'commodities') && (
                <p className="text-xs text-slate-500 font-medium truncate">
                  {signupStep === 'otp'
                    ? signupTrans.otpSubtitle(signupPhone)
                    : signupTrans.commoditySubtitle}
                </p>
              )}
            </div>

            {/* SIGN UP WIZARD (SHOWING 1 STEP AT A TIME) */}
            {signupStep === 'details' && (
              <div className="space-y-4">
                {/* SUB-STEP 1: PERSONAL DETAILS */}
                {signupSubStep === 1 && (
                  <form onSubmit={handleStep1Next} className="space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label htmlFor="signup-fullname-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.fullNameLabel}
                      </label>
                      <input
                        id="signup-fullname-input"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: undefined });
                        }}
                        placeholder={signupTrans.fullNamePlaceholder}
                        className={`w-full px-3 py-2.5 rounded-xl border-2 font-semibold text-sm text-[#1e293b] outline-none bg-white ${
                          fieldErrors.fullName ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-[#1a3a52]'
                        }`}
                        autoFocus
                      />
                      {fieldErrors.fullName && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-phone-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.mobileLabel}
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 font-bold text-slate-500 text-sm">🇮🇳 +91</span>
                        <input
                          id="signup-phone-input"
                          type="tel"
                          maxLength={10}
                          value={signupPhone}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 0 && !/[6-9]/.test(val[0])) {
                              val = '';
                            }
                            setSignupPhone(val.slice(0, 10));
                            if (fieldErrors.signupPhone) setFieldErrors({ ...fieldErrors, signupPhone: undefined });
                          }}
                          placeholder={signupTrans.mobilePlaceholder}
                          className={`w-full pl-20 pr-3 py-2.5 rounded-xl border-2 font-mono font-bold text-sm text-[#1e293b] outline-none bg-white ${
                            fieldErrors.signupPhone ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-[#1a3a52]'
                          }`}
                        />
                      </div>
                      {fieldErrors.signupPhone && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.signupPhone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-email-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.emailLabel}
                      </label>
                      <input
                        id="signup-email-input"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder={signupTrans.emailPlaceholder}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-semibold text-sm text-[#1e293b] outline-none bg-white"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        id="btn-signup-step1-next"
                        className="w-full py-3 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <span>{signupTrans.btnNext}</span>
                        <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-STEP 2: PASSWORD */}
                {signupSubStep === 2 && (
                  <form onSubmit={handleStep2Next} className="space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label htmlFor="signup-password-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.passwordLabel}
                      </label>
                      <div className="relative">
                        <input
                          id="signup-password-input"
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={(e) => {
                            setSignupPassword(e.target.value);
                            if (fieldErrors.signupPassword) setFieldErrors({ ...fieldErrors, signupPassword: undefined });
                          }}
                          placeholder={signupTrans.passwordPlaceholder}
                          className={`w-full pl-3 pr-11 py-2.5 rounded-xl border-2 font-semibold text-sm text-[#1e293b] outline-none bg-white ${
                            fieldErrors.signupPassword ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-[#1a3a52]'
                          }`}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.signupPassword && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.signupPassword}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-confirmpassword-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.confirmPasswordLabel}
                      </label>
                      <input
                        id="signup-confirmpassword-input"
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupConfirmPassword}
                        onChange={(e) => {
                          setSignupConfirmPassword(e.target.value);
                          if (fieldErrors.signupConfirmPassword) setFieldErrors({ ...fieldErrors, signupConfirmPassword: undefined });
                        }}
                        placeholder={signupTrans.confirmPasswordPlaceholder}
                        className={`w-full px-3 py-2.5 rounded-xl border-2 font-semibold text-sm text-[#1e293b] outline-none bg-white ${
                          fieldErrors.signupConfirmPassword || (signupConfirmPassword && signupPassword !== signupConfirmPassword)
                            ? 'border-red-400 bg-red-50/30'
                            : 'border-slate-200 focus:border-[#1a3a52]'
                        }`}
                      />
                      {(fieldErrors.signupConfirmPassword || (signupConfirmPassword && signupPassword !== signupConfirmPassword)) && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">
                          {fieldErrors.signupConfirmPassword || signupTrans.errPasswordMismatch}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleStepBack}
                        className="px-4 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                        <span>{signupTrans.btnBack}</span>
                      </button>

                      <button
                        type="submit"
                        id="btn-signup-step2-next"
                        className="flex-1 py-3 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <span>{signupTrans.btnNext}</span>
                        <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-STEP 3: SHOP DETAILS */}
                {signupSubStep === 3 && (
                  <form onSubmit={handleStep3Next} className="space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label htmlFor="signup-shopname-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.shopNameLabel}
                      </label>
                      <input
                        id="signup-shopname-input"
                        type="text"
                        value={shopName}
                        onChange={(e) => {
                          setShopName(e.target.value);
                          if (fieldErrors.shopName) setFieldErrors({ ...fieldErrors, shopName: undefined });
                        }}
                        placeholder={signupTrans.shopNamePlaceholder}
                        className={`w-full px-3 py-2.5 rounded-xl border-2 font-semibold text-sm text-[#1e293b] outline-none bg-white ${
                          fieldErrors.shopName ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-[#1a3a52]'
                        }`}
                        autoFocus
                      />
                      {fieldErrors.shopName && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.shopName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-shopnumber-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.shopNumberLabel}
                      </label>
                      <input
                        id="signup-shopnumber-input"
                        type="text"
                        value={shopNumber}
                        onChange={(e) => setShopNumber(e.target.value)}
                        placeholder={signupTrans.shopNumberPlaceholder}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-mono font-semibold text-sm text-[#1e293b] outline-none bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleStepBack}
                        className="px-4 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                        <span>{signupTrans.btnBack}</span>
                      </button>

                      <button
                        type="submit"
                        id="btn-signup-step3-next"
                        className="flex-1 py-3 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <span>{signupTrans.btnNext}</span>
                        <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-STEP 4: MARKET DETAILS */}
                {signupSubStep === 4 && (
                  <form onSubmit={handleStep4Submit} className="space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label htmlFor="signup-state-select" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.stateLabel}
                      </label>
                      <select
                        id="signup-state-select"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#1a3a52] font-bold text-sm text-[#1e293b] outline-none bg-white"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="signup-marketyard-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.marketYardLabel}
                      </label>
                      <input
                        id="signup-marketyard-input"
                        type="text"
                        value={marketYard}
                        onChange={(e) => {
                          setMarketYard(e.target.value);
                          if (fieldErrors.marketYard) setFieldErrors({ ...fieldErrors, marketYard: undefined });
                        }}
                        placeholder={signupTrans.marketYardPlaceholder}
                        className={`w-full px-3 py-2.5 rounded-xl border-2 font-semibold text-sm text-[#1e293b] outline-none bg-white ${
                          fieldErrors.marketYard ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-[#1a3a52]'
                        }`}
                        autoFocus
                      />
                      {fieldErrors.marketYard && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.marketYard}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="signup-shopaddress-input" className="block text-xs font-black uppercase tracking-wider text-[#1a3a52] mb-1">
                        {signupTrans.shopAddressLabel}
                      </label>
                      <input
                        id="signup-shopaddress-input"
                        type="text"
                        value={shopAddress}
                        onChange={(e) => {
                          setShopAddress(e.target.value);
                          if (fieldErrors.shopAddress) setFieldErrors({ ...fieldErrors, shopAddress: undefined });
                        }}
                        placeholder={signupTrans.shopAddressPlaceholder}
                        className={`w-full px-3 py-2.5 rounded-xl border-2 font-semibold text-sm text-[#1e293b] outline-none bg-white ${
                          fieldErrors.shopAddress ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-[#1a3a52]'
                        }`}
                      />
                      {fieldErrors.shopAddress && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.shopAddress}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleStepBack}
                        className="px-4 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                        <span>{signupTrans.btnBack}</span>
                      </button>

                      <button
                        type="submit"
                        id="btn-signup-request-otp"
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <span>{signupTrans.btnGetOtp}</span>
                        <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Already have an account? Log In footer link */}
                <div className="text-center pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">
                    {signupTrans.alreadyHaveAccount}{' '}
                    <button
                      type="button"
                      id="switch-to-login-btn"
                      onClick={() => {
                        sounds.playBidTick();
                        setAuthMode('login');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="font-black text-[#1a3a52] hover:underline cursor-pointer ml-1"
                    >
                      {signupTrans.loginLink}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* SIGN UP STEP 2: ONE-TIME OTP CODE */}
            {signupStep === 'otp' && (
              <div className="space-y-4 text-center animate-in fade-in duration-150">
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <p className="font-bold text-sm">One-Time Verification OTP Required at Sign Up</p>
                  <p>You will not need an OTP to log in in the future. Just your mobile &amp; password!</p>
                </div>

                <div className="flex justify-center gap-2 my-2">
                  {signupOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`signup-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newOtp = [...signupOtp];
                        newOtp[idx] = val;
                        setSignupOtp(newOtp);
                        if (val && idx < 5) {
                          document.getElementById(`signup-otp-${idx + 1}`)?.focus();
                        }
                      }}
                      className="w-10 h-12 text-center text-xl font-mono font-black border-2 border-slate-300 focus:border-[#1a3a52] rounded-xl outline-none"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  id="btn-signup-verify-otp"
                  onClick={handleSignupVerifyOtp}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{signupTrans.btnVerifyOtp}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
                </button>
              </div>
            )}

            {/* SIGN UP STEP 3: COMMODITY SELECTION */}
            {signupStep === 'commodities' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <p className="text-xs sm:text-sm text-slate-600 text-center">
                  {signupTrans.commoditySubtitle}:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ALL_COMMODITIES.map((catKey) => {
                    const cfg = COMMODITY_CONFIGS[catKey];
                    if (!cfg) return null;
                    const isSelected = selectedCommodities.includes(catKey);

                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => toggleCommodity(catKey)}
                        className={`p-3 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a3a52] text-white border-[#1a3a52] shadow-md scale-[1.01]'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-2xl shrink-0">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-sm">{cfg.name}</h3>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" />}
                          </div>
                          <p className={`text-[11px] mt-0.5 truncate ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                            {cfg.varieties.map((v) => v.en.split(' ')[0]).join(', ')}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  id="btn-signup-complete-enter"
                  onClick={handleSignupComplete}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>{signupTrans.btnCompleteSignup}</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center pt-4 border-t border-slate-200 text-xs text-slate-500">
        <p className="font-medium">
          भारत MANDI Wholesale Form C Settlement System • Browser Local Storage Active
        </p>
      </footer>
    </div>
  );
};

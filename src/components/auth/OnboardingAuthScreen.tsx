import React, { useState } from 'react';
import {
  Store,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  Check,
  ChevronRight,
  AlertCircle,
  Mail,
  Lock,
  KeyRound,
  Layers,
  Sparkles,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useMandi } from '../../context/MandiContext';
import { Language, CommodityCategory, WeightUnit } from '../../types';
import { sounds } from '../../utils/audio';
import { COMMODITY_CONFIGS } from '../../data/initialData';
import { LanguageSettingsModal } from '../common/LanguageSettingsModal';
import { getLanguageInfo } from '../../data/indianLanguages';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { validateIndianMobile, cleanIndianMobile } from '../../utils/phoneValidation';
import { checkCloudDuplicateRegistration } from '../../services/supabaseSync';
import { sendPhoneOtp, verifyPhoneOtp, isSupabaseConfigured } from '../../services/supabase';

type Role = 'farmer' | 'merchant';
type AuthStep = 'step1-role' | 'step2-auth' | 'step2-otp' | 'step2-profile' | 'step3-commodities';
type AuthMethod = 'phone' | 'email';

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
    addFarmer,
    setActiveFarmerId,
    registeredAccounts,
    registerNewAccount,
    switchUserAccount,
    checkUniqueness,
    setUserCommodities,
    deleteRegisteredAccount,
    farmers,
  } = useMandi();

  // Step state
  const [step, setStep] = useState<AuthStep>('step1-role');
  const [selectedRole, setSelectedRole] = useState<Role>('farmer');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  // Step 2: Phone / Email & Auth state
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);

  const currentLangInfo = getLanguageInfo(language);
  const [otp, setOtp] = useState<string[]>(['1', '2', '3', '4', '5', '6']);
  const [isOtpSending, setIsOtpSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // Confirmation state for deleting saved account from device
  const [confirmingDeletePhone, setConfirmingDeletePhone] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<(typeof registeredAccounts)[0] | null>(null);

  // Profile setup fields
  const [name, setName] = useState<string>('');
  const [shopOrVillage, setShopOrVillage] = useState<string>('');
  const [shopAddress, setShopAddress] = useState<string>('');
  const [shopNumber, setShopNumber] = useState<string>('');
  const [marketName, setMarketName] = useState<string>('');

  // Step 3: Commodity Selection & Optional Preferred Units (User chooses 1 or more)
  const [selectedCommodities, setSelectedCommodities] = useState<CommodityCategory[]>([
    'flowers',
  ]);

  const [preferredUnits, setPreferredUnits] = useState<Record<CommodityCategory, WeightUnit>>({
    flowers: 'Kgs',
    grains: 'Bags',
    vegetables: 'Crates',
    fruits: 'Boxes',
  });

  // Content per language
  const content = {
    en: {
      appName: 'Agricultural Marketplace Settlement Tracker',
      appSub: 'Multi-Commodity Settlement & Ledger for Farmers & Merchants',
      step1Badge: 'Step 1 of 3: Role Selection',
      step1Title: 'Sign Up / Login to AgriMarket',
      step1Sub: 'Choose your role in the agricultural marketplace:',
      farmerTitle: 'FARMER / GROWER',
      farmerDesc: 'I grow and bring agricultural commodities to the mandi and sell them.',
      farmerBtn: 'Continue as Farmer',
      farmerFeatures: [
        'Track sales for any commodity (Flowers, Grains, Veggies, Fruits)',
        'View net earnings and payment status',
        'Download instant settlement slips (Parchi)',
      ],
      merchantTitle: 'MERCHANT / MANDI SHOP OWNER',
      merchantDesc: 'I run a shop/auction center in the mandi and handle consignments from farmers.',
      merchantBtn: 'Continue as Merchant',
      merchantFeatures: [
        'Manage multiple farmer consignments & lots',
        'Flexible per-transaction deductions & commission',
        'Print-ready professional settlement ledgers',
      ],
      step2Badge: 'Step 2 of 3: Authentication',
      step2Title: 'Phone Number / Email Verification',
      step2Sub: 'Sign in or create your isolated agricultural ledger account',
      phoneTab: 'Mobile Number',
      emailTab: 'Email Address',
      phoneLabel: 'Mobile Number',
      emailLabel: 'Email Address',
      passwordLabel: 'Create Password / PIN',
      passwordHint: 'Used to secure your transactions and settlements',
      sendOtpBtn: 'Send 6-Digit Verification Code',
      otpTitle: 'Enter Verification Code',
      otpSub: 'Enter the 6-digit code sent to ',
      verifyBtn: 'Verify & Continue',
      profileTitle: 'Complete Your Profile',
      profileSub: 'Setup your identity on the Mandi ledger',
      fullName: 'Full Name *',
      shopName: 'Shop / Firm Name *',
      shopAddress: 'Shop / Yard Address *',
      villageName: 'Village Name *',
      step3Badge: 'Step 3 of 3: Select Commodities',
      step3Title: 'Select Commodities You Work With',
      step3Sub: 'Choose the crops and produce you grow or trade (select multiple):',
      unitOptionTitle: 'Preferred Unit (Optional)',
      completeBtn: 'Complete Setup & Enter Dashboard',
      backBtn: 'Back',
      selectAll: 'Select All 4',
    },
    te: {
      appName: 'వ్యవసాయ మార్కెట్ సెటిల్మెంట్ ట్రాకర్',
      appSub: 'రైతులు మరియు వ్యాపారుల కోసం మల్టీ-కమోడిటీ లెడ్జర్',
      step1Badge: 'దశ 1: పాత్రను ఎంచుకోండి',
      step1Title: 'సైన్ అప్ / లాగిన్',
      step1Sub: 'వ్యవసాయ మార్కెట్లో మీ పాత్రను ఎంచుకోండి:',
      farmerTitle: 'రైతు / సాగుదారుడు',
      farmerDesc: 'నేను వ్యవసాయ ఉత్పత్తులను పండించి మండీలో విక్రయిస్తాను.',
      farmerBtn: 'రైతుగా కొనసాగండి',
      farmerFeatures: [
        'అన్ని పంటల అమ్మకాలను ట్రాక్ చేయండి (పూలు, ధాన్యాలు, కూరగాయలు, పండ్లు)',
        'నికర ఆదాయం మరియు చెల్లింపు వివరాలను చూడండి',
        'సెటిల్మెంట్ పట్టీలను డౌన్‌లోడ్ చేసుకోండి',
      ],
      merchantTitle: 'మండి వ్యాపారి / ఆడ్తీ',
      merchantDesc: 'నాకు మండీలో షాపు/వేలం కేంద్రం ఉంది, రైతుల నుండి సరుకులను నిర్వహిస్తాను.',
      merchantBtn: 'వ్యాపారిగా కొనసాగండి',
      merchantFeatures: [
        'బహుళ రైతుల సరుకులు మరియు లాట్‌లను నిర్వహించండి',
        'ప్రతి అమ్మకానికి సులభమైన తగ్గింపులు మరియు కమీషన్',
        'ప్రింట్-రెడీ సెటిల్మెంట్ లెడ్జర్ నివేదికలు',
      ],
      step2Badge: 'దశ 2: ధృవీకరణ',
      step2Title: 'మొబైల్ లేదా ఈమెయిల్ ధృవీకరణ',
      step2Sub: 'మీ ప్రైవేట్ వ్యవసాయ లెడ్జర్ ఖాతాను సృష్టించండి',
      phoneTab: 'మొబైల్ నంబర్',
      emailTab: 'ఈమెయిల్',
      phoneLabel: 'మొబైల్ నంబర్',
      emailLabel: 'ఈమెయిల్ చిరునామా',
      passwordLabel: 'పాస్‌వర్డ్ / పిన్ సృష్టించండి',
      passwordHint: 'మీ ఖాతా భద్రత కోసం ఉపయోగించబడుతుంది',
      sendOtpBtn: '6 అంకెల OTP కోడ్ పంపండి',
      otpTitle: 'OTP కోడ్ నమోదు చేయండి',
      otpSub: 'ఈ నంబరుకు 6 అంకెల OTP పంపాము: ',
      verifyBtn: 'ధృవీకరించి కొనసాగించండి',
      profileTitle: 'ప్రొఫైల్ వివరాలు పూర్తి చేయండి',
      profileSub: 'మండీ లెడ్జర్‌లో మీ గుర్తింపును నమోదు చేయండి',
      fullName: 'పూర్తి పేరు *',
      shopName: 'దుకాణం / సంస్థ పేరు *',
      shopAddress: 'దుకాణం చిరునామా *',
      villageName: 'గ్రామం పేరు *',
      step3Badge: 'దశ 3: పంటల ఎంపిక',
      step3Title: 'మీరు పని చేసే పంట రకాలను ఎంచుకోండి',
      step3Sub: 'మీరు పండించే లేదా అమ్మే పంటలను ఎంచుకోండి (ఒకటి కంటే ఎక్కువ ఎంచుకోవచ్చు):',
      unitOptionTitle: 'ఇష్టపడే యూనిట్ (ఐచ్ఛికం)',
      completeBtn: 'సెటప్ పూర్తి చేసి డాష్‌బోర్డ్‌లోకి ప్రవేశించండి',
      backBtn: 'వెనుకకు',
      selectAll: 'అన్నిటినీ ఎంచుకోండి',
    },
    hi: {
      appName: 'कृषि मंडी सेटलमेंट ट्रैकर (Agricultural Marketplace Settlement Tracker)',
      appSub: 'किसान और व्यापारियों के लिए बहु-फसल सेटलमेंट एवं लेजर (Multi-Commodity Settlement & Ledger for Farmers & Merchants)',
      step1Badge: 'चरण 1: भूमिका चुनें',
      step1Title: 'साइन अप / लॉगिन',
      step1Sub: 'कृषि बाजार में अपनी भूमिका चुनें:',
      farmerTitle: 'किसान / उत्पादक',
      farmerDesc: 'मैं कृषि उपज उगाता हूँ और मंडी में बिक्री के लिए लाता हूँ।',
      farmerBtn: 'किसान के रूप में आगे बढ़ें',
      farmerFeatures: [
        'किसी भी फसल के विक्रय को ट्रैक करें (फूल, अनाज, सब्जियां, फल)',
        'कुल शुद्ध आय और भुगतान स्थिति देखें',
        'तुरंत सेटलमेंट पर्ची डाउनलोड करें',
      ],
      merchantTitle: 'मंडी आढ़ती / व्यापारी',
      merchantDesc: 'मंडी में मेरी दुकान/नीलामी केंद्र है और किसानों का माल संभालता हूँ।',
      merchantBtn: 'आढ़ती के रूप में आगे बढ़ें',
      merchantFeatures: [
        'कई किसानों और माल का सुचारू प्रबंधन',
        'प्रति लेन-देन कमीशन और कटौती की सुविधा',
        'प्रिंट-तैयार पेशेवर सेटलमेंट लेजर',
      ],
      step2Badge: 'चरण 2: सत्यापन',
      step2Title: 'मोबाइल या ईमेल सत्यापन',
      step2Sub: 'अपना सुरक्षित कृषि लेजर खाता बनाएं या लॉगिन करें',
      phoneTab: 'मोबाइल नंबर',
      emailTab: 'ईमेल पता',
      phoneLabel: 'मोबाइल नंबर',
      emailLabel: 'ईमेल पता',
      passwordLabel: 'पासवर्ड / पिन बनाएं',
      passwordHint: 'खाते की सुरक्षा के लिए',
      sendOtpBtn: '6 अंकों का कोड भेजें',
      otpTitle: 'सत्यापन कोड दर्ज करें',
      otpSub: '6 अंकों का सत्यापन कोड भेजा गया: ',
      verifyBtn: 'सत्यापित कर आगे बढ़ें',
      profileTitle: 'प्रोफ़ाइल विवरण भरें',
      profileSub: 'मंडी लेजर में अपनी पहचान दर्ज करें',
      fullName: 'पूरा नाम *',
      shopName: 'दुकान / फर्म का नाम *',
      shopAddress: 'दुकान का पूरा पता *',
      villageName: 'गांव का नाम *',
      step3Badge: 'चरण 3: फसल चयन',
      step3Title: 'वे फसलें चुनें जिनमें आप कार्य करते हैं',
      step3Sub: 'सभी फसलें चुनें जो आप उगाते या व्यापार करते हैं (एक से अधिक चुन सकते हैं):',
      unitOptionTitle: 'पसंदीदा इकाई (वैकल्पिक)',
      completeBtn: 'सेटअप पूरा करें और डैशबोर्ड में जाएं',
      backBtn: 'पीछे',
      selectAll: 'सभी चुनें',
    },
  }[language];

  const handleQuickAccountLogin = (acct: (typeof registeredAccounts)[0]) => {
    sounds.playBidTick();
    const phoneVal = validateIndianMobile(acct.phoneNumber);
    if (!phoneVal.isValid) {
      setErrorMsg(phoneVal.error || 'Enter a valid 10-digit Indian mobile number');
      return;
    }
    const cleanPhone = phoneVal.cleanNumber;
    setPhone(cleanPhone);
    const resolvedRole = acct.role;
    setSelectedRole(resolvedRole);
    setPortalMode(resolvedRole);
    switchUserAccount(cleanPhone);

    const restoredCommodities: CommodityCategory[] =
      acct.selectedCommodities && acct.selectedCommodities.length > 0
        ? (acct.selectedCommodities as CommodityCategory[])
        : (['flowers'] as CommodityCategory[]);
    setUserCommodities(restoredCommodities);

    if (resolvedRole === 'farmer') {
      const matchingFarmer = farmers.find(
        (f) =>
          cleanIndianMobile(f.phone) === cleanPhone ||
          f.name.toLowerCase() === acct.fullName.toLowerCase() ||
          f.id === acct.id
      );
      if (matchingFarmer) {
        setActiveFarmerId(matchingFarmer.id);
      }
    }

    try {
      localStorage.setItem('phoolmitra_onboarding_completed', 'true');
      localStorage.setItem('bharatmandi_onboarding_completed', 'true');
      localStorage.setItem('phoolmitra_user_role', resolvedRole);
      localStorage.setItem('bharatmandi_user_role', resolvedRole);
      localStorage.setItem('phoolmitra_active_phone_v1', cleanPhone);
      localStorage.setItem('bharatmandi_active_phone_v1', cleanPhone);
      localStorage.setItem('phoolmitra_user_commodities', JSON.stringify(restoredCommodities));
      localStorage.setItem('bharatmandi_user_commodities', JSON.stringify(restoredCommodities));
    } catch {
      // ignore
    }

    sounds.playGavelStrike();
    onComplete();
  };

  const handleSelectRole = (role: Role, mode: 'signup' | 'login' = 'signup') => {
    sounds.playBidTick();
    setSelectedRole(role);
    setAuthMode(mode);
    setStep('step2-auth');
  };

  const handleSendOtp = async () => {
    setErrorMsg('');

    if (authMethod === 'phone') {
      const phoneVal = validateIndianMobile(phone);
      if (!phoneVal.isValid) {
        setErrorMsg(phoneVal.error || 'Enter a valid 10-digit Indian mobile number');
        return;
      }
      
      const cleanPhone = phoneVal.cleanNumber;

      // Check if phone number is already registered anywhere (local accounts, merchant profile, farmers, or cloud)
      const isAlreadyRegistered =
        registeredAccounts.some((a) => cleanIndianMobile(a.phoneNumber) === cleanPhone) ||
        cleanIndianMobile(merchantProfile.phoneNumber || '') === cleanPhone ||
        farmers.some((f) => cleanIndianMobile(f.phone) === cleanPhone);

      if (isAlreadyRegistered) {
        // Automatically convert to login mode so user enters OTP and logs in directly without credentials prompt
        setAuthMode('login');
      } else if (authMode === 'signup') {
        // Live Database uniqueness check
        try {
          const cloudDup = await checkCloudDuplicateRegistration({ phoneNumber: cleanPhone });
          if (cloudDup.isDuplicate) {
            // Found in cloud database -> switch to login mode seamlessly
            setAuthMode('login');
          }
        } catch {
          // continue
        }
      }
    } else {
      if (!email.includes('@') || !email.includes('.')) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
    }

    setIsOtpSending(true);
    sounds.playBidTick();

    if (authMethod === 'phone') {
      const res = await sendPhoneOtp(phone);
      setIsOtpSending(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to send OTP code');
        return;
      }
      if (res.simulated) {
        setOtp(['1', '2', '3', '4', '5', '6']);
      } else {
        setOtp(['', '', '', '', '', '']);
      }
    } else {
      setIsOtpSending(false);
      setOtp(['1', '2', '3', '4', '5', '6']);
    }

    setStep('step2-otp');
    sounds.playCashChime();
  };

  const handleVerifyOtp = async () => {
    const entered = otp.join('');
    if (entered.length < 6) {
      setErrorMsg('Please enter 6 digits');
      return;
    }

    setIsVerifying(true);
    sounds.playCashChime();

    if (authMethod === 'phone' && isSupabaseConfigured()) {
      const verifyRes = await verifyPhoneOtp(phone, entered);
      if (!verifyRes.success) {
        setIsVerifying(false);
        setErrorMsg(verifyRes.error || 'Invalid OTP code. Please check and try again.');
        return;
      }
    }

    setTimeout(() => {
      setIsVerifying(false);
      const cleanIdentifier =
        authMethod === 'phone'
          ? cleanIndianMobile(phone)
          : email.trim().toLowerCase();

      // 1. Check existing account in registeredAccounts
      let existingAccount = registeredAccounts.find(
        (a) =>
          cleanIndianMobile(a.phoneNumber) === cleanIdentifier ||
          a.phoneNumber === cleanIdentifier
      );

      // 2. If not found in registeredAccounts, check merchant profile
      if (!existingAccount && authMethod === 'phone') {
        const merchantPhone = cleanIndianMobile(merchantProfile.phoneNumber || '');
        if (merchantPhone && merchantPhone === cleanIdentifier) {
          const newAccData = {
            role: 'merchant' as const,
            fullName: merchantProfile.ownerName || merchantProfile.shopName || 'Mandi Merchant',
            phoneNumber: cleanIdentifier,
            shopOrVillage: merchantProfile.shopName || 'Mandi Trading Co.',
            shopAddress: merchantProfile.address || 'APMC Market Yard',
            shopNumber: merchantProfile.shopNumber || 'Shop 1',
            marketName: merchantProfile.apmcMarketName || 'Agri APMC Market Yard',
            licenseOrCrop: 'flowers',
            selectedCommodities: selectedCommodities,
          };
          registerNewAccount(newAccData);
          existingAccount = registeredAccounts.find((a) => cleanIndianMobile(a.phoneNumber) === cleanIdentifier) || {
            id: `USR-${Date.now()}`,
            createdAt: new Date().toISOString().split('T')[0],
            ...newAccData,
          };
        }
      }

      // 3. If not found, check farmers list
      if (!existingAccount && authMethod === 'phone') {
        const matchingFarmer = farmers.find(
          (f) => cleanIndianMobile(f.phone) === cleanIdentifier
        );
        if (matchingFarmer) {
          const newAccData = {
            role: 'farmer' as const,
            fullName: matchingFarmer.name,
            phoneNumber: cleanIdentifier,
            shopOrVillage: matchingFarmer.village || 'Mandi Belt',
            licenseOrCrop: matchingFarmer.primaryCrops?.join(', ') || 'flowers',
            selectedCommodities: selectedCommodities,
          };
          registerNewAccount(newAccData);
          existingAccount = registeredAccounts.find((a) => cleanIndianMobile(a.phoneNumber) === cleanIdentifier) || {
            id: matchingFarmer.id,
            createdAt: new Date().toISOString().split('T')[0],
            ...newAccData,
          };
        }
      }

      // 4. Returning User OR Login Mode: NEVER ask for credentials again! Log in directly.
      if (existingAccount || authMode === 'login') {
        const cleanPhone = existingAccount ? cleanIndianMobile(existingAccount.phoneNumber) : cleanIdentifier;
        const resolvedRole = existingAccount?.role || selectedRole;

        if (!existingAccount) {
          // In login mode with no prior local entry: auto-create account entry to bypass credentials
          const fallbackName = resolvedRole === 'merchant' ? (merchantProfile.ownerName || 'Mandi Merchant') : 'Kisan Member';
          const fallbackShop = resolvedRole === 'merchant' ? (merchantProfile.shopName || 'Mandi Store') : 'Green Valley';
          const newAccData = {
            role: resolvedRole,
            fullName: fallbackName,
            phoneNumber: cleanPhone,
            shopOrVillage: fallbackShop,
            shopAddress: resolvedRole === 'merchant' ? 'APMC Market Yard' : undefined,
            licenseOrCrop: 'flowers',
            selectedCommodities: selectedCommodities,
          };
          registerNewAccount(newAccData);
        }

        switchUserAccount(cleanPhone);
        setPortalMode(resolvedRole);
        setSelectedRole(resolvedRole);

        // Restore saved commodities
        const restoredCommodities: CommodityCategory[] =
          existingAccount?.selectedCommodities && existingAccount.selectedCommodities.length > 0
            ? (existingAccount.selectedCommodities as CommodityCategory[])
            : (selectedCommodities.length > 0 ? selectedCommodities : (['flowers'] as CommodityCategory[]));
        setUserCommodities(restoredCommodities);

        // Restore active farmer ID if farmer role
        if (resolvedRole === 'farmer') {
          const matchingFarmer = farmers.find(
            (f) =>
              cleanIndianMobile(f.phone) === cleanPhone ||
              (existingAccount && f.name.toLowerCase() === existingAccount.fullName.toLowerCase()) ||
              (existingAccount && f.id === existingAccount.id)
          );
          if (matchingFarmer) {
            setActiveFarmerId(matchingFarmer.id);
          }
        }

        // Persist session tokens
        try {
          localStorage.setItem('phoolmitra_onboarding_completed', 'true');
          localStorage.setItem('bharatmandi_onboarding_completed', 'true');
          localStorage.setItem('phoolmitra_user_role', resolvedRole);
          localStorage.setItem('bharatmandi_user_role', resolvedRole);
          localStorage.setItem('phoolmitra_active_phone_v1', cleanPhone);
          localStorage.setItem('bharatmandi_active_phone_v1', cleanPhone);
          localStorage.setItem('phoolmitra_user_commodities', JSON.stringify(restoredCommodities));
          localStorage.setItem('bharatmandi_user_commodities', JSON.stringify(restoredCommodities));
        } catch {
          // ignore
        }

        sounds.playGavelStrike();
        onComplete();
        return;
      }

      // 5. Only NEW users signing up for the first time reach profile setup
      setName('');
      setShopOrVillage('');
      setShopAddress('');
      setShopNumber('');
      setMarketName('Agri APMC Market Yard');
      setValidationError('');
      setStep('step2-profile');
    }, 450);
  };

  const handleSaveProfile = async () => {
    const phoneVal = validateIndianMobile(phone);
    if (!phoneVal.isValid) {
      setValidationError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number');
      return;
    }
    const cleanPhone = phoneVal.cleanNumber;

    if (!name.trim()) {
      setValidationError('Please enter your full name');
      return;
    }

    if (/[0-9]/.test(name)) {
      setValidationError('Names cannot contain numbers');
      return;
    }

    if (selectedRole === 'merchant') {
      if (!shopOrVillage.trim()) {
        setValidationError('Please enter your shop or firm name');
        return;
      }
      if (!shopAddress.trim()) {
        setValidationError('Please enter your shop / yard address');
        return;
      }

      const uniqueness = checkUniqueness({
        shopName: shopOrVillage.trim(),
        shopAddress: shopAddress.trim(),
        phoneNumber: cleanPhone,
      });

      if (!uniqueness.valid) {
        setValidationError(uniqueness.message || 'Shop name or address is already taken');
        return;
      }

      // Cloud database check
      try {
        const cloudCheck = await checkCloudDuplicateRegistration({
          phoneNumber: cleanPhone,
          shopNumber: shopNumber.trim(),
          marketName: marketName.trim(),
          shopName: shopOrVillage.trim(),
        });
        if (cloudCheck.isDuplicate) {
          setValidationError(cloudCheck.message || 'Registration details already in use in database');
          return;
        }
      } catch {}
    } else {
      if (!shopOrVillage.trim()) {
        setValidationError('Please enter your village name');
        return;
      }
    }

    setValidationError('');
    sounds.playCashChime();
    setStep('step3-commodities');
  };

  const toggleCommodity = (cat: CommodityCategory) => {
    sounds.playBidTick();
    setSelectedCommodities((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleCompleteSetup = () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10) || '9876543210';
    const primaryCropsList = selectedCommodities.map((c) => COMMODITY_CONFIGS[c].name);

    if (selectedRole === 'merchant') {
      registerNewAccount({
        role: 'merchant',
        fullName: name.trim() || 'Mandi Merchant',
        phoneNumber: cleanPhone,
        shopOrVillage: shopOrVillage.trim() || 'Mandi Trading Co.',
        shopAddress: shopAddress.trim() || 'APMC Market Yard',
        shopNumber: shopNumber.trim() || 'Shop 1',
        marketName: marketName.trim() || 'Agri APMC Market Yard',
        licenseOrCrop: selectedCommodities.join(', '),
        selectedCommodities: selectedCommodities,
      });

      updateMerchantProfile({
        ownerName: name.trim() || 'Mandi Merchant',
        shopName: shopOrVillage.trim() || 'Mandi Trading Co.',
        shopNumber: shopNumber.trim() || 'Shop 1',
        apmcMarketName: marketName.trim() || 'Agri APMC Market Yard',
        phoneNumber: `+91 ${cleanPhone}`,
        address: shopAddress.trim() || 'APMC Market Yard',
      });

      setPortalMode('merchant');
    } else {
      registerNewAccount({
        role: 'farmer',
        fullName: name.trim() || 'Kisan Grower',
        phoneNumber: cleanPhone,
        shopOrVillage: shopOrVillage.trim() || 'Green Valley Village',
        licenseOrCrop: primaryCropsList.join(', '),
        selectedCommodities: selectedCommodities,
      });

      const newFarmer = addFarmer({
        name: name.trim() || 'Kisan Grower',
        phone: cleanPhone,
        village: shopOrVillage.trim() || 'Green Valley Village',
        primaryCrops: primaryCropsList,
        connectedMerchantIds: [merchantProfile.merchantId],
      });

      setActiveFarmerId(newFarmer.id);
      setPortalMode('farmer');
    }

    try {
      localStorage.setItem('phoolmitra_onboarding_completed', 'true');
      localStorage.setItem('phoolmitra_user_role', selectedRole);
      localStorage.setItem('phoolmitra_active_phone_v1', cleanPhone);
      localStorage.setItem('phoolmitra_user_commodities', JSON.stringify(selectedCommodities));
      localStorage.setItem('phoolmitra_preferred_units', JSON.stringify(preferredUnits));
    } catch {
      // ignore
    }

    setUserCommodities(selectedCommodities);
    sounds.playGavelStrike();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col justify-between p-3 sm:p-6 text-[#1e293b]">
      {/* Top Header: Centered Logo, Title, Subtitle, and Languages */}
      <header className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center text-center pt-2 pb-2 px-2">
        {/* At the very top, show the logo, centered */}
        <img
          src="/bharat_mandi_logo.png"
          alt="Agricultural Marketplace Logo"
          referrerPolicy="no-referrer"
          className="w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto shrink-0 mb-1.5 drop-shadow-xs bg-transparent"
        />

        {/* Below the logo, show the title Agricultural Marketplace Settlement Tracker */}
        <h1 className="font-black text-base sm:text-lg md:text-xl tracking-tight text-[#1a3a52] leading-tight">
          Agricultural Marketplace Settlement Tracker
        </h1>

        {/* Below the title, show the subtitle Multi-Commodity Settlement & Ledger for Farmers & Merchants */}
        <p className="text-[11px] sm:text-xs text-[#64748b] font-medium mt-1 max-w-lg mx-auto leading-snug">
          Multi-Commodity Settlement & Ledger for Farmers & Merchants
        </p>

        {/* Language Settings trigger button */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <button
            type="button"
            id="onboarding-language-settings-btn"
            onClick={() => {
              sounds.playBidTick();
              setIsLangModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#1a3a52] text-xs font-bold rounded-xl border border-[#e2e8f0] shadow-2xs transition hover:border-[#1a3a52]/40 cursor-pointer select-none group"
            title="Click to open Indian Language Settings"
          >
            <Globe className="w-3.5 h-3.5 text-[#1a3a52] group-hover:rotate-12 transition-transform" />
            <span className="font-black text-[#1a3a52]">{currentLangInfo.nativeName}</span>
            {currentLangInfo.nativeName !== currentLangInfo.englishName && (
              <span className="text-[10px] text-[#64748b] font-medium">
                ({currentLangInfo.englishName})
              </span>
            )}
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-200 ml-0.5">
              Change Language
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        <LanguageSettingsModal
          isOpen={isLangModalOpen}
          onClose={() => setIsLangModalOpen(false)}
          currentLanguage={language}
          onSelectLanguage={(lang) => setLanguage(lang)}
        />
      </header>

      {/* Main Flow Area */}
      <div className="max-w-2xl w-full mx-auto my-auto py-4 space-y-6">
        {/* ================= STEP 1: ROLE SELECTION LANDING PAGE ================= */}
        {step === 'step1-role' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#e2e8f0] shadow-md space-y-6">
            <div className="text-center space-y-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#1a3a52] bg-[#eef3f7] px-3.5 py-1 rounded-full inline-block">
                {content.step1Badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1e293b]">
                {content.step1Title}
              </h2>
              <p className="text-sm text-[#64748b] font-medium">{content.step1Sub}</p>
            </div>

            {/* Saved Accounts for Quick Switching / Returning Login */}
            {registeredAccounts.length > 0 && (
              <div className="bg-[#f8fafc] rounded-2xl border-2 border-[#d4af37]/40 p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1a3a52]">
                      Saved Accounts on this Device
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#64748b]">
                    {registeredAccounts.length} {registeredAccounts.length === 1 ? 'account' : 'accounts'}
                  </span>
                </div>

                <div className="space-y-2">
                  {registeredAccounts.map((acct) => (
                    <div
                      key={acct.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#e2e8f0] hover:border-[#1a3a52] transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            acct.role === 'merchant'
                              ? 'bg-[#1a3a52] text-[#d4af37]'
                              : 'bg-amber-500 text-black'
                          }`}
                        >
                          {acct.role === 'merchant' ? (
                            <Store className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-[#1e293b] truncate">
                              {acct.fullName}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                acct.role === 'merchant'
                                  ? 'bg-[#eef3f7] text-[#1a3a52]'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {acct.role === 'merchant' ? 'Merchant / Adathiya' : 'Farmer / Kisan'}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748b] truncate mt-0.5">
                            {acct.shopOrVillage} • +91 {acct.phoneNumber}
                          </p>
                        </div>
                      </div>

                      {confirmingDeletePhone === acct.phoneNumber ? (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 p-1.5 rounded-xl text-xs shrink-0 animate-in fade-in duration-150">
                          <span className="font-bold text-red-800 text-[11px] px-1 hidden sm:inline">Remove?</span>
                          <button
                            type="button"
                            id={`confirm-delete-saved-${acct.phoneNumber}`}
                            onClick={() => {
                              sounds.playTrashSound?.();
                              deleteRegisteredAccount(acct.phoneNumber);
                              setConfirmingDeletePhone(null);
                              setAccountToDelete(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-black bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg shadow-2xs transition cursor-pointer min-touch-target"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            id={`cancel-delete-saved-${acct.phoneNumber}`}
                            onClick={() => {
                              setConfirmingDeletePhone(null);
                              setAccountToDelete(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer min-touch-target"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickAccountLogin(acct)}
                            className="px-3.5 py-2 text-xs font-black rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 min-touch-target"
                          >
                            <span>Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
                          </button>

                          <button
                            type="button"
                            id={`initiate-delete-saved-${acct.phoneNumber}`}
                            onClick={() => {
                              setConfirmingDeletePhone(acct.phoneNumber);
                              setAccountToDelete(acct);
                            }}
                            title="Remove from this device"
                            aria-label={`Remove ${acct.fullName} account from this device`}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-transparent hover:border-red-200 min-touch-target"
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

            {/* Two Distinct Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: FARMER / GROWER */}
              <div className="p-5 sm:p-6 rounded-2xl border-2 border-[#e2e8f0] bg-[#f8fafc] hover:border-[#1a3a52] transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-sm">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#1e293b]">{content.farmerTitle}</h3>
                    <p className="text-xs text-[#1e293b] mt-1.5 italic bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      &ldquo;{content.farmerDesc}&rdquo;
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-[#64748b] font-medium pt-1">
                    {content.farmerFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1a3a52] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    id="btn-continue-farmer"
                    onClick={() => handleSelectRole('farmer', 'signup')}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-sm transition shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                  >
                    <span>Sign Up as Farmer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    id="btn-login-farmer"
                    onClick={() => handleSelectRole('farmer', 'login')}
                    className="w-full py-2 px-3 rounded-xl border border-[#cbd5e1] bg-white hover:bg-amber-50 text-[#1e293b] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Already registered? Log In</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                  </button>
                </div>
              </div>

              {/* Option 2: MERCHANT / MANDI SHOP OWNER */}
              <div className="p-5 sm:p-6 rounded-2xl border-2 border-[#e2e8f0] bg-[#f8fafc] hover:border-[#1a3a52] transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1a3a52] text-[#d4af37] flex items-center justify-center shadow-sm">
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#1e293b]">{content.merchantTitle}</h3>
                    <p className="text-xs text-[#1e293b] mt-1.5 italic bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      &ldquo;{content.merchantDesc}&rdquo;
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-[#64748b] font-medium pt-1">
                    {content.merchantFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1a3a52] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    id="btn-continue-merchant"
                    onClick={() => handleSelectRole('merchant', 'signup')}
                    className="w-full py-3 px-4 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-sm transition shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                  >
                    <span>Sign Up as Merchant</span>
                    <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                  </button>

                  <button
                    type="button"
                    id="btn-login-merchant"
                    onClick={() => handleSelectRole('merchant', 'login')}
                    className="w-full py-2 px-3 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#1e293b] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Already registered? Log In</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#1a3a52]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PHONE / EMAIL AUTHENTICATION ================= */}
        {step === 'step2-auth' && (() => {
          const cleanId =
            authMethod === 'phone'
              ? phone.replace(/\D/g, '').slice(-10)
              : email.trim().toLowerCase();
          const matchedAccount = cleanId
            ? registeredAccounts.find(
                (a) =>
                  a.phoneNumber.replace(/\D/g, '').slice(-10) === cleanId ||
                  a.phoneNumber === cleanId
              )
            : null;

          return (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#e2e8f0] shadow-md space-y-6">
              <div className="text-center space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1a3a52] bg-[#eef3f7] px-3 py-1 rounded-full">
                    {authMode === 'login' ? 'Returning User Login' : content.step2Badge}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 capitalize">
                    Role: {selectedRole}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1e293b]">
                  {authMode === 'login' ? 'Sign In to Your Ledger' : content.step2Title}
                </h2>
                <p className="text-sm text-[#64748b] font-medium">
                  {authMode === 'login'
                    ? `Enter your registered 10-digit mobile number to access your ${selectedRole} ledger`
                    : content.step2Sub}
                </p>
              </div>

              {/* Dynamic matched account indicator */}
              {matchedAccount && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">
                      Account Found: {matchedAccount.fullName} ({matchedAccount.role.toUpperCase()})
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Verifying OTP will log you directly into your dashboard. Profile setup will be skipped.
                    </p>
                  </div>
                </div>
              )}

              {/* Auth Method Switcher (Phone vs Email) */}
              <div className="flex rounded-xl bg-[#F8F6F0] p-1 border border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                    authMethod === 'phone'
                      ? 'bg-[#1a3a52] text-white shadow-xs'
                      : 'text-[#64748b] hover:text-[#1e293b]'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>{content.phoneTab}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                    authMethod === 'email'
                      ? 'bg-[#1a3a52] text-white shadow-xs'
                      : 'text-[#64748b] hover:text-[#1e293b]'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>{content.emailTab}</span>
                </button>
              </div>

              {/* Input fields */}
              <div className="space-y-4">
                {authMethod === 'phone' ? (
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-[#1a3a52] block mb-1">
                      {content.phoneLabel}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 flex items-center gap-1 text-base sm:text-lg font-black text-[#64748b] border-r border-[#e2e8f0] pr-3">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(clean);
                          setErrorMsg('');
                        }}
                        placeholder="9849012345"
                        className="w-full pl-22 pr-4 py-3.5 rounded-2xl border-2 border-[#e2e8f0] focus:border-[#1a3a52] text-xl font-mono font-black text-[#1e293b] outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-[#1a3a52] block mb-1">
                      {content.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="kisan@mandiledger.com"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e2e8f0] focus:border-[#1a3a52] text-base font-bold text-[#1e293b] outline-none"
                      autoFocus
                    />
                  </div>
                )}

                {/* Password / PIN setup */}
                <div>
                  <label className="text-[#1a3a52] block mb-1 text-xs font-black uppercase tracking-wider">
                    {content.passwordLabel}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border-2 border-[#e2e8f0] py-3.5 pl-4 pr-12 text-base font-bold text-[#1e293b] outline-none focus:border-[#1a3a52]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playBidTick?.();
                        setShowPassword((prev) => !prev);
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 flex items-center justify-center p-1.5 text-[#64748b] hover:text-[#1a3a52] transition-colors rounded-xl cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#64748b]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1a3a52]" />
                    <span>{content.passwordHint}</span>
                  </p>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>

              {/* Mode Toggle Link */}
              <div className="text-center pt-1">
                {authMode === 'signup' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg('');
                    }}
                    className="text-xs text-[#1a3a52] hover:underline font-bold cursor-pointer"
                  >
                    Already registered? Switch to Log In mode
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg('');
                    }}
                    className="text-xs text-[#1a3a52] hover:underline font-bold cursor-pointer"
                  >
                    Need a new account? Switch to Sign Up mode
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('step1-role')}
                  className="py-3.5 px-5 rounded-2xl border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#1e293b] font-bold text-sm transition cursor-pointer"
                >
                  {content.backBtn}
                </button>

                <button
                  type="button"
                  id="btn-send-otp"
                  onClick={handleSendOtp}
                  disabled={isOtpSending}
                  className="flex-1 py-4 px-6 rounded-2xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-base sm:text-lg transition shadow-md flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <span className="text-white font-black">{content.sendOtpBtn}</span>
                  <ArrowRight className="w-5 h-5 text-[#d4af37]" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* STEP 2-OTP: OTP Verification */}
        {step === 'step2-otp' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#e2e8f0] shadow-md space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#1a3a52] bg-[#eef3f7] px-3 py-1 rounded-full inline-block">
                Verification Code
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1e293b]">
                {content.otpTitle}
              </h2>
              <p className="text-sm text-[#64748b] font-medium">
                {content.otpSub} <strong>{authMethod === 'phone' ? `+91 ${phone}` : email}</strong>
              </p>
            </div>

            {/* 6 Digit Boxes */}
            <div className="flex justify-center gap-2 sm:gap-3 my-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && idx > 0) {
                      document.getElementById(`otp-${idx - 1}`)?.focus();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    if (pasted) {
                      const newOtp = [...otp];
                      for (let i = 0; i < 6; i++) {
                        newOtp[i] = pasted[i] || '';
                      }
                      setOtp(newOtp);
                      const nextFocus = Math.min(pasted.length, 5);
                      document.getElementById(`otp-${nextFocus}`)?.focus();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = [...otp];
                    newOtp[idx] = val;
                    setOtp(newOtp);
                    if (val && idx < 5) {
                      document.getElementById(`otp-${idx + 1}`)?.focus();
                    }
                  }}
                  className="w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-mono font-black rounded-xl sm:rounded-2xl border-2 border-[#e2e8f0] focus:border-[#1a3a52] bg-[#f8fafc] text-[#1e293b] outline-none shadow-2xs"
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-bold text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('step2-auth')}
                className="py-3.5 px-5 rounded-2xl border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#1e293b] font-bold text-sm transition cursor-pointer"
              >
                {content.backBtn}
              </button>

              <button
                type="button"
                id="btn-verify-otp"
                onClick={handleVerifyOtp}
                disabled={isVerifying}
                className="flex-1 py-4 px-6 rounded-2xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-base sm:text-lg transition shadow-md flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <span>{content.verifyBtn}</span>
                <ArrowRight className="w-5 h-5 text-[#d4af37]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2-PROFILE: Complete Profile */}
        {step === 'step2-profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#e2e8f0] shadow-md space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#1a3a52] bg-[#eef3f7] px-3 py-1 rounded-full inline-block">
                Setup Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1e293b]">
                {content.profileTitle}
              </h2>
              <p className="text-sm text-[#64748b] font-medium">{content.profileSub}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#64748b] block mb-1">
                  {content.fullName} <span className="text-[10px] text-gray-400 font-normal">(letters only)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onKeyDown={(e) => {
                    if (/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const clean = e.clipboardData.getData('text').replace(/[0-9]/g, '');
                    setName(clean);
                  }}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[0-9]/g, '');
                    setName(cleaned);
                  }}
                  placeholder={selectedRole === 'merchant' ? 'e.g., Ramesh Gupta' : 'e.g., Venkatesh Reddy'}
                  className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm font-bold text-[#1e293b] focus:outline-none focus:border-[#1a3a52]"
                />
              </div>

              {selectedRole === 'merchant' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#64748b] block mb-1">
                      {content.shopName}
                    </label>
                    <input
                      type="text"
                      value={shopOrVillage}
                      onChange={(e) => setShopOrVillage(e.target.value)}
                      placeholder="e.g., Sri Laxmi Agri Traders"
                      className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm font-bold text-[#1e293b] focus:outline-none focus:border-[#1a3a52]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#64748b] block mb-1">
                      {content.shopAddress}
                    </label>
                    <input
                      type="text"
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      placeholder="e.g., Stall 12, APMC Wholesale Market"
                      className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm font-bold text-[#1e293b] focus:outline-none focus:border-[#1a3a52]"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-bold text-[#64748b] block mb-1">
                    {content.villageName}
                  </label>
                  <input
                    type="text"
                    value={shopOrVillage}
                    onChange={(e) => setShopOrVillage(e.target.value)}
                    placeholder="e.g., Narsapur, Medak District"
                    className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm font-bold text-[#1e293b] focus:outline-none focus:border-[#1a3a52]"
                  />
                </div>
              )}

              {validationError && (
                <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              id="btn-save-profile"
              onClick={handleSaveProfile}
              className="w-full py-4 px-6 rounded-2xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-base sm:text-lg transition shadow-md flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              <span>Continue to Commodities</span>
              <ArrowRight className="w-5 h-5 text-[#d4af37]" />
            </button>
          </div>
        )}

        {/* ================= STEP 3: SELECT COMMODITIES YOU WORK WITH ================= */}
        {step === 'step3-commodities' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#e2e8f0] shadow-md space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#1a3a52] bg-[#eef3f7] px-3 py-1 rounded-full inline-block">
                {content.step3Badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1e293b]">
                {content.step3Title}
              </h2>
              <p className="text-sm text-[#64748b] font-medium">{content.step3Sub}</p>
            </div>

            {/* Quick select all */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  sounds.playBidTick();
                  setSelectedCommodities(['flowers', 'grains', 'vegetables', 'fruits']);
                }}
                className="text-xs font-bold text-[#1a3a52] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#1a3a52]" />
                <span>{content.selectAll}</span>
              </button>
            </div>

            {/* 4 Commodity Selection Grid (With Optional Unit Selectors) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(['flowers', 'grains', 'vegetables', 'fruits'] as CommodityCategory[]).map((cat) => {
                const config = COMMODITY_CONFIGS[cat];
                const isSelected = selectedCommodities.includes(cat);

                return (
                  <div
                    key={cat}
                    onClick={() => toggleCommodity(cat)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1a3a52] bg-[#eef3f7]/50 shadow-sm ring-2 ring-[#1a3a52]/20'
                        : 'border-[#e2e8f0] bg-white hover:border-[#1a3a52]/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{config.icon}</span>
                        <div>
                          <h4 className="text-base font-black text-[#1e293b]">
                            {config.name}
                          </h4>
                          <p className="text-[11px] text-[#64748b] font-medium">
                            {config.allowedUnits.join(', ')}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                          isSelected
                            ? 'bg-[#1a3a52] border-[#1a3a52] text-white'
                            : 'border-[#e2e8f0] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Optional: Preferred Unit for this commodity */}
                    {isSelected && (
                      <div
                        className="mt-3 pt-2.5 border-t border-[#e2e8f0]/70 flex items-center justify-between"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold text-[#64748b] uppercase">
                          {content.unitOptionTitle}:
                        </span>
                        <select
                          value={preferredUnits[cat]}
                          onChange={(e) => {
                            const val = e.target.value as WeightUnit;
                            setPreferredUnits((prev) => ({ ...prev, [cat]: val }));
                          }}
                          className="px-2 py-1 rounded-lg border border-[#e2e8f0] bg-white text-xs font-bold text-[#1e293b] focus:outline-none focus:border-[#1a3a52]"
                        >
                          {config.allowedUnits.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Complete Setup Action Button */}
            <div className="pt-3">
              <button
                type="button"
                id="btn-complete-setup"
                onClick={handleCompleteSetup}
                className="w-full py-4 px-6 rounded-2xl bg-[#1a3a52] hover:bg-[#122839] text-white font-black text-lg sm:text-xl transition shadow-md flex items-center justify-center gap-3 active:scale-[0.99] cursor-pointer"
              >
                <span>{content.completeBtn}</span>
                <ArrowRight className="w-6 h-6 text-[#d4af37]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="max-w-4xl w-full mx-auto text-center py-2 text-xs text-[#64748b] font-medium">
        <span>AgriMarket Settlement Ledger • Multi-Commodity Platform</span>
      </div>

      {/* Universal Delete Confirmation Modal for Saved Account */}
      <DeleteConfirmModal
        isOpen={!!accountToDelete}
        title="Remove Saved Account"
        itemName={accountToDelete ? `${accountToDelete.fullName} (${accountToDelete.role === 'merchant' ? 'Merchant' : 'Farmer'})` : ''}
        itemDetails={accountToDelete ? `Phone: +91 ${accountToDelete.phoneNumber} • ${accountToDelete.shopOrVillage}` : ''}
        message="Are you sure you want to remove this saved account from this device? This will not delete any server data. You can log back in anytime."
        confirmText="CONFIRM DELETE"
        cancelText="CANCEL"
        onConfirm={() => {
          if (accountToDelete) {
            sounds.playTrashSound?.();
            deleteRegisteredAccount(accountToDelete.phoneNumber);
            setAccountToDelete(null);
            setConfirmingDeletePhone(null);
          }
        }}
        onCancel={() => {
          setAccountToDelete(null);
          setConfirmingDeletePhone(null);
        }}
      />
    </div>
  );
};

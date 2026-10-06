import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Calendar,
  User,
  Phone,
  MapPin,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Receipt,
  Layers,
  ArrowDown,
  Sparkles,
  Store,
  ChevronRight,
  Trash2,
  Loader2,
  FileText,
  Sliders,
  Check,
  Filter,
  ArrowLeft,
  X,
  Eye,
  Link2,
  Link2Off,
  Send,
  Clock,
  ShieldCheck,
  Plus,
  Edit3,
  UserPlus,
} from 'lucide-react';
import { useMandi } from '../../context/MandiContext';
import { SaleLot, Farmer } from '../../types';
import { formatDisplayDate, getTodayDateString, getPastDateString } from '../../data/initialData';
import {
  exportElementToPdf,
  printHtmlViaIframe,
  sharePdfFile,
  createPdfFile,
  canSharePdfFile,
  acquireGlobalShareLock,
  releaseGlobalShareLock,
} from '../../utils/pdfExport';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { FormCInvoiceCanvas, FormCInvoiceData } from '../common/FormCInvoiceCanvas';
import { GeneratePdfModal } from '../common/GeneratePdfModal';
import { PhotoUploadPicker } from '../common/PhotoUploadPicker';
import { validateIndianMobile } from '../../utils/phoneValidation';
import { flowerVarietiesData } from '../../translations';
import { sounds } from '../../utils/audio';

interface FarmerKathaStatementViewProps {
  initialFarmer?: Farmer | null;
  onSelectParchiLot?: (lot: SaleLot) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const FarmerKathaStatementView: React.FC<FarmerKathaStatementViewProps> = ({
  initialFarmer,
  onSelectParchiLot,
  onClose,
  isModal = false,
}) => {
  const {
    lots,
    farmers,
    updateFarmer,
    merchantProfile,
    setSelectedParchiLot,
    openPdfModalForLot,
    deleteSaleLot,
    deleteFarmer,
    addSaleLot,
    getConnectionStatus,
    disconnectFarmerAndMerchant,
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    syncStatementToFarmer,
    connectionRequests,
    activeCommodityFilter,
    language,
    t,
  } = useMandi();

  const todayStr = getTodayDateString();

  // Search state
  const [searchNameQuery, setSearchNameQuery] = useState<string>(initialFarmer ? initialFarmer.name : '');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(
    initialFarmer ? initialFarmer.id : farmers[0]?.id || ''
  );

  // Edit Farmer Details Modal State
  const [isEditFarmerModalOpen, setIsEditFarmerModalOpen] = useState(false);
  const [editFarmerName, setEditFarmerName] = useState('');
  const [editFarmerPhone, setEditFarmerPhone] = useState('');
  const [editFarmerVillage, setEditFarmerVillage] = useState('');
  const [editFarmerPhotoUrl, setEditFarmerPhotoUrl] = useState('');
  const [editFarmerCrops, setEditFarmerCrops] = useState<string[]>([]);
  const [editFarmerError, setEditFarmerError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFarmer) {
      setSelectedFarmerId(initialFarmer.id);
      setSearchNameQuery(initialFarmer.name);
    }
  }, [initialFarmer]);

  // Date filters: Start Date and End Date - DEFAULT TO "All Time" (empty strings)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDatePickers, setShowCustomDatePickers] = useState<boolean>(false);

  const [isCustomFormCModalOpen, setIsCustomFormCModalOpen] = useState(false);

  // Past Date Consignment Modal
  const [isAddPastLotModalOpen, setIsAddPastLotModalOpen] = useState(false);
  const [pastLotForm, setPastLotForm] = useState({
    date: getPastDateString(1),
    flowerVariety: 'Marigold (Banthi)',
    quantity: 50,
    unit: 'Kgs',
    boxesCount: 2,
    rate: 45,
    flowerQuality: 'Good',
    ammaliCharges: 30,
    transportCharges: 50,
    commissionPercent: 5,
    miscAmount: 10,
  });

  // Notification state
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState('');
  const formCPdfRef = useRef<HTMLDivElement>(null);

  // Delete Consignment Lot State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    lot: SaleLot | null;
  }>({
    isOpen: false,
    lot: null,
  });

  // Delete Farmer State
  const [deleteFarmerModalConfig, setDeleteFarmerModalConfig] = useState<{
    isOpen: boolean;
    farmer: Farmer | null;
  }>({
    isOpen: false,
    farmer: null,
  });

  const handleDeleteLotClick = (lot: SaleLot) => {
    setDeleteModalConfig({
      isOpen: true,
      lot,
    });
  };

  const handleConfirmDeleteLot = () => {
    if (deleteModalConfig.lot) {
      const pNum = deleteModalConfig.lot.parchiNumber;
      deleteSaleLot(deleteModalConfig.lot.id);
      sounds.playTrashSound?.();
      setNotificationMsg(`✓ Consignment record ${pNum} deleted successfully.`);
      setTimeout(() => setNotificationMsg(null), 3500);
    }
    setDeleteModalConfig({ isOpen: false, lot: null });
  };

  const handleDeleteFarmerClick = (farmer: Farmer) => {
    setDeleteFarmerModalConfig({
      isOpen: true,
      farmer,
    });
  };

  const handleConfirmDeleteFarmer = () => {
    if (deleteFarmerModalConfig.farmer) {
      const targetName = deleteFarmerModalConfig.farmer.name;
      const targetId = deleteFarmerModalConfig.farmer.id;
      deleteFarmer(targetId);
      sounds.playTrashSound?.();
      setNotificationMsg(`✓ Farmer ${targetName} and all linked records (parchis, payments, charges) deleted permanently.`);
      setTimeout(() => setNotificationMsg(null), 4500);

      const remaining = farmers.filter((f) => f.id !== targetId);
      if (remaining.length > 0) {
        setSelectedFarmerId(remaining[0].id);
        setSearchNameQuery(remaining[0].name);
      } else {
        setSelectedFarmerId('');
        setSearchNameQuery('');
      }
    }
    setDeleteFarmerModalConfig({ isOpen: false, farmer: null });
  };

  const handleOpenEditFarmerModal = () => {
    if (!currentFarmer) return;
    setEditFarmerName(currentFarmer.name);
    setEditFarmerPhone(currentFarmer.phone || '');
    setEditFarmerVillage(currentFarmer.village || '');
    setEditFarmerPhotoUrl(currentFarmer.photoUrl || '');
    setEditFarmerCrops(Array.isArray(currentFarmer.primaryCrops) ? currentFarmer.primaryCrops : ['Marigold (Banthi)']);
    setEditFarmerError(null);
    setIsEditFarmerModalOpen(true);
  };

  const handleSaveEditedFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFarmer) return;
    setEditFarmerError(null);

    const trimmedName = editFarmerName.replace(/[0-9]/g, '').trim();
    if (!trimmedName) {
      setEditFarmerError('Please enter a valid farmer name');
      return;
    }

    const phoneVal = validateIndianMobile(editFarmerPhone);
    if (!phoneVal.isValid) {
      setEditFarmerError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number');
      return;
    }
    const cleanPhone = phoneVal.cleanNumber;

    updateFarmer(currentFarmer.id, {
      name: trimmedName,
      phone: cleanPhone,
      village: editFarmerVillage.trim() || 'Local Grower Belt',
      primaryCrops: editFarmerCrops.length > 0 ? editFarmerCrops : ['Marigold (Banthi)'],
      photoUrl: editFarmerPhotoUrl.trim() || undefined,
    });

    sounds.success?.();
    setNotificationMsg(`✓ Farmer details updated for ${trimmedName}!`);
    setTimeout(() => setNotificationMsg(null), 3500);
    setIsEditFarmerModalOpen(false);
  };

  // Active farmer resolution
  const currentFarmer = useMemo(() => {
    return farmers.find((f) => f.id === selectedFarmerId) || initialFarmer || farmers[0] || null;
  }, [farmers, selectedFarmerId, initialFarmer]);

  const cleanFarmerPhone = useMemo(() => {
    return currentFarmer?.phone ? currentFarmer.phone.replace(/\D/g, '').slice(-10) : '';
  }, [currentFarmer]);

  // Mutual Connection Status with this specific farmer
  const connectionStatus = useMemo(() => {
    if (!cleanFarmerPhone || !merchantProfile.merchantId) return 'not_connected';
    return getConnectionStatus(cleanFarmerPhone, merchantProfile.merchantId);
  }, [cleanFarmerPhone, merchantProfile.merchantId, getConnectionStatus]);

  const currentConnRequest = useMemo(() => {
    if (!cleanFarmerPhone) return null;
    const cleanMerchantPhone = (merchantProfile.phoneNumber || '').replace(/\D/g, '').slice(-10);
    return connectionRequests.find(
      (r) =>
        r.farmerPhone.replace(/\D/g, '').slice(-10) === cleanFarmerPhone &&
        (r.merchantId === merchantProfile.merchantId ||
          (r.merchantPhone && r.merchantPhone.replace(/\D/g, '').slice(-10) === cleanMerchantPhone))
    );
  }, [connectionRequests, cleanFarmerPhone, merchantProfile]);

  // Connection Request Handlers
  const handleSendConnectRequestToFarmer = () => {
    if (!currentFarmer || !cleanFarmerPhone) return;
    sendConnectionRequest({
      senderRole: 'merchant',
      merchantId: merchantProfile.merchantId,
      merchantName: merchantProfile.shopName || 'APMC Commission Agent',
      merchantPhone: merchantProfile.phoneNumber || '',
      merchantOwnerName: merchantProfile.ownerName || '',
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      farmerPhone: cleanFarmerPhone,
      farmerVillage: currentFarmer.village,
    });
    setNotificationMsg(`✓ Connection invitation sent to ${currentFarmer.name}! When they accept, statements will automatically sync.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleAcceptFarmerRequest = () => {
    if (!currentConnRequest) return;
    acceptConnectionRequest(currentConnRequest.id);
    setNotificationMsg(`✓ Mutual connection active with ${currentFarmer?.name}! Real-time statement auto-sync enabled.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleDeclineFarmerRequest = () => {
    if (!currentConnRequest) return;
    declineConnectionRequest(currentConnRequest.id);
    setNotificationMsg('Connection request declined.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleDisconnectFarmer = () => {
    if (!currentFarmer || !cleanFarmerPhone) return;
    sounds.playTrashSound?.();
    disconnectFarmerAndMerchant(cleanFarmerPhone, merchantProfile.merchantId);
    setNotificationMsg(`Disconnected from ${currentFarmer.name}. Future auto-syncs paused; past records preserved.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Auto-push helper when connected
  const triggerAutoPushIfConnected = (): boolean => {
    if (!currentFarmer || !cleanFarmerPhone) return false;
    const status = getConnectionStatus(cleanFarmerPhone, merchantProfile.merchantId);
    if (status === 'connected') {
      const syncRes = syncStatementToFarmer({
        farmerId: currentFarmer.id,
        farmerPhone: cleanFarmerPhone,
        farmerName: currentFarmer.name,
        merchantId: merchantProfile.merchantId,
        merchantName: merchantProfile.shopName || 'APMC Commission Agent',
        merchantShopNumber: merchantProfile.shopNumber,
        merchantPhone: merchantProfile.phoneNumber,
        statementNumber: kathaFormCData?.parchiNumber || `FC-${cleanFarmerPhone.slice(-4)}-${Date.now()}`,
        type: 'form_c',
        date: startDate || new Date().toISOString().split('T')[0],
        startDate: startDate,
        endDate: endDate,
        periodLabel: isSingleDay ? startDate : `${startDate || 'All Time'} to ${endDate || 'Latest'}`,
        lotsCount: dateFilteredLots.length,
        items: dateFilteredLots.map((l) => ({
          lotId: l.id,
          flowerVariety: l.flowerVariety,
          cropVariety: l.flowerVariety,
          quality: l.flowerQuality || 'Good',
          quantity: l.quantity,
          unit: l.unit || 'Kgs',
          rate: l.rate,
          grossTotal: l.grossTotal,
          boxesCount: l.boxesCount,
        })),
        grossTotal: statementMetrics.grossTotal,
        commissionAmount: statementMetrics.commissionAmount,
        hamaliAmount: statementMetrics.hamaliAmount,
        transportAmount: statementMetrics.transportAmount,
        miscAmount: statementMetrics.miscAmount,
        totalDeductions: statementMetrics.totalDeductions,
        farmerNetPayable: statementMetrics.farmerNetMoney,
        amountPaid: statementMetrics.amountPaid,
        balanceDue: statementMetrics.balanceDue,
        paymentStatus: statementMetrics.balanceDue === 0 && statementMetrics.grossTotal > 0 ? 'PAID' : statementMetrics.amountPaid > 0 ? 'PARTIAL' : 'PENDING',
        commodityCategory: dateFilteredLots[0]?.commodityCategory || 'flowers',
      });
      return syncRes.success;
    }
    return false;
  };

  // Filtered farmers list for search autocomplete
  const matchedFarmers = useMemo(() => {
    const q = searchNameQuery.toLowerCase().trim();
    if (!q) return farmers;
    return farmers.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.phone.includes(q)
    );
  }, [farmers, searchNameQuery]);

  // All lots for this specific farmer, deduplicated by unique ID and sorted oldest first
  const farmerAllLots = useMemo(() => {
    if (!currentFarmer) return [];
    const cleanPhone = currentFarmer.phone ? currentFarmer.phone.replace(/\D/g, '').slice(-10) : '';
    const matched = lots.filter((l) => {
      if (activeCommodityFilter !== 'all') {
        const lotCat = l.commodityCategory || 'flowers';
        if (lotCat !== activeCommodityFilter) return false;
      }
      const lotPhone = l.farmerPhone ? l.farmerPhone.replace(/\D/g, '').slice(-10) : '';
      return (
        l.farmerId === currentFarmer.id ||
        (cleanPhone && lotPhone === cleanPhone) ||
        (l.farmerName && l.farmerName.trim().toLowerCase() === currentFarmer.name.trim().toLowerCase())
      );
    });

    // Deduplicate by lot ID
    const uniqueMap = new Map<string, SaleLot>();
    matched.forEach((item) => {
      if (item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    // Sort oldest first by date
    return Array.from(uniqueMap.values()).sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
  }, [lots, currentFarmer, activeCommodityFilter]);

  // Opening Balance calculation for custom date range (records before startDate)
  const openingBalance = useMemo(() => {
    if (!startDate) return 0;
    const priorLots = farmerAllLots.filter((lot) => lot.date && lot.date < startDate);
    return priorLots.reduce((acc, lot) => acc + (lot.balanceDue || 0), 0);
  }, [farmerAllLots, startDate]);

  // Filter lots according to date range [startDate, endDate]
  const dateFilteredLots = useMemo(() => {
    if (!startDate && !endDate) return farmerAllLots;
    return farmerAllLots.filter((lot) => {
      if (!lot.date) return false;
      if (startDate && endDate) {
        return lot.date >= startDate && lot.date <= endDate;
      }
      if (startDate) return lot.date >= startDate;
      if (endDate) return lot.date <= endDate;
      return true;
    });
  }, [farmerAllLots, startDate, endDate]);

  // Is Single Day Mode?
  const isSingleDay = Boolean(startDate && endDate && startDate === endDate);

  // Calculations for Katha Statement Waterfall (Matching on-screen & PDF)
  const statementMetrics = useMemo(() => {
    const lotsCount = dateFilteredLots.length;
    const totalVolume = dateFilteredLots.reduce((acc, l) => acc + (l.quantity || 0), 0);
    const totalBoxes = dateFilteredLots.reduce((acc, l) => acc + (l.boxesCount || 0), 0);
    const grossTotal = dateFilteredLots.reduce((acc, l) => acc + (l.grossTotal || 0), 0);
    const commissionAmount = dateFilteredLots.reduce((acc, l) => acc + (l.commissionAmount || 0), 0);

    // Hamali / Loading-Unloading
    const hamaliAmount = dateFilteredLots.reduce(
      (acc, l) => acc + (l.ammaliCharges || l.otherExpenditures?.hamali || 0),
      0
    );

    // Transport / Freight
    const transportAmount = dateFilteredLots.reduce(
      (acc, l) => acc + (l.transportCharges || l.otherExpenditures?.transport || 0),
      0
    );

    // Miscellaneous Charges
    const miscAmount = dateFilteredLots.reduce(
      (acc, l) => acc + (l.otherExpenditures?.misc || 0),
      0
    );

    // Total Deductions = Hamali + Transport + Commission + Misc
    const totalDeductions = hamaliAmount + transportAmount + commissionAmount + miscAmount;

    // Farmer Net Payable = Total Gross - Total Deductions
    const farmerNetMoney = Math.max(0, grossTotal - totalDeductions);
    const amountPaid = dateFilteredLots.reduce((acc, l) => acc + (l.amountPaid || 0), 0);
    const balanceDue = Math.max(0, farmerNetMoney - amountPaid);

    return {
      lotsCount,
      totalVolume,
      totalBoxes,
      grossTotal,
      commissionAmount,
      hamaliAmount,
      transportAmount,
      miscAmount,
      totalDeductions,
      farmerNetMoney,
      amountPaid,
      balanceDue,
    };
  }, [dateFilteredLots]);

  // Quick date shortcuts
  const handleSetQuickDate = (type: 'all' | 'today' | 'last7' | 'thisMonth' | 'yesterday') => {
    if (type === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'yesterday') {
      const y = getPastDateString(1);
      setStartDate(y);
      setEndDate(y);
    } else if (type === 'last7') {
      setStartDate(getPastDateString(7));
      setEndDate(todayStr);
    } else if (type === 'thisMonth') {
      const monthStart = `${todayStr.slice(0, 7)}-01`;
      setStartDate(monthStart);
      setEndDate(todayStr);
    }
  };

  // Submit Past Date Lot Handler
  const handleAddPastLotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFarmer) return;

    const gross = pastLotForm.quantity * pastLotForm.rate;
    const commAmt = Math.round((gross * pastLotForm.commissionPercent) / 100);
    const hamali = Number(pastLotForm.ammaliCharges) || 0;
    const trans = Number(pastLotForm.transportCharges) || 0;
    const misc = Number(pastLotForm.miscAmount) || 0;
    const totDed = commAmt + hamali + trans + misc;
    const net = Math.max(0, gross - totDed);

    addSaleLot({
      date: pastLotForm.date,
      commodityCategory: 'flowers',
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      farmerVillage: currentFarmer.village || 'Yard',
      farmerPhone: currentFarmer.phone,
      flowerVariety: pastLotForm.flowerVariety,
      quantity: pastLotForm.quantity,
      unit: pastLotForm.unit as any,
      boxesCount: pastLotForm.boxesCount,
      packagingType: 'Boxes',
      rate: pastLotForm.rate,
      grossTotal: gross,
      commissionPercent: pastLotForm.commissionPercent,
      commissionAmount: commAmt,
      ammaliCharges: hamali,
      transportCharges: trans,
      otherExpenditures: { misc },
      totalOtherExpenditures: misc,
      farmerNetPayable: net,
      paymentStatus: 'Unpaid',
      amountPaid: 0,
      balanceDue: net,
      flowerQuality: pastLotForm.flowerQuality as any,
    });

    sounds.playCashChime?.();
    setNotificationMsg(`✓ Added consignment entry for ${pastLotForm.date} successfully!`);
    setIsAddPastLotModalOpen(false);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Prepared Data for Combined Single PDF / Form C Canvas
  const kathaFormCData = useMemo<FormCInvoiceData | null>(() => {
    if (!currentFarmer) return null;

    const isCombined = dateFilteredLots.length > 1 || !isSingleDay;

    const itemRows = dateFilteredLots.map((l) => {
      const hamali = l.ammaliCharges || l.otherExpenditures?.hamali || 0;
      const trans = l.transportCharges || l.otherExpenditures?.transport || 0;
      const comm = l.commissionAmount || 0;
      const misc = l.otherExpenditures?.misc || 0;

      return {
        id: l.id,
        parchiNumber: l.parchiNumber,
        date: l.date,
        flowerVariety: l.flowerVariety,
        flowerQuality: l.flowerQuality || 'Good',
        quantity: l.quantity,
        unit: l.unit || 'Kgs',
        boxesCount: l.boxesCount,
        packagingType: l.packagingType || (l.boxesCount ? 'Boxes' : 'Direct arrival'),
        rate: l.rate,
        grossTotal: l.grossTotal,
        hamali,
        transport: trans,
        commission: comm,
        misc,
        farmerNetPayable: l.farmerNetPayable,
      };
    });

    const finalItems = itemRows.length > 0 ? itemRows : [
      {
        id: 'placeholder',
        parchiNumber: '—',
        date: startDate || todayStr,
        flowerVariety: 'No Consignments Recorded',
        flowerQuality: 'Good',
        quantity: 0,
        unit: 'Kgs',
        boxesCount: 0,
        packagingType: 'Direct arrival',
        rate: 0,
        grossTotal: 0,
        hamali: 0,
        transport: 0,
        commission: 0,
        misc: 0,
        farmerNetPayable: 0,
      },
    ];

    const parchiNo = isSingleDay && dateFilteredLots[0]
      ? dateFilteredLots[0].parchiNumber
      : `FC-KATHA-${(currentFarmer.name || 'FARMER').slice(0, 3).toUpperCase()}-${(startDate || 'ALL').replace(/-/g, '')}`;

    const dateRangeLabel = !startDate && !endDate
      ? 'All Time Records'
      : isSingleDay
      ? `Date: ${startDate}`
      : `Period: ${startDate || 'Start'} to ${endDate || 'Latest'}`;

    return {
      parchiNumber: parchiNo,
      date: isSingleDay ? startDate : dateRangeLabel,
      time: isSingleDay && dateFilteredLots[0]?.time ? dateFilteredLots[0].time : 'Combined Statement',
      farmerName: currentFarmer.name,
      farmerVillage: currentFarmer.village || 'APMC Yard',
      farmerPhone: currentFarmer.phone,
      farmerPhotoUrl: currentFarmer.photoUrl,
      isCombinedStatement: isCombined,
      dateRangeLabel,
      items: finalItems,
      grossTotal: statementMetrics.grossTotal,
      transportCharges: statementMetrics.transportAmount,
      ammaliCharges: statementMetrics.hamaliAmount,
      commissionPercent: statementMetrics.grossTotal > 0
        ? Math.round((statementMetrics.commissionAmount / statementMetrics.grossTotal) * 100)
        : (merchantProfile.defaultCommissionRate || 0),
      commissionAmount: statementMetrics.commissionAmount,
      miscCommissionMode: 'fixed',
      miscCommissionAmount: statementMetrics.miscAmount,
      farmerNetPayable: statementMetrics.farmerNetMoney,
      amountPaid: statementMetrics.amountPaid,
      balanceDue: statementMetrics.balanceDue,
      openingBalance: openingBalance,
      paymentMode: 'Cash / Direct APMC Settlement',
      paymentStatus: statementMetrics.balanceDue === 0 && statementMetrics.grossTotal > 0
        ? 'SETTLED'
        : statementMetrics.amountPaid > 0
        ? 'PARTIAL'
        : 'PENDING',
    };
  }, [currentFarmer, dateFilteredLots, isSingleDay, startDate, endDate, statementMetrics, merchantProfile, todayStr, openingBalance]);

  // Download Form C Combined PDF
  const handleDownloadKathaPdf = async () => {
    const targetEl = formCPdfRef.current;
    if (!targetEl || !currentFarmer) return;
    setIsGeneratingPdf(true);
    setPdfStatusMessage('Rendering Official Combined PDF Statement...');
    try {
      const cleanName = currentFarmer.name.replace(/[^a-zA-Z0-9]/g, '_');
      const periodTag = !startDate && !endDate ? 'AllTime' : (startDate || 'All');
      const filename = `BharatMandi_Statement_${cleanName}_${periodTag}.pdf`;
      const result = await exportElementToPdf(targetEl, {
        filename,
        format: 'a4',
        orientation: 'portrait',
        marginMm: 6,
        scale: 2,
        fitToPage: true,
        autoDownload: true,
      });
      if (result.success) {
        const synced = triggerAutoPushIfConnected();
        if (synced) {
          setPdfStatusMessage(`✓ Statement PDF downloaded & automatically synced to ${currentFarmer.name}'s digital portal!`);
        } else {
          setPdfStatusMessage('✓ Official Combined Statement PDF downloaded successfully!');
        }
      } else {
        setPdfStatusMessage(`Failed: ${result.error || 'PDF Generation Error'}`);
      }
    } catch (err: any) {
      console.error('[Katha PDF Error]', err);
      setPdfStatusMessage('Error generating Statement PDF');
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfStatusMessage('');
      }, 4500);
    }
  };

  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);

  // WhatsApp / Native Share Statement with PDF file attachment
  const handleShareWhatsApp = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentFarmer || isSharingPdf) return;

    // Acquire global share lock synchronously BEFORE PDF rendering starts
    if (!acquireGlobalShareLock()) {
      return;
    }

    setIsSharingPdf(true);
    setPdfStatusMessage('Rendering Combined Statement PDF for sharing...');

    try {
      const targetEl = formCPdfRef.current;
      if (!targetEl) {
        throw new Error('Please select a farmer and view their statement before sharing.');
      }

      const cleanName = currentFarmer.name.replace(/[^a-zA-Z0-9]/g, '_');
      const periodTag = !startDate && !endDate ? 'AllTime' : (startDate || 'All');
      const filename = `BharatMandi_Statement_${cleanName}_${periodTag}.pdf`;

      // 1. Generate PDF blob
      const result = await exportElementToPdf(targetEl, {
        filename,
        title: `Farmer Statement - ${currentFarmer.name}`,
        format: 'a4',
        orientation: 'portrait',
        marginMm: 6,
        scale: 2,
        fitToPage: true,
        autoDownload: false,
      });

      if (!result.success || !result.blob) {
        throw new Error(result.error || 'Failed to render statement PDF');
      }

      // Auto sync if mutually connected
      const synced = triggerAutoPushIfConnected();

      // 2. Share via centralized sharePdfFile helper
      const shareRes = await sharePdfFile({
        blob: result.blob,
        filename,
        title: `Farmer Khata Statement - ${currentFarmer.name}`,
        fallbackToDownload: true,
      });

      if (shareRes.shared) {
        setPdfStatusMessage(
          synced
            ? `Statement shared & automatically synced to ${currentFarmer.name}'s portal!`
            : 'Statement PDF shared successfully!'
        );
      } else if (shareRes.downloaded) {
        setPdfStatusMessage(
          "Your browser doesn't support direct file sharing — the PDF has been downloaded so you can attach it in WhatsApp."
        );
      }
    } catch (err: any) {
      console.error('[Katha Share Fatal Error]', err);
      setPdfStatusMessage('Could not share PDF. Please use the Download PDF button.');
    } finally {
      setIsSharingPdf(false);
      releaseGlobalShareLock(2500);
      setTimeout(() => setPdfStatusMessage(''), 6000);
    }
  };

  // Export CSV Statement
  const handleExportCSV = () => {
    if (!currentFarmer) {
      setNotificationMsg('Please select a farmer to export statement.');
      return;
    }

    if (dateFilteredLots.length === 0) {
      setNotificationMsg('No consignment transactions to export for the selected date range.');
      return;
    }

    const escapeVal = (v: any) => {
      if (v === null || v === undefined) return '""';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headerMetadata = [
      ['PHOOLMITRA FLOWER MANDI LEDGER - FARMER KHATA STATEMENT'],
      ['Shop Name', escapeVal(merchantProfile.shopName || 'Wholesale Flower Mandi')],
      ['APMC License / Market', escapeVal(merchantProfile.licenseNumber || merchantProfile.apmcMarketName || 'APMC-GDR-2026')],
      ['Farmer Name', escapeVal(currentFarmer.name)],
      ['Farmer Village', escapeVal(currentFarmer.village || 'N/A')],
      ['Farmer Phone', escapeVal(currentFarmer.phone || 'N/A')],
      ['Statement Period', escapeVal(`${startDate || 'All Time'} to ${endDate || 'Latest'}`)],
      ['Generated On', escapeVal(new Date().toLocaleString('en-IN'))],
      [],
    ];

    const columnHeaders = [
      'Parchi Number',
      'Date',
      'Flower Variety',
      'Quality',
      'No. of Boxes',
      'Quantity',
      'Unit',
      'Rate per Unit (INR)',
      'Gross Amount (INR)',
      'Hamali / Ammali (INR)',
      'Transport / Freight (INR)',
      'Mandi Commission (INR)',
      'Misc Charges (INR)',
      'Total Deductions (INR)',
      "Farmer's Net Payable (INR)",
      'Amount Paid (INR)',
      'Balance Due (INR)',
      'Payment Status',
    ];

    const rows = dateFilteredLots.map((l) => {
      const gross = Number(l.grossTotal) || 0;
      const comm = Number(l.commissionAmount) || 0;
      const hamali = Number(l.ammaliCharges || l.otherExpenditures?.hamali) || 0;
      const trans = Number(l.transportCharges || l.otherExpenditures?.transport) || 0;
      const misc = Number(l.otherExpenditures?.misc) || 0;
      const totalDed = comm + hamali + trans + misc;
      const net = Number(l.farmerNetPayable) || 0;
      const paid = Number(l.amountPaid) || 0;
      const due = Number(l.balanceDue) || 0;

      return [
        escapeVal(l.parchiNumber),
        escapeVal(l.date),
        escapeVal(l.flowerVariety),
        escapeVal(l.flowerQuality || 'Good'),
        l.boxesCount || 0,
        l.quantity,
        escapeVal(l.unit || 'Kgs'),
        l.rate.toFixed(2),
        gross.toFixed(2),
        hamali.toFixed(2),
        trans.toFixed(2),
        comm.toFixed(2),
        misc.toFixed(2),
        totalDed.toFixed(2),
        net.toFixed(2),
        paid.toFixed(2),
        due.toFixed(2),
        escapeVal(l.paymentStatus || 'pending'),
      ];
    });

    // Summary Totals Row
    const totalsRow = [
      escapeVal('TOTALS / SUMMARY'),
      escapeVal(`${dateFilteredLots.length} Lots`),
      '""',
      '""',
      statementMetrics.totalBoxes,
      statementMetrics.totalVolume,
      escapeVal('Kgs/Units'),
      '""',
      statementMetrics.grossTotal.toFixed(2),
      statementMetrics.hamaliAmount.toFixed(2),
      statementMetrics.transportAmount.toFixed(2),
      statementMetrics.commissionAmount.toFixed(2),
      statementMetrics.miscAmount.toFixed(2),
      statementMetrics.totalDeductions.toFixed(2),
      statementMetrics.farmerNetMoney.toFixed(2),
      statementMetrics.amountPaid.toFixed(2),
      statementMetrics.balanceDue.toFixed(2),
      '""',
    ];

    const allLines = [
      ...headerMetadata.map((line) => line.join(',')),
      columnHeaders.join(','),
      ...rows.map((r) => r.join(',')),
      totalsRow.join(','),
    ];

    const csvString = allLines.join('\r\n');
    const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const sanitizedFarmerName = (currentFarmer.name || 'Farmer').replace(/[^a-zA-Z0-9_-]/g, '_');
    const startStr = startDate ? startDate : 'AllTime';
    const endStr = endDate ? endDate : 'Latest';
    link.setAttribute('download', `Farmer_Statement_${sanitizedFarmerName}_${startStr}_to_${endStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotificationMsg(`✓ Exported ${dateFilteredLots.length} transaction records to CSV!`);
    sounds.playCashChime();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-28 sm:pb-32">
      {/* Modal Top Navigation Header Bar */}
      {isModal && onClose && (
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#1a3a52] text-white rounded-2xl shadow-sm">
          <button
            type="button"
            id="katha-modal-back-btn"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-xs sm:text-sm font-bold transition min-touch-target cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'te' ? 'వెనుకకు' : language === 'hi' ? 'पीछे' : 'Back'}</span>
          </button>
          <div className="text-center">
            <h2 className="text-sm sm:text-base font-black">
              {currentFarmer ? `${currentFarmer.name} • Khata Statement` : 'Farmer Khata Statement'}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-300">Official Form C Mandi Ledger & Combined PDF</p>
          </div>
          <button
            type="button"
            id="katha-modal-close-btn"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition min-touch-target cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{notificationMsg}</span>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="text-white/80 hover:text-white text-xs uppercase px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: FIND THE FARMER & DATE (Sequential Step 1 & 2) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a3a52] text-white flex items-center justify-center font-black shadow-sm">
              <User className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {language === 'te' ? 'రైతు & తేదీ ఎంపిక' : 'Find Farmer & Date'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'te' ? 'ఖాతా వివరాలను చూడటానికి రైతును ఎంచుకోండి' : 'Select a grower and pick the accounting time period'}
              </p>
            </div>
          </div>

          {currentFarmer && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{currentFarmer.name}</span>
              </div>
              {/* EDIT FARMER ACTION BUTTON */}
              <button
                type="button"
                id="katha-edit-farmer-header-btn"
                onClick={handleOpenEditFarmerModal}
                className="px-3 py-1.5 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white border border-[#1a3a52] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs min-touch-target"
                title="Edit Farmer Name, Village, Phone, or Photo"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Edit Farmer Details</span>
              </button>
              {/* DELETE FARMER ACTION BUTTON */}
              <button
                type="button"
                id="katha-delete-farmer-header-btn"
                onClick={() => handleDeleteFarmerClick(currentFarmer)}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs min-touch-target"
                title="Permanently Delete Farmer and all linked records"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete Farmer</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-5 space-y-6">
          {/* STEP 1: PICK A FARMER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1a3a52] text-[#d4af37] text-xs font-black flex items-center justify-center">
                  1
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                  {language === 'te' ? 'రైతును ఎంచుకోండి' : 'Step 1: Pick a Farmer'}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {matchedFarmers.length} {matchedFarmers.length === 1 ? 'farmer' : 'farmers'} found
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                id="merchant-katha-farmer-search-input"
                type="text"
                placeholder={language === 'te' ? 'రైతు పేరు లేదా ఫోన్ నంబర్ శోధించండి...' : 'Type name or phone number (e.g. Ramesh Reddy)...'}
                value={searchNameQuery}
                onChange={(e) => setSearchNameQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 min-h-[48px] rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a3a52] focus:bg-white transition"
              />
            </div>

            {/* Farmer Chips / Cards */}
            {matchedFarmers.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                No farmers found matching &quot;{searchNameQuery}&quot;.
              </div>
            ) : (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {matchedFarmers.map((f) => {
                  const isSelected = selectedFarmerId === f.id;
                  return (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => {
                        setSelectedFarmerId(f.id);
                        setSearchNameQuery(f.name);
                      }}
                      className={`min-h-[52px] px-3.5 py-2 rounded-2xl flex items-center gap-3 shrink-0 transition-all cursor-pointer border-2 text-left ${
                        isSelected
                          ? 'bg-[#1a3a52] text-white border-[#1a3a52] shadow-md ring-2 ring-[#d4af37]/50'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-black text-sm border ${
                          isSelected
                            ? 'border-[#d4af37] bg-white/10 text-white'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}
                      >
                        {f.photoUrl ? (
                          <img
                            src={f.photoUrl}
                            alt={f.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{f.name ? f.name.charAt(0) : '🌾'}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-xs sm:text-sm leading-tight line-clamp-1">
                          {f.name}
                        </div>
                        <div
                          className={`text-[11px] leading-tight flex items-center gap-1.5 mt-0.5 ${
                            isSelected ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          <span>📍 {f.village || 'Yard'}</span>
                          <span>•</span>
                          <span>📞 {f.phone ? f.phone.slice(-4) : '—'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MUTUAL CONNECTION STATUS CARD */}
            {currentFarmer && (
              <div className="mt-3 p-3.5 rounded-2xl border transition-all bg-slate-50 border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        connectionStatus === 'connected'
                          ? 'bg-emerald-600 text-white'
                          : connectionStatus === 'pending_from_farmer'
                          ? 'bg-amber-500 text-white'
                          : connectionStatus === 'pending_from_merchant'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {connectionStatus === 'connected' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : connectionStatus === 'pending_from_farmer' ? (
                        <Clock className="w-5 h-5 animate-pulse" />
                      ) : connectionStatus === 'pending_from_merchant' ? (
                        <Send className="w-5 h-5" />
                      ) : (
                        <Link2 className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {connectionStatus === 'connected' && '⚡ Connected to Farmer Portal'}
                          {connectionStatus === 'pending_from_farmer' && '📩 Connection Request Received'}
                          {connectionStatus === 'pending_from_merchant' && '⏳ Connection Request Pending'}
                          {connectionStatus === 'declined' && 'Connection Request Declined'}
                          {connectionStatus === 'not_connected' && 'Portal Connection Inactive'}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            connectionStatus === 'connected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : connectionStatus === 'pending_from_farmer'
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : connectionStatus === 'pending_from_merchant'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {connectionStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {connectionStatus === 'connected' &&
                          `Form C statements generated here automatically sync in real-time to ${currentFarmer.name}'s mobile app.`}
                        {connectionStatus === 'pending_from_farmer' &&
                          `${currentFarmer.name} requested to link accounts. Accept to enable direct statement syncing.`}
                        {connectionStatus === 'pending_from_merchant' &&
                          `Invitation sent to ${currentFarmer.name} (${currentFarmer.phone}). Waiting for farmer approval.`}
                        {connectionStatus === 'not_connected' &&
                          `Connect with ${currentFarmer.name} to auto-push digital Form C statements directly to their phone.`}
                        {connectionStatus === 'declined' &&
                          'Mutual connection is currently closed. You can send a fresh connection request anytime.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {connectionStatus === 'not_connected' && (
                      <button
                        type="button"
                        onClick={handleSendConnectRequestToFarmer}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Connect Farmer</span>
                      </button>
                    )}

                    {connectionStatus === 'pending_from_farmer' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAcceptFarmerRequest}
                          className="px-3 py-1.5 min-h-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDeclineFarmerRequest}
                          className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          <span>Decline</span>
                        </button>
                      </div>
                    )}

                    {connectionStatus === 'pending_from_merchant' && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        Request Sent
                      </span>
                    )}

                    {connectionStatus === 'connected' && (
                      <button
                        type="button"
                        onClick={handleDisconnectFarmer}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Disconnect accounts"
                      >
                        <Link2Off className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: PICK A DATE RANGE (ALL TIME IS DEFAULT) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1a3a52] text-[#d4af37] text-xs font-black flex items-center justify-center">
                  2
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                  {language === 'te' ? 'తేదీని ఎంచుకోండి' : 'Step 2: Pick Date Range'}
                </span>
              </div>

              {/* Status Pill */}
              {!startDate && !endDate ? (
                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>All Time (Full Ledger History)</span>
                </span>
              ) : isSingleDay ? (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Single Day: {startDate}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Range: {startDate || 'Start'} to {endDate || 'End'}</span>
                </span>
              )}
            </div>

            {/* Quick-Select Buttons: Default Session Date and Custom Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="katha-filter-today-btn"
                onClick={() => handleSetQuickDate('today')}
                className={`min-h-[48px] px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer border-2 ${
                  startDate === todayStr && endDate === todayStr
                    ? 'bg-[#1a3a52] text-white border-[#1a3a52] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#d4af37]" />
                <span>Default Date ({todayStr})</span>
              </button>

              <button
                type="button"
                id="katha-filter-custom-btn"
                onClick={() => setShowCustomDatePickers(!showCustomDatePickers)}
                className={`min-h-[48px] px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer border-2 ${
                  showCustomDatePickers || (startDate && startDate !== todayStr)
                    ? 'bg-[#1a3a52] text-white border-[#1a3a52] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Filter className="w-4 h-4 text-[#d4af37]" />
                <span>Custom Range</span>
              </button>
            </div>

            {/* Custom Date Pickers Drawer */}
            {showCustomDatePickers && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
                <div className="space-y-1">
                  <label htmlFor="katha-start-date" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1a3a52]" />
                    <span>{language === 'te' ? 'ప్రారంభ తేదీ:' : 'Start Date:'}</span>
                  </label>
                  <input
                    id="katha-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1a3a52]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="katha-end-date" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1a3a52]" />
                    <span>{language === 'te' ? 'ముగింపు తేదీ:' : 'End Date:'}</span>
                  </label>
                  <input
                    id="katha-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1a3a52]"
                  />
                </div>
              </div>
            )}

            {startDate && openingBalance > 0 && (
              <div className="pt-2 flex justify-end">
                <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  Opening Balance Carried Forward: <span className="font-mono text-slate-900 font-black">₹{openingBalance.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: SEND OR SAVE IT (Step 3: Primary Action & Export Toolbar) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a3a52] text-white flex items-center justify-center font-black shadow-sm">
              <Share2 className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {language === 'te' ? 'స్టేట్‌మెంట్ పంపండి లేదా డౌన్‌లోడ్ చేయండి' : 'Send or Save Statement'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'te' ? 'WhatsApp ద్వారా పంపండి లేదా అధికారిక PDF సేవ్ చేసుకోండి' : 'Share directly to farmer via WhatsApp or export official Form C copy'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Farmer Net Payable</span>
            <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
              ₹{statementMetrics.farmerNetMoney.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* PDF Status Message */}
          {pdfStatusMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfStatusMessage}</span>
            </div>
          )}

          {/* PRIMARY DOMINANT ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary Action 1: WhatsApp Share */}
            <button
              type="button"
              id="katha-whatsapp-btn"
              onClick={handleShareWhatsApp}
              disabled={isSharingPdf || isGeneratingPdf || !currentFarmer}
              className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              title="Share Statement PDF via WhatsApp / Native Share Sheet"
            >
              {isSharingPdf ? (
                <Loader2 className="w-6 h-6 animate-spin shrink-0 text-white" />
              ) : (
                <Share2 className="w-6 h-6 shrink-0 text-white" />
              )}
              <div className="text-left">
                <div className="leading-tight font-black">
                  {isSharingPdf ? 'Sharing PDF...' : 'Share WhatsApp'}
                </div>
                <div className="text-[11px] font-normal text-emerald-100 leading-tight">
                  Send PDF statement to {currentFarmer?.name || 'Farmer'}
                </div>
              </div>
            </button>

            {/* Primary Action 2: Download PDF */}
            <button
              type="button"
              id="katha-pdf-download-btn"
              disabled={isGeneratingPdf || !currentFarmer}
              onClick={handleDownloadKathaPdf}
              className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#1a3a52] hover:bg-[#122839] active:bg-[#0c1a26] text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              title="Download Combined Form C PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin shrink-0" />
              ) : (
                <Download className="w-6 h-6 text-[#d4af37] shrink-0" />
              )}
              <div className="text-left">
                <div className="leading-tight font-black">
                  {isGeneratingPdf ? 'Generating PDF...' : 'Generate / Download PDF'}
                </div>
                <div className="text-[11px] font-normal text-slate-300 leading-tight">
                  Single combined A4 document ({dateFilteredLots.length} {dateFilteredLots.length === 1 ? 'parchi' : 'parchis'})
                </div>
              </div>
            </button>
          </div>

          {/* SECONDARY ACTION ROW (Form C Editor, CSV Export) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {/* Form C Editor */}
            <button
              type="button"
              id="katha-customize-formc-btn"
              onClick={() => setIsCustomFormCModalOpen(true)}
              disabled={!currentFarmer}
              className="min-h-[48px] px-3 py-2 rounded-2xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Sliders className="w-4 h-4 text-[#1a3a52]" />
              <span>Form C Editor</span>
            </button>

            {/* CSV Export */}
            <button
              type="button"
              id="katha-csv-btn"
              onClick={handleExportCSV}
              disabled={!currentFarmer || dateFilteredLots.length === 0}
              className="min-h-[48px] px-3 py-2 rounded-2xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: STATEMENT & CONSIGNMENT PARTICULARS */}
      <div className="space-y-6">
        {/* 3A: OFFICIAL FORM C COMBINED PDF INVOICE SHEET VIEW */}
        {currentFarmer && kathaFormCData ? (
          <div className="bg-slate-50 p-3.5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1a3a52] text-white flex items-center justify-center font-black shadow-xs">
                  <FileText className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 leading-tight">
                    Official Mandi Statement Preview
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    APMC Standard Statement ({dateFilteredLots.length} {dateFilteredLots.length === 1 ? 'Parchi' : 'Parchis'})
                  </p>
                </div>
              </div>

              {/* Quick Actions for Form C */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  id="form-c-quick-custom-btn"
                  onClick={() => setIsCustomFormCModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1a3a52] hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-touch-target"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Customize</span>
                </button>
                <button
                  type="button"
                  id="form-c-quick-pdf-btn"
                  onClick={handleDownloadKathaPdf}
                  disabled={isGeneratingPdf}
                  className="px-3 py-1.5 rounded-xl bg-[#1a3a52] text-white hover:bg-[#122839] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-touch-target"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                  )}
                  <span>{isGeneratingPdf ? 'Exporting...' : 'PDF'}</span>
                </button>
              </div>
            </div>

            {/* Mobile swipe helper */}
            <div className="block sm:hidden text-[10px] text-slate-500 font-semibold text-center bg-slate-200/60 py-1 px-2 rounded-lg">
              ↔ Swipe horizontally to view full table &amp; deductions
            </div>

            <div className="overflow-x-auto py-1">
              <FormCInvoiceCanvas
                ref={formCPdfRef}
                data={kathaFormCData}
                format="a4"
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No records found. Please select a farmer or add a consignment entry.
          </div>
        )}

        {/* 3B: CONSIGNMENT LOTS PARTICULARS TABLE & MOBILE CARDS */}
        {currentFarmer && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-5">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Consignment Lots
                </span>
                <span className="text-lg font-black text-slate-900">
                  {statementMetrics.lotsCount} {statementMetrics.lotsCount === 1 ? 'Lot' : 'Lots'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {language === 'te' ? 'బాక్సులు' : 'Total Boxes'}
                </span>
                <span className="text-lg font-black text-[#1a3a52] font-mono">
                  {statementMetrics.totalBoxes ? `${statementMetrics.totalBoxes} Boxes` : '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Total Flower Volume
                </span>
                <span className="text-lg font-black text-slate-900">
                  {statementMetrics.totalVolume} units
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Current Status
                </span>
                <span
                  className={`text-xs sm:text-sm font-black inline-block px-2.5 py-0.5 rounded-full mt-1 ${
                    statementMetrics.balanceDue === 0 && statementMetrics.lotsCount > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : statementMetrics.amountPaid > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {statementMetrics.balanceDue === 0 && statementMetrics.lotsCount > 0
                    ? 'Settled ✓'
                    : statementMetrics.amountPaid > 0
                    ? `Due ₹${statementMetrics.balanceDue.toFixed(2)}`
                    : `Unpaid ₹${statementMetrics.balanceDue.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Consignment Particulars Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1a3a52]" />
                  <span>
                    Consignment Particulars ({dateFilteredLots.length}{' '}
                    {!startDate && !endDate ? 'All Time Lots' : isSingleDay ? `Lots for ${startDate}` : `Lots in Period`})
                  </span>
                </h4>
                <span className="text-xs text-slate-500">
                  Showing records for {currentFarmer.name}
                </span>
              </div>

              {dateFilteredLots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                  <p className="font-bold text-slate-800">No records found for the selected date range.</p>
                  <p>Try switching to &quot;All Time&quot; to view past records.</p>
                </div>
              ) : (
                <>
                  {/* MOBILE VIEW: Lot Cards */}
                  <div className="space-y-3 block md:hidden">
                    {dateFilteredLots.map((lot) => {
                      const hamali = lot.ammaliCharges || lot.otherExpenditures?.hamali || 0;
                      const trans = lot.transportCharges || lot.otherExpenditures?.transport || 0;
                      const comm = lot.commissionAmount || 0;
                      const misc = lot.otherExpenditures?.misc || 0;

                      return (
                        <div
                          key={lot.id}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-[#1a3a52]">
                                  {lot.parchiNumber}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${
                                    lot.flowerQuality === 'Bad'
                                      ? 'bg-red-50 text-red-800 border-red-300'
                                      : lot.flowerQuality === 'Average'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {lot.flowerQuality || 'Good'}
                                </span>
                              </div>
                              <h5 className="text-sm font-black text-slate-900 mt-0.5">
                                {lot.flowerVariety}
                              </h5>
                              <p className="text-[10px] text-slate-500">
                                {lot.date} • {lot.time || 'Morning'}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                Farmer Net
                              </span>
                              <span className="text-base font-black font-mono text-emerald-700">
                                ₹{lot.farmerNetPayable.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-white border border-slate-200 text-center text-xs">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Quantity</span>
                              <span className="font-bold text-slate-800 font-mono">{lot.quantity} {lot.unit}</span>
                              {lot.boxesCount ? (
                                <span className="text-[9px] text-slate-500 block">({lot.boxesCount} bx)</span>
                              ) : null}
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Rate</span>
                              <span className="font-bold text-slate-800 font-mono">₹{lot.rate.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Gross Total</span>
                              <span className="font-bold text-slate-800 font-mono">₹{lot.grossTotal.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 flex-wrap gap-1">
                            {hamali > 0 && <span>Hamali: <strong className="text-red-700 font-mono">-₹{hamali.toFixed(2)}</strong></span>}
                            {trans > 0 && <span>Transport: <strong className="text-red-700 font-mono">-₹{trans.toFixed(2)}</strong></span>}
                            {comm > 0 && <span>Comm: <strong className="text-red-700 font-mono">-₹{comm.toFixed(2)}</strong></span>}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => openPdfModalForLot(lot)}
                              className="px-3 py-1.5 rounded-xl bg-[#1a3a52] text-white hover:bg-[#122839] text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer min-touch-target"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>Generate Parchi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectParchiLot) onSelectParchiLot(lot);
                                else setSelectedParchiLot(lot);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1a3a52] hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer min-touch-target"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Slip</span>
                            </button>
                            <button
                              type="button"
                              id={`delete-katha-lot-mobile-btn-${lot.id}`}
                              onClick={() => handleDeleteLotClick(lot)}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer min-touch-target"
                              title="Delete lot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP VIEW: Full Consignment Particulars Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-2xl bg-white overflow-hidden">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Parchi No. / Date</th>
                          <th className="p-3">Item / Variety</th>
                          <th className="p-3 text-center">Quality</th>
                          <th className="p-3 text-center">Boxes</th>
                          <th className="p-3 text-right">Quantity</th>
                          <th className="p-3 text-right">Rate</th>
                          <th className="p-3 text-right">Gross Total</th>
                          <th className="p-3 text-right">Hamali</th>
                          <th className="p-3 text-right">Transport</th>
                          <th className="p-3 text-right">Commission</th>
                          <th className="p-3 text-right">Farmer Net</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dateFilteredLots.map((lot) => {
                          const hamali = lot.ammaliCharges || lot.otherExpenditures?.hamali || 0;
                          const trans = lot.transportCharges || lot.otherExpenditures?.transport || 0;
                          const comm = lot.commissionAmount || 0;

                          return (
                            <tr key={lot.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono">
                                <span className="font-bold text-[#1a3a52] block">{lot.parchiNumber}</span>
                                <span className="text-[10px] text-slate-500">{lot.date} • {lot.time || 'Morning'}</span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                {lot.flowerVariety}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase ${
                                    lot.flowerQuality === 'Bad'
                                      ? 'bg-red-50 text-red-800 border-red-300'
                                      : lot.flowerQuality === 'Average'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {lot.flowerQuality || 'Good'}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-800">
                                {lot.boxesCount ? `${lot.boxesCount}` : '—'}
                              </td>
                              <td className="p-3 text-right font-bold text-slate-900 font-mono">
                                {lot.quantity} {lot.unit}
                              </td>
                              <td className="p-3 text-right font-mono">
                                ₹{lot.rate.toFixed(2)}/{lot.unit}
                              </td>
                              <td className="p-3 text-right font-mono font-bold">
                                ₹{lot.grossTotal.toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-mono text-red-800">
                                {hamali > 0 ? `-₹${hamali.toFixed(2)}` : '₹0.00'}
                              </td>
                              <td className="p-3 text-right font-mono text-red-800">
                                {trans > 0 ? `-₹${trans.toFixed(2)}` : '₹0.00'}
                              </td>
                              <td className="p-3 text-right font-mono text-red-800">
                                {comm > 0 ? `-₹${comm.toFixed(2)}` : '₹0.00'}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-emerald-800">
                                ₹{lot.farmerNetPayable.toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Form C Single Parchi Button */}
                                  <button
                                    type="button"
                                    onClick={() => openPdfModalForLot(lot)}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#1a3a52] text-white hover:bg-[#122839] cursor-pointer text-[10px] font-bold flex items-center gap-1 shadow-sm transition"
                                    title="Generate Form C Parchi for this lot"
                                  >
                                    <FileText className="w-3 h-3 text-[#d4af37]" />
                                    <span>Parchi</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onSelectParchiLot) onSelectParchiLot(lot);
                                      else setSelectedParchiLot(lot);
                                    }}
                                    className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[#1a3a52] hover:bg-slate-200 cursor-pointer"
                                    title="Open Thermal Auction Slip"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    id={`delete-katha-lot-btn-${lot.id}`}
                                    onClick={() => handleDeleteLotClick(lot)}
                                    className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-red-700 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                                    title="Delete this consignment record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form C Interactive Customizer & PDF Modal */}
      {isCustomFormCModalOpen && kathaFormCData && (
        <GeneratePdfModal
          isOpen={isCustomFormCModalOpen}
          onClose={() => setIsCustomFormCModalOpen(false)}
          lots={dateFilteredLots}
          draftData={{
            farmerName: kathaFormCData.farmerName,
            farmerVillage: kathaFormCData.farmerVillage,
            farmerPhone: kathaFormCData.farmerPhone,
            parchiNumber: kathaFormCData.parchiNumber,
            date: kathaFormCData.date,
            time: kathaFormCData.time,
            grossTotal: kathaFormCData.grossTotal,
            transportCharges: kathaFormCData.transportCharges,
            ammaliCharges: kathaFormCData.ammaliCharges,
            commissionPercent: kathaFormCData.commissionPercent,
            commissionAmount: kathaFormCData.commissionAmount,
            miscCommissionAmount: kathaFormCData.miscCommissionAmount,
            amountPaid: kathaFormCData.amountPaid,
            paymentMode: kathaFormCData.paymentMode,
            paymentStatus: kathaFormCData.paymentStatus,
            items: kathaFormCData.items,
          }}
        />
      )}

      {/* Unified Delete Lot Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        title="Delete Consignment Lot"
        itemName={deleteModalConfig.lot ? `Consignment Lot: ${deleteModalConfig.lot.parchiNumber}` : undefined}
        itemDetails={
          deleteModalConfig.lot
            ? `Farmer: ${deleteModalConfig.lot.farmerName} • Variety: ${deleteModalConfig.lot.flowerVariety} • Amount: ₹${(deleteModalConfig.lot.grossTotal ?? deleteModalConfig.lot.farmerNetPayable ?? 0).toFixed(2)}`
            : undefined
        }
        message="Are you sure you want to delete this consignment record from the farmer's account statement?"
        confirmText="CONFIRM DELETE"
        cancelText="CANCEL"
        onConfirm={handleConfirmDeleteLot}
        onCancel={() => setDeleteModalConfig({ isOpen: false, lot: null })}
      />

      {/* Unified Delete Farmer Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteFarmerModalConfig.isOpen}
        title="Delete Farmer Account"
        itemName={deleteFarmerModalConfig.farmer ? `Farmer: ${deleteFarmerModalConfig.farmer.name}` : undefined}
        itemDetails={
          deleteFarmerModalConfig.farmer
            ? `Phone: ${deleteFarmerModalConfig.farmer.phone || 'N/A'} • Village: ${deleteFarmerModalConfig.farmer.village || 'N/A'}`
            : undefined
        }
        message={
          deleteFarmerModalConfig.farmer
            ? `Delete ${deleteFarmerModalConfig.farmer.name}? This will permanently remove all their records (parchis, payments, commission, charges). This cannot be undone.`
            : 'Are you sure you want to permanently delete this farmer and all their associated records?'
        }
        confirmWord={deleteFarmerModalConfig.farmer?.name}
        confirmText="PERMANENTLY DELETE FARMER"
        cancelText="CANCEL"
        onConfirm={handleConfirmDeleteFarmer}
        onCancel={() => setDeleteFarmerModalConfig({ isOpen: false, farmer: null })}
      />

      {/* Edit Farmer Details Modal */}
      {isEditFarmerModalOpen && (
        <div
          id="edit-farmer-modal-overlay"
          onClick={() => setIsEditFarmerModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden"
        >
          <div
            id="edit-farmer-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-[#1a3a52] text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditFarmerModalOpen(false)}
                  aria-label="Go Back"
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                    Edit Farmer Profile
                  </h3>
                  <p className="text-xs text-slate-200/80 mt-0.5">
                    Update name, village, mobile number &amp; crops
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditFarmerModalOpen(false)}
                aria-label="Close modal"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSaveEditedFarmer} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8fafc]">
              {editFarmerError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{editFarmerError}</span>
                </div>
              )}

              {/* Photo Upload Picker */}
              <PhotoUploadPicker
                label="Farmer Profile Photo"
                sublabel="Upload photo from phone/PC, capture with webcam, or choose a preset"
                currentPhotoUrl={editFarmerPhotoUrl}
                onChange={(url) => setEditFarmerPhotoUrl(url)}
                presetType="farmer"
                idPrefix="katha-edit-farmer"
              />

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Farmer Full Name *
                </label>
                <input
                  id="edit-farmer-name-input"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy"
                  value={editFarmerName}
                  onKeyDown={(e) => {
                    if (/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setEditFarmerName(e.target.value.replace(/[0-9]/g, ''))}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1a3a52]"
                />
              </div>

              {/* Mobile Number Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Mobile Number (10 Digits) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-500 font-mono">
                    +91
                  </span>
                  <input
                    id="edit-farmer-phone-input"
                    type="tel"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="9876543210"
                    value={editFarmerPhone}
                    onChange={(e) => setEditFarmerPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-[#1a3a52]"
                  />
                </div>
              </div>

              {/* Village Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Village / Town / Location *
                </label>
                <input
                  id="edit-farmer-village-input"
                  type="text"
                  required
                  placeholder="e.g. Ananthapur Grower Belt"
                  value={editFarmerVillage}
                  onChange={(e) => setEditFarmerVillage(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1a3a52]"
                />
              </div>

              {/* Primary Crops Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Primary Crops / Flower Varieties
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                  {flowerVarietiesData.map((variety) => {
                    const label = variety.en.split('(')[0].trim();
                    const isChecked = editFarmerCrops.includes(label);
                    return (
                      <button
                        type="button"
                        key={variety.id}
                        onClick={() => {
                          if (isChecked) {
                            setEditFarmerCrops(editFarmerCrops.filter((c) => c !== label));
                          } else {
                            setEditFarmerCrops([...editFarmerCrops, label]);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          isChecked
                            ? 'bg-[#1a3a52] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '} {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditFarmerModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-edit-farmer-btn"
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#1a3a52] text-white text-xs font-bold hover:bg-[#122839] transition cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

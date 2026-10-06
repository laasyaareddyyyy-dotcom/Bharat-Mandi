import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Coins,
  CheckCircle2,
  Printer,
  Sparkles,
  Calculator,
  Plus,
  ArrowRight,
  Info,
  Calendar,
  Trash2,
  Clock,
  RotateCcw,
  Wallet,
  Banknote,
  Smartphone,
  QrCode,
  Building,
  AlertCircle,
  CreditCard,
  FileText,
  Truck,
  DollarSign,
  Layers,
  Percent,
  Edit3,
  X,
  User,
} from 'lucide-react';
import { useMandi } from '../../context/MandiContext';
import { WeightUnit, PaymentStatus, PaymentMode, Expenditures, FlowerQuality, SaleLot, CommodityCategory, Farmer } from '../../types';
import {
  formatDisplayDate,
  getTodayDateString,
  getPastDateString,
  COMMODITY_CONFIGS,
} from '../../data/initialData';
import { PhotoUploadPicker } from '../common/PhotoUploadPicker';
import { GeneratePdfModal } from '../common/GeneratePdfModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { CustomVarietyInput } from '../common/CustomVarietyInput';
import { sounds } from '../../utils/audio';

export interface ConsignmentVarietyRow {
  id: string;
  commodityCategory: CommodityCategory;
  flowerVariety: string;
  customVariety: string;
  quantity: number | '';
  unit: WeightUnit;
  boxesCount: number | '';
  packagingType?: string;
  flowerQuality: FlowerQuality;
  rate: number | '';
}

// Safe commodity config retriever to guarantee zero runtime crashes
const getSafeCommodityConfig = (cat?: string) => {
  if (cat && COMMODITY_CONFIGS[cat as CommodityCategory]) {
    return COMMODITY_CONFIGS[cat as CommodityCategory];
  }
  return COMMODITY_CONFIGS.flowers;
};

export const NewSaleView: React.FC = () => {
  const {
    farmers,
    addFarmer,
    updateFarmer,
    addSaleLot,
    addShipment,
    deleteSaleLot,
    lots,
    shipments,
    setSelectedParchiLot,
    openEditParchiModal,
    merchantProfile,
    activeSessionDate,
    setActiveSessionDate,
    setIsDateSwitcherOpen,
    setMerchantTab,
    openPdfModalForLot,
    userCommodities,
    registeredAccounts,
    activeCommodityFilter,
    addCustomVarietyName,
    language,
    t,
  } = useMandi();

  // Trading Date for this consignment entry (defaults to active session date)
  const [saleDate, setSaleDate] = useState<string>(activeSessionDate);

  useEffect(() => {
    setSaleDate(activeSessionDate);
  }, [activeSessionDate]);

  // Form State
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || '');
  const [farmerSearch, setFarmerSearch] = useState<string>('');
  const [isFarmerDropdownOpen, setIsFarmerDropdownOpen] = useState(false);
  const [showInlineAddFarmer, setShowInlineAddFarmer] = useState(false);

  // New Inline Farmer Form State
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [newFarmerName, setNewFarmerName] = useState('');
  const [newFarmerPhone, setNewFarmerPhone] = useState('');
  const [newFarmerVillage, setNewFarmerVillage] = useState('');
  const [newFarmerPhotoUrl, setNewFarmerPhotoUrl] = useState('');

  // Primary commodity for initial variety row (synced with active commodity)
  const initialCategory: CommodityCategory = (
    activeCommodityFilter && activeCommodityFilter !== 'all'
      ? activeCommodityFilter
      : userCommodities[0] || 'flowers'
  ) as CommodityCategory;
  const initialConfig = getSafeCommodityConfig(initialCategory);
  const initialVariety = initialConfig.varieties[0]?.en || 'Standard';
  const initialUnit = (initialConfig.allowedUnits[0] as WeightUnit) || 'Kgs';
  const initialRate = initialConfig.varieties[0]?.defaultRate || 40;

  // Consignment Details: Supports grouping multiple varieties across commodities in ONE shipment
  const [varietyRows, setVarietyRows] = useState<ConsignmentVarietyRow[]>([
    {
      id: 'var-1',
      commodityCategory: initialCategory,
      flowerVariety: initialVariety,
      customVariety: '',
      quantity: '',
      unit: initialUnit,
      boxesCount: '',
      packagingType: initialCategory === 'grains' ? 'Bags' : 'Boxes',
      flowerQuality: 'Good',
      rate: '',
    },
  ]);
  const [activeRowId, setActiveRowId] = useState<string>('var-1');

  // Sync category when activeCommodityFilter changes
  useEffect(() => {
    if (activeCommodityFilter && activeCommodityFilter !== 'all') {
      const targetConfig = getSafeCommodityConfig(activeCommodityFilter);
      setVarietyRows((prev) =>
        prev.map((r) => ({
          ...r,
          commodityCategory: activeCommodityFilter,
          flowerVariety: targetConfig.varieties[0]?.en || 'Standard',
          customVariety: '',
          unit: (targetConfig.allowedUnits[0] as WeightUnit) || 'Kgs',
          packagingType: activeCommodityFilter === 'grains' ? 'Bags' : 'Boxes',
          rate: targetConfig.varieties[0]?.defaultRate || 40,
        }))
      );
    }
  }, [activeCommodityFilter]);

  // Interactive Tools & PDF Modal State
  const [showDigitalScale, setShowDigitalScale] = useState<boolean>(false);
  const [showRateNegotiator, setShowRateNegotiator] = useState<boolean>(false);
  const [isDraftPdfOpen, setIsDraftPdfOpen] = useState<boolean>(false);
  const [selectedLotForPdf, setSelectedLotForPdf] = useState<SaleLot | null>(null);

  // Charges State: Deductions per transaction (Hamali, Transport, Mandi Commission, and Misleene Commission)
  const [ammaliCharge, setAmmaliCharge] = useState<number | ''>(''); // Hamali / Loading (₹)
  const [transportCharge, setTransportCharge] = useState<number | ''>(''); // Transport / Freight (₹)
  const [commissionRate, setCommissionRate] = useState<number | ''>(''); // Mandi Commission Rate (%)
  const [miscCommissionRate, setMiscCommissionRate] = useState<number | ''>(''); // Misleene Commission Rate (%)

  // Payment Options & Settlement State
  const [paymentChoice, setPaymentChoice] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [payPortion, setPayPortion] = useState<'full' | 'partial'>('full');
  const [amountPaidNow, setAmountPaidNow] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Action Notification State
  const [actionFeedbackMsg, setActionFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Unified Delete Confirmation State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    type: 'lot' | 'varietyRow';
    lot?: SaleLot;
    varietyRowId?: string;
    varietyName?: string;
    rowDetails?: string;
  }>({
    isOpen: false,
    type: 'lot',
  });

  const handleDeleteVarietyRowClick = (row: ConsignmentVarietyRow) => {
    const vName = row.customVariety.trim() || row.flowerVariety;
    setDeleteModalConfig({
      isOpen: true,
      type: 'varietyRow',
      varietyRowId: row.id,
      varietyName: vName,
      rowDetails: `Packaging: ${row.boxesCount || 0} ${row.packagingType || 'Boxes'} • Quantity: ${row.quantity || 0} ${row.unit} • Rate: ₹${row.rate || 0}/${row.unit} • Quality: ${row.flowerQuality || 'Good'}`,
    });
  };

  const handleDeleteLotClick = (lot: SaleLot) => {
    setDeleteModalConfig({
      isOpen: true,
      type: 'lot',
      lot,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteModalConfig.type === 'varietyRow' && deleteModalConfig.varietyRowId) {
      const rowId = deleteModalConfig.varietyRowId;
      const vName = deleteModalConfig.varietyName || 'Flower variety';
      setVarietyRows((prev) => prev.filter((r) => r.id !== rowId));
      if (activeRowId === rowId) {
        const remaining = varietyRows.filter((r) => r.id !== rowId);
        if (remaining[0]) setActiveRowId(remaining[0].id);
      }
      sounds.playTrashSound?.();
      setActionFeedbackMsg({ type: 'success', text: `✓ Variety "${vName}" removed from consignment list.` });
      setTimeout(() => setActionFeedbackMsg(null), 3000);
    } else if (deleteModalConfig.type === 'lot' && deleteModalConfig.lot) {
      const lotNumber = deleteModalConfig.lot.parchiNumber;
      deleteSaleLot(deleteModalConfig.lot.id);
      sounds.playTrashSound?.();
      setActionFeedbackMsg({ type: 'success', text: `✓ Consignment lot ${lotNumber} permanently deleted.` });
      setTimeout(() => setActionFeedbackMsg(null), 3000);
    }
    setDeleteModalConfig({ isOpen: false, type: 'lot' });
  };

  // Selected Farmer details
  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId);

  // Real-time Calculations for all varieties in the shipment
  const computedVarietyRows = useMemo(() => {
    return varietyRows.map((row) => {
      const q = typeof row.quantity === 'number' ? row.quantity : 0;
      const b = typeof row.boxesCount === 'number' ? row.boxesCount : 0;
      const pType = row.packagingType || (row.commodityCategory === 'grains' ? 'Bags' : 'Boxes');
      const r = typeof row.rate === 'number' ? row.rate : 0;
      const lineGross = Math.round(q * r);
      const displayName = row.customVariety.trim() || row.flowerVariety;
      return {
        ...row,
        numericQuantity: q,
        numericBoxes: b,
        packagingType: pType,
        numericRate: r,
        lineGross,
        displayName,
      };
    });
  }, [varietyRows]);

  const grossTotal = useMemo(() => {
    return computedVarietyRows.reduce((sum, r) => sum + r.lineGross, 0);
  }, [computedVarietyRows]);

  const totalQuantity = useMemo(() => {
    return computedVarietyRows.reduce((sum, r) => sum + r.numericQuantity, 0);
  }, [computedVarietyRows]);

  const totalBoxes = useMemo(() => {
    return computedVarietyRows.reduce((sum, r) => sum + r.numericBoxes, 0);
  }, [computedVarietyRows]);

  // Backward compatibility convenience for single item / active row
  const activeRow = computedVarietyRows.find((r) => r.id === activeRowId) || computedVarietyRows[0];
  const flowerVariety = activeRow?.flowerVariety || 'Rose';
  const numericQuantity = activeRow?.numericQuantity || 0;
  const numericBoxes = activeRow?.numericBoxes || 0;
  const numericRate = activeRow?.numericRate || 0;
  const unit = activeRow?.unit || 'Kgs';

  // Itemized numerical deductions (Hamali, Transport, Mandi Commission & Misleene Commission per sale transaction)
  const numericAmmali = typeof ammaliCharge === 'number' ? ammaliCharge : 0;
  const numericTransport = typeof transportCharge === 'number' ? transportCharge : 0;
  const numericCommissionRate = typeof commissionRate === 'number' ? Math.max(0, commissionRate) : 0;
  const numericCommissionAmount = numericCommissionRate > 0 ? Math.round((grossTotal * numericCommissionRate) / 100) : 0;
  const numericMiscCommissionRate = typeof miscCommissionRate === 'number' ? Math.max(0, miscCommissionRate) : 0;
  const numericMiscCommissionAmount = numericMiscCommissionRate > 0 ? Math.round((grossTotal * numericMiscCommissionRate) / 100) : 0;

  // Total Deductions per transaction = Hamali + Transport + Mandi Commission + Misleene Commission
  const totalDeductions = useMemo(() => {
    return numericAmmali + numericTransport + numericCommissionAmount + numericMiscCommissionAmount;
  }, [numericAmmali, numericTransport, numericCommissionAmount, numericMiscCommissionAmount]);

  // Net Amount to Farmer after transaction deductions
  const farmerNetPayable = useMemo(() => {
    return Math.max(0, grossTotal - totalDeductions);
  }, [grossTotal, totalDeductions]);

  // Derived effective payment amounts and status
  const numericPaid = useMemo(() => {
    if (paymentChoice === 'pay_later') return 0;
    if (typeof amountPaidNow === 'number') return Math.max(0, Math.min(farmerNetPayable, amountPaidNow));
    return 0;
  }, [paymentChoice, amountPaidNow, farmerNetPayable]);

  const paymentStatus = useMemo<PaymentStatus>(() => {
    if (paymentChoice === 'pay_later') return 'Unpaid';
    if (numericPaid >= farmerNetPayable && farmerNetPayable > 0) return 'Paid';
    if (numericPaid > 0 && numericPaid < farmerNetPayable) return 'Partial';
    return 'Unpaid';
  }, [paymentChoice, numericPaid, farmerNetPayable]);

  const balanceDue = useMemo(() => {
    return Math.max(0, farmerNetPayable - numericPaid);
  }, [farmerNetPayable, numericPaid]);

  // Keep amountPaidNow in sync when net payable changes or when pay options switch
  useEffect(() => {
    if (paymentChoice === 'pay_now') {
      if (payPortion === 'full') {
        setAmountPaidNow(farmerNetPayable);
      } else if (amountPaidNow === '') {
        setAmountPaidNow(Math.round(farmerNetPayable / 2));
      }
    } else {
      setAmountPaidNow(0);
    }
  }, [farmerNetPayable, paymentChoice, payPortion]);

  // Filtered farmers for dropdown
  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.village.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.phone.includes(farmerSearch)
  );

  // Handle Inline Add/Edit Farmer
  const handleSaveInlineFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmerName.trim()) {
      alert('Please enter farmer name');
      return;
    }

    if (/[0-9]/.test(newFarmerName)) {
      alert(language === 'te' ? 'రైతు పేరులో అంకెలు ఉండకూడదు' : 'Farmer name cannot contain numbers');
      return;
    }

    const cleanPhone = newFarmerPhone.replace(/\D/g, '').slice(-10);
    if (newFarmerPhone.trim() && cleanPhone.length !== 10) {
      alert('Phone number must contain only numbers (exactly 10 digits)');
      return;
    }

    if (editingFarmer) {
      updateFarmer(editingFarmer.id, {
        name: newFarmerName.trim(),
        phone: cleanPhone || editingFarmer.phone,
        village: newFarmerVillage.trim() || editingFarmer.village,
        photoUrl: newFarmerPhotoUrl.trim() || editingFarmer.photoUrl,
      });
      setSelectedFarmerId(editingFarmer.id);
      setEditingFarmer(null);
    } else {
      const created = addFarmer({
        name: newFarmerName.trim(),
        phone: cleanPhone || '',
        village: newFarmerVillage.trim() || 'Local Mandi Belt',
        primaryCrops: [flowerVariety],
        connectedMerchantIds: [merchantProfile.merchantId],
        photoUrl: newFarmerPhotoUrl.trim() || undefined,
      });
      setSelectedFarmerId(created.id);
    }

    setNewFarmerName('');
    setNewFarmerPhone('');
    setNewFarmerVillage('');
    setNewFarmerPhotoUrl('');
    setShowInlineAddFarmer(false);
  };

  // Submit Sale Shipment & Generate Parchi
  const handleSaveLot = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    let targetFarmer = selectedFarmer;

    if (!targetFarmer) {
      if (farmerSearch.trim()) {
        const query = farmerSearch.trim().toLowerCase();
        const extractedDigits = farmerSearch.replace(/\D/g, '').slice(-10);

        // 1. Search existing farmers list by name or phone digits
        const found = farmers.find((f) => {
          const fPhone = f.phone ? f.phone.replace(/\D/g, '').slice(-10) : '';
          if (extractedDigits && extractedDigits.length === 10 && fPhone === extractedDigits) return true;
          return f.name.toLowerCase() === query || f.phone.includes(query);
        });

        if (found) {
          const cleanFPhone = found.phone ? found.phone.replace(/\D/g, '').slice(-10) : '';
          if (extractedDigits && extractedDigits.length === 10 && cleanFPhone !== extractedDigits) {
            updateFarmer(found.id, { phone: extractedDigits });
            targetFarmer = { ...found, phone: extractedDigits };
          } else {
            targetFarmer = found;
          }
          setSelectedFarmerId(found.id);
        } else {
          // 2. Check if a farmer account is registered in the app with extracted phone
          const registeredAcc = registeredAccounts.find(
            (a) => a.role === 'farmer' && extractedDigits && extractedDigits.length === 10 && a.phoneNumber.replace(/\D/g, '').slice(-10) === extractedDigits
          );

          const farmerTextName = farmerSearch.replace(/[0-9]/g, '').trim();
          const finalFarmerName = registeredAcc?.fullName || farmerTextName || (extractedDigits ? `Farmer (+91 ${extractedDigits})` : farmerSearch.trim());
          const finalFarmerVillage = registeredAcc?.shopOrVillage || 'Mandi Area';
          const finalFarmerPhone = extractedDigits.length === 10 ? extractedDigits : '';

          const created = addFarmer({
            name: finalFarmerName,
            village: finalFarmerVillage,
            phone: finalFarmerPhone,
            primaryCrops: userCommodities,
            connectedMerchantIds: [merchantProfile.merchantId],
          });
          targetFarmer = created;
          setSelectedFarmerId(created.id);
        }
      } else if (farmers.length > 0) {
        targetFarmer = farmers[0];
        setSelectedFarmerId(farmers[0].id);
      } else {
        // Auto-create default Mandi farmer if farmers list is completely empty
        const created = addFarmer({
          name: 'General Mandi Farmer',
          village: 'Mandi Yard',
          phone: '',
          primaryCrops: userCommodities,
          connectedMerchantIds: [merchantProfile.merchantId],
        });
        targetFarmer = created;
        setSelectedFarmerId(created.id);
      }
    }

    if (!targetFarmer) {
      setActionFeedbackMsg({
        type: 'error',
        text: 'Please select or enter a farmer name to record the consignment.',
      });
      setTimeout(() => setActionFeedbackMsg(null), 4000);
      return;
    }

    if (computedVarietyRows.length === 0) {
      setActionFeedbackMsg({
        type: 'error',
        text: 'Please add at least one crop variety line item.',
      });
      setTimeout(() => setActionFeedbackMsg(null), 4000);
      return;
    }

    // Check Merchant Type Rule: ensure all items belong to user's selected commodities
    const invalidMerchantTypeItem = computedVarietyRows.find(
      (r) => !userCommodities.includes(r.commodityCategory || 'flowers')
    );
    if (invalidMerchantTypeItem) {
      const allowedNames = userCommodities.map((c) => getSafeCommodityConfig(c)?.name || c).join(', ');
      setActionFeedbackMsg({
        type: 'error',
        text: `Cannot save: Selected category "${getSafeCommodityConfig(invalidMerchantTypeItem.commodityCategory || 'flowers')?.name}" is not enabled for your merchant profile. Allowed types: ${allowedNames}.`,
      });
      setTimeout(() => setActionFeedbackMsg(null), 6000);
      return;
    }

    const invalidItem = computedVarietyRows.find((r) => r.numericQuantity <= 0 || r.numericRate <= 0);
    if (invalidItem) {
      setActionFeedbackMsg({
        type: 'error',
        text: `Please enter a valid Quantity (> 0) and Rate (> 0) for ${invalidItem.displayName || 'the item'}.`,
      });
      setTimeout(() => setActionFeedbackMsg(null), 4000);
      return;
    }

    // Register custom variety names for suggestion dropdowns across the app
    computedVarietyRows.forEach((r) => {
      if (r.displayName) {
        addCustomVarietyName(r.displayName, r.commodityCategory);
      }
    });

    // Call addShipment to group all varieties into ONE shipment and deduct Hamali & Transport ONCE
    const newShipment = addShipment({
      date: saleDate,
      farmerId: targetFarmer.id,
      farmerName: targetFarmer.name,
      farmerVillage: targetFarmer.village,
      farmerPhone: targetFarmer.phone,
      items: computedVarietyRows.map((r) => ({
        id: r.id,
        commodityCategory: r.commodityCategory || userCommodities[0] || 'flowers',
        flowerVariety: r.displayName,
        quantity: r.numericQuantity,
        unit: r.unit,
        rate: r.numericRate,
        grossTotal: r.lineGross,
        boxesCount: r.numericBoxes > 0 ? r.numericBoxes : undefined,
        packagingType: r.packagingType || (r.commodityCategory === 'grains' ? 'Bags' : 'Boxes'),
        flowerQuality: r.flowerQuality,
      })),
      grossTotal,
      transportCharge: numericTransport,
      hamaliCharge: numericAmmali,
      commissionPercent: numericCommissionRate,
      commissionAmount: numericCommissionAmount,
      netAmountAfterDailyCuts: farmerNetPayable,
      paymentStatus,
      amountPaid: numericPaid,
      balanceDue,
      notes: notes.trim(),
    });

    // Play cash chime sound effect
    try {
      sounds.playCashChime();
    } catch {
      // Audio autoplay safe
    }

    // Prepare consolidated Parchi slip for instant printing/WhatsApp
    const varietySummary = computedVarietyRows.map((r) => `${r.displayName} (${r.numericQuantity} ${r.unit})`).join(', ');
    const primaryCommodity: CommodityCategory = (computedVarietyRows[0]?.commodityCategory || userCommodities[0] || 'flowers') as CommodityCategory;
    const primaryPackaging = computedVarietyRows[0]?.packagingType || (primaryCommodity === 'grains' ? 'Bags' : 'Boxes');
    const primaryConfig = getSafeCommodityConfig(primaryCommodity);

    const parchiLot: SaleLot = {
      id: newShipment.id,
      commodityCategory: primaryCommodity,
      parchiNumber: newShipment.shipmentNumber,
      date: newShipment.date,
      time: newShipment.time,
      farmerId: newShipment.farmerId,
      farmerName: newShipment.farmerName,
      farmerVillage: newShipment.farmerVillage,
      farmerPhone: newShipment.farmerPhone,
      flowerVariety: varietySummary,
      quantity: totalQuantity,
      unit: computedVarietyRows[0]?.unit || 'Kgs',
      boxesCount: totalBoxes > 0 ? totalBoxes : undefined,
      packagingType: primaryPackaging,
      flowerQuality: computedVarietyRows[0]?.flowerQuality || 'Good',
      rate: totalQuantity > 0 ? Math.round(grossTotal / totalQuantity) : 0,
      grossTotal,
      commissionPercent: numericCommissionRate,
      commissionAmount: numericCommissionAmount,
      transportCharges: numericTransport,
      ammaliCharges: numericAmmali,
      otherExpenditures: {
        transport: numericTransport,
        hamali: numericAmmali,
        kanta: 0,
        mandiCess: 0,
        packingCharges: 0,
        misc: numericMiscCommissionAmount,
        miscPercent: numericMiscCommissionRate,
        miscNote: 'Miscellaneous Charges',
      },
      totalOtherExpenditures: numericTransport + numericAmmali + numericCommissionAmount + numericMiscCommissionAmount,
      farmerNetPayable,
      paymentStatus,
      amountPaid: numericPaid,
      balanceDue,
      paymentMode: numericPaid > 0 ? paymentMode : undefined,
      paymentReference: numericPaid > 0 ? paymentReference.trim() : undefined,
      notes: notes.trim(),
      shipmentId: newShipment.id,
    };

    // Open Mandi Parchi Modal immediately for printing / WhatsApp
    setSelectedParchiLot(parchiLot);

    setActionFeedbackMsg({
      type: 'success',
      text: `✓ Form C Parchi #${newShipment.shipmentNumber} generated successfully for ${targetFarmer.name}!`,
    });
    setTimeout(() => setActionFeedbackMsg(null), 4000);

    // Reset Form for next shipment safely
    setVarietyRows([
      {
        id: `var-${Date.now()}`,
        commodityCategory: primaryCommodity,
        flowerVariety: primaryConfig.varieties[0]?.en || 'Standard',
        customVariety: '',
        quantity: 50,
        unit: (primaryConfig.allowedUnits[0] as WeightUnit) || 'Kgs',
        boxesCount: '',
        packagingType: primaryCommodity === 'grains' ? 'Bags' : 'Boxes',
        flowerQuality: 'Good',
        rate: primaryConfig.varieties[0]?.defaultRate || 40,
      },
    ]);
    setActiveRowId(`var-${Date.now()}`);
    setAmmaliCharge('');
    setTransportCharge('');
    setCommissionRate('');
    setNotes('');
    setPaymentReference('');
    if (paymentChoice === 'pay_now') {
      const resetGross = 50 * (primaryConfig.varieties[0]?.defaultRate || 40);
      if (payPortion === 'full') {
        setAmountPaidNow(resetGross);
      } else {
        setAmountPaidNow(Math.round(resetGross / 2));
      }
    } else {
      setAmountPaidNow(0);
    }
  };

  const todayStr = getTodayDateString();
  const yesterdayStr = getPastDateString(1);

  // Compute consignments recorded specifically for this saleDate (Scoped to active commodity)
  const dateLots = useMemo(() => {
    return lots.filter((l) => {
      if (l.date !== saleDate) return false;
      if (activeCommodityFilter !== 'all') {
        const lotCat = l.commodityCategory || 'flowers';
        if (lotCat !== activeCommodityFilter) return false;
      }
      return true;
    });
  }, [lots, saleDate, activeCommodityFilter]);

  const dateTurnover = useMemo(() => {
    return dateLots.reduce((sum, l) => sum + l.grossTotal, 0);
  }, [dateLots]);

  const dateNetPayable = useMemo(() => {
    return dateLots.reduce((sum, l) => sum + l.farmerNetPayable, 0);
  }, [dateLots]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#1e293b] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#1a3a52]" />
              <span>{t('newSaleTitle')}</span>
            </h2>
          </div>

          {/* Mandi Trading Date Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <label htmlFor="sale-date-input" className="text-xs font-bold text-[#1e293b] flex items-center gap-1 shrink-0 cursor-pointer">
              <Calendar className="w-4 h-4 text-[#1a3a52]" />
              <span>Mandi Trading Date:</span>
            </label>
            <input
              id="sale-date-input"
              type="date"
              value={saleDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setSaleDate(newDate);
                setActiveSessionDate(newDate);
              }}
              className="px-2.5 py-1 rounded-lg border border-[#e2e8f0] bg-white text-xs font-mono font-bold text-[#1a3a52] focus:outline-hidden focus:border-[#1a3a52] cursor-pointer shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSaveLot} className="space-y-6">
        {/* Step 1: Farmer Selection with Search & Inline Add */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a3a52] flex items-center gap-1.5">
              <span>1. {t('selectFarmer')}</span>
            </label>
            <button
              type="button"
              id="inline-add-farmer-btn"
              onClick={() => setShowInlineAddFarmer(!showInlineAddFarmer)}
              className="text-xs font-bold text-[#1a3a52] hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showInlineAddFarmer ? 'Cancel Add Farmer' : t('addNewFarmerInline')}</span>
            </button>
          </div>

          {/* Inline Add Farmer Form */}
          {showInlineAddFarmer && (
            <div className="p-4 rounded-xl bg-[#FEF8ED] border border-[#d4af37]/40 space-y-4">
              <h4 className="text-xs font-bold text-[#1e293b] uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#1a3a52]" />
                <span>Instant Farmer Registration with Photo</span>
              </h4>

              <PhotoUploadPicker
                label={language === 'te' ? 'రైతు ఫోటో' : 'Photo of Farmer'}
                sublabel="Upload from phone/PC, capture with webcam, or choose a preset"
                currentPhotoUrl={newFarmerPhotoUrl}
                onChange={(url) => setNewFarmerPhotoUrl(url)}
                presetType="farmer"
                idPrefix="newsale-inline-farmer"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  id="inline-farmer-name"
                  type="text"
                  placeholder="Farmer Full Name (no numbers) *"
                  value={newFarmerName}
                  onKeyDown={(e) => {
                    if (/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const clean = e.clipboardData.getData('text').replace(/[0-9]/g, '');
                    setNewFarmerName(clean);
                  }}
                  onChange={(e) => setNewFarmerName(e.target.value.replace(/[0-9]/g, ''))}
                  className="px-3 py-2 rounded-lg bg-white border border-[#e2e8f0] text-xs focus:outline-hidden focus:border-[#1a3a52]"
                />
                <input
                  id="inline-farmer-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Mobile Number (10 digits)"
                  value={newFarmerPhone}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      e.key !== 'Backspace' &&
                      e.key !== 'Delete' &&
                      e.key !== 'ArrowLeft' &&
                      e.key !== 'ArrowRight' &&
                      e.key !== 'Tab' &&
                      e.key !== 'Enter'
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const clean = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                    setNewFarmerPhone(clean);
                  }}
                  onChange={(e) => setNewFarmerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="px-3 py-2 rounded-lg bg-white border border-[#e2e8f0] text-xs focus:outline-hidden focus:border-[#1a3a52]"
                />
                <input
                  id="inline-farmer-village"
                  type="text"
                  placeholder="Village / Area"
                  value={newFarmerVillage}
                  onChange={(e) => setNewFarmerVillage(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white border border-[#e2e8f0] text-xs focus:outline-hidden focus:border-[#1a3a52]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInlineAddFarmer(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#e2e8f0] text-xs text-[#64748b]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  id="save-inline-farmer-btn"
                  onClick={handleSaveInlineFarmer}
                  className="px-4 py-1.5 rounded-lg bg-[#1a3a52] text-white font-bold text-xs hover:bg-[#122839] shadow-2xs"
                >
                  Save & Select Farmer
                </button>
              </div>
            </div>
          )}

          {/* Farmer Selection Dropdown / Search */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748b]" />
                <input
                  id="search-farmer-input"
                  type="text"
                  placeholder={t('searchFarmerPlaceholder')}
                  value={farmerSearch}
                  onFocus={() => setIsFarmerDropdownOpen(true)}
                  onChange={(e) => {
                    setFarmerSearch(e.target.value);
                    setIsFarmerDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e8f0] text-xs focus:outline-hidden focus:border-[#1a3a52] bg-[#f8fafc]"
                />
              </div>
            </div>

            {/* Dropdown Options */}
            {isFarmerDropdownOpen && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-56 overflow-y-auto bg-white rounded-xl border border-[#e2e8f0] shadow-lg p-1 space-y-1">
                {filteredFarmers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#64748b]">
                    No farmer found. Use &quot;+ Add New Farmer&quot; above to register instantly.
                  </div>
                ) : (
                  filteredFarmers.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      id={`select-farmer-option-${f.id}`}
                      onClick={() => {
                        setSelectedFarmerId(f.id);
                        setFarmerSearch(f.name);
                        setIsFarmerDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                        selectedFarmerId === f.id
                          ? 'bg-[#eef3f7] text-[#1a3a52] font-bold'
                          : 'hover:bg-[#f8fafc] text-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#1a3a52] bg-[#f8fafc] shrink-0">
                          {f.photoUrl ? (
                            <img
                              src={f.photoUrl}
                              alt={f.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[#1a3a52] text-[10px]">
                              {f.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold block">{f.name}</span>
                          <span className="text-[11px] text-[#64748b]">
                            📍 {f.village} • Ph: {f.phone}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-[#64748b] bg-white px-2 py-0.5 rounded border border-[#e2e8f0]">
                        {f.id}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Farmer Badge */}
          {selectedFarmer && (
            <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#1a3a52] bg-white shrink-0 shadow-2xs">
                  {selectedFarmer.photoUrl ? (
                    <img
                      src={selectedFarmer.photoUrl}
                      alt={selectedFarmer.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#eef3f7] text-[#1a3a52] font-black text-xs">
                      {selectedFarmer.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-[#64748b] uppercase font-bold block">
                    Active Consignor
                  </span>
                  <span className="font-black text-sm text-[#1e293b]">
                    {selectedFarmer.name}
                  </span>
                  <span className="text-[#64748b] ml-2 font-medium">📍 {selectedFarmer.village}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-[#64748b] block">Mobile for Parchi</span>
                  <span className="font-mono font-bold text-[#1a3a52]">+91 {selectedFarmer.phone}</span>
                </div>
                <button
                  type="button"
                  id="newsale-edit-consignor-btn"
                  onClick={() => {
                    setEditingFarmer(selectedFarmer);
                    setNewFarmerName(selectedFarmer.name);
                    setNewFarmerPhone(selectedFarmer.phone);
                    setNewFarmerVillage(selectedFarmer.village);
                    setNewFarmerPhotoUrl(selectedFarmer.photoUrl || '');
                    setShowInlineAddFarmer(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1a3a52] text-white text-xs font-bold hover:bg-[#122839] transition flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                  title="Edit this farmer's details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2 & 3: Consignment Varieties & Rates */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a3a52] block">
              {language === 'te'
                ? '2 & 3. పువ్వుల రకాలు & ధరలు'
                : '2 & 3. Consignment Item Varieties & Rates'}
            </label>
          </div>

          {/* Variety Rows List */}
          <div className="space-y-4">
            {varietyRows.map((row, index) => {
              const isActive = row.id === activeRowId;
              const numericQ = typeof row.quantity === 'number' ? row.quantity : 0;
              const numericR = typeof row.rate === 'number' ? row.rate : 0;
              const numericB = typeof row.boxesCount === 'number' ? row.boxesCount : 0;
              const rowGross = Math.round(numericQ * numericR);

              return (
                <div
                  key={row.id}
                  onClick={() => setActiveRowId(row.id)}
                  className={`p-4 rounded-xl border transition space-y-3 ${
                    isActive
                      ? 'border-[#1a3a52] bg-[#f8fafc] shadow-xs'
                      : 'border-[#e2e8f0] bg-white hover:border-[#D0C8BD]'
                  }`}
                >
                  {/* Variety Card Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1a3a52] text-white text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-bold text-sm text-[#1e293b]">
                        {row.customVariety.trim() || row.flowerVariety}
                      </span>
                      {isActive && (
                        <span className="text-[10px] uppercase font-bold text-[#1a3a52] bg-[#eef3f7] px-2 py-0.5 rounded-md">
                          Active Item
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#1e293b] bg-white px-2.5 py-1 rounded-lg border border-[#e2e8f0]">
                        ₹{rowGross.toLocaleString('en-IN')}
                      </span>

                      {varietyRows.length > 1 && (
                        <button
                          type="button"
                          id={`remove-variety-row-btn-${row.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVarietyRowClick(row);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remove this variety from shipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Selection Tabs per Item (Only accessible for user's selected commodities) */}
                  {userCommodities.length <= 1 ? (
                    <div className="flex items-center gap-2 pb-1 border-b border-[#e2e8f0]">
                      <span className="text-[11px] font-bold text-[#64748b]">Commodity:</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a52] text-white shadow-2xs">
                        <span>{getSafeCommodityConfig(userCommodities[0] || 'flowers')?.icon || '🌸'}</span>
                        <span>{getSafeCommodityConfig(userCommodities[0] || 'flowers')?.name || 'Flowers'}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-[#e2e8f0]">
                      <span className="text-[11px] font-bold text-[#64748b] mr-1">Commodity Type:</span>
                      {userCommodities.map((cat) => {
                        const cfg = getSafeCommodityConfig(cat);
                        const isCatSelected = (row.commodityCategory || userCommodities[0]) === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newDefaultVariety = cfg.varieties[0]?.en || 'Standard';
                              const newDefaultUnit = (cfg.allowedUnits[0] as WeightUnit) || 'Kgs';
                              const newDefaultRate = cfg.varieties[0]?.defaultRate || 40;
                              setVarietyRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? {
                                        ...r,
                                        commodityCategory: cat,
                                        flowerVariety: newDefaultVariety,
                                        customVariety: '',
                                        unit: newDefaultUnit,
                                        rate: newDefaultRate,
                                      }
                                    : r
                                )
                              );
                              setActiveRowId(row.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isCatSelected
                                ? 'bg-[#1a3a52] text-white shadow-2xs'
                                : 'bg-white text-[#1e293b] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
                            }`}
                          >
                            <span>{cfg.icon}</span>
                            <span>{cfg.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom Variety Input with typed suggestions dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1e293b] mb-1">
                      {language === 'te' ? 'రకం / వెరైటీ పేరు (టైప్ చేయండి)' : 'Variety / Item Name *'}
                    </label>
                    <CustomVarietyInput
                      category={row.commodityCategory || 'flowers'}
                      value={row.customVariety || row.flowerVariety}
                      onChange={(val) => {
                        setVarietyRows((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, customVariety: val, flowerVariety: val } : r))
                        );
                      }}
                      placeholder={`Type custom ${getSafeCommodityConfig(row.commodityCategory || 'flowers').name} name (e.g. Dutch Rose, Red Marigold...)`}
                    />
                  </div>

                  {/* Inputs: 1. Packaging Count & Type, 2. Quantity / Weight *, 3. Rate (₹ per unit) *, 4. Quality * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    {/* 1. Bags / Boxes / Crates (Packaging Count & Type) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1e293b] mb-1">
                        {language === 'te' ? 'ప్యాకేజింగ్ సంఖ్య & రకం' : 'Packaging Count & Type'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g. 2"
                          value={row.boxesCount}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, boxesCount: val } : r))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-bold focus:outline-hidden focus:border-[#1a3a52] bg-white min-w-[50px]"
                        />
                        <select
                          value={row.packagingType || (row.commodityCategory === 'grains' ? 'Bags' : 'Boxes')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, packagingType: val } : r))
                            );
                          }}
                          className="px-2 py-1.5 rounded-lg border border-[#e2e8f0] text-[11px] font-bold focus:outline-hidden focus:border-[#1a3a52] bg-white shrink-0"
                        >
                          <option value="Boxes">Boxes</option>
                          <option value="Bags">Bags</option>
                          <option value="Crates">Crates</option>
                          <option value="Baskets">Baskets</option>
                          <option value="Packets">Packets</option>
                          <option value="Bunches">Bunches</option>
                        </select>
                      </div>
                    </div>

                    {/* 2. Quantity / Weight * */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1e293b] mb-1">
                        Quantity / Weight *
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          placeholder="50"
                          value={row.quantity}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, quantity: val } : r))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-bold focus:outline-hidden focus:border-[#1a3a52] bg-white"
                        />
                        <select
                          value={row.unit}
                          onChange={(e) => {
                            const val = e.target.value as WeightUnit;
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, unit: val } : r))
                            );
                          }}
                          className="px-2 py-1.5 rounded-lg border border-[#e2e8f0] text-[11px] font-bold focus:outline-hidden focus:border-[#1a3a52] bg-white"
                        >
                          {getSafeCommodityConfig(row.commodityCategory || 'flowers').allowedUnits.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 3. Rate (₹ per unit) * */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1e293b] mb-1">
                        Rate (₹ per {row.unit}) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-gray-500 font-bold">₹</span>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          placeholder="40"
                          value={row.rate}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, rate: val } : r))
                            );
                          }}
                          className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-bold focus:outline-hidden focus:border-[#1a3a52] bg-white"
                        />
                      </div>
                    </div>

                    {/* 4. Flower Quality * */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1e293b] mb-1">
                        Quality *
                      </label>
                      <div className="grid grid-cols-3 gap-1 h-[32px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, flowerQuality: 'Good' } : r))
                            );
                          }}
                          className={`rounded-lg text-[10px] font-bold transition flex items-center justify-center border ${
                            row.flowerQuality === 'Good'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white text-emerald-800 border-[#e2e8f0]'
                          }`}
                        >
                          Good
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, flowerQuality: 'Average' } : r))
                            );
                          }}
                          className={`rounded-lg text-[10px] font-bold transition flex items-center justify-center border ${
                            row.flowerQuality === 'Average'
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-white text-amber-800 border-[#e2e8f0]'
                          }`}
                        >
                          Avg
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVarietyRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, flowerQuality: 'Bad' } : r))
                            );
                          }}
                          className={`rounded-lg text-[10px] font-bold transition flex items-center justify-center border ${
                            row.flowerQuality === 'Bad'
                              ? 'bg-red-600 text-white border-red-700'
                              : 'bg-white text-red-800 border-[#e2e8f0]'
                          }`}
                        >
                          Bad
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item Subtotal Calculation Line */}
                  <div className="text-[11px] text-[#64748b] bg-white p-2 rounded-lg border border-[#e2e8f0] flex items-center justify-between">
                    <span>
                      Subtotal: {numericB > 0 ? `${numericB} ${row.packagingType || 'Boxes'} • ` : ''}{numericQ} {row.unit} × ₹{numericR}/{row.unit} ({row.flowerQuality || 'Good'} Quality)
                    </span>
                    <span className="font-bold text-[#1e293b]">
                      = ₹{rowGross.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Variety Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              id="add-variety-to-shipment-btn"
              onClick={() => {
                const newId = `var-${Date.now()}`;
                const addCat = (userCommodities[0] || 'flowers') as CommodityCategory;
                const addCfg = getSafeCommodityConfig(addCat);
                const addVariety = addCfg.varieties[0]?.en || 'Standard';
                const addUnit = (addCfg.allowedUnits[0] as WeightUnit) || 'Kgs';
                const addRate = addCfg.varieties[0]?.defaultRate || 40;

                setVarietyRows((prev) => [
                  ...prev,
                  {
                    id: newId,
                    commodityCategory: addCat,
                    flowerVariety: addVariety,
                    customVariety: '',
                    quantity: 30,
                    unit: addUnit,
                    boxesCount: '',
                    packagingType: addCat === 'grains' ? 'Bags' : 'Boxes',
                    flowerQuality: 'Good',
                    rate: addRate,
                  },
                ]);
                setActiveRowId(newId);
              }}
              className="px-4 py-2 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#d4af37]" />
              <span>+ Add Another Variety to this Shipment (Same Truck)</span>
            </button>

            {/* Consignment Grand Total Badge */}
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center gap-3 text-xs">
              <span className="text-[#64748b]">
                Total ({varietyRows.length} varieties, {totalQuantity} {varietyRows[0]?.unit || 'Kgs'}):
              </span>
              <span className="text-base font-black text-[#1e293b]">
                ₹{grossTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Step 4: Deductions per Transaction (Hamali, Transport & optional Commission) */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xs overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#f8fafc] border-b border-[#e2e8f0] select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1a3a52] flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#1a3a52]" />
                  <span>{language === 'te' ? '4. తగ్గింపు ఛార్జీలు (హమాలీ, రవాణా & కమీషన్)' : '4. Deductions per Transaction (Hamali, Transport & Commission)'}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-300 shadow-2xs">
                  − ₹{totalDeductions.toLocaleString('en-IN')} Total Deductions
                </span>
              </div>
            </div>
          </div>

          {/* Body: Hamali, Transport, and Commission Inputs */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Hamali / Loading Charges (₹) */}
              <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1e293b] flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>{language === 'te' ? 'హమాలీ (₹)' : 'Hamali / Labor (₹)'}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    Labor
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#64748b] mb-1">
                    {language === 'te' ? 'హమాలీ మొత్తం (₹)' : 'Hamali Amount (₹)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">₹</span>
                    <input
                      id="lot-ammali-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={ammaliCharge}
                      onChange={(e) => {
                        setAmmaliCharge(e.target.value === '' ? '' : parseFloat(e.target.value));
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#e2e8f0] text-xs font-bold bg-white focus:outline-hidden focus:border-[#1a3a52]"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 italic">
                  Loading / unloading labor fee
                </div>
              </div>

              {/* 2. Transport / Freight Charges (₹) */}
              <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1e293b] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-700" />
                    <span>{language === 'te' ? 'రవాణా (₹)' : 'Transport (₹)'}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Vehicle
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#64748b] mb-1">
                    {language === 'te' ? 'రవాణా మొత్తం (₹)' : 'Freight Amount (₹)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">₹</span>
                    <input
                      id="lot-transport-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={transportCharge}
                      onChange={(e) => {
                        setTransportCharge(e.target.value === '' ? '' : parseFloat(e.target.value));
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#e2e8f0] text-xs font-bold bg-white focus:outline-hidden focus:border-[#1a3a52]"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 italic">
                  Vehicle / truck freight charge
                </div>
              </div>

              {/* 3. Mandi Commission Rate (%) */}
              <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1e293b] flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#d4af37]" />
                    <span>{language === 'te' ? 'మండి కమీషన్ (%)' : 'Mandi Comm (%)'}</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    numericCommissionRate > 0 
                      ? 'text-amber-800 bg-amber-50 border-amber-200' 
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {numericCommissionRate > 0 ? `₹${numericCommissionAmount}` : '0% (None)'}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#64748b] mb-1">
                    {language === 'te' ? 'మండి కమీషన్ శాతం (%)' : 'Mandi Commission Rate (%)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">%</span>
                    <input
                      id="lot-commission-input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={commissionRate}
                      onChange={(e) => {
                        setCommissionRate(e.target.value === '' ? '' : parseFloat(e.target.value));
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#e2e8f0] text-xs font-bold bg-white focus:outline-hidden focus:border-[#1a3a52]"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 2, 4, 5].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCommissionRate(pct === 0 ? '' : pct)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition cursor-pointer ${
                        (pct === 0 && (commissionRate === '' || commissionRate === 0)) || commissionRate === pct
                          ? 'bg-[#1a3a52] text-white border-[#1a3a52]'
                          : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-gray-50'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {numericCommissionRate > 0 ? `-₹${numericCommissionAmount}` : 'No cut'}
                  </span>
                </div>
              </div>

              {/* 4. Miscellaneous Charges Rate (%) - Beside Mandi Commission */}
              <div className="p-4 rounded-xl border border-amber-200/80 bg-[#fdfaf3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1e293b] flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>{language === 'te' ? 'ఇతర ఖర్చులు (%)' : 'Misc Charges (%)'}</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    numericMiscCommissionRate > 0 
                      ? 'text-purple-800 bg-purple-50 border-purple-200' 
                      : 'text-slate-600 bg-slate-50 border-slate-200'
                  }`}>
                    {numericMiscCommissionRate > 0 ? `₹${numericMiscCommissionAmount}` : '0% (None)'}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#64748b] mb-1">
                    {language === 'te' ? 'ఇతర ఖర్చులు శాతం (%)' : 'Miscellaneous Charges Rate (%)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">%</span>
                    <input
                      id="lot-misc-commission-input"
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      placeholder="0"
                      value={miscCommissionRate}
                      onChange={(e) => {
                        setMiscCommissionRate(e.target.value === '' ? '' : parseFloat(e.target.value));
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#e2e8f0] text-xs font-bold bg-white focus:outline-hidden focus:border-[#1a3a52]"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 0.5, 1, 2].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMiscCommissionRate(pct === 0 ? '' : pct)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition cursor-pointer ${
                        (pct === 0 && (miscCommissionRate === '' || miscCommissionRate === 0)) || miscCommissionRate === pct
                          ? 'bg-amber-700 text-white border-amber-700'
                          : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-gray-50'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {numericMiscCommissionRate > 0 ? `-₹${numericMiscCommissionAmount}` : 'No cut'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Farmer Net Payable Highlight & Payment Details */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-[#1a3a52]/40 shadow-xs space-y-4">
          {/* Prominent Farmer Net Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#1a3a52] to-[#122839] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#d4af37] font-bold block">
                {language === 'te' ? 'రైతుకు నికర మొత్తం' : 'Net Amount to Farmer'}
              </span>
              <span className="text-xs text-white/80">
                Gross Amount (₹{grossTotal.toLocaleString('en-IN')}) − All Deductions (₹{totalDeductions.toLocaleString('en-IN')})
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              ₹{farmerNetPayable.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Payment Status & Settlement */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a3a52] block">
                5. {t('paymentSettlementNow')}
              </label>
              <span className="text-[11px] text-[#64748b] font-medium">
                Farmer Net: <strong className="text-[#1e293b] font-mono">₹{farmerNetPayable.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            {/* Primary Choice: Pay Now vs Pay Later */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pay Now Option Button */}
              <button
                type="button"
                id="payment-choice-pay-now-btn"
                onClick={() => {
                  setPaymentChoice('pay_now');
                  if (payPortion === 'full') {
                    setAmountPaidNow(farmerNetPayable);
                  } else {
                    setAmountPaidNow(Math.round(farmerNetPayable / 2));
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  paymentChoice === 'pay_now'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    paymentChoice === 'pay_now'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#1e293b]">
                      {t('payNow')}
                    </span>
                    {paymentChoice === 'pay_now' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5 leading-tight">
                    {t('payNowDesc')}
                  </p>
                </div>
              </button>

              {/* Pay Later Option Button */}
              <button
                type="button"
                id="payment-choice-pay-later-btn"
                onClick={() => {
                  setPaymentChoice('pay_later');
                  setAmountPaidNow(0);
                }}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  paymentChoice === 'pay_later'
                    ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                    : 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    paymentChoice === 'pay_later'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#1e293b]">
                      {t('payLater')}
                    </span>
                    {paymentChoice === 'pay_later' && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        Credit / Unpaid
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5 leading-tight">
                    {t('payLaterDesc')}
                  </p>
                </div>
              </button>
            </div>

            {/* When Pay Later is selected */}
            {paymentChoice === 'pay_later' && (
              <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
                <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{language === 'te' ? 'బాకీ ఖాతా (చెల్లించని లాట్)' : 'Unpaid Credit Consignment'}</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  The net amount of <strong className="font-mono">₹{farmerNetPayable.toLocaleString('en-IN')}</strong> will be recorded as <strong>Unpaid</strong>. When you click <em>Save &amp; Generate Mandi Parchi</em>, it will immediately go directly to the <strong>Payments</strong> tab under <em>{selectedFarmer?.name || 'Farmer'}</em> as an outstanding balance for later settlement.
                </p>
              </div>
            )}

            {/* When Pay Now is selected */}
            {paymentChoice === 'pay_now' && (
              <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                {/* Full vs Partial Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#1e293b] mb-2">
                    Payment Amount Choice:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="pay-portion-full-btn"
                      onClick={() => {
                        setPayPortion('full');
                        setAmountPaidNow(farmerNetPayable);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        payPortion === 'full' && numericPaid >= farmerNetPayable
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-[#1e293b] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('fullAmount')} (₹{farmerNetPayable.toLocaleString('en-IN')})</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="pay-portion-partial-btn"
                      onClick={() => {
                        setPayPortion('partial');
                        if (amountPaidNow === farmerNetPayable || amountPaidNow === 0 || amountPaidNow === '') {
                          setAmountPaidNow(Math.round(farmerNetPayable / 2));
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        payPortion === 'partial' || (numericPaid > 0 && numericPaid < farmerNetPayable)
                          ? 'bg-[#d4af37] text-[#1e293b] border-[#d4af37] shadow-2xs font-black'
                          : 'bg-white text-[#1e293b] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{t('partialAmount')} (Custom Edit)</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount Paid Edit Input & Status Badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="lot-amount-paid-input" className="block text-xs font-semibold text-[#1e293b]">
                      {t('amountPaidNow')}
                    </label>
                    <span className="text-[11px] font-bold">
                      {numericPaid >= farmerNetPayable && farmerNetPayable > 0 ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ {t('statusPaid')} (Full)
                        </span>
                      ) : numericPaid > 0 ? (
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          ⚠ {t('statusPartial')} (Remaining Due: ₹{balanceDue.toLocaleString('en-IN')})
                        </span>
                      ) : (
                        <span className="text-red-800 bg-red-100 px-2 py-0.5 rounded-md">
                          {t('statusUnpaid')}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm text-gray-500 font-bold">₹</span>
                    <input
                      id="lot-amount-paid-input"
                      type="number"
                      min="0"
                      max={farmerNetPayable}
                      step="any"
                      placeholder="Enter amount paid"
                      value={amountPaidNow}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setAmountPaidNow(val);
                        if (typeof val === 'number') {
                          if (val >= farmerNetPayable && farmerNetPayable > 0) {
                            setPayPortion('full');
                          } else if (val > 0) {
                            setPayPortion('partial');
                          }
                        }
                      }}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-mono font-bold bg-white focus:outline-hidden focus:border-[#1a3a52] focus:ring-1 focus:ring-[#1a3a52]"
                    />
                  </div>

                  {/* Quick percentage shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#64748b]">Quick presets:</span>
                    {[
                      { label: '25%', frac: 0.25 },
                      { label: '50%', frac: 0.5 },
                      { label: '75%', frac: 0.75 },
                      { label: 'Full', frac: 1 },
                    ].map(({ label, frac }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const amt = Math.round(farmerNetPayable * frac);
                          setAmountPaidNow(amt);
                          if (frac === 1) {
                            setPayPortion('full');
                          } else {
                            setPayPortion('partial');
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#1e293b] transition cursor-pointer"
                      >
                        {label} (₹{Math.round(farmerNetPayable * frac).toLocaleString('en-IN')})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Remaining Balance Summary Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-[#1e293b] block">
                  {t('balanceDue')}:
                </span>
                <span className="text-[11px] text-[#64748b]">
                  {balanceDue > 0
                    ? `Remaining ₹${balanceDue.toLocaleString('en-IN')} automatically goes to Payments Khata as pending due`
                    : 'Account fully settled! Zero pending dues remaining.'}
                </span>
              </div>
              <span
                className={`font-mono font-black text-base ${
                  balanceDue > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                ₹{balanceDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Submit & Generate Mandi Parchi & PDF Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-[#64748b] space-y-0.5 max-w-lg">
            <p className="font-medium text-[#1e293b]">
              Generates Form C Mandi Parchi with thermal printer support and WhatsApp share.
            </p>
            <p className="text-[11px] text-[#1a3a52] font-semibold">
              ✓ Ready to finalize? Click <strong>Generate PDF</strong> to select commission &amp; itemized deductions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              id="newsale-generate-formc-pdf-btn"
              onClick={() => {
                setSelectedLotForPdf(null);
                setIsDraftPdfOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-3.5 rounded-xl border-2 border-[#1a3a52] text-[#1a3a52] bg-blue-50/80 hover:bg-blue-100 font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap shrink-0"
              title="Generate official Form C PDF invoice with APMC commission & itemized deductions"
            >
              <FileText className="w-4 h-4 text-[#1a3a52] shrink-0" />
              <span>Form C PDF</span>
            </button>

            <button
              type="button"
              id="save-and-generate-parchi-btn"
              onClick={(e) => handleSaveLot(e)}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#1a3a52] text-white font-black text-xs sm:text-sm hover:bg-[#122839] active:scale-95 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>{t('saveAndGenerateParchi')}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Consignments Recorded for Selected Date Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1e293b] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1a3a52]" />
              <span>Consignments Recorded on {formatDisplayDate(saleDate)}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#eef3f7] text-[#1a3a52] font-mono text-xs font-bold">
                {dateLots.length}
              </span>
            </h3>
            <p className="text-xs text-[#64748b]">
              Live consignment records for the active date. Every day starts fresh & empty for new morning sales.
            </p>
          </div>

          {dateLots.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="bg-[#f8fafc] px-2.5 py-1 rounded-lg border border-[#e2e8f0]">
                <span className="text-[#64748b]">Turnover: </span>
                <strong className="text-[#1e293b] font-mono font-bold">₹{dateTurnover.toLocaleString('en-IN')}</strong>
              </div>
              <div className="bg-[#f8fafc] px-2.5 py-1 rounded-lg border border-[#e2e8f0]">
                <span className="text-[#64748b]">Farmer Net: </span>
                <strong className="text-[#1a3a52] font-mono font-bold">₹{dateNetPayable.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          )}
        </div>

        {dateLots.length === 0 ? (
          <div className="p-6 text-center space-y-2.5 bg-[#f8fafc] rounded-xl border border-dashed border-[#e2e8f0]">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-[#d4af37] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#1e293b]">
              No consignments recorded for {formatDisplayDate(saleDate)} yet
            </h4>
            <p className="text-xs text-[#64748b] max-w-md mx-auto">
              New sales is refreshed and stays empty at the start of each morning. Use the form above to record your first consignment. All previous dates remain accessible in Hisab &amp; Settlements.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDateSwitcherOpen(true)}
                className="text-xs font-bold text-[#1a3a52] hover:underline inline-flex items-center gap-1"
              >
                <span>Switch Trading Date in Date Switcher</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dateLots.map((lot) => (
              <div
                key={lot.id}
                className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] hover:bg-white hover:border-[#1a3a52]/30 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1a3a52] bg-[#eef3f7] px-2 py-0.5 rounded text-[11px]">
                      {lot.parchiNumber}
                    </span>
                    <span className="text-[#64748b]">{lot.time}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lot.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lot.paymentStatus === 'Partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {lot.paymentStatus}
                    </span>
                  </div>
                  <div className="font-bold text-[#1e293b] text-sm flex items-center gap-2">
                    <span>{lot.farmerName}</span>
                    <span className="text-xs font-normal text-[#64748b]">({lot.farmerVillage})</span>
                  </div>
                  <div className="text-[#64748b] flex items-center gap-2 flex-wrap">
                    <span className="text-[#1e293b] font-semibold">{lot.flowerVariety}</span>
                    <span>•</span>
                    <span>{lot.quantity} {lot.unit} @ ₹{lot.rate}/{lot.unit}</span>
                    <span>•</span>
                    <span>Gross: <strong className="text-[#1e293b]">₹{lot.grossTotal.toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>Net to Farmer: <strong className="text-[#1a3a52]">₹{lot.farmerNetPayable.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setSelectedParchiLot(lot)}
                    className="px-3 py-1.5 rounded-lg bg-[#1a3a52] text-white font-bold text-xs hover:bg-[#122839] transition flex items-center gap-1 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Print Parchi</span>
                  </button>
                  <button
                    type="button"
                    id={`formc-pdf-lot-btn-${lot.id}`}
                    onClick={() => {
                      setSelectedLotForPdf(lot);
                      setIsDraftPdfOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#1a3a52]/30 bg-blue-50/80 hover:bg-blue-100 text-[#1a3a52] font-bold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Generate & view official Form C PDF invoice for this parchi"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#1a3a52]" />
                    <span>Form C PDF</span>
                  </button>
                  <button
                    type="button"
                    id={`edit-recent-lot-btn-${lot.id}`}
                    onClick={() => openEditParchiModal(lot)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-bold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Edit details for this parchi"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    id={`delete-recent-lot-btn-${lot.id}`}
                    onClick={() => handleDeleteLotClick(lot)}
                    className="p-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                    title="Delete lot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Feedback Notification */}
      {actionFeedbackMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#1e293b] text-white px-4 py-2.5 rounded-xl shadow-xl border border-white/20 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          <span>{actionFeedbackMsg.text}</span>
        </div>
      )}

      {/* Unified Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.type === 'varietyRow' ? 'Remove Flower Variety' : 'Delete Consignment Lot'}
        itemName={
          deleteModalConfig.type === 'varietyRow'
            ? `Variety: ${deleteModalConfig.varietyName}`
            : deleteModalConfig.lot
            ? `Consignment Lot: ${deleteModalConfig.lot.parchiNumber}`
            : undefined
        }
        itemDetails={
          deleteModalConfig.type === 'varietyRow'
            ? deleteModalConfig.rowDetails
            : deleteModalConfig.lot
            ? `Farmer: ${deleteModalConfig.lot.farmerName} • Variety: ${deleteModalConfig.lot.flowerVariety} • Amount: ₹${(deleteModalConfig.lot.grossTotal ?? deleteModalConfig.lot.farmerNetPayable ?? 0).toLocaleString('en-IN')}`
            : undefined
        }
        message={
          deleteModalConfig.type === 'varietyRow'
            ? 'Are you sure you want to remove this flower variety item from the current consignment entry?'
            : 'Are you sure you want to delete this consignment record? This will permanently remove the lot from all reports, ledgers, and transactions.'
        }
        confirmText="CONFIRM DELETE"
        cancelText="CANCEL"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalConfig({ isOpen: false, type: 'lot' })}
      />

      {/* Draft / Live Form C PDF Modal */}
      {isDraftPdfOpen && (
        <GeneratePdfModal
          isOpen={isDraftPdfOpen}
          onClose={() => {
            setIsDraftPdfOpen(false);
            setSelectedLotForPdf(null);
          }}
          lot={selectedLotForPdf}
          lots={!selectedLotForPdf && dateLots.length > 0 ? dateLots : undefined}
          draftData={
            !selectedLotForPdf
              ? {
                  farmerName: selectedFarmer?.name || (dateLots[0]?.farmerName) || 'Farmer Consignor',
                  farmerVillage: selectedFarmer?.village || (dateLots[0]?.farmerVillage) || 'APMC Yard',
                  farmerPhone: selectedFarmer?.phone || (dateLots[0]?.farmerPhone) || '',
                  grossTotal: computedVarietyRows.length > 0 ? grossTotal : undefined,
                  transportCharges: numericTransport,
                  ammaliCharges: numericAmmali,
                  commissionPercent: numericCommissionRate,
                  commissionAmount: numericCommissionAmount,
                  miscCommissionPercent: numericMiscCommissionRate,
                  miscCommissionAmount: numericMiscCommissionAmount,
                  date: saleDate,
                  time: 'Morning Auction',
                  items:
                    computedVarietyRows.length > 0
                      ? computedVarietyRows.map((r) => ({
                          id: r.id,
                          flowerVariety: r.displayName,
                          flowerQuality: r.flowerQuality,
                          quantity: r.numericQuantity,
                          unit: r.unit,
                          boxesCount: r.numericBoxes > 0 ? r.numericBoxes : undefined,
                          packagingType: r.packagingType,
                          rate: r.numericRate,
                          grossTotal: r.lineGross,
                        }))
                      : undefined,
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

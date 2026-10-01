import React, { useState, useMemo } from 'react';
import {
  Users,
  ArrowLeft,
  Search,
  UserPlus,
  BookOpen,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Printer,
  ChevronRight,
  Plus,
  User,
  Sparkles,
  Send,
  ShieldCheck,
  Clock,
  Check,
  AlertCircle,
  Receipt,
  Trash2,
  Mic,
} from 'lucide-react';
import { useMandi } from '../../context/MandiContext';
import { Farmer } from '../../types';
import { flowerVarietiesData } from '../../translations';
import { PhotoUploadPicker } from '../common/PhotoUploadPicker';
import { FarmerKathaStatementView } from './FarmerKathaStatementView';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { VoiceInputModal } from '../common/VoiceInputModal';
import { FarmerVoiceParseResult } from '../../services/voiceAi';
import { sounds } from '../../utils/audio';
import { validateIndianMobile, cleanIndianMobile } from '../../utils/phoneValidation';
import { checkCloudDuplicateFarmer } from '../../services/supabaseSync';

export interface FarmersViewProps {
  initialTab?: 'connected' | 'incoming';
  onClose?: () => void;
  isModal?: boolean;
}

export const FarmersView: React.FC<FarmersViewProps> = ({
  initialTab = 'connected',
  onClose,
  isModal = false,
}) => {
  const {
    farmers,
    addFarmer,
    updateFarmer,
    deleteFarmer,
    lots,
    getFarmerStats,
    setSelectedParchiLot,
    merchantProfile,
    setIsFarmerSignUpOpen,
    connectionRequests,
    acceptConnectionRequest,
    declineConnectionRequest,
    sendConnectionRequest,
    registeredAccounts,
    currentUserPhone,
    language,
    t,
  } = useMandi();

  const [activeTab, setActiveTab] = useState<'connected' | 'incoming'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [selectedLedgerFarmer, setSelectedLedgerFarmer] = useState<Farmer | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleFarmerVoiceParsed = (res: FarmerVoiceParseResult) => {
    // Populate form fields directly
    setFormName(res.name);
    setFormVillage(res.village);
    setFormPhone(res.phone);

    // Register farmer directly without manual typing
    const newFarmer = addFarmer({
      name: res.name || 'Kisan Member',
      phone: res.phone || '9876543210',
      village: res.village || 'Mandi Yard',
      primaryCrops: res.primaryCrops && res.primaryCrops.length > 0 ? res.primaryCrops : ['flowers'],
      connectedMerchantIds: [merchantProfile.merchantId],
    });

    sounds.playCashChime?.();
    setNotificationMsg(`✓ Voice Registration Complete: Registered ${newFarmer.name} (${newFarmer.village}, +91 ${newFarmer.phone}) directly!`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Delete Confirmation State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    farmer: Farmer | null;
  }>({
    isOpen: false,
    farmer: null,
  });

  const handleDeleteFarmerClick = (farmer: Farmer) => {
    setDeleteModalConfig({
      isOpen: true,
      farmer,
    });
  };

  const handleConfirmDeleteFarmer = () => {
    if (deleteModalConfig.farmer) {
      const deletedName = deleteModalConfig.farmer.name;
      deleteFarmer(deleteModalConfig.farmer.id);
      sounds.playTrashSound?.();
      setNotificationMsg(`✓ Farmer "${deletedName}" was successfully deleted.`);
      setTimeout(() => setNotificationMsg(null), 3500);
      if (editingFarmer?.id === deleteModalConfig.farmer.id) {
        setIsAddModalOpen(false);
        setEditingFarmer(null);
      }
    }
    setDeleteModalConfig({ isOpen: false, farmer: null });
  };

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVillage, setFormVillage] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formCrops, setFormCrops] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const cleanMerchantPhone = merchantProfile.phoneNumber
    ? merchantProfile.phoneNumber.replace(/\D/g, '').slice(-10)
    : currentUserPhone;

  // Incoming connection requests from farmers
  const incomingFarmerRequests = useMemo(() => {
    return connectionRequests.filter(
      (r) =>
        r.senderRole === 'farmer' &&
        r.status === 'pending' &&
        (r.merchantId === merchantProfile.merchantId ||
          (r.merchantPhone && r.merchantPhone.replace(/\D/g, '').slice(-10) === cleanMerchantPhone))
    );
  }, [connectionRequests, merchantProfile.merchantId, cleanMerchantPhone]);

  // Outgoing requests sent by merchant
  const outgoingMerchantRequests = useMemo(() => {
    return connectionRequests.filter(
      (r) =>
        r.senderRole === 'merchant' &&
        (r.merchantId === merchantProfile.merchantId ||
          (r.merchantPhone && r.merchantPhone.replace(/\D/g, '').slice(-10) === cleanMerchantPhone))
    );
  }, [connectionRequests, merchantProfile.merchantId, cleanMerchantPhone]);

  // Accepted connections
  const acceptedConnections = useMemo(() => {
    return connectionRequests.filter(
      (r) =>
        r.status === 'accepted' &&
        (r.merchantId === merchantProfile.merchantId ||
          (r.merchantPhone && r.merchantPhone.replace(/\D/g, '').slice(-10) === cleanMerchantPhone))
    );
  }, [connectionRequests, merchantProfile.merchantId, cleanMerchantPhone]);

  // Filtered farmers in Connected Tab
  const filteredFarmers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return (farmers || []).filter(Boolean);
    return (farmers || []).filter(
      (f) =>
        f &&
        ((f.name && f.name.toLowerCase().includes(q)) ||
        (f.village && f.village.toLowerCase().includes(q)) ||
        (f.phone && f.phone.includes(q)) ||
        (Array.isArray(f.primaryCrops) && f.primaryCrops.some((c) => c && c.toLowerCase().includes(q))))
    );
  }, [farmers, searchQuery]);

  // Searchable Network Farmers (registered accounts who are farmers + existing farmers)
  const networkFarmers = useMemo(() => {
    const list: {
      id: string;
      name: string;
      phone: string;
      village: string;
      crops: string[];
      photoUrl?: string;
    }[] = [];

    const seenPhones = new Set<string>();

    // 1. Registered accounts with role 'farmer'
    registeredAccounts
      .filter((a) => a.role === 'farmer')
      .forEach((a) => {
        const clean = a.phoneNumber.replace(/\D/g, '').slice(-10);
        if (!seenPhones.has(clean)) {
          seenPhones.add(clean);
          list.push({
            id: a.id,
            name: a.fullName,
            phone: clean,
            village: a.shopOrVillage || 'Grower Belt',
            crops: a.licenseOrCrop ? [a.licenseOrCrop] : ['Marigold (Banthi)'],
            photoUrl: a.photoUrl,
          });
        }
      });

    // 2. Existing local farmers
    farmers.forEach((f) => {
      const clean = f.phone ? f.phone.replace(/\D/g, '').slice(-10) : '';
      if (clean && !seenPhones.has(clean)) {
        seenPhones.add(clean);
        list.push({
          id: f.id,
          name: f.name,
          phone: clean,
          village: f.village,
          crops: Array.isArray(f.primaryCrops) ? f.primaryCrops : ['Marigold (Banthi)'],
          photoUrl: f.photoUrl,
        });
      }
    });

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.phone.includes(q) ||
        f.crops.some((c) => c.toLowerCase().includes(q))
    );
  }, [registeredAccounts, farmers, searchQuery]);

  const openAddModal = () => {
    setEditingFarmer(null);
    setFormName('');
    setFormPhone('');
    setFormVillage('');
    setFormPhotoUrl('');
    setFormCrops([]);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFormName(farmer.name);
    setFormPhone(farmer.phone);
    setFormVillage(farmer.village);
    setFormPhotoUrl(farmer.photoUrl || '');
    setFormCrops(farmer.primaryCrops);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    const trimmedVillage = formVillage.trim() || 'Local Flower Belt';

    if (!trimmedName) {
      setFormError('Farmer name is required');
      return;
    }

    if (/[0-9]/.test(trimmedName)) {
      setFormError(language === 'te' ? 'రైతు పేరులో అంకెలు ఉండకూడదు' : 'Farmer name cannot contain numbers');
      return;
    }

    // Phone validation
    const phoneVal = validateIndianMobile(formPhone);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number');
      return;
    }
    const cleanPhone = phoneVal.cleanNumber;

    // Check duplicate phone locally
    const duplicatePhoneFarmer = farmers.find(
      (f) =>
        (!editingFarmer || f.id !== editingFarmer.id) &&
        cleanIndianMobile(f.phone) === cleanPhone
    );
    if (duplicatePhoneFarmer) {
      setFormError(`A farmer with mobile number +91 ${cleanPhone} already exists (${duplicatePhoneFarmer.name}).`);
      return;
    }

    // Check duplicate name + village locally
    const duplicateNameVillageFarmer = farmers.find(
      (f) =>
        (!editingFarmer || f.id !== editingFarmer.id) &&
        f.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        f.village.trim().toLowerCase() === trimmedVillage.toLowerCase()
    );
    if (duplicateNameVillageFarmer) {
      setFormError(`A farmer named "${trimmedName}" in village "${trimmedVillage}" already exists.`);
      return;
    }

    // Check duplicate in cloud database
    try {
      const cloudCheck = await checkCloudDuplicateFarmer({
        ownerUid: merchantProfile.merchantId || currentUserPhone,
        phone: cleanPhone,
        name: trimmedName,
        village: trimmedVillage,
        excludeFarmerId: editingFarmer?.id,
      });
      if (cloudCheck.isDuplicate) {
        setFormError(cloudCheck.message || 'Farmer record already exists in database');
        return;
      }
    } catch {}

    if (editingFarmer) {
      updateFarmer(editingFarmer.id, {
        name: trimmedName,
        phone: cleanPhone,
        village: trimmedVillage,
        primaryCrops: formCrops,
        photoUrl: formPhotoUrl.trim() || undefined,
      });
    } else {
      addFarmer({
        name: trimmedName,
        phone: cleanPhone,
        village: trimmedVillage,
        primaryCrops: formCrops,
        connectedMerchantIds: [merchantProfile.merchantId],
        photoUrl: formPhotoUrl.trim() || undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  const toggleCrop = (cropName: string) => {
    if (formCrops.includes(cropName)) {
      setFormCrops(formCrops.filter((c) => c !== cropName));
    } else {
      setFormCrops([...formCrops, cropName]);
    }
  };

  // Send request to searched farmer
  const handleAcceptRequest = (reqId: string, farmerName: string) => {
    acceptConnectionRequest(reqId);
    setNotificationMsg(
      `✓ Connection accepted with ${farmerName}! Data sharing activated. Only this specific farmer's consignment lots and ledger are now shared.`
    );
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleDeclineRequest = (reqId: string) => {
    declineConnectionRequest(reqId);
    setNotificationMsg('Request declined.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Farmer Ledger Modal calculations - strictly for this farmer!
  const farmerLots = useMemo(() => {
    if (!selectedLedgerFarmer) return [];
    const cleanFarmerPhone = selectedLedgerFarmer.phone
      ? selectedLedgerFarmer.phone.replace(/\D/g, '').slice(-10)
      : '';
    return lots.filter((l) => {
      const lotPhone = l.farmerPhone ? l.farmerPhone.replace(/\D/g, '').slice(-10) : '';
      return (
        l.farmerId === selectedLedgerFarmer.id ||
        (cleanFarmerPhone && lotPhone === cleanFarmerPhone) ||
        (l.farmerName && l.farmerName.trim().toLowerCase() === selectedLedgerFarmer.name.trim().toLowerCase())
      );
    });
  }, [lots, selectedLedgerFarmer]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#1e293b] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1a3a52]" />
              <span>{t('farmersDirectoryTitle')}</span>
            </h2>
            <p className="text-xs text-[#64748b]">{t('farmersDirectorySubtitle')}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="open-voice-add-farmer-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Mic className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>🎙️ Voice Register Farmer (Awaaz Se)</span>
            </button>
            <button
              id="open-farmer-signup-wizard-btn"
              onClick={() => setIsFarmerSignUpOpen(true)}
              className="px-3 py-2 rounded-xl border border-[#1a3a52] text-[#1a3a52] text-xs font-bold hover:bg-[#eef3f7] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>{language === 'te' ? 'రైతు నమోదు' : 'Sign Up Farmer'}</span>
            </button>
            <button
              id="open-add-farmer-modal-btn"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-[#1a3a52] text-white text-xs font-bold hover:bg-[#122839] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#d4af37]" />
              <span>{t('addFarmerBtn')}</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notificationMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notificationMsg}</span>
            </div>
            <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] pt-2 overflow-x-auto">
          <button
            type="button"
            id="tab-connected-farmers"
            onClick={() => setActiveTab('connected')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'connected'
                ? 'border-[#1a3a52] text-[#1a3a52] bg-[#eef3f7]/50 rounded-t-xl'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Connected Farmers ({farmers.length})</span>
          </button>

          <button
            type="button"
            id="tab-incoming-requests"
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'incoming'
                ? 'border-[#1a3a52] text-[#1a3a52] bg-[#eef3f7]/50 rounded-t-xl'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Incoming Requests</span>
            {incomingFarmerRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold animate-pulse">
                {incomingFarmerRequests.length} new
              </span>
            )}
          </button>
        </div>

        {/* Data Privacy & Isolation Assurance Banner */}
        <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#64748b] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1a3a52] shrink-0" />
          <span>
            <strong>Secure Mandi Data Isolation:</strong> When connected, only that specific farmer&apos;s flower lots, parchis, and payment khata are shared. No other farmer&apos;s data is accessible.
          </span>
        </div>

        {/* Search Input for Connected tab */}
        {activeTab === 'connected' && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748b]" />
            <input
              id="farmers-search-input"
              type="text"
              placeholder="Search connected farmers by name, village, phone, crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e8f0] text-xs focus:outline-hidden focus:border-[#1a3a52] bg-[#f8fafc]"
            />
          </div>
        )}
      </div>

      {/* TAB 1: Connected Farmers */}
      {activeTab === 'connected' && (
        <div>
          {filteredFarmers.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-[#e2e8f0] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#eef3f7] text-[#1a3a52] flex items-center justify-center mx-auto text-2xl">
                🌱
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-black text-base text-[#1e293b]">No Farmers in Khata Yet</h4>
                <p className="text-xs text-[#64748b]">
                  Register farmers in your yard to view their connected ledger and consignments.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-5 py-2 rounded-xl bg-[#1a3a52] text-white text-xs font-bold hover:bg-[#122839] transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#d4af37]" />
                  <span>{t('addFarmerBtn')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFarmers.map((farmer) => {
                const stats = getFarmerStats(farmer.id);

                return (
                  <div
                    key={farmer.id}
                    id={`farmer-card-${farmer.id}`}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] shadow-2xs hover:shadow-xs transition space-y-3.5 flex flex-col justify-between"
                  >
                    {/* Farmer Info */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#1a3a52] bg-[#f8fafc] shrink-0 shadow-2xs">
                            {farmer.photoUrl ? (
                              <img
                                src={farmer.photoUrl}
                                alt={farmer.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#eef3f7] text-[#1a3a52] font-black text-sm">
                                {farmer.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-sm sm:text-base text-[#1e293b]">
                                {farmer.name}
                              </h4>
                              <span className="font-mono text-[10px] bg-[#f8fafc] text-[#64748b] px-1.5 py-0.5 rounded border border-[#e2e8f0]">
                                {farmer.id}
                              </span>
                            </div>
                            <p className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#1a3a52]" />
                              <span>{farmer.village}</span>
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-[#1e293b] font-mono mt-1">
                              <Phone className="w-3 h-3 text-[#64748b]" />
                              <span>+91 {farmer.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            id={`edit-farmer-btn-${farmer.id}`}
                            onClick={() => openEditModal(farmer)}
                            className="text-[11px] text-[#1a3a52] font-semibold hover:underline"
                          >
                            {t('editFarmer')}
                          </button>
                          <button
                            id={`delete-farmer-card-btn-${farmer.id}`}
                            onClick={() => handleDeleteFarmerClick(farmer)}
                            className="p-1 rounded-md text-[#9E3A24] hover:bg-red-50 hover:text-red-800 transition cursor-pointer"
                            title="Delete this farmer record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Connection Badge */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Connected &amp; Data Shared (Only this farmer)</span>
                      </div>

                      {/* Primary Crops Chips */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {(Array.isArray(farmer.primaryCrops) ? farmer.primaryCrops : [farmer.primaryCrops || 'Marigold']).map((crop) => (
                          <span
                            key={crop}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef3f7] text-[#1a3a52] font-medium"
                          >
                            🌸 {crop}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Lifetime Khata Stats */}
                    <div className="pt-2 border-t border-[#f1f5f9] space-y-2">
                      <div className="grid grid-cols-3 gap-1 text-center bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0] text-[11px]">
                        <div>
                          <span className="text-[#64748b] block text-[9px] uppercase font-semibold">
                            Total Lots
                          </span>
                          <span className="font-black text-xs text-[#1e293b]">{stats.totalLots}</span>
                        </div>

                        <div>
                          <span className="text-[#64748b] block text-[9px] uppercase font-semibold">
                            Volume
                          </span>
                          <span className="font-black text-xs text-[#1e293b]">
                            {stats.totalVolume.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#64748b] block text-[9px] uppercase font-semibold">
                            Turnover
                          </span>
                          <span className="font-black text-xs text-[#1a3a52]">
                            ₹{stats.totalTurnover.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Pending Dues Banner */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-[#64748b]">Outstanding Balance:</span>
                        <span
                          className={`font-mono font-bold ${
                            stats.pendingDues > 0 ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {stats.pendingDues > 0 ? `₹${stats.pendingDues.toLocaleString('en-IN')}` : 'Settled ✓'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          id={`view-ledger-btn-${farmer.id}`}
                          onClick={() => setSelectedLedgerFarmer(farmer)}
                          className="w-full py-2.5 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>{language === 'te' ? 'వ్యక్తిగత ఖాతా (ఖాతా చూడండి)' : 'View Farmer Khata / Ledger'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'incoming' && (
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#1e293b] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1a3a52]" />
                <span>Pending Incoming Requests from Farmers ({incomingFarmerRequests.length})</span>
              </h3>
              <p className="text-xs text-[#64748b]">
                Farmers requesting to link their digital passbook with your shop. When accepted, only their specific consignments and payments will be shared with them.
              </p>
            </div>
          </div>

          {incomingFarmerRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748b] space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#1e293b]">No Pending Incoming Requests</p>
              <p className="max-w-md mx-auto">
                When a farmer searches your shop and clicks &quot;Send Connection Request&quot;, their request will appear here for you to approve with one click.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingFarmerRequests.map((req) => (
                <div
                  key={req.id}
                  id={`incoming-req-${req.id}`}
                  className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#1a3a52]/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1e293b]">{req.farmerName}</span>
                      <span className="text-xs text-[#64748b]">📍 {req.farmerVillage}</span>
                    </div>
                    <span className="font-mono text-xs text-[#1a3a52] block font-semibold">
                      Mobile: +91 {req.farmerPhone}
                    </span>
                    <span className="text-[10px] text-[#64748b] block">
                      Requested on: {req.requestDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      id={`accept-request-${req.id}`}
                      onClick={() => handleAcceptRequest(req.id, req.farmerName)}
                      className="px-4 py-2 rounded-xl bg-[#1a3a52] text-white text-xs font-bold hover:bg-[#122839] transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{language === 'te' ? 'అంగీకరించండి' : 'Accept Connection'}</span>
                    </button>
                    <button
                      type="button"
                      id={`decline-request-${req.id}`}
                      onClick={() => handleDeclineRequest(req.id)}
                      className="px-3 py-2 rounded-xl bg-white border border-[#e2e8f0] text-[#64748b] text-xs font-semibold hover:bg-gray-100 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Farmer Modal */}
      {isAddModalOpen && (
        <div
          id="add-farmer-modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        >
          <div
            id="add-farmer-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFFFF] rounded-2xl max-w-md w-full shadow-2xl border border-[#e2e8f0] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-3 sm:p-4 bg-[#1a3a52] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  aria-label="Go Back"
                  className="w-11 h-11 min-w-[48px] min-h-[48px] rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-white/10 hidden sm:flex items-center justify-center text-[#d4af37] shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base">
                  {editingFarmer ? 'Edit Farmer Profile' : t('addNewFarmerTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                className="w-11 h-11 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFarmer} className="p-5 space-y-4 bg-[#f8fafc] max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photo of Farmer */}
              <PhotoUploadPicker
                label={language === 'te' ? 'రైతు ఫోటో' : 'Photo of Farmer'}
                sublabel="Upload, snap with webcam, or choose authentic flower grower avatar"
                currentPhotoUrl={formPhotoUrl}
                onChange={(url) => setFormPhotoUrl(url)}
                presetType="farmer"
                idPrefix="farmers-view-modal"
              />

              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                  {t('farmerFullName')} * (No numbers)
                </label>
                <input
                  id="farmer-modal-name-input"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy"
                  value={formName}
                  onKeyDown={(e) => {
                    if (/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const clean = e.clipboardData.getData('text').replace(/[0-9]/g, '');
                    setFormName(clean);
                  }}
                  onChange={(e) => setFormName(e.target.value.replace(/[0-9]/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs bg-white focus:outline-hidden focus:border-[#1a3a52]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                  {t('farmerPhone')} * (10 digits only)
                </label>
                <input
                  id="farmer-modal-phone-input"
                  type="tel"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="e.g. 9848123456"
                  value={formPhone}
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
                    setFormPhone(clean);
                  }}
                  onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs bg-white font-mono focus:outline-hidden focus:border-[#1a3a52]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                  {t('farmerVillage')} *
                </label>
                <input
                  id="farmer-modal-village-input"
                  type="text"
                  required
                  placeholder="e.g. Shamshabad / Medchal"
                  value={formVillage}
                  onChange={(e) => setFormVillage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs bg-white focus:outline-hidden focus:border-[#1a3a52]"
                />
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-100/70 opacity-60 pointer-events-none space-y-2 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-500">
                    {t('primaryCropsLabel')}
                  </label>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Currently Disabled</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {flowerVarietiesData.map((v) => {
                    const isChecked = formCrops.includes(v.en);
                    const label = language === 'te' ? v.te : language === 'hi' ? v.hi : v.en;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled
                        onClick={() => toggleCrop(v.en)}
                        className={`p-2 rounded-lg text-left text-xs font-medium border cursor-not-allowed ${
                          isChecked
                            ? 'bg-slate-300 text-slate-700 border-slate-400 font-bold'
                            : 'bg-slate-200 text-slate-500 border-slate-300'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '} {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                {editingFarmer ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteFarmerClick(editingFarmer)}
                    className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Farmer</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#e2e8f0] text-xs font-semibold text-[#1e293b]"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    id="submit-farmer-btn"
                    className="px-5 py-2 rounded-xl bg-[#1a3a52] text-white text-xs font-bold hover:bg-[#122839] transition shadow-xs"
                  >
                    {t('saveFarmer')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Farmer Katha Statement Modal */}
      {selectedLedgerFarmer && (
        <div
          id="farmer-ledger-modal-overlay"
          onClick={() => setSelectedLedgerFarmer(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
        >
          <div
            id="farmer-ledger-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-3 sm:p-4 bg-[#1a3a52] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLedgerFarmer(null)}
                  aria-label="Go Back"
                  className="w-11 h-11 min-w-[48px] min-h-[48px] rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-white/10 hidden sm:flex items-center justify-center text-[#d4af37] shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold block leading-tight">
                    Farmer Katha Statement &amp; Date Lookup: {selectedLedgerFarmer.name}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {selectedLedgerFarmer.village ? `📍 ${selectedLedgerFarmer.village}` : ''} • +91 {selectedLedgerFarmer.phone}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLedgerFarmer(null)}
                aria-label="Close modal"
                className="w-11 h-11 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto">
              <FarmerKathaStatementView
                initialFarmer={selectedLedgerFarmer}
                onSelectParchiLot={(lot) => setSelectedParchiLot(lot)}
                onClose={() => setSelectedLedgerFarmer(null)}
                isModal={true}
              />
            </div>

            <div className="p-3 bg-white border-t border-[#e2e8f0] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLedgerFarmer(null)}
                className="px-4 py-1.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b] text-xs font-semibold cursor-pointer hover:bg-gray-100 transition"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        title="Delete Farmer Profile"
        itemName={deleteModalConfig.farmer ? `${deleteModalConfig.farmer.name} (${deleteModalConfig.farmer.village || 'Local Area'})` : undefined}
        itemDetails={
          deleteModalConfig.farmer
            ? `Phone: +91 ${deleteModalConfig.farmer.phone || 'N/A'} • Crops: ${Array.isArray(deleteModalConfig.farmer.primaryCrops) ? deleteModalConfig.farmer.primaryCrops.join(', ') : (deleteModalConfig.farmer.primaryCrops || 'Flowers')}`
            : undefined
        }
        message="Are you sure you want to delete this farmer? This will remove the farmer from your directory and associated active ledger views."
        confirmText="CONFIRM DELETE"
        cancelText="CANCEL"
        onConfirm={handleConfirmDeleteFarmer}
        onCancel={() => setDeleteModalConfig({ isOpen: false, farmer: null })}
      />

      {/* Voice Input Modal for Farmer Registration */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        mode="farmer"
        onFarmerParsed={handleFarmerVoiceParsed}
      />
    </div>
  );
};

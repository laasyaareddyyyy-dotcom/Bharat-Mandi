import React, { useState } from 'react';
import { useMandi } from '../../context/MandiContext';
import { SupportAdminDashboard } from '../helpdesk/SupportAdminDashboard';
import {
  ShieldCheck,
  Headphones,
  Store,
  Users,
  FileSpreadsheet,
  Settings,
  Search,
  Building2,
  Calendar,
  LogOut,
  Sparkles,
  PhoneCall,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  KeyRound,
} from 'lucide-react';
import {
  DEFAULT_ADMIN_PHONE_NUMBERS,
  getCustomAdminNumbers,
  addCustomAdminNumber,
  removeCustomAdminNumber,
} from '../../utils/phoneValidation';

export const AdminPortalView: React.FC = () => {
  const {
    merchantProfile,
    farmers,
    lots,
    payments,
    helpTickets,
    registeredAccounts,
    logoutCurrentUser,
    activeSessionDate,
    setIsDateSwitcherOpen,
    setPortalMode,
  } = useMandi();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'helpdesk' | 'merchants' | 'farmers' | 'sales' | 'settings'
  >('helpdesk');

  const [merchantSearch, setMerchantSearch] = useState('');
  const [farmerSearch, setFarmerSearch] = useState('');
  const [customAdminNums, setCustomAdminNums] = useState<string[]>(getCustomAdminNumbers());
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [adminPhoneMsg, setAdminPhoneMsg] = useState('');

  const handleAddAdmin = () => {
    if (!newAdminPhone || newAdminPhone.replace(/\D/g, '').length !== 10) {
      setAdminPhoneMsg('Enter a valid 10-digit mobile number');
      return;
    }
    const clean = newAdminPhone.replace(/\D/g, '').slice(-10);
    addCustomAdminNumber(clean);
    setCustomAdminNums(getCustomAdminNumbers());
    setNewAdminPhone('');
    setAdminPhoneMsg('Admin unique key added successfully');
    setTimeout(() => setAdminPhoneMsg(''), 3000);
  };

  const handleRemoveAdmin = (num: string) => {
    removeCustomAdminNumber(num);
    setCustomAdminNums(getCustomAdminNumbers());
    setAdminPhoneMsg(`Removed ${num}`);
    setTimeout(() => setAdminPhoneMsg(''), 3000);
  };

  // Aggregated platform stats
  const totalMerchants = registeredAccounts.filter((a) => a.role === 'merchant').length || 1;
  const totalFarmers = farmers.length;
  const totalLots = lots.length;
  const openHelpTickets = helpTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const totalTurnover = lots.reduce((sum, l) => sum + (Number(l.grossTotal) || 0), 0);

  const filteredMerchants = registeredAccounts
    .filter((a) => a.role === 'merchant')
    .filter(
      (m) =>
        m.fullName.toLowerCase().includes(merchantSearch.toLowerCase()) ||
        m.phoneNumber.includes(merchantSearch) ||
        (m.shopOrVillage && m.shopOrVillage.toLowerCase().includes(merchantSearch.toLowerCase()))
    );

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.phone.includes(farmerSearch) ||
      (f.village && f.village.toLowerCase().includes(farmerSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Admin Header Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#1a3a52] via-[#122839] to-[#0a1824] text-white shadow-xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-amber-200 text-slate-900 flex items-center justify-center font-black shadow-md shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                APMC Mandi Central Admin Portal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Platform Governance, Merchant & Farmer Registry, SLA Desk & Ledger Audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsDateSwitcherOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>Mandi Date: {activeSessionDate}</span>
          </button>

          <button
            type="button"
            onClick={() => setPortalMode('merchant')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Merchant Mode</span>
          </button>

          <button
            type="button"
            onClick={logoutCurrentUser}
            className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Admin KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Merchants</span>
            <Store className="w-4 h-4 text-[#1a3a52]" />
          </div>
          <div className="text-2xl font-black text-[#1e293b] font-mono">{totalMerchants}</div>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> Registered Yards
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Farmers</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#1e293b] font-mono">{totalFarmers}</div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Passbook Profiles</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#1e293b] font-mono">{totalLots}</div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Parchi Auctions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Tickets</span>
            <Headphones className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">{openHelpTickets}</div>
          <span className="text-[10px] text-red-500 font-bold mt-0.5 block">Awaiting SLA</span>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mandi Turnover</span>
            <Activity className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            ₹{totalTurnover.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-800 font-bold mt-0.5 block">Recorded Gross Volume</span>
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveAdminTab('helpdesk')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'helpdesk'
              ? 'bg-[#1a3a52] text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Headphones className="w-4 h-4 text-amber-300" />
          <span>Help Desk Control Center</span>
          {openHelpTickets > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
              {openHelpTickets}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('merchants')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'merchants'
              ? 'bg-[#1a3a52] text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Merchant Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('farmers')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'farmers'
              ? 'bg-[#1a3a52] text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Farmer Registry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('sales')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'sales'
              ? 'bg-[#1a3a52] text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Sales & Audit Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'settings'
              ? 'bg-[#1a3a52] text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>APMC Settings</span>
        </button>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: HELPDESK CONTROL CENTER */}
      {activeAdminTab === 'helpdesk' && <SupportAdminDashboard />}

      {/* TAB 2: MERCHANT DIRECTORY */}
      {activeAdminTab === 'merchants' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#1e293b]">Registered APMC Merchants</h2>
              <p className="text-xs text-slate-500">
                Authorized Wholesalers, Adathiyas, and Yard Commission Agents
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search merchant name / phone..."
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a3a52]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a3a52] text-white font-bold">
                  <th className="p-3">Shop / Firm</th>
                  <th className="p-3">Merchant Owner</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">APMC Yard</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMerchants.length > 0 ? (
                  filteredMerchants.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-black text-[#1e293b]">
                        {m.shopOrVillage || merchantProfile.shopName || 'Mandi Yard Shop'}
                      </td>
                      <td className="p-3 font-semibold">{m.fullName}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">+91 {m.phoneNumber}</td>
                      <td className="p-3 text-slate-600">{m.marketName || 'Agri APMC Yard'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#eef3f7] text-[#1a3a52]">
                          Merchant
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active License
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No merchants matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FARMER REGISTRY */}
      {activeAdminTab === 'farmers' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#1e293b]">Registered Mandi Farmers</h2>
              <p className="text-xs text-slate-500">
                Registered growers, crop categories, and digital passbooks
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search farmer name / village..."
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a3a52]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a3a52] text-white font-bold">
                  <th className="p-3">Farmer ID</th>
                  <th className="p-3">Farmer Name</th>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Village</th>
                  <th className="p-3">Crops</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFarmers.length > 0 ? (
                  filteredFarmers.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-[#1a3a52]">{f.id}</td>
                      <td className="p-3 font-black text-[#1e293b]">{f.name}</td>
                      <td className="p-3 font-mono text-slate-700">+91 {f.phone}</td>
                      <td className="p-3 text-slate-600">{f.village || 'Mandi Belt'}</td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {(f.primaryCrops || ['flowers']).map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Connected
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No farmers matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SALES & AUDIT LEDGER */}
      {activeAdminTab === 'sales' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-black text-[#1e293b]">System-Wide Sales & Settlement Audit</h2>
            <p className="text-xs text-slate-500">
              Live auction lots, generated parchment receipts, and APMC commission logs
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a3a52] text-white font-bold">
                  <th className="p-3">Parchi #</th>
                  <th className="p-3">Farmer</th>
                  <th className="p-3">Commodity / Variety</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lots.length > 0 ? (
                  lots.slice(0, 15).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-black text-[#1a3a52]">#{l.parchiNumber || l.id}</td>
                      <td className="p-3 font-bold text-[#1e293b]">{l.farmerName}</td>
                      <td className="p-3 text-slate-700">
                        {l.commodityCategory} • {l.flowerVariety}
                      </td>
                      <td className="p-3 font-semibold">
                        {l.quantity} {l.unit}
                      </td>
                      <td className="p-3 font-mono font-black text-slate-900">
                        ₹{Number(l.grossTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {l.paymentStatus === 'Paid' ? 'Settled' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No sales lots logged in current session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: APMC SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-black text-[#1e293b]">APMC System Configuration & Help Desk Officers</h2>
            <p className="text-xs text-slate-500">
              Manage SLA response timers, assigned desk officers, and APMC market parameters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-sm text-[#1a3a52] flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Assigned Help Desk Officers</span>
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#1e293b] block">Rajesh Kumar (Desk Officer - APMC Yard 1)</span>
                    <span className="text-[11px] text-slate-500">+91 98765 11223</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Online</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#1e293b] block">Anil Verma (Settlement Officer - APMC Yard 2)</span>
                    <span className="text-[11px] text-slate-500">+91 98765 44332</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Online</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-sm text-[#1a3a52] flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>APMC Help Desk SLA Targets</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                  <span className="font-bold text-slate-700">Critical Priority SLA:</span>
                  <span className="font-mono font-black text-red-600">30 Minutes</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                  <span className="font-bold text-slate-700">High Priority SLA:</span>
                  <span className="font-mono font-black text-amber-600">2 Hours</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                  <span className="font-bold text-slate-700">Standard Query SLA:</span>
                  <span className="font-mono font-black text-blue-600">12 Hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Unique Numbers (Merchant Login Gateway) */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-[#1a3a52] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Authorized Admin Unique Numbers (Merchant Sign-In Gateway)</span>
                </h3>
                <p className="text-xs text-slate-600">
                  When logging in or signing up via Merchant, entering any of these unique numbers grants access directly to this Admin Portal.
                </p>
              </div>
              {adminPhoneMsg && (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                  {adminPhoneMsg}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {DEFAULT_ADMIN_PHONE_NUMBERS.map((num) => (
                <span
                  key={num}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-slate-800 text-xs font-mono font-bold shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>+91 {num}</span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-sans">System</span>
                </span>
              ))}

              {customAdminNums.map((num) => (
                <span
                  key={num}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-mono font-bold shadow-2xs"
                >
                  <span>+91 {num}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdmin(num)}
                    className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 max-w-md">
              <input
                type="tel"
                value={newAdminPhone}
                onChange={(e) => setNewAdminPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1a3a52] font-mono"
              />
              <button
                type="button"
                onClick={handleAddAdmin}
                className="px-3.5 py-2 rounded-xl bg-[#1a3a52] hover:bg-[#122839] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Admin Number</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

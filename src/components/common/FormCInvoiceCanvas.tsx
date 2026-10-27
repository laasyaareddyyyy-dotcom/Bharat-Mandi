import React, { forwardRef } from 'react';
import { useMandi } from '../../context/MandiContext';

export interface FormCItem {
  id?: string;
  parchiNumber?: string;
  date?: string;
  commodity?: string;
  flowerVariety: string;
  flowerQuality?: string;
  quantity: number;
  unit: string;
  boxesCount?: number;
  packagingType?: string;
  rate: number;
  grossTotal: number;
  hamali?: number;
  transport?: number;
  commission?: number;
  misc?: number;
  farmerNetPayable?: number;
  workerName?: string;
}

export interface StatementRowForCanvas {
  id: string;
  type: 'sale' | 'payment';
  date: string;
  time: string;
  parchiNumber: string;
  itemsSummary: string;
  takenAmount: number;
  paidAmount: number;
  runningBalance: number;
  isDaySubtotal?: boolean;
}

export interface FormCInvoiceData {
  mode?: 'wholesaler' | 'retailer';
  isRetailStatement?: boolean;
  statementRows?: StatementRowForCanvas[];
  totalTaken?: number;
  totalPaid?: number;
  closingBalance?: number;
  parchiNumber: string;
  date: string;
  time: string;
  farmerName: string;
  farmerVillage?: string;
  farmerPhone?: string;
  farmerPhotoUrl?: string;
  isCombinedStatement?: boolean;
  dateRangeLabel?: string;
  items: FormCItem[];
  grossTotal: number;
  transportCharges: number;
  ammaliCharges: number;
  commissionPercent: number;
  commissionAmount: number;
  miscCommissionMode?: 'percent' | 'fixed';
  miscCommissionPercent?: number;
  miscCommissionAmount?: number;
  otherDeductions?: Array<{ name: string; amount: number }>;
  farmerNetPayable: number;
  amountPaid: number;
  balanceDue?: number;
  previousDue?: number;
  openingBalance?: number;
  paymentMode?: string;
  paymentStatus: string;
  notes?: string;
  workerName?: string;
}

interface FormCInvoiceCanvasProps {
  data: FormCInvoiceData;
  format?: 'a4' | 'thermal-80mm';
  merchantOverride?: {
    shopName?: string;
    shopNumber?: string;
    marketYardName?: string;
    ownerName?: string;
    phoneNumber?: string;
  };
}

/**
 * Formats currency in Indian locale (e.g. ₹23,891.00)
 */
export function formatIndianCurrency(amount: number): string {
  const num = Math.abs(Number(amount) || 0);
  const formatted = num.toFixed(2);
  return `${amount < 0 ? '-' : ''}₹${formatted}`;
}

export const FormCInvoiceCanvas = forwardRef<HTMLDivElement, FormCInvoiceCanvasProps>(
  ({ data, format = 'a4', merchantOverride }, ref) => {
    const { merchantProfile } = useMandi();

    const isThermal = format === 'thermal-80mm';
    const isRetail = data.mode === 'retailer';

    // Merchant Profile & Clean Address Processing (No duplicate 'Shop No.', No 'APMC')
    const rawShopName = merchantOverride?.shopName || merchantProfile?.shopName || 'GOPALA KRISHNA FLOWER MART';
    const shopName = rawShopName.replace(/\bAPMC\b/gi, '').trim() || 'FLOWER MART';

    const rawShopNumber = merchantOverride?.shopNumber || merchantProfile?.shopNumber || '53';
    const cleanShopNumber = rawShopNumber
      .replace(/^(shop\s*no\.?|shop\s*#?|stall\s*no\.?|shop)\s*/i, '')
      .replace(/\bAPMC\b/gi, '')
      .trim();

    const rawMarketYard = merchantOverride?.marketYardName || merchantProfile?.marketYardName || 'Gudimalkapur Flower Market';
    const cleanMarketYard = rawMarketYard.replace(/\bAPMC\b/gi, '').trim();

    const shopAddressDisplay = `Shop No. ${cleanShopNumber || '53'} • ${cleanMarketYard}`;

    const ownerName = (merchantOverride?.ownerName || merchantProfile?.ownerName || 'Kothakapu Gopal Reddy').replace(/\bAPMC\b/gi, '').trim();
    const phoneNumber = merchantOverride?.phoneNumber || merchantProfile?.phoneNumber || '9440826222';

    // Calculations
    const customDeductionsSum = Array.isArray(data.otherDeductions)
      ? data.otherDeductions.reduce((acc, d) => acc + (Number(d.amount) || 0), 0)
      : 0;

    const totalDeductionsSum =
      (Number(data.ammaliCharges) || 0) +
      (Number(data.transportCharges) || 0) +
      (Number(data.commissionAmount) || 0) +
      (Number(data.miscCommissionAmount) || 0) +
      customDeductionsSum;

    const effectiveNetPayable = data.farmerNetPayable ?? Math.max(0, data.grossTotal - totalDeductionsSum);
    const paidAmount = Number(data.amountPaid) || 0;
    const computedBalance = data.balanceDue ?? Math.max(0, effectiveNetPayable - paidAmount);

    const isFullyPaid = computedBalance === 0 && paidAmount > 0;
    const isPartPaid = paidAmount > 0 && computedBalance > 0;
    const statusLabel = isFullyPaid ? 'PAID' : isPartPaid ? 'PART PAID' : (data.paymentStatus || 'UNPAID').toUpperCase();

    // Clean Farmer / Customer Labels
    const partyName = (data.farmerName || (isRetail ? 'Retail Customer' : 'Farmer')).replace(/\bAPMC\b/gi, '').trim();
    const partyVillage = (data.farmerVillage || '').replace(/\bAPMC\b/gi, '').trim();
    const partyPhone = data.farmerPhone ? data.farmerPhone.replace(/\D/g, '').slice(-10) : '';

    if (data.isRetailStatement) {
      const statementRows = data.statementRows || [];
      const openingBalance = data.openingBalance || 0;
      const totalTaken = data.totalTaken || 0;
      const totalPaid = data.totalPaid || 0;
      const closingBalance = data.closingBalance || 0;

      return (
        <div
          ref={ref}
          id="form-c-official-invoice-canvas"
          className="bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-sm mx-auto p-5 sm:p-6 max-w-3xl space-y-3.5 w-full"
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* 1. TOP HEADER */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-start gap-3 min-w-0">
              <img
                src="/bharat_mandi_logo.png"
                alt="Bharat Mandi Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 bg-transparent mt-0.5"
              />
              <div className="text-left space-y-1 min-w-0">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-extrabold tracking-widest text-slate-700 uppercase border border-slate-200">
                  RETAIL STATEMENT
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight leading-tight break-words my-0.5">
                  {shopName}
                </h1>
                <p className="text-xs font-bold text-slate-800 leading-snug truncate">
                  {shopAddressDisplay}
                </p>
                <p className="text-[10px] text-slate-600 leading-snug">
                  Proprietor: <span className="font-bold text-slate-900">{ownerName}</span> | Contact: <span className="font-bold text-slate-900">{phoneNumber}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 pt-1">
              <span className="text-[9px] font-mono uppercase px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold inline-block shadow-2xs whitespace-nowrap">
                OFFICIAL KHATA STATEMENT
              </span>
            </div>
          </div>

          {/* 2. CUSTOMER & STATEMENT PERIOD INFO CARD */}
          <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200 grid grid-cols-12 gap-2 text-xs">
            <div className="col-span-4">
              <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">
                CUSTOMER
              </span>
              <span className="font-black text-slate-900 text-sm block break-words leading-tight">
                {partyName}
              </span>
            </div>

            <div className="col-span-4">
              <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">
                SHOP / MARKET &amp; CONTACT
              </span>
              <span className="font-bold text-slate-800 text-xs block break-words leading-tight">
                {partyVillage || 'Local Shop'}
              </span>
              {partyPhone ? (
                <span className="text-[10px] font-mono text-slate-600 block mt-0.5">
                  +91 {partyPhone}
                </span>
              ) : null}
            </div>

            <div className="col-span-4">
              <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">
                STATEMENT PERIOD
              </span>
              <span className="font-bold text-slate-900 text-xs block break-words leading-tight font-mono">
                {data.dateRangeLabel || 'All Time'}
              </span>
            </div>
          </div>

          {/* 3. OPENING BALANCE CARD */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <span className="font-black text-slate-800 text-xs uppercase tracking-wider block">
                OPENING BALANCE
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                Customer balance prior to From Date (accumulated earlier sales − payments)
              </span>
            </div>
            <span className="font-mono font-black text-slate-900 text-base sm:text-lg">
              {formatIndianCurrency(openingBalance)}
            </span>
          </div>

          {/* 4. STATEMENT TRANSACTIONS TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a3a52] text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-2.5">Date &amp; Time</th>
                  <th className="p-2.5">Type / Ref #</th>
                  <th className="p-2.5">Items / Details</th>
                  <th className="p-2.5 text-right">Taken (₹)</th>
                  <th className="p-2.5 text-right">Paid (₹)</th>
                  <th className="p-2.5 text-right">Balance After (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {statementRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 font-bold text-xs">
                      No entries in this range
                    </td>
                  </tr>
                ) : (
                  statementRows.map((row) => {
                    if (row.isDaySubtotal) {
                      return (
                        <tr key={row.id} className="bg-slate-100 font-bold text-slate-900">
                          <td colSpan={3} className="p-2 font-mono text-[11px] text-slate-700">
                            {row.parchiNumber} ({row.date})
                          </td>
                          <td className="p-2 text-right font-mono text-slate-900">
                            {row.takenAmount > 0 ? formatIndianCurrency(row.takenAmount) : '-'}
                          </td>
                          <td className="p-2 text-right font-mono text-emerald-800">
                            {row.paidAmount > 0 ? formatIndianCurrency(row.paidAmount) : '-'}
                          </td>
                          <td className="p-2 text-right font-mono text-[#1a3a52]">
                            {formatIndianCurrency(row.runningBalance)}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={row.id} className="hover:bg-slate-50 font-medium">
                        <td className="p-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {row.date} {row.time ? `• ${row.time}` : ''}
                        </td>
                        <td className="p-2.5 font-mono text-xs">
                          {row.type === 'sale' ? (
                            <span className="font-bold text-[#1a3a52]">{row.parchiNumber}</span>
                          ) : (
                            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                              {row.parchiNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-800 font-semibold max-w-xs break-words">
                          {row.itemsSummary}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {row.takenAmount > 0 ? formatIndianCurrency(row.takenAmount) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          {row.paidAmount > 0 ? formatIndianCurrency(row.paidAmount) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-[#1a3a52]">
                          {formatIndianCurrency(row.runningBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 5. STATEMENT TOTALS */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
              <span className="font-bold text-slate-700 text-xs">TOTAL TAKEN (Sales in Range)</span>
              <span className="font-mono font-black text-slate-900 text-sm">{formatIndianCurrency(totalTaken)}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
              <span className="font-bold text-slate-700 text-xs">TOTAL PAID (Payments in Range)</span>
              <span className="font-mono font-black text-emerald-700 text-sm">{formatIndianCurrency(totalPaid)}</span>
            </div>
          </div>

          {/* 6. CLOSING BALANCE BAR */}
          <div
            className={`p-3.5 rounded-2xl text-white flex items-center justify-between gap-3 shadow-xs border ${
              closingBalance === 0
                ? 'bg-[#047857] border-emerald-800'
                : 'bg-rose-700 border-rose-800'
            }`}
          >
            <div>
              <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                CLOSING BALANCE:
              </span>
              <span className="text-[10px] text-white/90 font-medium block mt-0.5">
                Opening ({formatIndianCurrency(openingBalance)}) + Total Taken ({formatIndianCurrency(totalTaken)}) − Total Paid ({formatIndianCurrency(totalPaid)})
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl sm:text-2xl font-black font-mono text-white block">
                {closingBalance === 0 ? 'No Due ✓' : formatIndianCurrency(closingBalance)}
              </span>
            </div>
          </div>

          {/* 7. AUTHORIZATION & FOOTER */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs pt-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              OFFICIAL RETAIL STATEMENT • GOVT REGULATED
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 text-[11px] block">For {shopName}</span>
              <span className="text-[9px] text-slate-500 block">(Authorized Signatory)</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        id="form-c-official-invoice-canvas"
        className={`bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-sm mx-auto ${
          isThermal ? 'p-3 max-w-md space-y-2.5 text-xs' : 'p-5 sm:p-6 max-w-3xl space-y-3.5 w-full'
        }`}
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          pageBreakInside: 'avoid',
        }}
      >
        {/* 1. TOP HEADER */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-start gap-3 min-w-0">
            <img
              src="/bharat_mandi_logo.png"
              alt="Bharat Mandi Logo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 bg-transparent mt-0.5"
            />
            <div className="text-left space-y-1 min-w-0">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-extrabold tracking-widest text-slate-700 uppercase border border-slate-200">
                {isRetail ? 'RETAIL SALE PARCHI • RECEIPT' : 'MANDI SALE PARCHI • FORM C'}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight leading-tight break-words my-0.5">
                {shopName}
              </h1>
              <p className="text-xs font-bold text-slate-800 leading-snug truncate">
                {shopAddressDisplay}
              </p>
              <p className="text-[10px] text-slate-600 leading-snug">
                Proprietor: <span className="font-bold text-slate-900">{ownerName}</span> | Contact: <span className="font-bold text-slate-900">{phoneNumber}</span>
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 pt-1">
            <span className="text-[9px] font-mono uppercase px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold inline-block shadow-2xs whitespace-nowrap">
              {isRetail ? 'OFFICIAL RETAIL RECEIPT' : 'OFFICIAL MANDI RECEIPT'}
            </span>
          </div>
        </div>

        {/* 2. 4-COLUMN INFO CARD */}
        <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200 grid grid-cols-12 gap-2 text-xs">
          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">
              PARCHI / INV NO.
            </span>
            <span className="font-mono font-black text-slate-900 text-xs sm:text-sm block break-all">
              {data.parchiNumber || (isRetail ? 'RP-2026-0001' : 'FC-2026-0001')}
            </span>
          </div>

          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">
              DATE &amp; TIME
            </span>
            <span className="font-bold text-slate-800 text-xs block break-words leading-tight">
              {data.date} {data.time ? `• ${data.time}` : ''}
            </span>
          </div>

          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">
              {isRetail ? 'CUSTOMER' : 'FARMER'}
            </span>
            <span className="font-black text-slate-900 text-xs sm:text-sm block break-words leading-tight">
              {partyName}
            </span>
          </div>

          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">
              VILLAGE &amp; CONTACT
            </span>
            <span className="font-bold text-slate-800 text-xs block break-words leading-tight">
              {partyVillage || 'Local Market'}
            </span>
            {partyPhone ? (
              <span className="text-[10px] font-mono text-slate-600 block mt-0.5">
                +91 {partyPhone}
              </span>
            ) : null}
          </div>
        </div>

        {/* 3. ITEMS TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[620px] sm:min-w-0">
            <div>
              {isRetail ? (
                /* RETAILER COLUMNS: PARCHI & DATE | ITEM / CROP | QTY | RATE | AMOUNT */
                <div className="bg-slate-100 border-b border-slate-200 py-2 px-3 text-[10px] font-black text-slate-700 uppercase tracking-wider grid grid-cols-12 items-center">
                  <div className="col-span-3">PARCHI &amp; DATE</div>
                  <div className="col-span-3">ITEM / CROP</div>
                  <div className="col-span-2 text-center">QTY</div>
                  <div className="col-span-2 text-center">RATE</div>
                  <div className="col-span-2 text-right">AMOUNT</div>
                </div>
              ) : (
                /* WHOLESALER COLUMNS: DATE | COMMODITY | VARIETY | BOXES | QTY | RATE | GROSS | HAMALI | TRANSPORT */
                <div className="bg-slate-100 border-b border-slate-200 py-2 px-3 text-[10px] font-black text-slate-700 uppercase tracking-wider grid grid-cols-12 items-center gap-1">
                  <div className="col-span-2">DATE</div>
                  <div className="col-span-1">COMMODITY</div>
                  <div className="col-span-2">VARIETY</div>
                  <div className="col-span-1 text-center">BOXES</div>
                  <div className="col-span-1 text-center">QTY (KGS)</div>
                  <div className="col-span-1 text-right">RATE</div>
                  <div className="col-span-1 text-right">GROSS</div>
                  <div className="col-span-1 text-right">HAMALI</div>
                  <div className="col-span-1 text-right">TRANSPORT</div>
                </div>
              )}

              <div className="divide-y divide-slate-100 bg-white">
                {data.items.map((item, idx) => {
                  const itemHamali = item.hamali ?? (idx === 0 ? data.ammaliCharges : 0);
                  const itemTrans = item.transport ?? (idx === 0 ? data.transportCharges : 0);
                  const itemComm = item.commission ?? (data.items.length === 1 ? data.commissionAmount : Math.round((item.grossTotal * data.commissionPercent) / 100));
                  const itemMisc = item.misc ?? (data.items.length === 1 ? (data.miscCommissionAmount || 0) : 0);
                  const itemNet = item.farmerNetPayable ?? Math.max(0, item.grossTotal - (itemHamali + itemTrans + itemComm + itemMisc));
                  const itemCommodity = item.commodity || (item.flowerVariety?.toLowerCase().includes('wheat') ? 'Grain' : 'Flower');
                  const itemBoxes = item.boxesCount !== undefined && item.boxesCount !== null ? item.boxesCount : '—';

                  if (isRetail) {
                    return (
                      <div
                        key={idx}
                        className="py-2.5 px-3 text-xs grid grid-cols-12 items-center hover:bg-slate-50/50 leading-normal"
                      >
                        <div className="col-span-3 font-mono text-[11px]">
                          <span className="font-bold text-slate-900 block break-all">
                            {item.parchiNumber || data.parchiNumber || '—'}
                          </span>
                          <span className="text-slate-500 text-[10px] block">{item.date || data.date}</span>
                        </div>
                        <div className="col-span-3 font-bold text-slate-900 break-words pr-1">
                          <div className="text-xs font-bold leading-tight">{item.flowerVariety}</div>
                          {item.boxesCount && item.boxesCount > 0 ? (
                            <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                              {item.boxesCount} {item.packagingType || 'Boxes'}
                            </span>
                          ) : null}
                        </div>
                        <div className="col-span-2 text-center font-mono font-semibold text-slate-800 text-[11px]">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="col-span-2 text-center font-mono font-semibold text-slate-800 text-[11px]">
                          {formatIndianCurrency(item.rate)}
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-slate-900 text-[11px]">
                          {formatIndianCurrency(item.grossTotal)}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="py-2.5 px-3 text-xs grid grid-cols-12 items-center hover:bg-slate-50/50 leading-normal gap-1"
                    >
                      <div className="col-span-2 font-mono text-[11px]">
                        <span className="font-bold text-slate-900 block break-all">
                          {item.date || data.date}
                        </span>
                        {item.parchiNumber || data.parchiNumber ? (
                          <span className="text-slate-500 text-[10px] block">{item.parchiNumber || data.parchiNumber}</span>
                        ) : null}
                      </div>
                      <div className="col-span-1 font-bold text-slate-800 text-[11px] truncate">
                        {itemCommodity}
                      </div>
                      <div className="col-span-2 font-bold text-slate-900 break-words pr-1 text-xs">
                        {item.flowerVariety}
                      </div>
                      <div className="col-span-1 text-center font-mono font-semibold text-slate-800 text-[11px]">
                        {itemBoxes}
                      </div>
                      <div className="col-span-1 text-center font-mono font-semibold text-slate-800 text-[11px]">
                        {item.quantity} {item.unit || 'Kgs'}
                      </div>
                      <div className="col-span-1 text-right font-mono font-semibold text-slate-800 text-[11px]">
                        {formatIndianCurrency(item.rate)}
                      </div>
                      <div className="col-span-1 text-right font-mono font-bold text-slate-900 text-[11px]">
                        {formatIndianCurrency(item.grossTotal)}
                      </div>
                      <div className="col-span-1 text-right font-mono text-slate-800 text-[11px]">
                        {itemHamali > 0 ? formatIndianCurrency(itemHamali) : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono text-slate-800 text-[11px]">
                        {itemTrans > 0 ? formatIndianCurrency(itemTrans) : '₹0.00'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. TOTAL SALES AMOUNT (GROSS) CARD */}
        <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex justify-between items-center text-slate-900">
          <div>
            <span className="block text-xs uppercase font-black tracking-wider text-slate-900">
              TOTAL SALES AMOUNT (GROSS)
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              Gross sales turnover before mandi charges and commission
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {formatIndianCurrency(data.grossTotal)}
          </span>
        </div>

        {/* 5. DEDUCTIONS CARD (WHOLESALER) / ACCOUNT SUMMARY CARD (RETAILER) */}
        {!isRetail ? (
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                NET AMOUNT CALCULATION
              </span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                FORM C SUMMARY
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-slate-800">Gross Total Sales</span>
                <span className="font-black text-slate-900 text-sm font-mono">
                  = {formatIndianCurrency(data.grossTotal)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 text-slate-800">
                <span className="font-semibold text-slate-700">Less: Hamali Charges</span>
                <span className="font-bold font-mono text-rose-700">
                  = -{formatIndianCurrency(data.ammaliCharges)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 text-slate-800">
                <span className="font-semibold text-slate-700">Less: Transport Charges</span>
                <span className="font-bold font-mono text-rose-700">
                  = -{formatIndianCurrency(data.transportCharges)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 text-slate-800">
                <span className="font-semibold text-slate-700">
                  Less: Commission ({data.commissionPercent || 0}%)
                </span>
                <span className="font-bold font-mono text-rose-700">
                  = -{formatIndianCurrency(data.commissionAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 text-slate-800">
                <span className="font-semibold text-slate-700">
                  Less: Misc Expenses ({data.miscCommissionPercent || 0}%)
                </span>
                <span className="font-bold font-mono text-rose-700">
                  = -{formatIndianCurrency(data.miscCommissionAmount || 0)}
                </span>
              </div>

              {Array.isArray(data.otherDeductions) &&
                data.otherDeductions.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 text-slate-800">
                    <span className="font-semibold text-slate-700">Less: {d.name}</span>
                    <span className="font-bold font-mono text-rose-700">= -{formatIndianCurrency(d.amount)}</span>
                  </div>
                ))}

              <div className="border-t-2 border-slate-300 pt-2.5 mt-2 flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="font-black text-emerald-900 uppercase text-xs sm:text-sm">
                  NET FARMER AMOUNT
                </span>
                <span className="font-black text-emerald-900 text-lg sm:text-xl font-mono">
                  = {formatIndianCurrency(effectiveNetPayable)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* RETAILER ACCOUNT SUMMARY CARD */
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-[#f8fafc]/80 space-y-2.5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                ACCOUNT SUMMARY
              </span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                RETAIL SALE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-[11px]">Today's Sale Total</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{formatIndianCurrency(data.grossTotal)}</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-[11px]">Previous Due</span>
                <span className={`font-mono font-bold text-xs ${(data.previousDue || 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatIndianCurrency(data.previousDue || 0)}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-[11px]">Amount Paid Now</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">{formatIndianCurrency(paidAmount)}</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-[11px]">Payment Mode</span>
                <span className="font-bold text-slate-900 text-xs uppercase">{data.paymentMode || 'CASH'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. NET PAYABLE / GRAND TOTAL PAYABLE BANNER */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#047857] text-white flex items-center justify-between gap-3 shadow-xs border border-emerald-800">
          <div>
            <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              {isRetail ? 'GRAND TOTAL PAYABLE:' : 'NET PAYABLE TO FARMER:'}
            </span>
            <span className="text-[10px] text-emerald-100 font-medium block mt-0.5">
              {isRetail
                ? `Today's Sale (${formatIndianCurrency(data.grossTotal)}) + Previous Due (${formatIndianCurrency(data.previousDue || 0)})`
                : `Gross Total (${formatIndianCurrency(data.grossTotal)}) − Total Deductions (${formatIndianCurrency(totalDeductionsSum)})`}
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-white block">
              {formatIndianCurrency(effectiveNetPayable)}
            </span>
          </div>
        </div>

        {/* 7. BOTTOM SETTLEMENT & AUTHORIZATION CARDS (SIDE BY SIDE) */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-[#f8fafc]/50 grid grid-cols-2 gap-3 text-xs">
          {/* Left Settlement Card */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                PAYMENT SETTLEMENT STATUS
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                  statusLabel === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : statusLabel === 'PART PAID'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {statusLabel}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-600 font-medium">Payments / Advances:</span>
                <span className="text-slate-900 font-mono font-bold">{formatIndianCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-600 font-medium">Payment Mode:</span>
                <span className="text-slate-900 font-bold uppercase">{data.paymentMode || 'CASH'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                <span className="text-slate-900 font-black">Final Balance Due:</span>
                <span className={`font-mono font-black text-sm ${computedBalance > 0 ? 'text-rose-600' : 'text-emerald-800'}`}>
                  {formatIndianCurrency(computedBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Authorization & Seal Card */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-right">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
              AUTHORIZATION &amp; SEAL
            </span>
            <div className="pt-3 border-t border-slate-200 mt-2">
              <span className="font-bold text-slate-900 text-[11px] block truncate">
                For {shopName}
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                (Authorized Signatory / Mandi Licensee)
              </span>
            </div>
          </div>
        </div>

        {/* 8. FOOTER */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200 space-y-0.5">
          <p className="font-bold tracking-wider text-slate-600 uppercase">
            {isRetail ? 'OFFICIAL RETAIL SALE PARCHI • GOVT REGULATED' : 'OFFICIAL MANDI SALE PARCHI • FORM C • GOVT REGULATED'}
          </p>
          <p className="text-[9px] text-slate-400">
            Generated via Bharat MANDI Software • Valid Settlement Bill
          </p>
        </div>
      </div>
    );
  }
);

FormCInvoiceCanvas.displayName = 'FormCInvoiceCanvas';

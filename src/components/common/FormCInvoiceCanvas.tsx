import React, { forwardRef } from 'react';
import { useMandi } from '../../context/MandiContext';

export interface FormCItem {
  id?: string;
  parchiNumber?: string;
  date?: string;
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
}

export interface FormCInvoiceData {
  parchiNumber: string;
  date: string;
  time: string;
  farmerName: string;
  farmerVillage: string;
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
  openingBalance?: number;
  paymentMode?: string;
  paymentStatus: string;
  notes?: string;
}

interface FormCInvoiceCanvasProps {
  data: FormCInvoiceData;
  format?: 'a4' | 'thermal-80mm';
  merchantOverride?: {
    shopName?: string;
    shopNumber?: string;
    apmcMarketName?: string;
    ownerName?: string;
    phoneNumber?: string;
  };
}

export const FormCInvoiceCanvas = forwardRef<HTMLDivElement, FormCInvoiceCanvasProps>(
  ({ data, format = 'a4', merchantOverride }, ref) => {
    const { merchantProfile } = useMandi();

    const isThermal = format === 'thermal-80mm';

    const shopName = merchantOverride?.shopName || merchantProfile?.shopName || 'Wholesale Commission Agent';
    const rawShopNumber = merchantOverride?.shopNumber || merchantProfile?.shopNumber || 'Shop 1';
    const cleanShopNumber = rawShopNumber.replace(/^(shop\s*no\.?|shop\s*#?|stall\s*no\.?|shop)\s*/i, '').trim();
    const shopNumberDisplay = `Shop No. ${cleanShopNumber || rawShopNumber}`;
    const apmcMarketName = merchantOverride?.apmcMarketName || merchantProfile?.apmcMarketName || 'Gudimalkapur Market Yard';
    const ownerName = merchantOverride?.ownerName || merchantProfile?.ownerName || 'Commission Merchant';
    const phoneNumber = merchantOverride?.phoneNumber || merchantProfile?.phoneNumber || '+91 9999999999';

    const customDeductionsSum = Array.isArray(data.otherDeductions)
      ? data.otherDeductions.reduce((acc, d) => acc + (Number(d.amount) || 0), 0)
      : 0;
    const totalDeductionsSum =
      (Number(data.ammaliCharges) || 0) +
      (Number(data.transportCharges) || 0) +
      (Number(data.commissionAmount) || 0) +
      (Number(data.miscCommissionAmount) || 0) +
      customDeductionsSum;

    return (
      <div
        ref={ref}
        id="form-c-official-invoice-canvas"
        className={`bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-sm mx-auto ${
          isThermal ? 'p-3 max-w-md space-y-2.5 text-xs' : 'p-5 sm:p-6 max-w-3xl space-y-4 w-full'
        }`}
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* 1. Top Header Pill & Letterhead */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <img
              src="/bharat_mandi_logo.png"
              alt="भारत मंडी Logo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 bg-transparent mt-0.5"
            />
            <div className="text-left space-y-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold tracking-widest text-slate-700 uppercase border border-slate-200">
                MANDI SALE PARCHI • FORM C
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight leading-snug break-words my-0.5">
                {shopName}
              </h1>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                {shopNumberDisplay} • {apmcMarketName}
              </p>
              <p className="text-[10px] text-slate-600 leading-snug">
                Proprietor: <span className="font-bold text-slate-900">{ownerName}</span> | Contact: <span className="font-bold text-slate-900">{phoneNumber}</span>
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 pt-1">
            <span className="text-[9px] font-mono uppercase px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold inline-block shadow-2xs">
              OFFICIAL MANDI RECEIPT
            </span>
          </div>
        </div>

        {/* 2. 4-Column Metadata Box with Generous Proportions & Zero Text Overlap */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-3 text-xs">
          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-1">
              PARCHI / INV NO.
            </span>
            <span className="font-mono font-black text-slate-900 text-xs sm:text-sm block break-all">
              {data.parchiNumber || 'FC-2026-PREVIEW'}
            </span>
          </div>

          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-1">
              DATE &amp; TIME
            </span>
            <span className="font-bold text-slate-800 text-xs block break-words leading-tight">
              {data.date} • {data.time || 'Morning Auction'}
            </span>
          </div>

          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-1">
              FARMER
            </span>
            <span className="font-black text-slate-900 text-xs sm:text-sm block break-words leading-tight">
              {data.farmerName || 'Ramesh Patel'}
            </span>
          </div>

          <div className="col-span-3">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-1">
              VILLAGE &amp; CONTACT
            </span>
            <span className="font-bold text-slate-800 text-xs block break-words leading-tight">
              {data.farmerVillage || 'Yard'}
            </span>
            {data.farmerPhone && (
              <span className="text-[10px] font-mono text-slate-600 block mt-0.5">
                +91 {data.farmerPhone}
              </span>
            )}
          </div>
        </div>

        {/* 3. Items Table with Dynamic Row Height and Clean Padding */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[620px] sm:min-w-0">
            <div>
              <div className="bg-slate-100 border-b border-slate-200 py-2 px-3 text-[10px] font-black text-slate-700 uppercase tracking-wider grid grid-cols-12 items-center">
                <div className="col-span-2">PARCHI &amp; DATE</div>
                <div className="col-span-2">ITEM / CROP</div>
                <div className="col-span-1 text-center">QTY</div>
                <div className="col-span-1 text-center">RATE</div>
                <div className="col-span-1 text-right">GROSS</div>
                <div className="col-span-1 text-right">HAMALI</div>
                <div className="col-span-1 text-right">TRANS</div>
                <div className="col-span-1 text-right">COMM</div>
                <div className="col-span-1 text-right">MISC</div>
                <div className="col-span-1 text-right">NET</div>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {data.items.map((item, idx) => {
                  const itemHamali = item.hamali ?? (data.items.length === 1 ? data.ammaliCharges : 0);
                  const itemTrans = item.transport ?? (data.items.length === 1 ? data.transportCharges : 0);
                  const itemComm = item.commission ?? (data.items.length === 1 ? data.commissionAmount : 0);
                  const itemMisc = item.misc ?? (data.items.length === 1 ? (data.miscCommissionAmount || 0) : 0);
                  const itemNet = item.farmerNetPayable ?? Math.max(0, item.grossTotal - (itemHamali + itemTrans + itemComm + itemMisc));

                  return (
                    <div
                      key={idx}
                      className="py-2.5 px-3 text-xs grid grid-cols-12 items-center hover:bg-slate-50/50 leading-normal"
                    >
                      <div className="col-span-2 font-mono text-[11px]">
                        <span className="font-bold text-[#1a3a52] block break-all">
                          {item.parchiNumber || data.parchiNumber || `#${idx + 1}`}
                        </span>
                        <span className="text-slate-500 text-[10px] block">{item.date || data.date}</span>
                      </div>
                      <div className="col-span-2 font-bold text-slate-900 break-words pr-1">
                        <div className="text-xs font-bold leading-tight">{item.flowerVariety}</div>
                        {item.boxesCount && item.boxesCount > 0 && (
                          <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                            {item.boxesCount} {item.packagingType || 'Boxes'}
                          </span>
                        )}
                      </div>
                      <div className="col-span-1 text-center font-mono font-semibold text-slate-800 text-[11px]">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="col-span-1 text-center font-mono font-semibold text-slate-800 text-[11px]">
                        ₹{item.rate.toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right font-mono font-bold text-slate-900 text-[11px]">
                        ₹{item.grossTotal.toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[11px]">
                        {itemHamali > 0 ? `₹${itemHamali.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[11px]">
                        {itemTrans > 0 ? `₹${itemTrans.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[11px]">
                        {itemComm > 0 ? `₹${itemComm.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[11px]">
                        {itemMisc > 0 ? `₹${itemMisc.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono font-black text-emerald-800 text-[11px]">
                        ₹{itemNet.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. TOTAL SALES AMOUNT (Card) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-slate-900">
          <div>
            <span className="block text-xs uppercase font-black tracking-wider text-slate-900">
              TOTAL SALES AMOUNT (GROSS)
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              Gross sales turnover before APMC mandi charges and commission
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            ₹{data.grossTotal.toFixed(2)}
          </span>
        </div>

        {/* 5. MANDI CHARGES & COMMISSION DEDUCTIONS (Explicit Grid Layout to Prevent Overlapping) */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              MANDI CHARGES &amp; COMMISSION DEDUCTIONS
            </span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              FORM C SUMMARY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Freight / Vehicle Charges */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center min-w-0">
              <div className="min-w-0 pr-1">
                <span className="font-bold text-slate-800 text-[11px] block truncate">Vehicle / Freight</span>
                <span className="text-[9px] text-slate-500 block">Transport</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs shrink-0">
                ₹{data.transportCharges.toFixed(2)}
              </span>
            </div>

            {/* Hamali / Labor Charges */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center min-w-0">
              <div className="min-w-0 pr-1">
                <span className="font-bold text-slate-800 text-[11px] block truncate">Hamali / Labor</span>
                <span className="text-[9px] text-slate-500 block">Loading &amp; Unloading</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs shrink-0">
                ₹{data.ammaliCharges.toFixed(2)}
              </span>
            </div>

            {/* Mandi Commission */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center min-w-0">
              <div className="min-w-0 pr-1">
                <span className="font-bold text-slate-800 text-[11px] block truncate">Mandi Commission</span>
                <span className="text-[9px] text-slate-500 font-mono block truncate">
                  {data.commissionPercent > 0 ? `${data.commissionPercent}% Gross` : 'Standard'}
                </span>
              </div>
              <span className="font-mono font-bold text-red-700 text-xs shrink-0">
                -₹{data.commissionAmount.toFixed(2)}
              </span>
            </div>

            {/* Miscellaneous Charges */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center min-w-0">
              <div className="min-w-0 pr-1">
                <span className="font-bold text-slate-800 text-[11px] block truncate">Misc Charges</span>
                <span className="text-[9px] text-slate-500 font-mono block truncate">
                  {data.miscCommissionPercent ? `${data.miscCommissionPercent}%` : 'Market Fee'}
                </span>
              </div>
              <span className="font-mono font-bold text-red-700 text-xs shrink-0">
                -₹{(data.miscCommissionAmount || 0).toFixed(2)}
              </span>
            </div>

            {/* Custom Deductions if any */}
            {Array.isArray(data.otherDeductions) &&
              data.otherDeductions.map((d, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center min-w-0 col-span-2 sm:col-span-1">
                  <span className="font-bold text-slate-800 text-[11px] truncate pr-1">{d.name}</span>
                  <span className="font-mono font-bold text-red-700 text-xs shrink-0">-₹{Number(d.amount || 0).toFixed(2)}</span>
                </div>
              ))}
          </div>

          {/* Total Deductions Highlight Bar */}
          <div className="flex justify-between items-center p-2.5 sm:p-3 rounded-xl bg-red-50 border border-red-200 font-bold text-xs text-red-950">
            <span className="text-slate-900 font-bold text-[11px] sm:text-xs">TOTAL DEDUCTIONS (Freight + Hamali + Comm + Misc):</span>
            <span className="font-mono font-black text-red-700 text-sm sm:text-base shrink-0 pl-1">
              -₹{totalDeductionsSum.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 6. FARMER NET PAYABLE Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0d7048] text-white flex items-center justify-between gap-3 shadow-xs border border-emerald-800">
          <div>
            <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              NET PAYABLE TO FARMER:
            </span>
            <span className="text-[10px] text-emerald-100 font-medium block mt-0.5">
              Gross Total (₹{data.grossTotal.toFixed(2)}) − Total Deductions (₹{totalDeductionsSum.toFixed(2)})
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black font-mono text-white block">
              ₹{data.farmerNetPayable.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 7. Bottom Settlement & Authorization Box */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/50 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                SETTLEMENT STATUS
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                (data.paymentStatus || 'SETTLED').toLowerCase().includes('paid') || (data.paymentStatus || 'SETTLED').toLowerCase().includes('settled')
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {data.paymentStatus || 'SETTLED'}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-600 font-medium">Payments / Advances:</span>
                <span className="text-slate-900 font-mono font-bold">₹{data.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-600 font-medium">Payment Mode:</span>
                <span className="text-slate-900 font-bold uppercase">{data.paymentMode || 'Cash'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                <span className="text-slate-900 font-black">Final Balance Due:</span>
                <span className="text-emerald-800 font-mono font-black text-sm">
                  ₹{(data.balanceDue ?? Math.max(0, data.farmerNetPayable - data.amountPaid)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
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

        {/* 8. Footer */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200 space-y-0.5">
          <p className="font-bold tracking-wider text-slate-600 uppercase">
            OFFICIAL MANDI SALE PARCHI • FORM C •
          </p>
          <p className="text-[9px] text-slate-400">
            Generated via भारत MANDI Software • Valid Settlement Bill
          </p>
        </div>
      </div>
    );
  }
);

FormCInvoiceCanvas.displayName = 'FormCInvoiceCanvas';


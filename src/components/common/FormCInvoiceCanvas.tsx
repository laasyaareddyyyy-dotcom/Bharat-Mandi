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

    const shopName = merchantOverride?.shopName || merchantProfile?.shopName || 'APMC Commission Agent';
    const shopNumber = merchantOverride?.shopNumber || merchantProfile?.shopNumber || 'Shop 1';
    const apmcMarketName = merchantOverride?.apmcMarketName || merchantProfile?.apmcMarketName || 'Agri APMC Market Yard';
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
          isThermal ? 'p-4 max-w-md space-y-3 text-xs' : 'p-6 sm:p-8 max-w-3xl space-y-5 min-w-[680px] sm:min-w-0'
        }`}
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* 1. Top Header Pill & Letterhead */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/bharat_mandi_logo.png"
              alt="भारत मंडी Logo"
              referrerPolicy="no-referrer"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 bg-transparent"
            />
            <div className="text-left">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold tracking-widest text-slate-700 uppercase border border-slate-200 mb-1">
                APMC MANDI SALE PARCHI • FORM C
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                {shopName}
              </h1>
              <p className="text-xs font-semibold text-slate-700">
                Shop No. {shopNumber} • {apmcMarketName}
              </p>
              <p className="text-[10px] text-slate-500">
                Proprietor: <span className="font-semibold text-slate-800">{ownerName}</span> | Contact: <span className="font-semibold text-slate-800">{phoneNumber}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono uppercase px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
              OFFICIAL MANDI RECEIPT
            </span>
          </div>
        </div>

        {/* 2. 4-Column Metadata Box */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">
              PARCHI / INV NO.
            </span>
            <span className="font-mono font-black text-slate-900 text-xs sm:text-sm block">
              {data.parchiNumber || 'FC-2026-PREVIEW'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">
              DATE &amp; TIME
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
              {data.date} • {data.time || 'Morning Auction'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">
              FARMER
            </span>
            <span className="font-black text-slate-900 text-xs sm:text-sm block">
              {data.farmerName || 'Ramesh Patel'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">
              VILLAGE &amp; CONTACT
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
              {data.farmerVillage || 'Kadi'}
            </span>
            {data.farmerPhone && (
              <span className="text-[11px] font-mono text-slate-600 block">
                +91 {data.farmerPhone}
              </span>
            )}
          </div>
        </div>

        {/* 3. Items Table with Horizontal Scroll Support for Mobile */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[620px] sm:min-w-0">
            <div>
              <div className="bg-slate-100 border-b border-slate-200 py-2 sm:py-2.5 px-3 text-[9px] sm:text-[10px] font-black text-slate-700 uppercase tracking-wider grid grid-cols-12 items-center">
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
                      className="py-2.5 px-3 text-[11px] grid grid-cols-12 items-center hover:bg-slate-50/50"
                    >
                      <div className="col-span-2 font-mono text-[10px]">
                        <span className="font-bold text-[#1a3a52] block truncate">
                          {item.parchiNumber || data.parchiNumber || `#${idx + 1}`}
                        </span>
                        <span className="text-slate-500">{item.date || data.date}</span>
                      </div>
                      <div className="col-span-2 font-bold text-slate-900 truncate pr-1">
                        <div>{item.flowerVariety}</div>
                        {item.boxesCount && item.boxesCount > 0 && (
                          <span className="text-[9px] font-normal text-slate-500 block">
                            {item.boxesCount} {item.packagingType || 'Boxes'}
                          </span>
                        )}
                      </div>
                      <div className="col-span-1 text-center font-mono text-slate-800 text-[10px]">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="col-span-1 text-center font-mono text-slate-800 text-[10px]">
                        ₹{item.rate.toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right font-mono font-bold text-slate-900 text-[10px]">
                        ₹{item.grossTotal.toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[10px]">
                        {itemHamali > 0 ? `₹${itemHamali.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[10px]">
                        {itemTrans > 0 ? `₹${itemTrans.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[10px]">
                        {itemComm > 0 ? `₹${itemComm.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono text-red-700 text-[10px]">
                        {itemMisc > 0 ? `₹${itemMisc.toFixed(2)}` : '₹0.00'}
                      </div>
                      <div className="col-span-1 text-right font-mono font-black text-emerald-800 text-[10px]">
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
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-slate-900">
          <div>
            <span className="block text-xs uppercase font-black tracking-wider text-slate-900">
              TOTAL SALES AMOUNT (GROSS)
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Gross sales turnover before APMC mandi charges and commission
            </span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900">
            ₹{data.grossTotal.toFixed(2)}
          </span>
        </div>

        {/* 5. MANDI CHARGES & COMMISSION DEDUCTIONS */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 text-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              MANDI CHARGES &amp; COMMISSION DEDUCTIONS
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              FORM C SUMMARY
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Freight / Vehicle Charges */}
            <div className="flex justify-between items-center py-1 text-slate-700 border-b border-slate-100">
              <span className="font-medium text-slate-700">Total Vehicle / Freight Charges:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{data.transportCharges.toFixed(2)}
              </span>
            </div>

            {/* Hamali / Loading Charges */}
            <div className="flex justify-between items-center py-1 text-slate-700 border-b border-slate-100">
              <span className="font-medium text-slate-700">Total Hamali / Loading &amp; Unloading:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{data.ammaliCharges.toFixed(2)}
              </span>
            </div>

            {/* Mandi Commission */}
            <div className="flex justify-between items-center py-1 text-slate-700 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">Mandi Commission:</span>
                {data.commissionPercent > 0 && (
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {data.commissionPercent}%
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-red-700">
                -₹{data.commissionAmount.toFixed(2)}
              </span>
            </div>

            {/* Miscellaneous Charges */}
            {(data.miscCommissionAmount || 0) > 0 && (
              <div className="flex justify-between items-center py-1 text-slate-700 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">Miscellaneous &amp; Market Charges:</span>
                  {data.miscCommissionPercent ? (
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {data.miscCommissionPercent}%
                    </span>
                  ) : null}
                </div>
                <span className="font-mono font-bold text-red-700">
                  -₹{(data.miscCommissionAmount || 0).toFixed(2)}
                </span>
              </div>
            )}

            {/* Custom Deductions if any */}
            {Array.isArray(data.otherDeductions) &&
              data.otherDeductions.map((d, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 text-slate-700 border-b border-slate-100">
                  <span className="font-medium text-slate-700">{d.name}:</span>
                  <span className="font-mono font-bold text-red-700">-₹{Number(d.amount || 0).toFixed(2)}</span>
                </div>
              ))}

            {/* Total Deductions Highlight Bar */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-red-50/80 border border-red-200/90 font-bold text-xs mt-2.5 text-red-900">
              <span className="text-slate-800 font-bold">Total Deductions (Freight + Hamali + Commission + Misc):</span>
              <span className="font-mono font-black text-red-700 text-sm">
                -₹{totalDeductionsSum.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 6. FARMER NET PAYABLE Banner (Distinct, Spacious Deep Green Card) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d7048] text-white flex items-center justify-between gap-3 shadow-xs border border-emerald-800">
          <div>
            <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              NET PAYABLE TO FARMER:
            </span>
            <span className="text-[10px] text-emerald-100 font-medium block mt-0.5">
              Gross Total (₹{data.grossTotal.toFixed(2)}) − Total Deductions (₹{totalDeductionsSum.toFixed(2)})
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white block">
              ₹{data.farmerNetPayable.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 7. Bottom Settlement & Authorization Box */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
              PAYMENT SETTLEMENT STATUS:
            </span>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Payments / Advances Made:</span>
                <strong className="text-slate-900 font-mono">₹{data.amountPaid.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span className="text-slate-900">Final Balance Due:</span>
                <strong className="text-emerald-800 font-mono text-sm">
                  ₹{(data.balanceDue ?? Math.max(0, data.farmerNetPayable - data.amountPaid)).toFixed(2)}
                </strong>
              </div>
              <div className="flex gap-2 text-[11px] text-slate-500 pt-0.5">
                <span>Status:</span>
                <strong className="text-slate-900 uppercase">{data.paymentStatus || 'SETTLED'}</strong>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              AUTHORIZATION &amp; SEAL
            </span>
            <div className="border-b border-dotted border-slate-400 w-48 ml-auto my-3" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                For {shopName}
              </span>
              <span className="text-[10px] text-slate-500">
                (Authorized Signatory / Mandi Licensee)
              </span>
            </div>
          </div>
        </div>

        {/* 8. Footer */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200 space-y-0.5">
          <p className="font-bold tracking-wider text-slate-600 uppercase">
            OFFICIAL APMC MANDI SALE PARCHI • FORM C • GOVT REGULATED
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


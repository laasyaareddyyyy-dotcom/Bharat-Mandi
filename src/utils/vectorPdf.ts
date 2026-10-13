import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleLot, FifteenDaySettlement, MerchantProfile, Shipment } from '../types';

/**
 * Downloads a generated jsPDF document
 */
export function downloadVectorPdf(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate Vector PDF for OFFICIAL MANDI SALE PARCHI • FORM C
 */
export function generateVectorParchiPdf(
  lot: SaleLot,
  merchant: MerchantProfile,
  options: { autoDownload?: boolean } = { autoDownload: true }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Box
  doc.setFillColor(240, 253, 244); // light green background
  doc.rect(10, 10, pageWidth - 20, 32, 'F');
  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, 32, 'D');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(22, 101, 52);
  doc.text('OFFICIAL MANDI SALE PARCHI • FORM C • GOVT REGULATED', pageWidth / 2, 18, { align: 'center' });

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('Generated via भारत MANDI Software • Valid Settlement Bill', pageWidth / 2, 24, { align: 'center' });

  // Shop & Market
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(`${merchant.shopName || 'APMC MANDI SHOP'} • Shop #${merchant.shopNumber || '01'}`, pageWidth / 2, 30, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`${merchant.apmcMarketName || 'APMC Yard'} • APMC Lic: ${merchant.licenseNumber || 'APMC-REG-2026'}`, pageWidth / 2, 36, { align: 'center' });

  // Meta Info Table
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);

  const startY = 48;
  const leftX = 14;
  const rightX = pageWidth / 2 + 5;

  doc.text(`Parchi No: ${lot.parchiNumber}`, leftX, startY);
  doc.text(`Date & Time: ${lot.date} ${lot.time || ''}`, rightX, startY);

  doc.text(`Farmer Name: ${lot.farmerName}`, leftX, startY + 6);
  doc.text(`Village: ${lot.farmerVillage || 'N/A'}`, rightX, startY + 6);

  doc.text(`Mobile: +91 ${lot.farmerPhone || 'N/A'}`, leftX, startY + 12);
  doc.text(`Payment Status: ${lot.paymentStatus || 'Unpaid'}`, rightX, startY + 12);

  // Table of Crop / Lot details
  autoTable(doc, {
    startY: startY + 18,
    head: [['Crop / Variety', 'Quantity & Unit', 'Quality Grade', 'Rate (₹)', 'Gross Amount (₹)']],
    body: [
      [
        lot.flowerVariety || 'Crop Lot',
        `${lot.quantity} ${lot.unit}${lot.boxesCount ? ` (${lot.boxesCount} PKG)` : ''}`,
        lot.flowerQuality || 'Standard',
        `₹${lot.rate.toFixed(2)}`,
        `₹${lot.grossTotal.toLocaleString('en-IN')}`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY + 8;

  // Deductions Table
  const deductionsData = [
    ['Gross Sale Total', `₹${lot.grossTotal.toLocaleString('en-IN')}`],
    [`Commission (${lot.commissionPercent}%)`, `- ₹${lot.commissionAmount.toLocaleString('en-IN')}`],
    ['Transport Charges', `- ₹${(lot.transportCharges || 0).toLocaleString('en-IN')}`],
    ['Hamali / Coolie Charges', `- ₹${(lot.ammaliCharges || 0).toLocaleString('en-IN')}`],
    ['Net Payable to Farmer', `₹${lot.farmerNetPayable.toLocaleString('en-IN')}`],
    ['Amount Paid to Date', `₹${lot.amountPaid.toLocaleString('en-IN')}`],
    ['Balance Dues', `₹${lot.balanceDue.toLocaleString('en-IN')}`],
  ];

  autoTable(doc, {
    startY: finalTableY,
    head: [['Financial Breakdown', 'Amount (₹)']],
    body: deductionsData,
    theme: 'striped',
    headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  const footerY = (doc as any).lastAutoTable.finalY + 15;

  // Signatures
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Farmer Signature / Thumb', 20, footerY);
  doc.text('Merchant Stamp & Auth Signature', pageWidth - 70, footerY);

  doc.setLineWidth(0.3);
  doc.line(20, footerY + 8, 70, footerY + 8);
  doc.line(pageWidth - 70, footerY + 8, pageWidth - 20, footerY + 8);

  // Disclaimer
  doc.setFontSize(8);
  doc.text('This is an official computer-generated Mandi Parchi under APMC Bye-Laws.', pageWidth / 2, footerY + 18, { align: 'center' });

  const filename = `FormC-Parchi-${lot.parchiNumber}.pdf`;
  if (options.autoDownload) {
    downloadVectorPdf(doc, filename);
  }

  return doc;
}

/**
 * Generate Vector PDF for 15-Day Settlement Statement
 */
export function generateVectorSettlementPdf(
  settlement: FifteenDaySettlement,
  merchant: MerchantProfile,
  options: { autoDownload?: boolean } = { autoDownload: true }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Box
  doc.setFillColor(239, 246, 255); // light blue background
  doc.rect(10, 10, pageWidth - 20, 32, 'F');
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, 32, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(29, 78, 216);
  doc.text('OFFICIAL 15-DAY FARMER SETTLEMENT STATEMENT', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Period: ${settlement.periodLabel || '15-Day Cycle'}`, pageWidth / 2, 24, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`${merchant.shopName || 'APMC Merchant Shop'} • Lic #${merchant.licenseNumber || 'APMC-01'}`, pageWidth / 2, 30, { align: 'center' });

  // Meta Info
  const startY = 48;
  doc.setFontSize(10);
  doc.text(`Settlement No: ${settlement.settlementNumber}`, 14, startY);
  doc.text(`Farmer Name: ${settlement.farmerName}`, pageWidth / 2 + 5, startY);

  doc.text(`Village: ${settlement.farmerVillage || 'N/A'}`, 14, startY + 6);
  doc.text(`Phone: +91 ${settlement.farmerPhone || 'N/A'}`, pageWidth / 2 + 5, startY + 6);

  doc.text(`Total Shipments: ${settlement.totalShipmentsCount}`, 14, startY + 12);
  doc.text(`Status: ${(settlement.status || 'PENDING').toUpperCase()}`, pageWidth / 2 + 5, startY + 12);

  // Financial Breakdown
  const tableData = [
    ['Total Gross Sales Volume', `₹${settlement.totalGross.toLocaleString('en-IN')}`],
    ['Less: Total Transport Charges', `- ₹${settlement.totalTransport.toLocaleString('en-IN')}`],
    ['Less: Total Hamali / Loading Charges', `- ₹${settlement.totalHamali.toLocaleString('en-IN')}`],
    ['Subtotal After Daily Charges', `₹${settlement.subtotalAfterCharges.toLocaleString('en-IN')}`],
    [`Less: Mandi Commission (${settlement.commissionPercent}%)`, `- ₹${settlement.commissionAmount.toLocaleString('en-IN')}`],
    [`Less: Misc / Cess (${settlement.miscPercent || 0}%)`, `- ₹${(settlement.miscAmount || 0).toLocaleString('en-IN')}`],
    ['Final Settlement Net Payable', `₹${settlement.finalPayment.toLocaleString('en-IN')}`],
  ];

  autoTable(doc, {
    startY: startY + 18,
    head: [['Settlement Ledger Item', 'Amount (₹)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  const footerY = (doc as any).lastAutoTable.finalY + 20;

  // Signatures
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Farmer Receipt Acknowledgment', 20, footerY);
  doc.text('Authorized Mandi Adathiya Stamp', pageWidth - 70, footerY);

  doc.setLineWidth(0.3);
  doc.line(20, footerY + 8, 70, footerY + 8);
  doc.line(pageWidth - 70, footerY + 8, pageWidth - 20, footerY + 8);

  const filename = `Settlement-${settlement.settlementNumber}.pdf`;
  if (options.autoDownload) {
    downloadVectorPdf(doc, filename);
  }

  return doc;
}

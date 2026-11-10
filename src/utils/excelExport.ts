import * as XLSX from 'xlsx';
import { Product, StockMovement, DocumentInfo } from '../types';

/**
 Export Products list to Excel file
*/
export function exportProductsToExcel(products: Product[], fileName = 'รายการสินค้าในสต็อค.xlsx') {
  const data = products.map((p, idx) => ({
    'ลำดับ': idx + 1,
    'รหัส/บาร์โค้ด': p.code,
    'ชื่อสินค้า': p.name,
    'หมวดหมู่': p.category,
    'จำนวนคงเหลือ': p.quantity,
    'หน่วยนับ': p.unit,
    'จุดเตือนขั้นต่ำ': p.minQuantity,
    'สถานะ': p.quantity <= p.minQuantity ? 'สินค้าใกล้หมด (Low Stock)' : 'ปกติ',
    'ราคาทุน (บาท)': p.costPrice,
    'ราคาขาย (บาท)': p.sellingPrice,
    'มูลค่ารวมคงเหลือ (บาท)': p.quantity * p.costPrice,
    'ตำแหน่งจัดเก็บ': p.location,
    'อัปเดตล่าสุด': new Date(p.updatedAt).toLocaleString('th-TH')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการสินค้า');
  XLSX.writeFile(workbook, fileName);
}

/**
 Export Stock Movements log to Excel
*/
export function exportMovementsToExcel(movements: StockMovement[], fileName = 'รายงานการเคลื่อนไหวสินค้า.xlsx') {
  const data = movements.map((m, idx) => ({
    'ลำดับ': idx + 1,
    'วันที่-เวลา': new Date(m.createdAt).toLocaleString('th-TH'),
    'รหัสสินค้า': m.productCode,
    'ชื่อสินค้า': m.productName,
    'ประเภท': m.type === 'IN' ? 'รับเข้า (+)' : m.type === 'OUT' ? 'เบิกออก (-)' : m.type === 'SALE' ? 'ขาย/จัดส่ง (-)' : 'ปรับปรุงสต็อค',
    'จำนวน': m.quantity,
    'คงเหลือหลังรายการ': m.balanceAfter,
    'เลขที่เอกสารอ้างอิง': m.refDocumentNo || '-',
    'ผู้ทำรายการ': m.createdBy,
    'หมายเหตุ': m.note || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'เคลื่อนไหวสต็อค');
  XLSX.writeFile(workbook, fileName);
}

/**
 Export Documents (Invoices, Receipts, Delivery Notes) to Excel
*/
export function exportDocumentsToExcel(documents: DocumentInfo[], fileName = 'รายงานเอกสารขายและการจัดส่ง.xlsx') {
  const data = documents.map((doc, idx) => ({
    'ลำดับ': idx + 1,
    'เลขที่เอกสาร': doc.documentNo,
    'ประเภทเอกสาร': doc.type === 'DELIVERY_NOTE' ? 'ใบส่งของ' : doc.type === 'BILLING_NOTE' ? 'ใบวางบิล' : 'ใบเสร็จรับเงิน',
    'วันที่ออกเอกสาร': new Date(doc.issuedAt).toLocaleDateString('th-TH'),
    'ชื่อลูกค้า': doc.customerName,
    'จำนวนรายการ': doc.items.reduce((acc, i) => acc + i.quantity, 0),
    'ยอดรวมก่อนภาษี (บาท)': doc.subtotal,
    'ภาษี VAT 7% (บาท)': doc.tax,
    'ยอดรวมสุทธิ (บาท)': doc.totalAmount,
    'สถานะจัดส่ง': doc.deliveryStatus === 'DELIVERED' ? 'จัดส่งสำเร็จ' : doc.deliveryStatus === 'IN_TRANSIT' ? 'อยู่ระหว่างจัดส่ง' : doc.deliveryStatus === 'PREPARING' ? 'กำลังเตรียมสินค้า' : 'ยกเลิก',
    'วิธีชำระเงิน': doc.paymentMethod || 'ยังไม่ได้ชำระ',
    'ผู้ออกเอกสาร': doc.issuedBy
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'สรุปเอกสารการขาย');
  XLSX.writeFile(workbook, fileName);
}

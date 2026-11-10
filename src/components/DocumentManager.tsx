import React, { useState } from 'react';
import { DocumentInfo, Product, User, DeliveryStatus } from '../types';
import { DocumentTemplate } from './DocumentTemplate';
import { exportDocumentsToExcel } from '../utils/excelExport';
import html2canvas from 'html2canvas';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Share2,
  FileSpreadsheet,
  Truck,
  Eye,
  X,
  Image as ImageIcon,
  ArrowLeft,
  Home
} from 'lucide-react';

interface DocumentManagerProps {
  documents: DocumentInfo[];
  products: Product[];
  onCreateDocument: (doc: Partial<DocumentInfo>) => void;
  onUpdateDeliveryStatus: (docId: string, status: DeliveryStatus, trackingNo?: string, company?: string) => void;
  currentUser: User;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents = [],
  products = [],
  onCreateDocument,
  onUpdateDeliveryStatus,
  currentUser
}) => {
  const safeDocs = documents || [];
  const safeProds = products || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT'>('ALL');

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null);
  const [statusUpdateDoc, setStatusUpdateDoc] = useState<DocumentInfo | null>(null);

  // Status Form state
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('IN_TRANSIT');
  const [trackingNoInput, setTrackingNoInput] = useState('');
  const [deliveryCompanyInput, setDeliveryCompanyInput] = useState('KAEN GREEN Cold Chain');

  // Create Document Form state
  const [docType, setDocType] = useState<'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT'>('DELIVERY_NOTE');
  const [custName, setCustName] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custTaxId, setCustTaxId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'ส่งเอง' | 'ขนส่งเอกชน' | 'ลูกค้ารับเอง'>('ส่งเอง');
  const [selectedItems, setSelectedItems] = useState<{
    productId: string;
    productCode: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[]>([]);
  const [notes, setNotes] = useState('');

  const handleAddItemRow = () => {
    if (safeProds.length === 0) return;
    const firstProd = safeProds[0];
    setSelectedItems(prev => [
      ...prev,
      {
        productId: firstProd.id,
        productCode: firstProd.code,
        productName: firstProd.name,
        unit: firstProd.unit,
        quantity: 1,
        unitPrice: firstProd.sellingPrice,
        amount: firstProd.sellingPrice
      }
    ]);
  };

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setSelectedItems(prev => {
      const next = [...prev];
      next[index] = {
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        unit: prod.unit,
        quantity: 1,
        unitPrice: prod.sellingPrice,
        amount: prod.sellingPrice
      };
      return next;
    });
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setSelectedItems(prev => {
      const next = [...prev];
      const validQty = Math.max(1, qty);
      next[index] = {
        ...next[index],
        quantity: validQty,
        amount: validQty * next[index].unitPrice
      };
      return next;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || selectedItems.length === 0) return;

    const subtotal = selectedItems.reduce((acc, i) => acc + i.amount, 0);
    const tax = Number((subtotal * 0.07).toFixed(2));
    const totalAmount = Number((subtotal + tax).toFixed(2));

    const prefix = docType === 'DELIVERY_NOTE' ? 'DO' : docType === 'BILLING_NOTE' ? 'INV' : 'REC';
    const docNo = `${prefix}-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;

    onCreateDocument({
      documentNo: docNo,
      type: docType,
      customerName: custName.trim(),
      customerAddress: custAddress.trim() || undefined,
      customerPhone: custPhone.trim() || undefined,
      customerTaxId: custTaxId.trim() || undefined,
      recipientName: recipientName.trim() || custName.trim(),
      shippingMethod: shippingMethod,
      items: selectedItems,
      subtotal,
      tax,
      discount: 0,
      totalAmount,
      deliveryStatus: 'PREPARING',
      notes: notes || undefined,
      issuedBy: currentUser.name,
      issuedAt: new Date().toISOString()
    });

    setCreateModalOpen(false);
    setCustName('');
    setCustAddress('');
    setCustPhone('');
    setCustTaxId('');
    setRecipientName('');
    setShippingMethod('ส่งเอง');
    setSelectedItems([]);
    setNotes('');
  };

  const handleExportImage = async (doc: DocumentInfo) => {
    const el = document.getElementById(`document-print-area-${doc.id}`);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${doc.documentNo}-${doc.customerName.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error('Export image error:', err);
    }
  };

  const handleShareDocument = async (doc: DocumentInfo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `เอกสาร ${doc.documentNo} - ${doc.customerName}`,
          text: `ใบส่งของ/วางบิล เลขที่ ${doc.documentNo} ยอดรวม ฿${doc.totalAmount.toLocaleString()}`,
          url: window.location.href
        });
      } catch (err) {
        // Share cancelled
      }
    }
  };

  const filteredDocs = safeDocs.filter(d => {
    const matchesSearch =
      d.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8B5E34] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่เอกสาร หรือ ชื่อลูกค้า..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => exportDocumentsToExcel(documents)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E6E2D6] text-[#23311D] hover:bg-[#F7F5EF] rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#5A8F3E]" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              onClick={() => {
                setCreateModalOpen(true);
                if (selectedItems.length === 0) handleAddItemRow();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>ออกเอกสารใหม่</span>
            </button>
          </div>
        </div>

        {/* Document Type Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-[#E6E2D6] pt-3.5">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'ALL'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ทั้งหมด ({documents.length})
          </button>
          <button
            onClick={() => setTypeFilter('DELIVERY_NOTE')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'DELIVERY_NOTE'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ใบส่งของ (Delivery Note)
          </button>
          <button
            onClick={() => setTypeFilter('BILLING_NOTE')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'BILLING_NOTE'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ใบวางบิล (Billing Note)
          </button>
          <button
            onClick={() => setTypeFilter('RECEIPT')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'RECEIPT'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ใบเสร็จรับเงิน (Receipt)
          </button>
        </div>
      </div>

      {/* Documents List Table */}
      <div className="bg-white rounded-2xl border border-[#E6E2D6] overflow-x-auto">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-[#8B5E34] space-y-2">
            <FileText className="w-10 h-10 mx-auto text-[#8B5E34]/50" />
            <p className="font-semibold text-[#263E1A] text-sm">ไม่พบเอกสารในระบบ</p>
            <p className="text-xs text-[#6B665B]">กดปุ่มออกเอกสารใหม่เพื่อสร้างใบส่งของ ใบวางบิล หรือใบเสร็จ</p>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6]">
              <tr className="text-[#8B5E34] font-semibold">
                <th className="px-5 py-3.5">เลขที่เอกสาร</th>
                <th className="px-5 py-3.5">ประเภท</th>
                <th className="px-5 py-3.5">ลูกค้า / ผู้รับสินค้า</th>
                <th className="px-5 py-3.5">วันที่ออก</th>
                <th className="px-5 py-3.5 text-right">ยอดสุทธิ</th>
                <th className="px-5 py-3.5 text-center">สถานะจัดส่ง</th>
                <th className="px-5 py-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D6]">
              {filteredDocs.map(doc => {
                const isDelivered = doc.deliveryStatus === 'DELIVERED';
                const isInTransit = doc.deliveryStatus === 'IN_TRANSIT';
                return (
                  <tr key={doc.id} className="hover:bg-[#FAF8F3] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#263E1A] tabular-nums whitespace-nowrap">
                      {doc.documentNo}
                    </td>
                    <td className="px-5 py-3.5 text-[#8B5E34] font-medium whitespace-nowrap">
                      {doc.type === 'DELIVERY_NOTE'
                        ? 'ใบส่งของ'
                        : doc.type === 'BILLING_NOTE'
                        ? 'ใบวางบิล'
                        : 'ใบเสร็จรับเงิน'}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#23311D] text-sm">{doc.customerName}</p>
                      {doc.recipientName && (
                        <p className="text-[11px] text-[#6B665B]">ผู้รับ: {doc.recipientName}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B665B] font-mono tabular-nums whitespace-nowrap">
                      {new Date(doc.issuedAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-[#5A8F3E] text-sm tabular-nums whitespace-nowrap">
                      ฿{doc.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setStatusUpdateDoc(doc);
                          setNewStatus(doc.deliveryStatus);
                          setTrackingNoInput(doc.trackingNo || '');
                          setDeliveryCompanyInput(doc.deliveryCompany || 'KAEN GREEN Cold Chain');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#F7F5EF] hover:bg-[#EFECE2] border border-[#E6E2D6] text-[#263E1A] transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#5A8F3E]" />
                        <span>
                          {isDelivered ? 'จัดส่งสำเร็จ' : isInTransit ? 'กำลังจัดส่ง' : 'กำลังเตรียมสินค้า'}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1.5 text-xs font-medium text-[#263E1A] bg-[#F7F5EF] hover:bg-[#EFECE2] rounded-lg inline-flex items-center gap-1"
                          title="ดูและพิมพ์เอกสาร"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#5A8F3E]" />
                          <span>ดูเอกสาร</span>
                        </button>
                        <button
                          onClick={() => handleExportImage(doc)}
                          className="p-1.5 text-[#6B665B] hover:text-[#263E1A] hover:bg-[#F7F5EF] rounded-lg"
                          title="ดาวน์โหลดเป็นภาพ PNG"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShareDocument(doc)}
                          className="p-1.5 text-[#6B665B] hover:text-[#263E1A] hover:bg-[#F7F5EF] rounded-lg"
                          title="แชร์เอกสาร"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create New Document Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E6E2D6] my-8 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D6]">
              <h3 className="font-bold text-[#263E1A] text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5A8F3E]" />
                <span>ออกเอกสารการค้า KAEN GREEN</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)}>
                <X className="w-4 h-4 text-[#8B5E34]" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="font-semibold text-[#23311D] block mb-1.5">ประเภทเอกสาร</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType('DELIVERY_NOTE')}
                    className={`p-2.5 rounded-xl border font-medium text-center transition-colors ${
                      docType === 'DELIVERY_NOTE'
                        ? 'bg-[#5A8F3E] text-white border-[#5A8F3E]'
                        : 'bg-[#F7F5EF] text-[#23311D] border-[#E6E2D6]'
                    }`}
                  >
                    ใบส่งของ (Delivery)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('BILLING_NOTE')}
                    className={`p-2.5 rounded-xl border font-medium text-center transition-colors ${
                      docType === 'BILLING_NOTE'
                        ? 'bg-[#5A8F3E] text-white border-[#5A8F3E]'
                        : 'bg-[#F7F5EF] text-[#23311D] border-[#E6E2D6]'
                    }`}
                  >
                    ใบวางบิล (Billing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('RECEIPT')}
                    className={`p-2.5 rounded-xl border font-medium text-center transition-colors ${
                      docType === 'RECEIPT'
                        ? 'bg-[#5A8F3E] text-white border-[#5A8F3E]'
                        : 'bg-[#F7F5EF] text-[#23311D] border-[#E6E2D6]'
                    }`}
                  >
                    ใบเสร็จรับเงิน (Receipt)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">ชื่อลูกค้า / โรงแรม / ร้านอาหาร *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น โรงแรม Ad Lib Khon Kaen"
                    value={custName}
                    onChange={e => setCustName(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">ชื่อผู้รับมอบสินค้า</label>
                  <input
                    type="text"
                    placeholder="เช่น เชฟกิตติ / แผนกจัดซื้อ"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    placeholder="043-xxx-xxx"
                    value={custPhone}
                    onChange={e => setCustPhone(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">วิธีการจัดส่ง</label>
                  <select
                    value={shippingMethod}
                    onChange={e => setShippingMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-medium text-[#23311D]"
                  >
                    <option value="ส่งเอง">รถห้องเย็น KAEN GREEN Cold Chain</option>
                    <option value="ขนส่งเอกชน">ขนส่งเอกชนควบคุมอุณหภูมิ</option>
                    <option value="ลูกค้ารับเอง">ลูกค้ารับเองหน้าฟาร์ม/คลัง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-1">ที่อยู่จัดส่ง</label>
                <input
                  type="text"
                  placeholder="ถนนศรีจันทร์ ต.ในเมือง อ.เมือง จ.ขอนแก่น"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-[#263E1A]">รายการสินค้าในเอกสาร</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[#5A8F3E] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรายการสินค้า</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-[#F7F5EF] p-2 rounded-xl border border-[#E6E2D6]"
                    >
                      <select
                        value={item.productId}
                        onChange={e => handleItemProductChange(idx, e.target.value)}
                        className="flex-1 p-2 bg-white border border-[#E6E2D6] rounded-lg text-xs font-medium"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            [{p.code}] {p.name} (฿{p.sellingPrice})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleItemQtyChange(idx, parseInt(e.target.value) || 1)}
                        className="w-16 p-2 text-center bg-white border border-[#E6E2D6] rounded-lg font-bold font-mono tabular-nums"
                      />

                      <span className="w-20 text-right font-bold text-[#5A8F3E] font-mono tabular-nums">
                        ฿{item.amount.toLocaleString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-[#8B5E34] hover:text-[#DC2626]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="เช่น ส่งมอบที่จุดรับของห้องครัวหลักก่อน 08:00 น."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6E2D6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F5EF] text-[#23311D] rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold"
                >
                  บันทึกและออกเอกสาร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview & Print Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#F7F5EF] rounded-2xl max-w-4xl w-full p-6 shadow-2xl my-8 space-y-4 border border-[#E6E2D6]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D6]">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-1.5 bg-white hover:bg-[#EFECE2] text-[#23311D] rounded-xl font-medium text-xs flex items-center gap-1.5 border border-[#E6E2D6]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <h3 className="font-bold text-[#263E1A] text-sm">
                  ตัวอย่างเอกสาร {previewDoc.documentNo}
                </h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-[#8B5E34] hover:text-[#23311D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <DocumentTemplate
              document={previewDoc}
              onBack={() => setPreviewDoc(null)}
              onGoHome={() => setPreviewDoc(null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6E2D6] text-xs">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-3.5 py-2 bg-white hover:bg-[#EFECE2] text-[#23311D] border border-[#E6E2D6] font-medium rounded-xl flex items-center gap-1.5"
              >
                <Home className="w-4 h-4 text-[#5A8F3E]" />
                <span>กลับหน้ารายการเอกสาร</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleExportImage(previewDoc)}
                  className="px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-medium rounded-xl flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>บันทึกรูป PNG</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#263E1A] hover:bg-[#1a2c11] text-white font-medium rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์เอกสาร</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusUpdateDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#E6E2D6] text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#E6E2D6]">
              <h3 className="font-bold text-[#263E1A]">อัปเดตสถานะจัดส่ง ({statusUpdateDoc.documentNo})</h3>
              <button onClick={() => setStatusUpdateDoc(null)}>
                <X className="w-4 h-4 text-[#8B5E34]" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                onUpdateDeliveryStatus(statusUpdateDoc.id, newStatus, trackingNoInput, deliveryCompanyInput);
                setStatusUpdateDoc(null);
              }}
              className="space-y-3 mt-3"
            >
              <div>
                <label className="font-semibold text-[#23311D] block mb-1">สถานะการจัดส่ง</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as DeliveryStatus)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-medium text-[#23311D]"
                >
                  <option value="PREPARING">กำลังคัดและบรรจุผักสด (Preparing)</option>
                  <option value="IN_TRANSIT">กำลังจัดส่ง Cold Chain (In Transit)</option>
                  <option value="DELIVERED">จัดส่งถึงมือลูกค้าแล้ว (Delivered)</option>
                  <option value="CANCELLED">ยกเลิกรายการ (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-1">ผู้ให้บริการขนส่ง</label>
                <input
                  type="text"
                  value={deliveryCompanyInput}
                  onChange={e => setDeliveryCompanyInput(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-1">เลขพัสดุ / รอรถจัดส่ง</label>
                <input
                  type="text"
                  value={trackingNoInput}
                  onChange={e => setTrackingNoInput(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusUpdateDoc(null)}
                  className="px-3.5 py-2 bg-[#F7F5EF] text-[#23311D] rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5A8F3E] text-white rounded-xl font-semibold"
                >
                  บันทึกสถานะ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

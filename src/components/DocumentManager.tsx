import React, { useState, useEffect } from 'react';
import { DocumentInfo, Product, User, DeliveryStatus, Customer, ShippingMethod } from '../types';
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
  Home,
  Users,
  UserCheck,
  CopyPlus,
  Building2
} from 'lucide-react';

interface DocumentManagerProps {
  documents: DocumentInfo[];
  products: Product[];
  customers?: Customer[];
  onCreateDocument: (doc: Partial<DocumentInfo>) => void;
  onAddCustomer?: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer | void;
  onUpdateDeliveryStatus: (docId: string, status: DeliveryStatus, trackingNo?: string, company?: string) => void;
  currentUser: User;
  initialCustomerForDoc?: {
    customer: Customer;
    docType: 'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT';
  } | null;
  onClearInitialCustomerForDoc?: () => void;
  initialFilterCustomerId?: string | null;
  onClearFilterCustomerId?: () => void;
  onNavigateToCustomers?: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents = [],
  products = [],
  customers = [],
  onCreateDocument,
  onAddCustomer,
  onUpdateDeliveryStatus,
  currentUser,
  initialCustomerForDoc,
  onClearInitialCustomerForDoc,
  initialFilterCustomerId,
  onClearFilterCustomerId,
  onNavigateToCustomers
}) => {
  const safeDocs = documents || [];
  const safeProds = products || [];
  const safeCustomers = customers || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT'>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [saveNewCustomerToCrm, setSaveNewCustomerToCrm] = useState<boolean>(true);
  const [custName, setCustName] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custTaxId, setCustTaxId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('ส่งเอง');
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

  // Populate fromCustomer helper
  const applyCustomerToForm = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustName(customer.name || '');
    setRecipientName(customer.recipientName || customer.name || '');
    setCustPhone(customer.phone || '');
    setCustTaxId(customer.taxId || '');
    setCustAddress(customer.address || '');
    setShippingMethod(customer.defaultShippingMethod || 'ส่งเอง');
    setNotes(customer.notes || '');
    setSaveNewCustomerToCrm(false);
  };

  // Handle incoming customer from "ออกเอกสารการค้า" button in CustomerManager
  useEffect(() => {
    if (initialCustomerForDoc) {
      setDocType(initialCustomerForDoc.docType);
      applyCustomerToForm(initialCustomerForDoc.customer);
      if (selectedItems.length === 0 && safeProds.length > 0) {
        const firstProd = safeProds[0];
        setSelectedItems([
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
      }
      setCreateModalOpen(true);
      if (onClearInitialCustomerForDoc) onClearInitialCustomerForDoc();
    }
  }, [initialCustomerForDoc]);

  // Handle incoming customer filter from CustomerManager
  useEffect(() => {
    if (initialFilterCustomerId) {
      setCustomerFilter(initialFilterCustomerId);
      if (onClearFilterCustomerId) onClearFilterCustomerId();
    }
  }, [initialFilterCustomerId]);

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

  const handleSelectCustomerDropdown = (custId: string) => {
    if (!custId) {
      setSelectedCustomerId('');
      setCustName('');
      setRecipientName('');
      setCustPhone('');
      setCustTaxId('');
      setCustAddress('');
      setNotes('');
      setSaveNewCustomerToCrm(true);
      return;
    }
    const found = safeCustomers.find(c => c.id === custId);
    if (found) {
      applyCustomerToForm(found);
    }
  };

  // Duplicate / Convert an existing document to another type (e.g. DO -> INV or REC)
  const handleDuplicateOrConvertDoc = (
    sourceDoc: DocumentInfo,
    targetType: 'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT'
  ) => {
    setDocType(targetType);
    setSelectedCustomerId(sourceDoc.customerId || '');
    setCustName(sourceDoc.customerName);
    setRecipientName(sourceDoc.recipientName || sourceDoc.customerName);
    setCustPhone(sourceDoc.customerPhone || '');
    setCustTaxId(sourceDoc.customerTaxId || '');
    setCustAddress(sourceDoc.customerAddress || '');
    setShippingMethod(sourceDoc.shippingMethod || 'ส่งเอง');
    setNotes(sourceDoc.notes ? `อ้างอิงเอกสาร ${sourceDoc.documentNo} · ${sourceDoc.notes}` : `อ้างอิงเอกสาร ${sourceDoc.documentNo}`);
    setSaveNewCustomerToCrm(false);

    const mappedItems = sourceDoc.items.map(item => {
      const matchedProd = safeProds.find(p => p.code === item.productCode) || safeProds[0];
      return {
        productId: matchedProd?.id || '',
        productCode: item.productCode,
        productName: item.productName,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount
      };
    });
    setSelectedItems(mappedItems);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || selectedItems.length === 0) return;

    let linkedCustId = selectedCustomerId || undefined;

    // Check if customer already exists by name if not explicitly selected
    if (!linkedCustId) {
      const existingByName = safeCustomers.find(
        c => c.name.trim().toLowerCase() === custName.trim().toLowerCase()
      );
      if (existingByName) {
        linkedCustId = existingByName.id;
      } else if (saveNewCustomerToCrm && onAddCustomer) {
        const created = onAddCustomer({
          name: custName.trim(),
          recipientName: recipientName.trim() || custName.trim(),
          customerType: 'B2B_HORECA',
          defaultShippingMethod: shippingMethod,
          phone: custPhone.trim() || undefined,
          taxId: custTaxId.trim() || undefined,
          address: custAddress.trim() || undefined,
          notes: notes.trim() || undefined
        });
        if (created && typeof created === 'object' && 'id' in created) {
          linkedCustId = created.id;
        }
      }
    }

    const subtotal = selectedItems.reduce((acc, i) => acc + i.amount, 0);
    const tax = Number((subtotal * 0.07).toFixed(2));
    const totalAmount = Number((subtotal + tax).toFixed(2));

    const prefix = docType === 'DELIVERY_NOTE' ? 'DO' : docType === 'BILLING_NOTE' ? 'INV' : 'REC';
    const docNo = `${prefix}-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;

    onCreateDocument({
      id: `doc-${Date.now()}`,
      documentNo: docNo,
      type: docType,
      customerId: linkedCustId,
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
      deliveryStatus: docType === 'RECEIPT' ? 'DELIVERED' : 'PREPARING',
      notes: notes || undefined,
      issuedBy: currentUser.name,
      issuedAt: new Date().toISOString()
    });

    setCreateModalOpen(false);
    setSelectedCustomerId('');
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
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      d.documentNo.toLowerCase().includes(term) ||
      d.customerName.toLowerCase().includes(term) ||
      (d.recipientName && d.recipientName.toLowerCase().includes(term));
    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;

    let matchesCustomer = true;
    if (customerFilter !== 'ALL') {
      const selectedCust = safeCustomers.find(c => c.id === customerFilter);
      matchesCustomer = Boolean(
        d.customerId === customerFilter ||
          (selectedCust &&
            d.customerName.trim().toLowerCase() === selectedCust.name.trim().toLowerCase())
      );
    }

    return matchesSearch && matchesType && matchesCustomer;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8B5E34] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า หรือ ชื่อผู้รับสินค้า..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
              />
            </div>

            {/* Filter by Linked Customer / Recipient */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Users className="w-3.5 h-3.5 text-[#5A8F3E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={customerFilter}
                  onChange={e => setCustomerFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-medium text-[#23311D] focus:outline-none focus:border-[#5A8F3E]"
                >
                  <option value="ALL">ลูกค้า / ผู้รับสินค้าทั้งหมด ({safeCustomers.length} ราย)</option>
                  {safeCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.recipientName ? `(ผู้รับ: ${c.recipientName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {customerFilter !== 'ALL' && (
                <button
                  onClick={() => setCustomerFilter('ALL')}
                  className="px-2.5 py-2 text-xs text-[#8B5E34] hover:text-[#23311D] bg-[#F7F5EF] rounded-xl border border-[#E6E2D6]"
                  title="ล้างตัวกรองลูกค้า"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {onNavigateToCustomers && (
              <button
                onClick={onNavigateToCustomers}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E6E2D6] bg-[#F7F5EF] text-[#263E1A] hover:bg-[#EFECE2] rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-[#5A8F3E]" />
                <span>จัดการลูกค้า/ผู้รับสินค้า ({safeCustomers.length})</span>
              </button>
            )}

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
              className="flex items-center gap-1.5 px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>ออกเอกสารการค้าใหม่</span>
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
            <p className="font-semibold text-[#263E1A] text-sm">ไม่พบเอกสารการค้าในระบบ</p>
            <p className="text-xs text-[#6B665B]">กดปุ่มออกเอกสารการค้าใหม่เพื่อสร้างใบส่งของ ใบวางบิล หรือใบเสร็จรับเงิน</p>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6]">
              <tr className="text-[#8B5E34] font-semibold">
                <th className="px-5 py-3.5">เลขที่เอกสาร</th>
                <th className="px-5 py-3.5">ประเภท</th>
                <th className="px-5 py-3.5">ลูกค้า / ผู้รับสินค้า (เชื่อมโยง CRM)</th>
                <th className="px-5 py-3.5">วันที่ออก</th>
                <th className="px-5 py-3.5 text-right">ยอดสุทธิ</th>
                <th className="px-5 py-3.5 text-center">สถานะจัดส่ง</th>
                <th className="px-5 py-3.5 text-right">จัดการ / ออกบิลต่อเนื่อง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D6]">
              {filteredDocs.map(doc => {
                const isDelivered = doc.deliveryStatus === 'DELIVERED';
                const isInTransit = doc.deliveryStatus === 'IN_TRANSIT';
                const linkedCust = safeCustomers.find(
                  c =>
                    c.id === doc.customerId ||
                    c.name.trim().toLowerCase() === doc.customerName.trim().toLowerCase()
                );

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
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-[#23311D] text-sm">{doc.customerName}</p>
                        {linkedCust && (
                          <button
                            onClick={() => setCustomerFilter(linkedCust.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#5A8F3E] border border-[#E6E2D6] text-[10px] font-medium"
                            title="คลิกเพื่อดูเอกสารทั้งหมดของลูกค้ารายนี้"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>เชื่อมโยงลูกค้า</span>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#6B665B] mt-0.5">
                        {doc.recipientName && <span>ผู้รับสินค้า: {doc.recipientName}</span>}
                        {doc.customerPhone && <span className="font-mono">โทร: {doc.customerPhone}</span>}
                        {doc.shippingMethod && <span className="text-[#8B5E34]">({doc.shippingMethod})</span>}
                      </div>
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
                          className="px-2.5 py-1.5 text-xs font-medium text-[#263E1A] bg-[#F7F5EF] hover:bg-[#EFECE2] rounded-lg inline-flex items-center gap-1 border border-[#E6E2D6]"
                          title="ดูและพิมพ์เอกสาร"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#5A8F3E]" />
                          <span>ดูเอกสาร</span>
                        </button>

                        {doc.type !== 'RECEIPT' && (
                          <button
                            onClick={() =>
                              handleDuplicateOrConvertDoc(
                                doc,
                                doc.type === 'DELIVERY_NOTE' ? 'BILLING_NOTE' : 'RECEIPT'
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-medium text-[#5A8F3E] bg-[#F7F5EF] hover:bg-[#EFECE2] rounded-lg inline-flex items-center gap-1 border border-[#E6E2D6]"
                            title={
                              doc.type === 'DELIVERY_NOTE'
                                ? 'สร้างใบวางบิลต่อจากใบส่งของนี้'
                                : 'สร้างใบเสร็จรับเงินต่อจากใบวางบิลนี้'
                            }
                          >
                            <CopyPlus className="w-3.5 h-3.5" />
                            <span>{doc.type === 'DELIVERY_NOTE' ? 'ออกใบวางบิล' : 'ออกใบเสร็จ'}</span>
                          </button>
                        )}

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

      {/* Create New Commercial Document Modal (with Customer & Recipient Linker) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E6E2D6] my-8 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D6]">
              <h3 className="font-bold text-[#263E1A] text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5A8F3E]" />
                <span>ออกเอกสารการค้า KAEN GREEN (เชื่อมโยงข้อมูลลูกค้า/ผู้รับสินค้า)</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)}>
                <X className="w-4 h-4 text-[#8B5E34]" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              {/* Step 1: Document Type */}
              <div>
                <label className="font-semibold text-[#23311D] block mb-1.5">1. เลือกประเภทเอกสารการค้า</label>
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

              {/* Step 2: Customer & Recipient Database Selector */}
              <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E2D6] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold text-[#263E1A] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#5A8F3E]" />
                    <span>2. ดึงข้อมูลจากฐานข้อมูลลูกค้า / ผู้รับสินค้า</span>
                  </label>
                  {selectedCustomerId && (
                    <span className="text-[11px] font-semibold text-[#5A8F3E] flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>เชื่อมโยงข้อมูลลูกค้าเรียบร้อย</span>
                    </span>
                  )}
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={e => handleSelectCustomerDropdown(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#5A8F3E] rounded-xl font-medium text-[#23311D] focus:outline-none"
                >
                  <option value="">-- กรอกข้อมูลลูกค้าใหม่ หรือ เลือกจากรายชื่อลูกค้าในระบบ ({safeCustomers.length} ราย) --</option>
                  {safeCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.recipientName ? `· ผู้รับสินค้า: ${c.recipientName}` : ''} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-[#23311D] block mb-1">
                      ชื่อลูกค้า / โรงแรม / ร้านอาหาร *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น โรงแรม Ad Lib Khon Kaen"
                      value={custName}
                      onChange={e => {
                        setCustName(e.target.value);
                      }}
                      className="w-full p-2.5 bg-white border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#23311D] block mb-1">
                      ชื่อผู้รับสินค้า / ผู้รับมอบสินค้า *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น เชฟกิตติ / แผนกจัดซื้อ"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-[#23311D] block mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      placeholder="เช่น 082-369-2868"
                      value={custPhone}
                      onChange={e => setCustPhone(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#E6E2D6] rounded-xl font-mono focus:outline-none focus:border-[#5A8F3E]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#23311D] block mb-1">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      placeholder="เช่น 0405562001234"
                      value={custTaxId}
                      onChange={e => setCustTaxId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#E6E2D6] rounded-xl font-mono focus:outline-none focus:border-[#5A8F3E]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#23311D] block mb-1">วิธีการจัดส่ง</label>
                    <select
                      value={shippingMethod}
                      onChange={e => setShippingMethod(e.target.value as ShippingMethod)}
                      className="w-full p-2.5 bg-white border border-[#E6E2D6] rounded-xl font-medium text-[#23311D]"
                    >
                      <option value="ส่งเอง">ส่งเอง (KAEN GREEN Cold Chain)</option>
                      <option value="ขนส่งเอกชน">ขนส่งเอกชน</option>
                      <option value="ลูกค้ารับเอง">ลูกค้ารับเอง</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">ที่อยู่จัดส่ง / ที่อยู่ออกบิล</label>
                  <input
                    type="text"
                    placeholder="ถนนศรีจันทร์ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000"
                    value={custAddress}
                    onChange={e => setCustAddress(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>

                {!selectedCustomerId && custName.trim() !== '' && (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer text-[#263E1A] font-medium">
                    <input
                      type="checkbox"
                      checked={saveNewCustomerToCrm}
                      onChange={e => setSaveNewCustomerToCrm(e.target.checked)}
                      className="rounded accent-[#5A8F3E]"
                    />
                    <span>บันทึกข้อมูลลูกค้าและผู้รับสินค้ารายนี้เข้าสู่เมนู &ldquo;ลูกค้า / ผู้รับสินค้า&rdquo; อัตโนมัติ</span>
                  </label>
                )}
              </div>

              {/* Step 3: Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-[#263E1A]">3. รายการสินค้าในเอกสาร</label>
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
                <label className="font-semibold text-[#23311D] block mb-1">หมายเหตุเพิ่มเติมในเอกสาร</label>
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
                  บันทึกและออกเอกสารการค้า
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

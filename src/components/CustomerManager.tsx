import React, { useState } from 'react';
import { Customer, DocumentInfo, ShippingMethod } from '../types';
import { DocumentTemplate } from './DocumentTemplate';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  X,
  Truck,
  FilePlus2,
  Eye,
  ExternalLink,
  Printer,
  ArrowLeft,
  Receipt
} from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  documents?: DocumentInfo[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer | void;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  onSelectCustomer?: (customer: Customer) => void;
  isModalSelect?: boolean;
  onIssueDocumentForCustomer?: (
    customer: Customer,
    docType: 'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT'
  ) => void;
  onOpenDocumentsTabForCustomer?: (customer: Customer) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers = [],
  documents = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onSelectCustomer,
  isModalSelect = false,
  onIssueDocumentForCustomer,
  onOpenDocumentsTabForCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'B2B_HORECA' | 'CORPORATE' | 'GENERAL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // State for viewing linked documents of a specific customer
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null);
  const [issueDocChoiceCustomer, setIssueDocChoiceCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    recipientName: string;
    customerType: 'B2B_HORECA' | 'CORPORATE' | 'GENERAL';
    defaultShippingMethod: ShippingMethod;
    taxId: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  }>({
    name: '',
    recipientName: '',
    customerType: 'B2B_HORECA',
    defaultShippingMethod: 'ส่งเอง',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const safeCustomers = customers || [];
  const safeDocuments = documents || [];

  // Helper to get documents linked to a customer (by customerId or exact/partial name match)
  const getCustomerDocuments = (customer: Customer): DocumentInfo[] => {
    return safeDocuments.filter(
      doc =>
        doc.customerId === customer.id ||
        doc.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase() ||
        (customer.recipientName &&
          doc.recipientName &&
          doc.recipientName.trim().toLowerCase() === customer.recipientName.trim().toLowerCase() &&
          doc.customerName.toLowerCase().includes(customer.name.split(' ')[0].toLowerCase()))
    );
  };

  const filteredCustomers = safeCustomers.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      (c.recipientName && c.recipientName.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.taxId && c.taxId.includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term));

    const matchesType = typeFilter === 'ALL' || (c.customerType || 'B2B_HORECA') === typeFilter;
    return matchesSearch && matchesType;
  });

  // Overall KPI metrics
  const totalLinkedDocs = safeDocuments.filter(doc =>
    safeCustomers.some(
      c =>
        doc.customerId === c.id ||
        doc.customerName.trim().toLowerCase() === c.name.trim().toLowerCase()
    )
  );
  const totalCustomerSales = totalLinkedDocs.reduce((sum, d) => sum + d.totalAmount, 0);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      recipientName: '',
      customerType: 'B2B_HORECA',
      defaultShippingMethod: 'ส่งเอง',
      taxId: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      recipientName: customer.recipientName || '',
      customerType: customer.customerType || 'B2B_HORECA',
      defaultShippingMethod: customer.defaultShippingMethod || 'ส่งเอง',
      taxId: customer.taxId || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, formData);
    } else {
      onAddCustomer(formData);
    }

    setShowAddModal(false);
  };

  const getCustomerTypeLabel = (type?: 'B2B_HORECA' | 'CORPORATE' | 'GENERAL') => {
    switch (type) {
      case 'CORPORATE':
        return 'นิติบุคคล / บริษัท';
      case 'GENERAL':
        return 'ลูกค้าทั่วไป / ครอบครัว';
      default:
        return 'HoReCa (โรงแรม & ร้านอาหาร)';
    }
  };

  const getDocTypeLabel = (type: DocumentInfo['type']) => {
    switch (type) {
      case 'DELIVERY_NOTE':
        return 'ใบส่งของ';
      case 'BILLING_NOTE':
        return 'ใบวางบิล';
      case 'RECEIPT':
        return 'ใบเสร็จรับเงิน';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip (Hidden when used as small modal selector) */}
      {!isModalSelect && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8B5E34] font-medium">ฐานข้อมูลลูกค้า / ผู้รับสินค้า</p>
              <p className="text-2xl font-bold text-[#263E1A] font-mono tabular-nums mt-1">
                {safeCustomers.length} <span className="text-xs font-sans font-normal text-[#6B665B]">ราย</span>
              </p>
              <p className="text-[11px] text-[#6B665B] mt-1">พร้อมดึงข้อมูลเข้าเอกสารการค้าอัตโนมัติ</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F7F5EF] border border-[#E6E2D6] flex items-center justify-center text-[#5A8F3E]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8B5E34] font-medium">เอกสารการค้าที่เชื่อมโยง</p>
              <p className="text-2xl font-bold text-[#5A8F3E] font-mono tabular-nums mt-1">
                {totalLinkedDocs.length} <span className="text-xs font-sans font-normal text-[#6B665B]">ฉบับ</span>
              </p>
              <p className="text-[11px] text-[#6B665B] mt-1">ใบส่งของ · ใบวางบิล · ใบเสร็จรับเงิน</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F7F5EF] border border-[#E6E2D6] flex items-center justify-center text-[#5A8F3E]">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8B5E34] font-medium">ยอดซื้อสะสมของลูกค้าในระบบ</p>
              <p className="text-2xl font-bold text-[#263E1A] font-mono tabular-nums mt-1">
                ฿{totalCustomerSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-[#6B665B] mt-1">คำนวณจากเอกสารการค้าทั้งหมดที่ผูกกับลูกค้า</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F7F5EF] border border-[#E6E2D6] flex items-center justify-center text-[#8B5E34]">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Search, Filter & Action Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#8B5E34] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, ชื่อผู้รับสินค้า, เลขผู้เสียภาษี, เบอร์โทร..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มลูกค้า / ผู้รับสินค้าใหม่</span>
          </button>
        </div>

        {/* Customer Segment Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-[#E6E2D6] pt-3.5">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'ALL'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ทั้งหมด ({safeCustomers.length})
          </button>
          <button
            onClick={() => setTypeFilter('B2B_HORECA')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'B2B_HORECA'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            โรงแรม & ร้านอาหาร (HoReCa)
          </button>
          <button
            onClick={() => setTypeFilter('CORPORATE')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'CORPORATE'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            นิติบุคคล / บริษัท
          </button>
          <button
            onClick={() => setTypeFilter('GENERAL')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              typeFilter === 'GENERAL'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ลูกค้าทั่วไป / สมาชิกครอบครัว
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#E6E2D6] p-6 text-[#8B5E34]">
            <Users className="w-10 h-10 mx-auto mb-2 text-[#8B5E34]/50" />
            <p className="text-sm font-semibold text-[#263E1A]">ไม่พบข้อมูลลูกค้า / ผู้รับสินค้า</p>
            <p className="text-xs mt-1 text-[#6B665B]">กดปุ่มเพิ่มลูกค้า / ผู้รับสินค้าใหม่เพื่อบันทึกและเชื่อมโยงกับเอกสารการค้า</p>
          </div>
        ) : (
          filteredCustomers.map(c => {
            const customerDocs = getCustomerDocuments(c);
            const customerTotalAmount = customerDocs.reduce((sum, d) => sum + d.totalAmount, 0);
            const doCount = customerDocs.filter(d => d.type === 'DELIVERY_NOTE').length;
            const invCount = customerDocs.filter(d => d.type === 'BILLING_NOTE').length;
            const recCount = customerDocs.filter(d => d.type === 'RECEIPT').length;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-[#E6E2D6] p-5 hover:border-[#5A8F3E] transition-colors flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-semibold text-[#5A8F3E] bg-[#F7F5EF] border border-[#E6E2D6] px-2 py-0.5 rounded-md">
                        {getCustomerTypeLabel(c.customerType)}
                      </span>
                      <h3 className="font-bold text-base text-[#263E1A] leading-snug">{c.name}</h3>
                      {c.taxId && (
                        <p className="text-xs text-[#8B5E34] font-mono tabular-nums">
                          เลขผู้เสียภาษี: {c.taxId}
                        </p>
                      )}
                    </div>

                    {!isModalSelect && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-[#6B665B] hover:text-[#263E1A] hover:bg-[#F7F5EF] rounded-lg transition-colors"
                          title="แก้ไขข้อมูลลูกค้า/ผู้รับสินค้า"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCustomer(c.id)}
                          className="p-1.5 text-[#6B665B] hover:text-[#DC2626] hover:bg-[#F7F5EF] rounded-lg transition-colors"
                          title="ลบข้อมูล"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recipient & Shipping Box */}
                  <div className="bg-[#F7F5EF] p-3 rounded-xl text-xs text-[#23311D] border border-[#E6E2D6] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-[#5A8F3E] shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-[#8B5E34] block">ผู้รับสินค้า / ผู้รับมอบ</span>
                          <span className="font-semibold text-[#263E1A] truncate block">
                            {c.recipientName || c.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-[#8B5E34] block">การจัดส่งหลัก</span>
                        <span className="font-medium text-[#5A8F3E] flex items-center gap-1 justify-end">
                          <Truck className="w-3 h-3" />
                          <span>{c.defaultShippingMethod || 'ส่งเอง'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="space-y-1.5 text-xs text-[#6B665B] pt-0.5">
                    {c.phone && (
                      <p className="flex items-center gap-2 font-mono tabular-nums text-[#23311D]">
                        <Phone className="w-3.5 h-3.5 text-[#5A8F3E] shrink-0" />
                        <span>{c.phone}</span>
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-2 font-mono truncate">
                        <Mail className="w-3.5 h-3.5 text-[#8B5E34] shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </p>
                    )}
                    {c.address && (
                      <p className="flex items-start gap-2 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8B5E34] shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{c.address}</span>
                      </p>
                    )}
                    {c.notes && (
                      <p className="flex items-start gap-2 text-[11px] text-[#8B5E34] pt-2 border-t border-[#E6E2D6]">
                        <FileText className="w-3.5 h-3.5 text-[#5A8F3E] shrink-0 mt-0.5" />
                        <span>{c.notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Linked Commercial Documents Section */}
                {!isModalSelect ? (
                  <div className="pt-3 border-t border-[#E6E2D6] space-y-3">
                    <div className="bg-[#FAF8F3] rounded-xl p-3 border border-[#E6E2D6] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#263E1A] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#5A8F3E]" />
                          <span>เอกสารการค้า ({customerDocs.length} ฉบับ)</span>
                        </span>
                        <span className="font-mono font-bold text-[#5A8F3E] tabular-nums">
                          ฿{customerTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#6B665B] tabular-nums">
                        <span>ใบส่งของ: {doCount}</span>
                        <span>·</span>
                        <span>ใบวางบิล: {invCount}</span>
                        <span>·</span>
                        <span>ใบเสร็จ: {recCount}</span>
                      </div>

                      {/* Clickable recent document badges */}
                      {customerDocs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {customerDocs.slice(0, 3).map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2 py-1 bg-white hover:bg-[#EFECE2] text-[#263E1A] border border-[#E6E2D6] rounded-lg text-[10px] font-mono font-medium flex items-center gap-1 transition-colors"
                              title={`คลิกเพื่อเปิดดู ${getDocTypeLabel(doc.type)} ${doc.documentNo}`}
                            >
                              <Eye className="w-3 h-3 text-[#5A8F3E]" />
                              <span>{doc.documentNo}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons linking Customer <-> Commercial Documents */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setIssueDocChoiceCustomer(c)}
                        className="py-2 px-3 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FilePlus2 className="w-3.5 h-3.5" />
                        <span>ออกเอกสารการค้า</span>
                      </button>

                      <button
                        onClick={() => setHistoryCustomer(c)}
                        className="py-2 px-3 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#263E1A] border border-[#E6E2D6] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#8B5E3E]" />
                        <span>ประวัติเอกสาร ({customerDocs.length})</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  onSelectCustomer && (
                    <button
                      onClick={() => onSelectCustomer(c)}
                      className="w-full py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>เลือกลูกค้า / ผู้รับสินค้ารายนี้</span>
                    </button>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Issue Commercial Document Type Selector Modal */}
      {issueDocChoiceCustomer && (
        <div className="fixed inset-0 z-50 bg-[#23311D]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6E2D6] space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E6E2D6] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#263E1A] flex items-center gap-2">
                  <FilePlus2 className="w-5 h-5 text-[#5A8F3E]" />
                  <span>สร้างเอกสารการค้าให้ลูกค้า</span>
                </h3>
                <p className="text-[11px] text-[#8B5E34] mt-0.5">
                  ข้อมูลลูกค้าและผู้รับสินค้าจะถูกดึงเข้าเอกสารโดยอัตโนมัติ
                </p>
              </div>
              <button
                onClick={() => setIssueDocChoiceCustomer(null)}
                className="text-[#8B5E34] hover:text-[#23311D] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E6E2D6] space-y-1">
              <p className="font-bold text-sm text-[#263E1A]">{issueDocChoiceCustomer.name}</p>
              <p className="text-[#6B665B]">
                ผู้รับสินค้า: <span className="font-semibold text-[#23311D]">{issueDocChoiceCustomer.recipientName || issueDocChoiceCustomer.name}</span>
              </p>
              {issueDocChoiceCustomer.phone && (
                <p className="text-[#8B5E34] font-mono">โทร: {issueDocChoiceCustomer.phone}</p>
              )}
              {issueDocChoiceCustomer.address && (
                <p className="text-[#6B665B] line-clamp-1">{issueDocChoiceCustomer.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-[#23311D]">เลือกประเภทเอกสารการค้าที่ต้องการออก:</p>

              <button
                onClick={() => {
                  const cust = issueDocChoiceCustomer;
                  setIssueDocChoiceCustomer(null);
                  if (onIssueDocumentForCustomer) onIssueDocumentForCustomer(cust, 'DELIVERY_NOTE');
                }}
                className="w-full p-3.5 rounded-xl border border-[#E6E2D6] hover:border-[#5A8F3E] bg-[#FAF8F3] hover:bg-[#F7F5EF] flex items-center justify-between transition-colors text-left"
              >
                <div>
                  <p className="font-bold text-[#263E1A] text-sm">1. ใบส่งของ / ใบแจ้งหนี้ (Delivery Note)</p>
                  <p className="text-[11px] text-[#6B665B]">สำหรับจัดส่งผักสด Cold Chain พร้อมให้ผู้รับสินค้าเซ็นรับมอบ</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#5A8F3E] shrink-0" />
              </button>

              <button
                onClick={() => {
                  const cust = issueDocChoiceCustomer;
                  setIssueDocChoiceCustomer(null);
                  if (onIssueDocumentForCustomer) onIssueDocumentForCustomer(cust, 'BILLING_NOTE');
                }}
                className="w-full p-3.5 rounded-xl border border-[#E6E2D6] hover:border-[#5A8F3E] bg-[#FAF8F3] hover:bg-[#F7F5EF] flex items-center justify-between transition-colors text-left"
              >
                <div>
                  <p className="font-bold text-[#263E1A] text-sm">2. ใบวางบิล (Billing Note)</p>
                  <p className="text-[11px] text-[#6B665B]">สำหรับเรียกเก็บเงินลูกค้าเครดิต โรงแรม ร้านอาหาร HoReCa</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#5A8F3E] shrink-0" />
              </button>

              <button
                onClick={() => {
                  const cust = issueDocChoiceCustomer;
                  setIssueDocChoiceCustomer(null);
                  if (onIssueDocumentForCustomer) onIssueDocumentForCustomer(cust, 'RECEIPT');
                }}
                className="w-full p-3.5 rounded-xl border border-[#E6E2D6] hover:border-[#5A8F3E] bg-[#FAF8F3] hover:bg-[#F7F5EF] flex items-center justify-between transition-colors text-left"
              >
                <div>
                  <p className="font-bold text-[#263E1A] text-sm">3. ใบเสร็จรับเงิน / ใบกำกับภาษี (Receipt)</p>
                  <p className="text-[11px] text-[#6B665B]">สำหรับยืนยันการรับชำระเงินพร้อมหัวบิล KAEN GREEN</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#5A8F3E] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Commercial Documents History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-[#23311D]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#E6E2D6] my-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E6E2D6] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#263E1A] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#5A8F3E]" />
                  <span>เอกสารการค้าที่เชื่อมโยง: {historyCustomer.name}</span>
                </h3>
                <p className="text-[11px] text-[#8B5E34] mt-0.5">
                  ผู้รับสินค้า: {historyCustomer.recipientName || historyCustomer.name} · โทร: {historyCustomer.phone || '-'}
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-[#8B5E34] hover:text-[#23311D] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const docs = getCustomerDocuments(historyCustomer);
              if (docs.length === 0) {
                return (
                  <div className="py-10 text-center bg-[#F7F5EF] rounded-xl border border-[#E6E2D6] space-y-3">
                    <FileText className="w-8 h-8 mx-auto text-[#8B5E34]/50" />
                    <p className="font-semibold text-[#263E1A]">ยังไม่มีประวัติเอกสารการค้าสำหรับลูกค้ารายนี้</p>
                    <button
                      onClick={() => {
                        const cust = historyCustomer;
                        setHistoryCustomer(null);
                        setIssueDocChoiceCustomer(cust);
                      }}
                      className="px-4 py-2 bg-[#5A8F3E] text-white rounded-xl font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ออกเอกสารฉบับแรกให้ลูกค้ารายนี้</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto border border-[#E6E2D6] rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6] text-[#8B5E34] font-semibold">
                      <tr>
                        <th className="p-3">เลขที่เอกสาร</th>
                        <th className="p-3">ประเภท</th>
                        <th className="p-3">ผู้รับสินค้า</th>
                        <th className="p-3">วันที่ออก</th>
                        <th className="p-3 text-right">ยอดสุทธิ</th>
                        <th className="p-3 text-right">เปิดดู / พิมพ์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E2D6]">
                      {docs.map(d => (
                        <tr key={d.id} className="hover:bg-[#FAF8F3]">
                          <td className="p-3 font-mono font-bold text-[#263E1A]">{d.documentNo}</td>
                          <td className="p-3 text-[#8B5E34] font-medium">{getDocTypeLabel(d.type)}</td>
                          <td className="p-3 text-[#23311D]">{d.recipientName || d.customerName}</td>
                          <td className="p-3 font-mono text-[#6B665B]">
                            {new Date(d.issuedAt).toLocaleDateString('th-TH')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#5A8F3E]">
                            ฿{d.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setPreviewDoc(d)}
                              className="px-3 py-1.5 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-lg font-medium inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูใบสำคัญ</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E6E2D6]">
              {onOpenDocumentsTabForCustomer && (
                <button
                  onClick={() => {
                    const cust = historyCustomer;
                    setHistoryCustomer(null);
                    onOpenDocumentsTabForCustomer(cust);
                  }}
                  className="px-3.5 py-2 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#263E1A] border border-[#E6E2D6] rounded-xl font-medium flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#5A8F3E]" />
                  <span>เปิดในหน้าจัดการเอกสารการค้า</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    const cust = historyCustomer;
                    setHistoryCustomer(null);
                    setIssueDocChoiceCustomer(cust);
                  }}
                  className="px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <FilePlus2 className="w-4 h-4" />
                  <span>ออกเอกสารใหม่ให้ลูกค้ารายนี้</span>
                </button>
                <button
                  onClick={() => setHistoryCustomer(null)}
                  className="px-4 py-2 bg-[#F7F5EF] text-[#23311D] rounded-xl font-medium"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal directly from Customer View */}
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
                  เอกสารการค้า {previewDoc.documentNo} ({previewDoc.customerName})
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

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E6E2D6] text-xs">
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
      )}

      {/* Add / Edit Customer & Recipient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#23311D]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E2D6] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#E6E2D6] pb-3">
              <h3 className="font-bold text-base text-[#263E1A] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#5A8F3E]" />
                <span>{editingCustomer ? 'แก้ไขข้อมูลลูกค้า / ผู้รับสินค้า' : 'เพิ่มลูกค้า / ผู้รับสินค้าใหม่'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8B5E34] hover:text-[#23311D] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#23311D] mb-1">
                  ชื่อลูกค้า / โรงแรม / ร้านอาหาร / บริษัท *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โรงแรม Ad Lib Khon Kaen หรือ คุณพิมพ์ใจ"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">
                  ชื่อผู้รับสินค้า / ผู้รับมอบสินค้า (แสดงในใบส่งของ/ใบเสร็จ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น เชฟกิตติ (หัวหน้าห้องอาหาร) หรือ แผนกจัดซื้อ"
                  value={formData.recipientName}
                  onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">กลุ่มลูกค้า</label>
                  <select
                    value={formData.customerType}
                    onChange={e => setFormData({ ...formData, customerType: e.target.value as any })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-medium text-[#23311D]"
                  >
                    <option value="B2B_HORECA">โรงแรม & ร้านอาหาร (HoReCa)</option>
                    <option value="CORPORATE">นิติบุคคล / บริษัท</option>
                    <option value="GENERAL">ลูกค้าทั่วไป / ครอบครัว</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">วิธีการจัดส่งหลัก</label>
                  <select
                    value={formData.defaultShippingMethod}
                    onChange={e => setFormData({ ...formData, defaultShippingMethod: e.target.value as ShippingMethod })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-medium text-[#23311D]"
                  >
                    <option value="ส่งเอง">ส่งเอง (KAEN GREEN Cold Chain)</option>
                    <option value="ขนส่งเอกชน">ขนส่งเอกชน</option>
                    <option value="ลูกค้ารับเอง">ลูกค้ารับเอง</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    placeholder="เช่น 082-369-2868"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-mono focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">เลขประจำตัวผู้เสียภาษี</label>
                  <input
                    type="text"
                    placeholder="เช่น 0405562001234"
                    value={formData.taxId}
                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-mono focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">อีเมลสำหรับส่งเอกสารอิเล็กทรอนิกส์</label>
                <input
                  type="email"
                  placeholder="เช่น purchasing@adlibkhonkaen.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-mono focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">ที่อยู่สำหรับออกบิลและจัดส่งสินค้า</label>
                <textarea
                  rows={2}
                  placeholder="เช่น 999 ถนนศรีจันทร์ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">หมายเหตุประจำตัวลูกค้า / รอบเวลาส่งมอบ</label>
                <input
                  type="text"
                  placeholder="เช่น จัดส่งระบบ Cold Chain รอบเช้า 07:30 น."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E2D6]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#23311D] rounded-xl text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  {editingCustomer ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลลูกค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Customer } from '../types';
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
  X
} from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  onSelectCustomer?: (customer: Customer) => void;
  isModalSelect?: boolean;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onSelectCustomer,
  isModalSelect = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    recipientName: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const safeCustomers = customers || [];

  const filteredCustomers = safeCustomers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.recipientName && c.recipientName.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.taxId && c.taxId.includes(term))
    );
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      recipientName: '',
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

  return (
    <div className="space-y-6">
      {/* Search & Action Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8B5E34] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อโรงแรม, ร้านอาหาร, ผู้รับสินค้า, เบอร์โทร..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มลูกค้า / ผู้รับสินค้า</span>
        </button>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#E6E2D6] p-6 text-[#8B5E34]">
            <Users className="w-10 h-10 mx-auto mb-2 text-[#8B5E34]/50" />
            <p className="text-sm font-semibold text-[#263E1A]">ไม่พบข้อมูลลูกค้า</p>
            <p className="text-xs mt-1 text-[#6B665B]">กดปุ่มเพิ่มลูกค้า / ผู้รับสินค้าเพื่อเริ่มบันทึกข้อมูล</p>
          </div>
        ) : (
          filteredCustomers.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-[#E6E2D6] p-5 hover:border-[#5A8F3E] transition-colors flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base text-[#263E1A] leading-snug">{c.name}</h3>
                    {c.taxId && (
                      <p className="text-xs text-[#8B5E34] font-mono tabular-nums mt-0.5">
                        เลขผู้เสียภาษี: {c.taxId}
                      </p>
                    )}
                  </div>

                  {!isModalSelect && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-[#6B665B] hover:text-[#263E1A] hover:bg-[#F7F5EF] rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCustomer(c.id)}
                        className="p-1.5 text-[#6B665B] hover:text-[#DC2626] hover:bg-[#F7F5EF] rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Recipient info */}
                {c.recipientName && (
                  <div className="bg-[#F7F5EF] p-3 rounded-xl text-xs text-[#23311D] border border-[#E6E2D6] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#5A8F3E] shrink-0" />
                    <div>
                      <span className="text-[11px] text-[#8B5E34] block">ผู้รับมอบสินค้า</span>
                      <span className="font-semibold text-[#263E1A]">{c.recipientName}</span>
                    </div>
                  </div>
                )}

                {/* Phone, Email & Address */}
                <div className="space-y-1.5 text-xs text-[#6B665B] pt-1">
                  {c.phone && (
                    <p className="flex items-center gap-2 font-mono tabular-nums text-[#23311D]">
                      <Phone className="w-3.5 h-3.5 text-[#5A8F3E] shrink-0" />
                      <span>{c.phone}</span>
                    </p>
                  )}
                  {c.email && (
                    <p className="flex items-center gap-2 font-mono">
                      <Mail className="w-3.5 h-3.5 text-[#8B5E34] shrink-0" />
                      <span>{c.email}</span>
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

              {isModalSelect && onSelectCustomer && (
                <button
                  onClick={() => onSelectCustomer(c)}
                  className="w-full py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>เลือกลูกค้ารายนี้</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#23311D]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E2D6] space-y-5">
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
                  ชื่อลูกค้า / โรงแรม / ร้านอาหาร *
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
                  ชื่อผู้รับมอบสินค้า (เช่น หัวหน้าครัว / แผนกจัดซื้อ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น เชฟกิตติ (ห้องอาหาร)"
                  value={formData.recipientName}
                  onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">เบอร์โทรศัพท์</label>
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
                <label className="block font-semibold text-[#23311D] mb-1">อีเมล</label>
                <input
                  type="email"
                  placeholder="เช่น purchasing@adlibkhonkaen.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-mono focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">ที่อยู่สำหรับจัดส่งสินค้า</label>
                <textarea
                  rows={2}
                  placeholder="เช่น 999 ถนนศรีจันทร์ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">หมายเหตุการจัดส่ง</label>
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

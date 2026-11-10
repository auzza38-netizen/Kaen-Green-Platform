import React, { useState } from 'react';
import { DocumentInfo, DeliveryStatus } from '../types';
import {
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Building2,
  AlertCircle
} from 'lucide-react';

interface DeliveryTrackerProps {
  documents: DocumentInfo[];
  onUpdateDeliveryStatus: (docId: string, status: DeliveryStatus, trackingNo?: string, company?: string) => void;
}

export const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({
  documents = [],
  onUpdateDeliveryStatus
}) => {
  const safeDocs = documents || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<DocumentInfo | null>(safeDocs[0] || null);

  const deliveryDocs = safeDocs.filter(d => d.type === 'DELIVERY_NOTE' || d.type === 'RECEIPT');

  const filteredDocs = deliveryDocs.filter(d => {
    const matchesSearch =
      d.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.trackingNo && d.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || d.deliveryStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderStatusText = (status: DeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="text-xs font-medium text-[#5A8F3E] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>จัดส่งสำเร็จ</span>
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="text-xs font-medium text-[#263E1A] inline-flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-[#5A8F3E]" />
            <span>กำลังจัดส่ง Cold Chain</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="text-xs font-medium text-[#8B5E34] inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>กำลังคัดและบรรจุผักสด</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-xs font-medium text-[#DC2626] inline-flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ยกเลิก</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8B5E34] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่พัสดุ, เลขที่ใบส่งของ, หรือชื่อลูกค้า..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ทั้งหมด ({deliveryDocs.length})
          </button>
          <button
            onClick={() => setStatusFilter('PREPARING')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              statusFilter === 'PREPARING'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            กำลังเตรียมผักสด
          </button>
          <button
            onClick={() => setStatusFilter('IN_TRANSIT')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              statusFilter === 'IN_TRANSIT'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            กำลังจัดส่ง
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
              statusFilter === 'DELIVERED'
                ? 'bg-[#5A8F3E] text-white'
                : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            จัดส่งสำเร็จ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Orders List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E6E2D6] text-[#8B5E34] space-y-2">
              <Truck className="w-10 h-10 mx-auto text-[#8B5E34]/50" />
              <p className="font-semibold text-[#263E1A] text-sm">ไม่พบรายการจัดส่งสินค้า</p>
            </div>
          ) : (
            filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`bg-white p-5 rounded-2xl border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-[#5A8F3E] bg-[#FAF8F3]'
                      : 'border-[#E6E2D6] hover:border-[#5A8F3E]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#E6E2D6] pb-2.5 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#263E1A] tabular-nums">{doc.documentNo}</span>
                      <span aria-hidden="true" className="text-[#8B5E34]">·</span>
                      <span className="text-[#6B665B] font-mono tabular-nums">
                        {new Date(doc.issuedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    {renderStatusText(doc.deliveryStatus)}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-[#23311D] text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#5A8F3E]" />
                      <span>{doc.customerName}</span>
                    </p>

                    <p className="text-[#6B665B] truncate">
                      รายการ: {doc.items.map(i => `${i.productName} (x${i.quantity})`).join(' · ')}
                    </p>

                    <div className="flex items-center justify-between pt-2 text-[11px] text-[#8B5E34]">
                      <span>
                        การขนส่ง: <span className="font-medium text-[#23311D]">{doc.deliveryCompany || 'KAEN GREEN Cold Chain'}</span>
                      </span>
                      <span>
                        รหัสติดตาม: <span className="font-mono font-semibold text-[#263E1A] tabular-nums">{doc.trackingNo || 'รอออกรหัส'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Order Timeline Details (5 cols) */}
        {selectedDoc && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E6E2D6] p-6 space-y-5 text-xs sticky top-22">
            <div className="flex justify-between items-start border-b border-[#E6E2D6] pb-3.5">
              <div>
                <h3 className="font-bold text-[#263E1A] text-base">รายละเอียดการจัดส่ง</h3>
                <p className="font-mono text-[#5A8F3E] font-semibold text-xs mt-0.5 tabular-nums">
                  {selectedDoc.documentNo}
                </p>
              </div>

              {renderStatusText(selectedDoc.deliveryStatus)}
            </div>

            <div className="bg-[#F7F5EF] p-4 rounded-xl border border-[#E6E2D6] space-y-1">
              <p className="font-semibold text-[#263E1A] text-sm">{selectedDoc.customerName}</p>
              {selectedDoc.customerAddress && <p className="text-[#6B665B]">{selectedDoc.customerAddress}</p>}
              {selectedDoc.customerPhone && (
                <p className="text-[#8B5E34] font-mono tabular-nums">โทร: {selectedDoc.customerPhone}</p>
              )}
            </div>

            {/* Delivery Steps */}
            <div className="space-y-3 pt-1">
              <p className="font-semibold text-[#263E1A]">ขั้นตอนการส่งมอบความสด (How It Works)</p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E6E2D6] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#263E1A]">01. คัดสรรคุณภาพและบรรจุสะอาด</p>
                    <p className="text-[11px] text-[#6B665B]">เก็บเกี่ยวจากฟาร์มขอนแก่นและตัดสต็อคเรียบร้อย</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#5A8F3E] shrink-0" />
                </div>

                <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E6E2D6] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#263E1A]">
                      02. จัดส่งระบบ Cold Chain ({selectedDoc.deliveryCompany || 'KAEN GREEN Cold Chain'})
                    </p>
                    <p className="text-[11px] text-[#8B5E34] font-mono tabular-nums">
                      Tracking: {selectedDoc.trackingNo || 'KG-COLD-0891'}
                    </p>
                  </div>
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      selectedDoc.deliveryStatus === 'IN_TRANSIT' || selectedDoc.deliveryStatus === 'DELIVERED'
                        ? 'text-[#5A8F3E]'
                        : 'text-[#E6E2D6]'
                    }`}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E6E2D6] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#263E1A]">03. ถึงมือลูกค้า สด ปลอดภัย มั่นใจได้</p>
                    <p className="text-[11px] text-[#6B665B]">ส่งมอบรอบ 07:00 - 18:00 น.</p>
                  </div>
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      selectedDoc.deliveryStatus === 'DELIVERED' ? 'text-[#5A8F3E]' : 'text-[#E6E2D6]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Quick Change Status Buttons */}
            <div className="pt-3 border-t border-[#E6E2D6] space-y-2">
              <p className="font-semibold text-[#23311D]">อัปเดตสถานะการจัดส่งด่วน</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onUpdateDeliveryStatus(selectedDoc.id, 'IN_TRANSIT', 'KG-COLD-9988', 'KAEN GREEN Cold Chain')
                  }
                  className="py-2.5 px-3 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#263E1A] rounded-xl font-medium text-xs border border-[#E6E2D6] transition-colors"
                >
                  กำลังจัดส่ง Cold Chain
                </button>
                <button
                  onClick={() => onUpdateDeliveryStatus(selectedDoc.id, 'DELIVERED')}
                  className="py-2.5 px-3 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  ยืนยันจัดส่งสำเร็จ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { DocumentInfo } from '../types';
import { thaiBahtText } from '../utils/thaiBaht';
import { KaenGreenLogo } from './KaenGreenLogo';
import { Truck, Building2, Phone, User, ArrowLeft, Home, Printer } from 'lucide-react';

interface DocumentTemplateProps {
  document: DocumentInfo;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  onBack?: () => void;
  onGoHome?: () => void;
}

export const DocumentTemplate: React.FC<DocumentTemplateProps> = ({
  document,
  companyAddress = '123/45 ถนนมิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000',
  companyTaxId = '0-4055-6600-123-4',
  companyPhone = '082-369-2868, LINE: @kaengreen',
  onBack,
  onGoHome
}) => {
  const getDocTitleTH = () => {
    switch (document.type) {
      case 'DELIVERY_NOTE':
        return 'ใบส่งของ / ใบแจ้งหนี้ (DELIVERY NOTE)';
      case 'BILLING_NOTE':
        return 'ใบวางบิล / ใบแจ้งชำระเงิน (BILLING NOTE)';
      case 'RECEIPT':
        return 'ใบเสร็จรับเงิน / ใบกำกับภาษี (RECEIPT)';
      default:
        return 'เอกสารการค้า';
    }
  };

  return (
    <div
      id={`document-print-area-${document.id}`}
      className="bg-white p-6 sm:p-10 border border-[#E6E2D6] rounded-2xl max-w-4xl mx-auto text-[#23311D] print:shadow-none print:border-none print:m-0 print:p-4 print:max-w-none"
    >
      {/* Navigation Toolbar (Hidden when printing) */}
      {(onBack || onGoHome) && (
        <div className="print:hidden mb-6 pb-4 border-b border-[#E6E2D6] flex flex-wrap items-center justify-between gap-3 bg-[#F7F5EF] p-3 rounded-xl">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3.5 py-2 bg-white hover:bg-[#EFECE2] text-[#23311D] border border-[#E6E2D6] rounded-xl font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#8B5E34]" />
                <span>ย้อนกลับ</span>
              </button>
            )}
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="px-3.5 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>กลับหน้าหลัก</span>
              </button>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-[#263E1A] hover:bg-[#1a2c11] text-white rounded-xl font-medium text-xs transition-colors flex items-center gap-1.5 ml-auto"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์เอกสาร</span>
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#5A8F3E] pb-6 mb-6 gap-4">
        <div>
          <div className="mb-2">
            <KaenGreenLogo size="lg" />
          </div>
          <p className="text-xs text-[#6B665B] mt-1">{companyAddress}</p>
          <p className="text-xs text-[#8B5E34] flex items-center gap-2 mt-0.5 font-mono tabular-nums">
            <span>เลขผู้เสียภาษี: {companyTaxId}</span>
            <span aria-hidden="true">·</span>
            <span>โทร: {companyPhone}</span>
          </p>
        </div>

        <div className="text-right sm:self-start w-full sm:w-auto">
          <div className="px-4 py-2 border border-[#5A8F3E] bg-[#F7F5EF] text-[#263E1A] rounded-xl font-bold text-sm text-center">
            {getDocTitleTH()}
          </div>
          <div className="mt-3 text-xs space-y-1 text-[#6B665B]">
            <p className="font-semibold text-[#263E1A]">
              เลขที่เอกสาร:{' '}
              <span className="font-mono text-sm text-[#5A8F3E] tabular-nums">{document.documentNo}</span>
            </p>
            <p>
              วันที่ออกเอกสาร:{' '}
              <span className="font-medium text-[#23311D]">
                {new Date(document.issuedAt).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </p>
            <p>
              ผู้ออกเอกสาร: <span className="font-medium text-[#23311D]">{document.issuedBy}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer & Recipient Info Box */}
      <div className="bg-[#FAF8F3] border border-[#E6E2D6] rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <h3 className="font-semibold text-[#263E1A] text-sm mb-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#5A8F3E]" />
            <span>ลูกค้า / ผู้รับสินค้า</span>
          </h3>
          <p className="font-semibold text-[#23311D] text-sm">{document.customerName}</p>
          {document.recipientName && (
            <p className="text-[#6B665B] mt-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#5A8F3E]" />
              <span>ผู้รับมอบ:</span>
              <span className="font-semibold text-[#23311D]">{document.recipientName}</span>
            </p>
          )}
          {document.customerAddress && <p className="text-[#6B665B] mt-1">{document.customerAddress}</p>}
          {document.customerPhone && (
            <p className="text-[#8B5E34] font-mono tabular-nums mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>โทร: {document.customerPhone}</span>
            </p>
          )}
        </div>

        <div className="border-t md:border-t-0 md:border-l border-[#E6E2D6] pt-3 md:pt-0 md:pl-4 space-y-1.5">
          <h3 className="font-semibold text-[#263E1A] text-sm mb-1 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-[#5A8F3E]" />
            <span>การจัดส่งและชำระเงิน</span>
          </h3>
          <p className="flex justify-between">
            <span className="text-[#6B665B]">วิธีการจัดส่ง:</span>
            <span className="font-semibold text-[#263E1A]">{document.shippingMethod || 'ส่งเอง Cold Chain'}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-[#6B665B]">สถานะจัดส่ง:</span>
            <span className="font-semibold text-[#5A8F3E]">
              {document.deliveryStatus === 'DELIVERED'
                ? 'จัดส่งสำเร็จ'
                : document.deliveryStatus === 'IN_TRANSIT'
                ? 'กำลังจัดส่ง'
                : 'กำลังเตรียมผักสด'}
            </span>
          </p>
          {document.trackingNo && (
            <p className="flex justify-between">
              <span className="text-[#6B665B]">รหัสติดตาม:</span>
              <span className="font-mono font-semibold text-[#263E1A] tabular-nums">{document.trackingNo}</span>
            </p>
          )}
          <p className="flex justify-between">
            <span className="text-[#6B665B]">วิธีชำระเงิน:</span>
            <span className="font-medium text-[#23311D]">{document.paymentMethod || 'เงินโอน / พร้อมเพย์'}</span>
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-[#263E1A] text-white font-semibold">
              <th className="p-2.5 text-center w-12 border border-[#263E1A]">ลำดับ</th>
              <th className="p-2.5 border border-[#263E1A]">รหัสสินค้า</th>
              <th className="p-2.5 border border-[#263E1A]">รายการสินค้า</th>
              <th className="p-2.5 text-center border border-[#263E1A]">จำนวน</th>
              <th className="p-2.5 text-center border border-[#263E1A]">หน่วย</th>
              <th className="p-2.5 text-right border border-[#263E1A]">ราคา/หน่วย</th>
              <th className="p-2.5 text-right border border-[#263E1A]">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F3]'}>
                <td className="p-2.5 text-center border border-[#E6E2D6] font-mono text-[#6B665B] tabular-nums">
                  {index + 1}
                </td>
                <td className="p-2.5 border border-[#E6E2D6] font-mono text-[#6B665B] tabular-nums">
                  {item.productCode}
                </td>
                <td className="p-2.5 border border-[#E6E2D6] font-medium text-[#23311D]">
                  {item.productName}
                </td>
                <td className="p-2.5 text-center border border-[#E6E2D6] font-bold font-mono text-[#263E1A] tabular-nums">
                  {item.quantity}
                </td>
                <td className="p-2.5 text-center border border-[#E6E2D6] text-[#6B665B]">
                  {item.unit}
                </td>
                <td className="p-2.5 text-right border border-[#E6E2D6] font-mono text-[#23311D] tabular-nums">
                  ฿{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2.5 text-right border border-[#E6E2D6] font-mono font-semibold text-[#263E1A] tabular-nums">
                  ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-8">
        <div className="bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl p-4 text-xs text-[#23311D]">
          <p className="font-semibold text-[#8B5E34] mb-1">จำนวนเงินตัวอักษร (THAI BAHT TEXT)</p>
          <p className="text-sm font-bold text-[#263E1A] bg-white p-2.5 rounded-lg border border-[#E6E2D6]">
            ({thaiBahtText(document.totalAmount)})
          </p>
          {document.notes && (
            <div className="mt-3 pt-2 border-t border-[#E6E2D6] text-[#6B665B]">
              <span className="font-semibold text-[#23311D]">หมายเหตุ:</span> {document.notes}
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-[#6B665B] bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E2D6]">
          <div className="flex justify-between">
            <span>รวมเงินก่อนภาษี (Subtotal)</span>
            <span className="font-mono font-medium text-[#23311D] tabular-nums">
              ฿{document.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          {document.discount > 0 && (
            <div className="flex justify-between text-[#8B5E34]">
              <span>หัก ส่วนลด (Discount)</span>
              <span className="font-mono font-medium tabular-nums">
                -฿{document.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>ภาษีมูลค่าเพิ่ม VAT 7%</span>
            <span className="font-mono font-medium text-[#23311D] tabular-nums">
              ฿{document.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#E6E2D6] pt-2 text-sm font-bold text-[#263E1A]">
            <span>จำนวนเงินรวมสุทธิ (NET TOTAL)</span>
            <span className="font-mono text-base text-[#5A8F3E] tabular-nums">
              ฿{document.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Footer */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E6E2D6] text-center text-xs text-[#6B665B]">
        <div>
          <div className="h-14 border-b border-dashed border-[#8B5E34]/40 mb-2"></div>
          <p className="font-medium text-[#263E1A]">ผู้สั่งซื้อ / ผู้รับสินค้า</p>
          <p className="text-[10px] text-[#8B5E34] mt-1">วันที่ ...../...../..........</p>
        </div>
        <div>
          <div className="h-14 border-b border-dashed border-[#8B5E34]/40 mb-2"></div>
          <p className="font-medium text-[#263E1A]">พนักงานจัดส่ง Cold Chain</p>
          <p className="text-[10px] text-[#8B5E34] mt-1">วันที่ ...../...../..........</p>
        </div>
        <div>
          <div className="h-14 border-b border-dashed border-[#8B5E34]/40 mb-2"></div>
          <p className="font-medium text-[#263E1A]">ผู้มีอำนาจลงนาม KAEN GREEN</p>
          <p className="text-[10px] text-[#8B5E34] mt-1">วันที่ ...../...../..........</p>
        </div>
      </div>
    </div>
  );
};

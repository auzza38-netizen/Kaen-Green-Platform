import React, { useState } from 'react';
import { StockMovement, Product, DocumentInfo } from '../types';
import {
  exportMovementsToExcel,
  exportProductsToExcel,
  exportDocumentsToExcel
} from '../utils/excelExport';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Filter
} from 'lucide-react';

interface ReportsViewProps {
  movements: StockMovement[];
  products: Product[];
  documents: DocumentInfo[];
}

type TimeframeOption = 'week' | 'month' | 'year' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  movements = [],
  products = [],
  documents = []
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('month');
  const [filterType, setFilterType] = useState<string>('ALL');

  const safeMovements = movements || [];
  const safeDocs = documents || [];

  const getTimeframeCutoff = (tf: TimeframeOption): number => {
    const d = new Date();
    if (tf === 'week') {
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (tf === 'month') {
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (tf === 'year') {
      d.setDate(d.getDate() - 365);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    return 0;
  };

  const cutoffTime = getTimeframeCutoff(timeframe);

  const timeframeMovements = safeMovements.filter(m => {
    const t = new Date(m.createdAt).getTime();
    return t >= cutoffTime;
  });

  const timeframeDocs = safeDocs.filter(d => {
    const dateStr = d.issuedAt || d.createdAt || d.date || new Date().toISOString();
    const t = new Date(dateStr).getTime();
    return t >= cutoffTime;
  });

  const totalInQty = timeframeMovements
    .filter(m => m.type === 'IN')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalOutQty = timeframeMovements
    .filter(m => m.type === 'OUT' || m.type === 'SALE')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalSalesRevenue = timeframeDocs.reduce((acc, d) => acc + d.totalAmount, 0);

  const itemSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};
  timeframeDocs.forEach(doc => {
    (doc.items || []).forEach(item => {
      if (!itemSalesMap[item.productCode]) {
        itemSalesMap[item.productCode] = { name: item.productName, qty: 0, revenue: 0 };
      }
      itemSalesMap[item.productCode].qty += item.quantity;
      itemSalesMap[item.productCode].revenue += item.amount;
    });
  });

  const topSellingItems = Object.values(itemSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const filteredMovements = timeframeMovements.filter(m => {
    if (filterType === 'ALL') return true;
    return m.type === filterType;
  });

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'week':
        return '7 วันล่าสุด';
      case 'month':
        return '30 วันล่าสุด';
      case 'year':
        return '365 วันล่าสุด';
      case 'all':
        return 'ทั้งหมด';
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Segmented Bar & Excel Exports */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F7F5EF] p-1 rounded-xl border border-[#E6E2D6]">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              timeframe === 'week'
                ? 'bg-[#5A8F3E] text-white'
                : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            รายสัปดาห์ (7 วัน)
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              timeframe === 'month'
                ? 'bg-[#5A8F3E] text-white'
                : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            รายเดือน (30 วัน)
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              timeframe === 'year'
                ? 'bg-[#5A8F3E] text-white'
                : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            รายปี (365 วัน)
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              timeframe === 'all'
                ? 'bg-[#263E1A] text-white'
                : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            ทั้งหมด
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportMovementsToExcel(timeframeMovements)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E6E2D6] text-[#23311D] hover:bg-[#F7F5EF] rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#5A8F3E]" />
            <span>Excel เคลื่อนไหวสต็อค ({timeframeMovements.length})</span>
          </button>

          <button
            onClick={() => exportDocumentsToExcel(timeframeDocs)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E6E2D6] text-[#23311D] hover:bg-[#F7F5EF] rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#8B5E34]" />
            <span>Excel ยอดขาย ({timeframeDocs.length})</span>
          </button>

          <button
            onClick={() => exportProductsToExcel(products)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel สต็อคคงเหลือ</span>
          </button>
        </div>
      </div>

      {/* 3-Column KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#8B5E34]">
              รับผักสดเข้าคลัง ({getTimeframeLabel()})
            </p>
            <p className="text-2xl font-bold text-[#5A8F3E] mt-1 font-mono tabular-nums">
              +{totalInQty.toLocaleString()}{' '}
              <span className="text-xs font-sans font-normal text-[#6B665B]">หน่วย</span>
            </p>
            <p className="text-xs text-[#6B665B] mt-1 tabular-nums">
              จากรายการรับเข้า {timeframeMovements.filter(m => m.type === 'IN').length} รอบ
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] text-[#5A8F3E] flex items-center justify-center border border-[#E6E2D6]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#8B5E34]">
              ตัดสต็อคจำหน่าย ({getTimeframeLabel()})
            </p>
            <p className="text-2xl font-bold text-[#8B5E34] mt-1 font-mono tabular-nums">
              -{totalOutQty.toLocaleString()}{' '}
              <span className="text-xs font-sans font-normal text-[#6B665B]">หน่วย</span>
            </p>
            <p className="text-xs text-[#6B665B] mt-1">
              รวมยอดขายหน้าร้าน POS และใบส่งของ B2B
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] text-[#8B5E34] flex items-center justify-center border border-[#E6E2D6]">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#8B5E34]">
              ยอดขายรวมสุทธิ ({getTimeframeLabel()})
            </p>
            <p className="text-2xl font-bold text-[#263E1A] mt-1 font-mono tabular-nums">
              ฿{totalSalesRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-[#5A8F3E] mt-1 tabular-nums">
              จากเอกสารการขาย {timeframeDocs.length} ฉบับ
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] text-[#263E1A] flex items-center justify-center border border-[#E6E2D6]">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E2D6] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6E2D6] pb-3">
          <h3 className="font-bold text-[#263E1A] text-sm">
            อันดับสินค้าขายดี ({getTimeframeLabel()})
          </h3>
          <span className="text-xs text-[#8B5E34] font-mono tabular-nums">
            คำนวณจาก {timeframeDocs.length} บิล
          </span>
        </div>

        {topSellingItems.length === 0 ? (
          <p className="text-xs text-[#6B665B] text-center py-6">
            ไม่มีข้อมูลการขายในช่วงเวลานี้
          </p>
        ) : (
          <div className="space-y-3">
            {topSellingItems.map((item, idx) => {
              const maxQty = topSellingItems[0].qty || 1;
              const pct = Math.round((item.qty / maxQty) * 100);
              return (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium text-[#23311D]">
                    <span>
                      0{idx + 1}. {item.name}
                    </span>
                    <span className="font-mono font-semibold text-[#5A8F3E] tabular-nums">
                      {item.qty} หน่วย · ฿{item.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F7F5EF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5A8F3E] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock Movement Audit Table */}
      <div className="bg-white rounded-2xl border border-[#E6E2D6] overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6E2D6]">
          <div>
            <h3 className="font-bold text-[#263E1A] text-sm">ตารางประวัติการเคลื่อนไหวสต็อค</h3>
            <p className="text-xs text-[#6B665B] mt-0.5">
              ช่วงเวลา: {getTimeframeLabel()}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#8B5E34]" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-medium text-[#23311D] focus:outline-none focus:border-[#5A8F3E]"
            >
              <option value="ALL">ทุกประเภท</option>
              <option value="IN">รับเข้า (+)</option>
              <option value="OUT">เบิกออก (-)</option>
              <option value="SALE">ขายหน้าร้าน/จัดส่ง (-)</option>
              <option value="ADJUST">ปรับยอดสุทธิ</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6]">
              <tr className="text-[#8B5E34] font-semibold">
                <th className="px-5 py-3.5">วันและเวลา</th>
                <th className="px-5 py-3.5">รายการสินค้า</th>
                <th className="px-5 py-3.5">ประเภท</th>
                <th className="px-5 py-3.5 text-right">จำนวน</th>
                <th className="px-5 py-3.5 text-right">คงเหลือหลังรายการ</th>
                <th className="px-5 py-3.5">อ้างอิง</th>
                <th className="px-5 py-3.5">ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D6]">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#6B665B]">
                    ไม่พบประวัติการเคลื่อนไหวสินค้าในช่วงเวลานี้
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => (
                  <tr key={m.id} className="hover:bg-[#FAF8F3] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#6B665B] tabular-nums whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-[#23311D]">{m.productName}</span>
                      <span className="block font-mono text-[10px] text-[#8B5E34] tabular-nums">
                        {m.productCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          m.type === 'IN' ? 'text-[#5A8F3E]' : 'text-[#8B5E34]'
                        }`}
                      >
                        {m.type === 'IN'
                          ? 'รับเข้าคลัง (+)'
                          : m.type === 'SALE'
                          ? 'จำหน่าย (-)'
                          : 'เบิกออก (-)'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                      <span className={m.type === 'IN' ? 'text-[#5A8F3E]' : 'text-[#8B5E34]'}>
                        {m.type === 'IN' ? '+' : '-'}{m.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-[#263E1A] tabular-nums whitespace-nowrap">
                      {m.balanceAfter}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#6B665B] whitespace-nowrap">
                      {m.refDocumentNo || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B665B] whitespace-nowrap">{m.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

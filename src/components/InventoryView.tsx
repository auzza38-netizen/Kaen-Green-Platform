import React, { useState } from 'react';
import { Product, User, StockMovement } from '../types';
import { exportProductsToExcel } from '../utils/excelExport';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Camera,
  Edit,
  Trash2,
  FileSpreadsheet,
  TrendingUp,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Download,
  Clock,
  Calendar,
  History,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  FileCode,
  ArrowUpDown
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  movements?: StockMovement[];
  onSaveProduct: (product: Partial<Product>, customMovement?: Partial<StockMovement>) => void;
  onDeleteProduct: (id: string) => void;
  onOpenScanner: () => void;
  currentUser: User;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products = [],
  movements = [],
  onSaveProduct,
  onDeleteProduct,
  onOpenScanner,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'stock_asc' | 'stock_desc' | 'price'>('name');

  // Add/Edit Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Quick Stock Adjustment & Refill Modal State
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustDate, setAdjustDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [adjustNote, setAdjustNote] = useState<string>('เติมสต็อคผักสดประจำวัน');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const safeProducts = products || [];
  const categories = Array.from(new Set(safeProducts.map(p => p.category)));

  // Filtered and Sorted list
  const filteredProducts = safeProducts
    .filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.qrCode && p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesLowStock = !onlyLowStock || p.quantity <= p.minQuantity;

      return matchesSearch && matchesCategory && matchesLowStock;
    })
    .sort((a, b) => {
      if (sortBy === 'stock_asc') return a.quantity - b.quantity;
      if (sortBy === 'stock_desc') return b.quantity - a.quantity;
      if (sortBy === 'price') return b.sellingPrice - a.sellingPrice;
      return a.name.localeCompare(b.name, 'th');
    });

  const lowStockCount = safeProducts.filter(p => p.quantity <= p.minQuantity).length;
  const totalItemsCount = safeProducts.reduce((acc, p) => acc + p.quantity, 0);
  const totalStockValuation = safeProducts.reduce((acc, p) => acc + p.quantity * p.costPrice, 0);
  const totalRetailValue = safeProducts.reduce((acc, p) => acc + p.quantity * p.sellingPrice, 0);

  const handleOpenAddModal = () => {
    setEditingProduct({
      code: `${Math.floor(8850000000000 + Math.random() * 999999999)}`,
      qrCode: `KG-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: categories[0] || 'Premium Pack',
      unit: 'แพ็ค (200g)',
      costPrice: 35,
      sellingPrice: 60,
      quantity: 20,
      minQuantity: 10,
      location: 'ห้องเย็น Cold-A01',
      imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&auto=format&fit=crop&q=80',
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct({ ...prod });
    setModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedbackBanner('ขนาดไฟล์รูปภาพใหญ่เกินไป (โปรดเลือกไฟล์ขนาดไม่เกิน 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Url = reader.result;
        setEditingProduct(prev => (prev ? { ...prev, imageUrl: base64Url } : null));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.code) {
      return;
    }
    onSaveProduct(editingProduct);
    setModalOpen(false);
    setEditingProduct(null);
    setFeedbackBanner(`บันทึกข้อมูลสินค้า "${editingProduct.name}" เรียบร้อยแล้ว`);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleOpenAdjustModal = (p: Product) => {
    setAdjustModalProduct(p);
    setAdjustType('IN');
    setAdjustQty(10);
    setAdjustDate(new Date().toISOString().slice(0, 16));
    setAdjustNote('เติมสต็อคผักสดประจำวัน');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    let delta = 0;
    let newQty = 0;

    if (adjustType === 'IN') {
      delta = Math.max(1, adjustQty);
      newQty = adjustModalProduct.quantity + delta;
    } else if (adjustType === 'OUT') {
      delta = Math.max(1, adjustQty);
      newQty = adjustModalProduct.quantity - delta;
    } else {
      newQty = Math.max(0, adjustQty);
      delta = newQty - adjustModalProduct.quantity;
    }

    if (newQty < 0) {
      setFeedbackBanner('จำนวนสต็อคคงเหลือต้องไม่ติดลบ');
      return;
    }

    const customMovement: Partial<StockMovement> = {
      type: adjustType,
      quantity: Math.abs(delta),
      balanceAfter: newQty,
      refDocumentNo: adjustNote.trim() || 'MANUAL-REFILL',
      createdBy: currentUser.name,
      createdAt: adjustDate ? new Date(adjustDate).toISOString() : new Date().toISOString()
    };

    onSaveProduct(
      {
        ...adjustModalProduct,
        quantity: newQty,
        updatedAt: customMovement.createdAt
      },
      customMovement
    );

    setFeedbackBanner(
      `บันทึกสต็อค "${adjustModalProduct.name}" สำเร็จ (${delta >= 0 ? '+' : ''}${delta} ${adjustModalProduct.unit} · คงเหลือ ${newQty} ${adjustModalProduct.unit})`
    );
    setTimeout(() => setFeedbackBanner(null), 4000);
    setAdjustModalProduct(null);
  };

  const handleDownloadLogFile = (product: Product) => {
    const productMovements = (movements || []).filter(
      m => m.productId === product.id || m.productCode === product.code
    );

    const nowStr = new Date().toLocaleString('th-TH');
    let logText = `======================================================================\n`;
    logText += `  KAEN GREEN POS & CLOUD INVENTORY - STOCK ADJUSTMENT & REFILL LOG\n`;
    logText += `======================================================================\n`;
    logText += `รหัสสินค้า (Product Code) : ${product.code}\n`;
    logText += `ชื่อสินค้า (Product Name) : ${product.name}\n`;
    logText += `หมวดหมู่ (Category)      : ${product.category}\n`;
    logText += `จำนวนคงเหลือปัจจุบัน     : ${product.quantity} ${product.unit}\n`;
    logText += `วันที่ดาวน์โหลด Log      : ${nowStr}\n`;
    logText += `ผู้ขอส่งออก Log          : ${currentUser.name}\n`;
    logText += `======================================================================\n\n`;
    logText += `[ประวัติการปรับ/เติมสต็อคในแต่ละรอบ (Adjustment & Refill Log Rounds)]\n`;
    logText += `----------------------------------------------------------------------------------------------------\n`;
    logText += `ลำดับ\tวันที่-เวลา\t\t\tประเภท\t\tจำนวนปรับ/เติม\tคงเหลือหลังปรับ\tผู้ทำรายการ\t\tหมายเหตุ/เลขที่อ้างอิง\n`;
    logText += `----------------------------------------------------------------------------------------------------\n`;

    if (productMovements.length === 0) {
      logText += `(ยังไม่มีประวัติการปรับ/เติมสต็อคบันทึกไว้ในระบบ)\n`;
    } else {
      productMovements.forEach((m, idx) => {
        const dateFormatted = new Date(m.createdAt).toLocaleString('th-TH');
        const typeLabel =
          m.type === 'IN'
            ? 'รับเข้า/เติม (+)'
            : m.type === 'OUT'
            ? 'เบิกออก (-)'
            : m.type === 'SALE'
            ? 'ขายหน้าร้าน (-)'
            : 'ปรับยอด';
        const qtyStr =
          (m.type === 'IN' ? '+' : m.type === 'OUT' || m.type === 'SALE' ? '-' : '') +
          m.quantity;
        logText += `${idx + 1}\t${dateFormatted}\t${typeLabel}\t${qtyStr} ${product.unit}\t\t${
          m.balanceAfter
        } ${product.unit}\t${m.createdBy}\t${m.refDocumentNo || '-'}\n`;
      });
    }

    logText += `----------------------------------------------------------------------------------------------------\n`;
    logText += `END OF LOG FILE - KAEN GREEN POS\n`;

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Stock_Adjustment_Log_${product.code}_${new Date().toISOString().slice(0, 10)}.log`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {feedbackBanner && (
        <div className="bg-[#263E1A] text-white px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between border border-[#5A8F3E]">
          <span>{feedbackBanner}</span>
          <button onClick={() => setFeedbackBanner(null)} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#8B5E34]">รายการสินค้าทั้งหมด</p>
            <p className="text-2xl font-bold text-[#263E1A] mt-1 tabular-nums">
              {products.length}{' '}
              <span className="text-xs font-normal text-[#6B665B]">รายการ</span>
            </p>
            <p className="text-xs text-[#6B665B] mt-1 tabular-nums">
              รวมสต็อคคงเหลือ {totalItemsCount.toLocaleString()} หน่วย
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] text-[#5A8F3E] flex items-center justify-center border border-[#E6E2D6]">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#8B5E34]">สินค้าใกล้หมด (ต้องเติมสต็อค)</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${lowStockCount > 0 ? 'text-[#D97706]' : 'text-[#263E1A]'}`}>
              {lowStockCount}{' '}
              <span className="text-xs font-normal text-[#6B665B]">รายการ</span>
            </p>
            <p className="text-xs text-[#6B665B] mt-1">
              {lowStockCount > 0 ? 'ต่ำกว่าเกณฑ์ขั้นต่ำที่กำหนด' : 'สต็อคพร้อมจำหน่ายทุกรายการ'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] text-[#D97706] flex items-center justify-center border border-[#E6E2D6]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#8B5E34]">มูลค่าต้นทุนสินค้าคงคลัง</p>
            <p className="text-2xl font-bold text-[#263E1A] mt-1 font-mono tabular-nums">
              ฿{totalStockValuation.toLocaleString()}
            </p>
            <p className="text-xs text-[#5A8F3E] mt-1 tabular-nums">
              มูลค่าขายปลีกรวม ฿{totalRetailValue.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] text-[#5A8F3E] flex items-center justify-center border border-[#E6E2D6]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#8B5E34]">ผู้ดูแลคลังสินค้าขณะนี้</p>
            <p className="text-sm font-semibold text-[#263E1A] mt-1 truncate">{currentUser.name}</p>
            <p className="text-xs text-[#6B665B] mt-0.5">
              {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สต็อค (Member)'}
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="w-full py-2 px-4 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินค้าใหม่เข้าคลัง</span>
          </button>
        </div>
      </div>

      {/* Minimal Search, Filter & Action Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input + Sort Selector */}
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8B5E34] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผักสด, รหัสบาร์โค้ด SKU, หรือห้องเย็น..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-xs bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5E34] hover:text-[#23311D]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8B5E34] shrink-0 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-[#23311D] font-medium focus:outline-none focus:border-[#5A8F3E]"
              >
                <option value="name">เรียงตามชื่อสินค้า (ก-ฮ)</option>
                <option value="stock_asc">สต็อคน้อยไปมาก (ใกล้หมดก่อน)</option>
                <option value="stock_desc">สต็อคมากไปน้อย</option>
                <option value="price">ราคาขายสูงไปต่ำ</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#263E1A] hover:bg-[#1b2d12] text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span>สแกนบาร์โค้ด</span>
            </button>

            <a
              href={localStorage.getItem('kaen_custom_google_sheet_url') || 'https://sheets.new'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#263E1A] border border-[#E6E2D6] rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              title="เปิด Google Sheets Master Inventory (auzza38@gmail.com)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#5A8F3E]" />
              <span>Google Sheets</span>
            </a>

            <button
              onClick={() => exportProductsToExcel(products)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F7F5EF] text-[#23311D] border border-[#E6E2D6] rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#8B5E34]" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสินค้า</span>
            </button>
          </div>
        </div>

        {/* Category Segmented Filter Bar & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E2D6] pt-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setOnlyLowStock(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'ALL' && !onlyLowStock
                  ? 'bg-[#5A8F3E] text-white'
                  : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
              }`}
            >
              ทั้งหมด ({products.length})
            </button>

            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                onlyLowStock
                  ? 'bg-[#D97706] text-white'
                  : 'bg-[#F7F5EF] text-[#8B5E34] hover:text-[#23311D]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ใกล้หมด ({lowStockCount})</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setOnlyLowStock(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat && !onlyLowStock
                    ? 'bg-[#5A8F3E] text-white'
                    : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode Segmented Control */}
          <div className="flex items-center gap-1 bg-[#F7F5EF] p-1 rounded-lg border border-[#E6E2D6] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#263E1A] shadow-xs'
                  : 'text-[#6B665B] hover:text-[#23311D]'
              }`}
            >
              การ์ดสินค้า
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'table'
                  ? 'bg-white text-[#263E1A] shadow-xs'
                  : 'text-[#6B665B] hover:text-[#23311D]'
              }`}
            >
              ตารางข้อมูล
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid / Table Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E6E2D6] space-y-3">
          <Package className="w-10 h-10 mx-auto text-[#8B5E34]/60" />
          <p className="font-semibold text-[#263E1A] text-base">ไม่พบรายการสินค้าที่ค้นหา</p>
          <p className="text-xs text-[#6B665B]">
            ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มสินค้าใหม่เข้าสู่คลังสินค้า
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map(p => {
            const isLow = p.quantity <= p.minQuantity;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#E6E2D6] overflow-hidden flex flex-col justify-between hover:border-[#5A8F3E] transition-colors"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-4/3 bg-[#F7F5EF] overflow-hidden border-b border-[#E6E2D6]">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&auto=format&fit=crop&q=80'}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Card Body: Leads directly with Title & Quiet Unboxed Metadata */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold text-[#263E1A] text-base leading-snug line-clamp-2">
                        {p.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#8B5E34] mt-1.5">
                        <span className="font-mono tabular-nums">{p.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.location}</span>
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-[#6B665B] line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {/* Stock & Price Row */}
                    <div className="pt-3 border-t border-[#E6E2D6] flex items-baseline justify-between">
                      <div>
                        <p className="text-[11px] text-[#6B665B]">
                          คงเหลือสต็อค {isLow ? '(ใกล้หมด)' : ''}
                        </p>
                        <p
                          className={`text-xl font-bold tabular-nums mt-0.5 ${
                            isLow ? 'text-[#D97706]' : 'text-[#263E1A]'
                          }`}
                        >
                          {p.quantity}{' '}
                          <span className="text-xs font-normal text-[#6B665B]">{p.unit}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-[#6B665B]">ราคาจำหน่าย</p>
                        <p className="text-lg font-bold text-[#5A8F3E] font-mono tabular-nums mt-0.5">
                          ฿{p.sellingPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-[#FAF8F3] border-t border-[#E6E2D6] flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleOpenAdjustModal(p)}
                    className="flex-1 py-2 px-3 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>ปรับ / เติมสต็อค</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="p-2 text-[#6B665B] hover:text-[#263E1A] hover:bg-white rounded-lg border border-transparent hover:border-[#E6E2D6] transition-colors"
                    title="แก้ไขข้อมูลสินค้า"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="p-2 text-[#6B665B] hover:text-[#DC2626] hover:bg-white rounded-lg border border-transparent hover:border-[#E6E2D6] transition-colors"
                    title="ลบรายการสินค้า"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Minimal Luxury High-Density Table View */
        <div className="bg-white rounded-2xl border border-[#E6E2D6] overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6]">
              <tr className="text-[#8B5E34] text-xs font-semibold">
                <th className="px-5 py-3.5">รหัสสินค้า</th>
                <th className="px-5 py-3.5">รายการสินค้า</th>
                <th className="px-5 py-3.5">หมวดหมู่ · สถานที่เก็บ</th>
                <th className="px-5 py-3.5 text-right">คงเหลือ</th>
                <th className="px-5 py-3.5 text-right">ราคาทุน</th>
                <th className="px-5 py-3.5 text-right">ราคาขาย</th>
                <th className="px-5 py-3.5 text-right">จัดการสต็อค</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D6]">
              {filteredProducts.map(p => {
                const isLow = p.quantity <= p.minQuantity;
                return (
                  <tr key={p.id} className="hover:bg-[#FAF8F3] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#6B665B] tabular-nums whitespace-nowrap">
                      {p.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-cover border border-[#E6E2D6] shrink-0"
                        />
                        <span className="font-semibold text-[#23311D] text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B665B] whitespace-nowrap">
                      <span>{p.category}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>{p.location}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`font-mono font-semibold text-sm tabular-nums ${
                          isLow ? 'text-[#D97706]' : 'text-[#263E1A]'
                        }`}
                      >
                        {p.quantity}
                      </span>{' '}
                      <span className="text-[#6B665B]">{p.unit}</span>
                      {isLow && (
                        <span className="block text-[10px] text-[#D97706]">ต่ำกว่าเกณฑ์ ({p.minQuantity})</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#6B665B] tabular-nums whitespace-nowrap">
                      ฿{p.costPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-[#5A8F3E] text-sm tabular-nums whitespace-nowrap">
                      ฿{p.sellingPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjustModal(p)}
                          className="px-3 py-1.5 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>ปรับ/เติมสต็อค</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-[#6B665B] hover:text-[#263E1A] hover:bg-[#F7F5EF] rounded-lg"
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-[#6B665B] hover:text-[#DC2626] hover:bg-[#F7F5EF] rounded-lg"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E2D6] my-8">
            <div className="flex justify-between items-center pb-3.5 border-b border-[#E6E2D6]">
              <h3 className="font-bold text-[#263E1A] text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-[#5A8F3E]" />
                <span>{editingProduct.id ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่เข้าคลัง KAEN GREEN'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#8B5E34] hover:text-[#23311D] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">รหัสบาร์โค้ด / SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.code || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">รหัส QR Code</label>
                  <input
                    type="text"
                    value={editingProduct.qrCode || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, qrCode: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono focus:outline-none focus:border-[#5A8F3E]"
                    placeholder="KG-XXX"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-1">ชื่อสินค้า *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ผักสลัดกรีนโอ๊ค ออร์แกนิค (Premium Pack)"
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-medium focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">หมวดหมู่บรรจุภัณฑ์</label>
                  <input
                    type="text"
                    placeholder="เช่น Salad Mix Bag, Premium Pack"
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">หน่วยนับและขนาด</label>
                  <input
                    type="text"
                    placeholder="เช่น ถุง (150g), แพ็ค (200g), กล่อง (500g)"
                    value={editingProduct.unit || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">ราคาทุน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingProduct.costPrice ?? 0}
                    onChange={e => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono tabular-nums focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">ราคาขาย (บาท) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={editingProduct.sellingPrice ?? 0}
                    onChange={e => setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono tabular-nums text-[#5A8F3E] font-bold focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">จำนวนคงเหลือปัจจุบัน</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.quantity ?? 0}
                    onChange={e => setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono tabular-nums font-bold focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#23311D] block mb-1">จุดเตือนสินค้าใกล้หมด (Min)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.minQuantity ?? 10}
                    onChange={e => setEditingProduct({ ...editingProduct, minQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono tabular-nums text-[#8B5E34] font-bold focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-1">ตำแหน่งจัดเก็บ (ห้องเย็น / คลังสินค้า)</label>
                <input
                  type="text"
                  placeholder="เช่น ห้องเย็น Cold-A01"
                  value={editingProduct.location || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, location: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-1">รูปภาพสินค้า</label>
                <div className="space-y-2 bg-[#F7F5EF] p-3 rounded-xl border border-[#E6E2D6]">
                  <div className="flex items-center gap-3">
                    {editingProduct.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E6E2D6] bg-white shrink-0">
                        <img
                          src={editingProduct.imageUrl}
                          alt="preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, imageUrl: '' })}
                          className="absolute top-1 right-1 bg-[#23311D]/80 text-white rounded-full p-0.5"
                          title="ลบรูปออก"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-[#8B5E34]/40 bg-white flex flex-col items-center justify-center text-[#8B5E34] shrink-0">
                        <ImageIcon className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px]">ไม่มีรูป</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor="product-image-file-input"
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5A8F3E] hover:bg-[#436E2C] text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปจากเครื่อง</span>
                      </label>
                      <input
                        id="product-image-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <p className="text-[11px] text-[#6B665B]">รองรับไฟล์ PNG, JPG, WebP (ไม่เกิน 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6E2D6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#23311D] rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold"
                >
                  บันทึกข้อมูลสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Quick Modal */}
      {adjustModalProduct && (() => {
        const productMovements = (movements || []).filter(
          m => m.productId === adjustModalProduct.id || m.productCode === adjustModalProduct.code
        );

        let calculatedNewQty = adjustModalProduct.quantity;
        if (adjustType === 'IN') {
          calculatedNewQty = adjustModalProduct.quantity + (parseInt(String(adjustQty)) || 0);
        } else if (adjustType === 'OUT') {
          calculatedNewQty = adjustModalProduct.quantity - (parseInt(String(adjustQty)) || 0);
        } else {
          calculatedNewQty = parseInt(String(adjustQty)) || 0;
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E2D6] text-xs my-8 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D6]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#F7F5EF] text-[#5A8F3E] rounded-xl border border-[#E6E2D6]">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#263E1A] text-base">ปรับ / เติมสต็อคสินค้า</h3>
                    <p className="text-[11px] text-[#6B665B]">บันทึกการรับผักสดเข้าคลังหรือตัดจ่ายแต่ละรอบ</p>
                  </div>
                </div>
                <button
                  onClick={() => setAdjustModalProduct(null)}
                  className="p-1 hover:bg-[#F7F5EF] rounded-lg text-[#8B5E34]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info Banner */}
              <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E6E2D6] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={adjustModalProduct.imageUrl}
                    alt={adjustModalProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-lg object-cover border border-[#E6E2D6] shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-[#263E1A] text-sm">{adjustModalProduct.name}</p>
                    <p className="text-[11px] text-[#8B5E34] font-mono">
                      {adjustModalProduct.code} · {adjustModalProduct.location}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-[#6B665B]">คงเหลือปัจจุบัน</span>
                  <p className="text-lg font-bold text-[#5A8F3E] tabular-nums">
                    {adjustModalProduct.quantity}{' '}
                    <span className="text-xs font-normal text-[#6B665B]">{adjustModalProduct.unit}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                {/* Date & Time Picker */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-[#23311D] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5A8F3E]" />
                      <span>วันที่และเวลาทำรายการ</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdjustDate(new Date().toISOString().slice(0, 16))}
                      className="text-[11px] text-[#5A8F3E] hover:underline font-medium flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>ใช้เวลาปัจจุบัน</span>
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={adjustDate}
                    onChange={e => setAdjustDate(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-[#23311D] text-xs font-mono focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>

                {/* Transaction Type Selector */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#23311D] block">ประเภทรายการ</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustType('IN');
                        if (adjustQty <= 0) setAdjustQty(10);
                      }}
                      className={`py-2 px-2 rounded-xl font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                        adjustType === 'IN'
                          ? 'bg-[#5A8F3E] text-white border-[#5A8F3E]'
                          : 'bg-white text-[#23311D] border-[#E6E2D6] hover:bg-[#F7F5EF]'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>เติมสต็อค (+)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjustType('OUT');
                        if (adjustQty <= 0) setAdjustQty(5);
                      }}
                      className={`py-2 px-2 rounded-xl font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                        adjustType === 'OUT'
                          ? 'bg-[#8B5E34] text-white border-[#8B5E34]'
                          : 'bg-white text-[#23311D] border-[#E6E2D6] hover:bg-[#F7F5EF]'
                      }`}
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span>เบิกออก (-)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjustType('ADJUST');
                        setAdjustQty(adjustModalProduct.quantity);
                      }}
                      className={`py-2 px-2 rounded-xl font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                        adjustType === 'ADJUST'
                          ? 'bg-[#263E1A] text-white border-[#263E1A]'
                          : 'bg-white text-[#23311D] border-[#E6E2D6] hover:bg-[#F7F5EF]'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>กำหนดยอดสุทธิ</span>
                    </button>
                  </div>
                </div>

                {/* Adjustment Qty Input & Quick Buttons */}
                <div className="space-y-2.5 bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E6E2D6]">
                  <label className="font-semibold text-[#263E1A] block">
                    {adjustType === 'IN'
                      ? 'จำนวนที่รับเข้า / เติมเพิ่ม (+)'
                      : adjustType === 'OUT'
                      ? 'จำนวนที่เบิกออก / ปรับลด (-)'
                      : 'กำหนดยอดคงเหลือสุทธิใหม่'}
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustQty(Math.max(0, adjustQty - 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-[#E6E2D6] font-bold text-base text-[#23311D] hover:bg-[#FAF8F3] shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={adjustQty}
                      onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                      className="flex-1 p-2 text-center text-lg font-bold font-mono tabular-nums border border-[#E6E2D6] rounded-xl bg-white focus:outline-none focus:border-[#5A8F3E]"
                    />
                    <button
                      type="button"
                      onClick={() => setAdjustQty(adjustQty + 1)}
                      className="w-10 h-10 rounded-xl bg-white border border-[#E6E2D6] font-bold text-base text-[#23311D] hover:bg-[#FAF8F3] shrink-0"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset Quick Qty Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-[#8B5E34] mr-1">จำนวนด่วน:</span>
                    {[5, 10, 20, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAdjustQty(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums border transition-colors ${
                          adjustQty === val
                            ? 'bg-[#5A8F3E] text-white border-[#5A8F3E]'
                            : 'bg-white text-[#23311D] border-[#E6E2D6] hover:bg-[#FAF8F3]'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>

                  {/* Calculation Result Preview */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#E6E2D6] flex items-center justify-between">
                    <span className="text-[#6B665B]">
                      ยอดเดิม {adjustModalProduct.quantity}{' '}
                      {adjustType === 'IN' ? `+ ${adjustQty}` : adjustType === 'OUT' ? `- ${adjustQty}` : `→ ${adjustQty}`}
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${calculatedNewQty < 0 ? 'text-[#DC2626]' : 'text-[#5A8F3E]'}`}>
                      คงเหลือใหม่: {calculatedNewQty} {adjustModalProduct.unit}
                    </span>
                  </div>
                </div>

                {/* Ref Note Input */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#23311D] block">หมายเหตุ / เลขที่ล็อต</label>
                  <input
                    type="text"
                    placeholder="เช่น รับผักสดรอบเช้าจากฟาร์มขอนแก่น #LOT-KK"
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-[#23311D] text-xs focus:outline-none focus:border-[#5A8F3E]"
                  />
                </div>

                {/* Stock Movement Log History Section */}
                <div className="pt-2 border-t border-[#E6E2D6] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#263E1A] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#5A8F3E]" />
                      <span>ประวัติการปรับสต็อค ({productMovements.length} รอบ)</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownloadLogFile(adjustModalProduct)}
                      className="px-2.5 py-1 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#263E1A] border border-[#E6E2D6] rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <FileCode className="w-3.5 h-3.5 text-[#5A8F3E]" />
                      <span>ดาวน์โหลด .log</span>
                    </button>
                  </div>

                  <div className="max-h-32 overflow-y-auto border border-[#E6E2D6] rounded-xl bg-[#F7F5EF] divide-y divide-[#E6E2D6] text-[11px]">
                    {productMovements.length === 0 ? (
                      <p className="p-3 text-center text-[#6B665B]">ยังไม่มีประวัติการปรับสต็อคย้อนหลัง</p>
                    ) : (
                      productMovements.map(m => (
                        <div key={m.id} className="p-2.5 flex items-center justify-between bg-white/60">
                          <div>
                            <span className="text-[#6B665B] font-mono tabular-nums">{new Date(m.createdAt).toLocaleString('th-TH')}</span>
                            <span aria-hidden="true" className="mx-1.5 text-[#8B5E34]">·</span>
                            <span className="font-medium text-[#23311D]">{m.createdBy}</span>
                          </div>
                          <div className="font-mono tabular-nums text-right">
                            <span className={`font-bold ${m.type === 'IN' ? 'text-[#5A8F3E]' : 'text-[#8B5E34]'}`}>
                              {m.type === 'IN' ? '+' : '-'}{m.quantity}
                            </span>
                            <span className="text-[#6B665B] text-[10px] ml-1.5">(คงเหลือ {m.balanceAfter})</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-[#E6E2D6] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustModalProduct(null)}
                    className="px-4 py-2 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#23311D] rounded-xl font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกยอดสต็อค</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

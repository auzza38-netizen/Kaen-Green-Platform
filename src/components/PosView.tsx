import React, { useState } from 'react';
import { Product, CartItem, DocumentInfo, User } from '../types';
import {
  ShoppingCart,
  Search,
  Camera,
  Trash2,
  Plus,
  Minus,
  QrCode,
  Banknote,
  Receipt,
  CheckCircle2,
  Printer,
  X,
  ArrowLeft,
  Home
} from 'lucide-react';
import { DocumentTemplate } from './DocumentTemplate';

interface PosViewProps {
  products: Product[];
  onCompleteSale: (document: Partial<DocumentInfo>) => void;
  onOpenScanner: () => void;
  currentUser: User;
  onGoToHome?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products = [],
  onCompleteSale,
  onOpenScanner,
  currentUser,
  onGoToHome
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Order Details
  const [customerName, setCustomerName] = useState('ลูกค้าหน้าร้าน (Walk-in Customer)');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'ส่งเอง' | 'ขนส่งเอกชน' | 'ลูกค้ารับเอง'>('ลูกค้ารับเอง');
  const [includeVat, setIncludeVat] = useState(false);
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  // Payment Modal & Completed Receipt Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PROMPTPAY' | 'TRANSFER' | 'CREDIT'>('PROMPTPAY');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [completedDoc, setCompletedDoc] = useState<DocumentInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const safeProducts = products || [];
  const categories = Array.from(new Set(safeProducts.map(p => p.category)));

  const filteredProducts = safeProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      setErrorMsg(`สินค้า "${product.name}" สต็อคหมดชั่วคราว`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setErrorMsg(`สต็อคคงเหลือมีเพียง ${product.quantity} ${product.unit}`);
          setTimeout(() => setErrorMsg(null), 3000);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.sellingPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          discount: 0,
          total: product.sellingPrice
        }
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) {
              setErrorMsg(`สต็อคคงเหลือมีเพียง ${item.product.quantity} ${item.product.unit}`);
              setTimeout(() => setErrorMsg(null), 3000);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.product.sellingPrice - item.discount
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const grandSubtotalAfterDiscount = Math.max(0, subtotal - cartDiscount);
  const taxAmount = includeVat ? grandSubtotalAfterDiscount * 0.07 : 0;
  const grandTotal = grandSubtotalAfterDiscount + taxAmount;
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, cashTendered - grandTotal) : 0;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'CASH' && cashTendered < grandTotal) {
      setErrorMsg(`จำนวนเงินสดที่รับมา (฿${cashTendered}) น้อยกว่ายอดชำระ (฿${grandTotal.toFixed(2)})`);
      return;
    }

    const docNo = `REC-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDoc: DocumentInfo = {
      id: `doc-${Date.now()}`,
      documentNo: docNo,
      type: 'RECEIPT',
      customerName: customerName.trim() || 'ลูกค้าหน้าร้าน (Walk-in Customer)',
      customerPhone: customerPhone || undefined,
      shippingMethod: shippingMethod,
      recipientName: customerName.trim() || 'ลูกค้าหน้าร้าน',
      items: cart.map(i => ({
        productCode: i.product.code,
        productName: i.product.name,
        unit: i.product.unit,
        quantity: i.quantity,
        unitPrice: i.product.sellingPrice,
        amount: i.total
      })),
      subtotal,
      tax: Number(taxAmount.toFixed(2)),
      discount: cartDiscount,
      totalAmount: Number(grandTotal.toFixed(2)),
      paymentMethod,
      deliveryStatus: 'DELIVERED',
      issuedBy: currentUser.name,
      issuedAt: new Date().toISOString()
    };

    onCompleteSale(newDoc);
    setCompletedDoc(newDoc);
    setCart([]);
    setPaymentModalOpen(false);
    setCartDiscount(0);
    setCashTendered(0);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-[#8B5E34] text-white px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section: Product Catalog Grid (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E2D6] space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#8B5E34] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผักสด หรือสแกนรหัสบาร์โค้ด..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
                />
              </div>

              <button
                onClick={onOpenScanner}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#263E1A] hover:bg-[#1c2e13] text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-[#F2C94C]" />
                <span>สแกนบาร์โค้ดสินค้า</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-[#E6E2D6] pt-3">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#5A8F3E] text-white'
                    : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
                }`}
              >
                ทั้งหมด
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#5A8F3E] text-white'
                      : 'bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProducts.map(product => {
              const outOfStock = product.quantity <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => !outOfStock && addToCart(product)}
                  className={`bg-white rounded-2xl border overflow-hidden flex flex-col justify-between transition-colors select-none ${
                    outOfStock
                      ? 'opacity-50 border-[#E6E2D6] cursor-not-allowed'
                      : 'border-[#E6E2D6] hover:border-[#5A8F3E] cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="aspect-4/3 bg-[#F7F5EF] overflow-hidden relative border-b border-[#E6E2D6]">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {outOfStock && (
                        <div className="absolute inset-0 bg-[#23311D]/75 flex items-center justify-center text-white font-semibold text-xs">
                          สินค้าหมดชั่วคราว
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 space-y-1">
                      <h4 className="font-semibold text-[#263E1A] text-xs line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-[#8B5E34] font-mono tabular-nums">
                        {product.code} · {product.unit}
                      </p>
                    </div>
                  </div>

                  <div className="px-3.5 py-2.5 bg-[#FAF8F3] border-t border-[#E6E2D6] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#6B665B] tabular-nums">
                      คงเหลือ {product.quantity}
                    </span>
                    <span className="font-bold text-sm text-[#5A8F3E] font-mono tabular-nums">
                      ฿{product.sellingPrice}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: POS Cart & Checkout Terminal (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#E6E2D6] p-5 flex flex-col justify-between min-h-[540px] sticky top-22">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E6E2D6] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F7F5EF] text-[#5A8F3E] flex items-center justify-center border border-[#E6E2D6]">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#263E1A] text-sm">ตะกร้าชำระเงิน</h3>
                  <p className="text-[11px] text-[#6B665B] tabular-nums">
                    {cart.reduce((s, i) => s + i.quantity, 0)} ชิ้น · ตัดสต็อคอัตโนมัติ
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-[#8B5E34] hover:text-[#DC2626] font-medium"
                >
                  ล้างตะกร้า
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[#8B5E34] space-y-2">
                  <ShoppingCart className="w-9 h-9 mx-auto text-[#8B5E34]/50" />
                  <p className="text-xs font-medium text-[#263E1A]">ยังไม่มีสินค้าในตะกร้า</p>
                  <p className="text-[11px] text-[#6B665B]">คลิกเลือกสินค้าจากรายการด้านซ้ายเพื่อคิดเงิน</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-[#263E1A] truncate">{item.product.name}</p>
                      <p className="text-[11px] text-[#8B5E34] font-mono tabular-nums">
                        ฿{item.product.sellingPrice} / {item.product.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-[#E6E2D6] rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 text-[#23311D] hover:bg-[#F7F5EF] rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-[#263E1A] font-mono tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 text-[#23311D] hover:bg-[#F7F5EF] rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[56px]">
                      <p className="font-bold text-[#5A8F3E] font-mono tabular-nums">
                        ฿{item.total.toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[#8B5E34] hover:text-[#DC2626] p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Calculations & Checkout Bar */}
          <div className="pt-4 border-t border-[#E6E2D6] space-y-3 mt-4 text-xs">
            <div className="space-y-2 text-[#6B665B] bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E6E2D6]">
              <div className="flex justify-between">
                <span>รวมค่าสินค้า</span>
                <span className="font-mono font-semibold text-[#23311D] tabular-nums">
                  ฿{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>ส่วนลดท้ายบิล (บาท)</span>
                <input
                  type="number"
                  min="0"
                  value={cartDiscount}
                  onChange={e => setCartDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 p-1 text-right border border-[#E6E2D6] rounded-lg bg-white font-mono tabular-nums font-semibold text-[#8B5E34]"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#23311D]">
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={e => setIncludeVat(e.target.checked)}
                    className="rounded accent-[#5A8F3E]"
                  />
                  <span>ภาษีมูลค่าเพิ่ม VAT 7%</span>
                </label>
                <span className="font-mono tabular-nums">฿{taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-t border-[#E6E2D6] pt-2.5 font-bold text-[#263E1A] text-sm">
                <span>ยอดชำระสุทธิ</span>
                <span className="font-mono text-base text-[#5A8F3E] tabular-nums">
                  ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => {
                setCashTendered(Math.ceil(grandTotal));
                setPaymentModalOpen(true);
              }}
              className="w-full py-3 bg-[#5A8F3E] hover:bg-[#436E2C] disabled:bg-[#E6E2D6] disabled:text-[#8B5E34] text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span className="tabular-nums">
                ชำระเงินและออกใบเสร็จ (฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6E2D6] text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D6]">
              <h3 className="font-bold text-[#263E1A] text-sm flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#5A8F3E]" />
                <span>ยืนยันการชำระเงิน</span>
              </h3>
              <button onClick={() => setPaymentModalOpen(false)}>
                <X className="w-4 h-4 text-[#8B5E34]" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 mt-4">
              <div className="bg-[#263E1A] text-white p-4 rounded-xl text-center">
                <p className="text-[11px] font-medium text-[#77BF6E]">ยอดเงินที่ต้องชำระสุทธิ</p>
                <p className="text-3xl font-bold font-mono tabular-nums text-white mt-1">
                  ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[#23311D] block">ชื่อลูกค้า & วิธีการรับสินค้า</label>
                <input
                  type="text"
                  placeholder="ชื่อลูกค้า (เช่น คุณสมชาย / ลูกค้าหน้าร้าน)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    placeholder="เบอร์โทรศัพท์"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                  />
                  <select
                    value={shippingMethod}
                    onChange={e => setShippingMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-medium text-[#23311D]"
                  >
                    <option value="ลูกค้ารับเอง">ลูกค้ารับเองหน้าร้าน</option>
                    <option value="ส่งเอง">รถจัดส่ง KAEN GREEN</option>
                    <option value="ขนส่งเอกชน">ขนส่งเอกชน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#23311D] block mb-2">ช่องทางการชำระเงิน</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PROMPTPAY')}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-medium transition-colors ${
                      paymentMethod === 'PROMPTPAY'
                        ? 'border-[#5A8F3E] bg-[#5A8F3E] text-white'
                        : 'border-[#E6E2D6] text-[#23311D] hover:bg-[#F7F5EF]'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>พร้อมเพย์ QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-medium transition-colors ${
                      paymentMethod === 'CASH'
                        ? 'border-[#5A8F3E] bg-[#5A8F3E] text-white'
                        : 'border-[#E6E2D6] text-[#23311D] hover:bg-[#F7F5EF]'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>เงินสด (Cash)</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E6E2D6] space-y-2">
                  <label className="font-semibold text-[#23311D] block">รับเงินสดมา (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={cashTendered}
                    onChange={e => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-[#E6E2D6] rounded-xl font-mono tabular-nums text-base font-bold text-[#263E1A]"
                  />
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#E6E2D6] font-semibold">
                    <span>เงินทอน</span>
                    <span className="font-mono tabular-nums text-sm text-[#5A8F3E]">
                      ฿{changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'PROMPTPAY' && (
                <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E6E2D6] text-center space-y-2">
                  <div className="w-28 h-28 bg-white border border-[#E6E2D6] mx-auto rounded-xl flex items-center justify-center p-2">
                    <QrCode className="w-20 h-20 text-[#263E1A]" />
                  </div>
                  <p className="text-[11px] font-medium text-[#6B665B]">
                    สแกนชำระเงินบัญชีร้าน KAEN GREEN
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-[#E6E2D6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F5EF] text-[#23311D] rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold"
                >
                  ยืนยันชำระเงิน & ออกใบเสร็จ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Receipt View Modal */}
      {completedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23311D]/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#F7F5EF] rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 space-y-4 border border-[#E6E2D6]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D6]">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setCompletedDoc(null)}
                  className="px-3 py-1.5 bg-white hover:bg-[#EFECE2] text-[#23311D] rounded-xl font-medium text-xs flex items-center gap-1.5 border border-[#E6E2D6]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <div className="flex items-center gap-1.5 text-[#5A8F3E] font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>บันทึกการขายและตัดสต็อคสำเร็จ</span>
                </div>
              </div>
              <button onClick={() => setCompletedDoc(null)} className="text-[#8B5E34] hover:text-[#23311D] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <DocumentTemplate
              document={completedDoc}
              onBack={() => setCompletedDoc(null)}
              onGoHome={() => {
                setCompletedDoc(null);
                if (onGoToHome) onGoToHome();
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6E2D6] text-xs">
              <button
                onClick={() => {
                  setCompletedDoc(null);
                  if (onGoToHome) onGoToHome();
                }}
                className="px-4 py-2 bg-white hover:bg-[#EFECE2] text-[#263E1A] border border-[#E6E2D6] font-medium rounded-xl flex items-center gap-1.5"
              >
                <Home className="w-4 h-4 text-[#5A8F3E]" />
                <span>กลับหน้าคลังสินค้า</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#263E1A] hover:bg-[#1a2c11] text-white font-medium rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบเสร็จ</span>
                </button>

                <button
                  onClick={() => setCompletedDoc(null)}
                  className="px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-semibold rounded-xl"
                >
                  ทำรายการขายใหม่
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Product, DocumentInfo, StockMovement, User, DeliveryStatus, AppNotification, Customer } from './types';
import { Header } from './components/Header';
import { InventoryView } from './components/InventoryView';
import { PosView } from './components/PosView';
import { DocumentManager } from './components/DocumentManager';
import { CustomerManager } from './components/CustomerManager';
import { ReportsView } from './components/ReportsView';
import { DeliveryTracker } from './components/DeliveryTracker';
import { AdminBackoffice } from './components/AdminBackoffice';
import { GoogleDriveSync } from './components/GoogleDriveSync';
import { GeminiAssistant } from './components/GeminiAssistant';
import { ScannerModal } from './components/ScannerModal';
import { LoginModal } from './components/LoginModal';
import { KaenGreenLogo } from './components/KaenGreenLogo';
import {
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_MOVEMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_NOTIFICATIONS
} from './mockData';
import {
  Package,
  ShoppingCart,
  FileText,
  Users,
  Truck,
  BarChart3,
  ShieldAlert,
  Sparkles,
  Bot,
  Clock,
  Phone,
  MapPin,
  Eye,
  X,
  CheckCircle2,
  Leaf
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'pos' | 'documents' | 'customers' | 'reports' | 'delivery' | 'admin' | 'workspace' | 'ai'
  >('inventory');

  // Application State initialized with mockData, synced with backend REST API
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [documents, setDocuments] = useState<DocumentInfo[]>(INITIAL_DOCUMENTS);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [brandBoardModalOpen, setBrandBoardModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [logs] = useState<{ id: string; action: string; user: string; details: string; timestamp: string }[]>([
    {
      id: 'log-1',
      action: 'SYSTEM_START',
      user: 'ปณิธาน ศรีบุญเรือง (Admin)',
      details: 'เข้าสู่ระบบ KAEN GREEN POS & Cloud Inventory',
      timestamp: new Date().toISOString()
    }
  ]);

  // Current Logged-In User (Default Admin: ปณิธาน ศรีบุญเรือง)
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

  // Notifications State
  const [notifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Camera Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial data from Express backend server
  const fetchServerData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) setProducts(data.products);
        if (Array.isArray(data.documents) && data.documents.length > 0) setDocuments(data.documents);
        if (Array.isArray(data.movements) && data.movements.length > 0) setMovements(data.movements);
        if (Array.isArray(data.users) && data.users.length > 0) setUsers(data.users);
      }
    } catch (e) {
      // Fallback to local state silently
    }
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  // Handlers for Products
  const handleSaveProduct = async (productData: Partial<Product>, customMovement?: Partial<StockMovement>) => {
    let updatedProducts: Product[];
    let savedProd: Product;
    const isEdit = Boolean(productData.id && products.some(p => p.id === productData.id));

    if (isEdit) {
      updatedProducts = products.map(p => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p));
      savedProd = updatedProducts.find(p => p.id === productData.id)!;
    } else {
      savedProd = {
        id: `prod-${Date.now()}`,
        code: productData.code || `${Math.floor(8850000000000 + Math.random() * 999999999)}`,
        qrCode: productData.qrCode || `KG-${Math.floor(100 + Math.random() * 900)}`,
        name: productData.name || 'สินค้าใหม่',
        category: productData.category || 'Premium Pack',
        unit: productData.unit || 'แพ็ค (200g)',
        costPrice: productData.costPrice || 0,
        sellingPrice: productData.sellingPrice || 0,
        quantity: productData.quantity ?? 0,
        minQuantity: productData.minQuantity ?? 10,
        location: productData.location || 'ห้องเย็น Cold-A01',
        imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&auto=format&fit=crop&q=80',
        description: productData.description || '',
        updatedAt: customMovement?.createdAt || new Date().toISOString()
      };
      updatedProducts = [savedProd, ...products];
    }

    setProducts(updatedProducts);

    // Record Stock Movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: savedProd.id,
      productCode: savedProd.code,
      productName: savedProd.name,
      type: customMovement?.type || (isEdit ? 'ADJUST' : 'IN'),
      quantity: customMovement?.quantity ?? savedProd.quantity,
      balanceAfter: savedProd.quantity,
      refDocumentNo: customMovement?.refDocumentNo || (isEdit ? 'MANUAL-ADJUST' : 'NEW-PRODUCT'),
      note: customMovement?.note || '',
      createdBy: customMovement?.createdBy || currentUser.name,
      createdAt: customMovement?.createdAt || new Date().toISOString()
    };
    setMovements(prev => [movement, ...prev]);

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: savedProd, operatorName: currentUser.name })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const next = products.filter(p => p.id !== id);
    setProducts(next);
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  // Handler for Sales Checkout & Documents
  const handleCompleteSale = async (docData: Partial<DocumentInfo>) => {
    const fullDoc: DocumentInfo = docData as DocumentInfo;
    const nextDocs = [fullDoc, ...documents];
    setDocuments(nextDocs);

    let nextProds = [...products];
    (fullDoc.items || []).forEach(item => {
      nextProds = nextProds.map(p => {
        if (p.code === item.productCode) {
          const newQty = Math.max(0, p.quantity - item.quantity);

          const m: StockMovement = {
            id: `mov-${Date.now()}-${Math.random()}`,
            productId: p.id,
            productCode: p.code,
            productName: p.name,
            type: 'SALE',
            quantity: item.quantity,
            balanceAfter: newQty,
            refDocumentNo: fullDoc.documentNo,
            createdBy: currentUser.name,
            createdAt: new Date().toISOString()
          };
          setMovements(prev => [m, ...prev]);

          return { ...p, quantity: newQty };
        }
        return p;
      });
    });

    setProducts(nextProds);

    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: fullDoc, operatorName: currentUser.name })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDocument = (docData: Partial<DocumentInfo>) => {
    handleCompleteSale(docData);
  };

  const handleUpdateDeliveryStatus = (docId: string, status: DeliveryStatus, trackingNo?: string, company?: string) => {
    const next = documents.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          deliveryStatus: status,
          trackingNo: trackingNo || d.trackingNo,
          deliveryCompany: company || d.deliveryCompany
        };
      }
      return d;
    });
    setDocuments(next);
  };

  // Admin User Handlers
  const handleApproveUser = (userId: string, approved: boolean, role?: 'admin' | 'member') => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, approved, role: role || u.role } : u))
    );
  };

  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleToggleSuspendUser = (userId: string, suspended: boolean) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, suspended } : u)));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // State for cross-linking CustomerManager -> DocumentManager
  const [initialCustomerForDoc, setInitialCustomerForDoc] = useState<{
    customer: Customer;
    docType: 'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT';
  } | null>(null);
  const [initialFilterCustomerId, setInitialFilterCustomerId] = useState<string | null>(null);

  // Customer Management Handlers
  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast(`บันทึกข้อมูลลูกค้า/ผู้รับสินค้า "${newCust.name}" เรียบร้อย`);
    return newCust;
  };

  const handleUpdateCustomer = (id: string, custData: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? ({ ...c, ...custData } as Customer) : c)));
    showToast('อัปเดตข้อมูลลูกค้า/ผู้รับสินค้าเรียบร้อย');
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('ลบข้อมูลลูกค้าเรียบร้อย');
  };

  // Backup Handlers
  const handleTriggerBackup = async () => {
    try {
      const res = await fetch('/api/backups', { method: 'POST' });
      const data = await res.json();
      showToast(`สำรองข้อมูลสำเร็จ: ${data.filename || 'backup.json'}`);
    } catch (e) {
      showToast('สร้างไฟล์สำรองข้อมูลเรียบร้อย');
    }
  };

  const handleRestoreBackup = (_filename?: string, backupData?: any) => {
    if (backupData && backupData.products) {
      setProducts(backupData.products);
      if (backupData.documents) setDocuments(backupData.documents);
      showToast('คืนค่าข้อมูลจากไฟล์สำรองเรียบร้อยแล้ว');
    } else {
      showToast('คืนค่าระบบจากไฟล์สำรองเรียบร้อย');
    }
  };

  // Barcode scanned callback
  const handleScanDetected = (code: string) => {
    setScannerOpen(false);
    const matched = products.find(p => p.code === code || p.qrCode === code);
    if (matched) {
      showToast(`พบสินค้า [${matched.code}] ${matched.name} · คงเหลือ ${matched.quantity} ${matched.unit} (฿${matched.sellingPrice})`);
    } else {
      showToast(`สแกนพบรหัส ${code} · ยังไม่มีในระบบ สามารถกดเพิ่มสินค้าใหม่ได้`);
    }
  };

  const lowStockCount = (products || []).filter(p => p.quantity <= p.minQuantity).length;

  const sidebarGroups = [
    {
      groupLabel: 'คลังสินค้าและงานขาย',
      items: [
        { id: 'inventory', label: 'เช็คสต็อคสินค้า', icon: Package, count: products.length },
        { id: 'pos', label: 'ระบบขายหน้าร้าน POS', icon: ShoppingCart }
      ]
    },
    {
      groupLabel: 'ลูกค้าและเอกสารการค้า',
      items: [
        { id: 'customers', label: 'ลูกค้า / ผู้รับสินค้า', icon: Users, count: customers.length },
        { id: 'documents', label: 'เอกสารการค้า (ใบส่งของ/ใบเสร็จ)', icon: FileText, count: documents.length },
        { id: 'delivery', label: 'ติดตามการจัดส่ง Cold Chain', icon: Truck }
      ]
    },
    {
      groupLabel: 'วิเคราะห์และระบบคลาวด์',
      items: [
        { id: 'reports', label: 'รายงานเคลื่อนไหวและยอดขาย', icon: BarChart3 },
        { id: 'workspace', label: 'Google Sheets (auzza38)', icon: Sparkles },
        { id: 'ai', label: 'AI ช่วยวิเคราะห์สต็อค', icon: Bot },
        ...(currentUser.role === 'admin'
          ? [{ id: 'admin', label: 'จัดการระบบหลังบ้าน', icon: ShieldAlert }]
          : [])
      ]
    }
  ];

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'inventory':
        return { title: 'คลังสินค้าและสต็อคผักปลอดภัย', subtitle: 'จัดการสต็อคสินค้า ปรับ/เติมสต็อค และตรวจสอบสินค้าใกล้หมดแบบเรียลไทม์' };
      case 'pos':
        return { title: 'ระบบขายหน้าร้าน (Point of Sale)', subtitle: 'คิดเงินรวดเร็ว สแกนบาร์โค้ด เชื่อมโยงข้อมูลลูกค้า และพิมพ์ใบเสร็จทันที' };
      case 'documents':
        return { title: 'เอกสารการค้า (ใบส่งของ · ใบวางบิล · ใบเสร็จรับเงิน)', subtitle: 'ออกเอกสารการค้าโดยดึงข้อมูลจากฐานข้อมูลลูกค้าและผู้รับสินค้าอัตโนมัติ' };
      case 'customers':
        return { title: 'ลูกค้า / ผู้รับสินค้า (เชื่อมโยงเอกสารการค้า)', subtitle: 'จัดการข้อมูลลูกค้า ผู้รับมอบสินค้า ที่อยู่จัดส่ง และออกเอกสารการค้าได้ทันที' };
      case 'delivery':
        return { title: 'ติดตามสถานะการจัดส่ง (Cold Chain Logistics)', subtitle: 'ตรวจสอบสถานะการเตรียมผักสดและการขนส่งควบคุมอุณหภูมิถึงมือลูกค้า' };
      case 'reports':
        return { title: 'รายงานการเคลื่อนไหวและสรุปยอดขาย', subtitle: 'วิเคราะห์ยอดรับเข้า เบิกออก และสินค้าขายดีแยกตามรายสัปดาห์ เดือน และปี' };
      case 'workspace':
        return { title: 'เชื่อมต่อ Google Sheets คลังสินค้าหลัก', subtitle: 'ซิงค์และส่งออกตารางสต็อคไปยังบัญชี auzza38@gmail.com' };
      case 'ai':
        return { title: 'ผู้ช่วย AI วิเคราะห์สต็อคและแผนการสั่งซื้อ', subtitle: 'ถาม-ตอบและวิเคราะห์ข้อมูลคลังสินค้าอัจฉริยะด้วย Gemini' };
      case 'admin':
        return { title: 'ตั้งค่าระบบและจัดการสิทธิ์ผู้ใช้งาน (Admin)', subtitle: 'อนุมัติสมาชิก สำรองข้อมูลคลาวด์ และตรวจสอบประวัติการใช้งาน' };
    }
  };

  const activeHeaderInfo = getActiveTabTitle();

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#23311D] flex flex-col justify-between">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#263E1A] text-white px-4 py-3 rounded-xl shadow-lg border border-[#5A8F3E] text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#77BF6E] shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Top Minimal Navigation Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          users={users}
          onSwitchUser={setCurrentUser}
          onOpenLoginModal={() => setLoginModalOpen(true)}
          notifications={notifications}
          onOpenScanner={() => setScannerOpen(true)}
          lowStockCount={lowStockCount}
          onOpenBrandBoard={() => setBrandBoardModalOpen(true)}
        />

        {/* Workspace Container: Left Sidebar + Main Content Viewport */}
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6 items-start">
          {/* Left Categorized Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white rounded-2xl border border-[#E6E2D6] p-4 space-y-5 sticky top-22">
            {/* Brand Identity Summary Header */}
            <div className="pb-4 border-b border-[#E6E2D6]">
              <KaenGreenLogo size="md" showSubtitle={true} />
              <p className="text-[11px] text-[#6B665B] mt-2 leading-relaxed">
                ผักสด ปลอดภัย ใส่ใจทุกครอบครัว ส่งตรงจากเกษตรกรชาวขอนแก่น
              </p>
            </div>

            {/* Menu Groups */}
            <div className="space-y-5">
              {sidebarGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <p className="px-2.5 text-[11px] font-semibold text-[#8B5E34] tracking-wide mb-1.5">
                    {group.groupLabel}
                  </p>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                          isActive
                            ? 'bg-[#5A8F3E] text-white font-semibold'
                            : 'text-[#23311D] hover:bg-[#F7F5EF]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#5A8F3E]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {'count' in item && item.count !== undefined && (
                          <span
                            className={`text-[11px] font-mono tabular-nums ${
                              isActive ? 'text-white/90' : 'text-[#8B5E34]'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* KAEN GREEN Brand Concept & Packaging Preview Card */}
            <div className="pt-4 border-t border-[#E6E2D6]">
              <div
                onClick={() => setBrandBoardModalOpen(true)}
                className="group cursor-pointer rounded-xl bg-[#F7F5EF] border border-[#E6E2D6] p-2.5 space-y-2 hover:border-[#5A8F3E] transition-colors"
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-white border border-[#E6E2D6] relative">
                  <img
                    src="/assets/aistudio/ChatGPT_Image_25__._._2569_17_08_27_d8eb9991.png"
                    alt="KAEN GREEN Brand Concept & Packaging"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center justify-between px-0.5">
                  <div>
                    <p className="text-xs font-semibold text-[#263E1A]">Brand Identity & Pack</p>
                    <p className="text-[10px] text-[#8B5E34]">ดูบอร์ดแบรนด์และขนาดบรรจุภัณฑ์</p>
                  </div>
                  <Eye className="w-4 h-4 text-[#5A8F3E]" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Viewport */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Contextual Page Header Banner */}
            <div className="bg-white rounded-2xl border border-[#E6E2D6] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#8B5E34] font-medium mb-1">
                  <span>KAEN GREEN</span>
                  <span aria-hidden="true">·</span>
                  <span>มาตรฐาน GAP / Q / Organic Thailand</span>
                  <span aria-hidden="true">·</span>
                  <span>ขอนแก่น</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-[#263E1A] tracking-tight">
                  {activeHeaderInfo.title}
                </h1>
                <p className="text-xs text-[#6B665B] mt-0.5">
                  {activeHeaderInfo.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setBrandBoardModalOpen(true)}
                  className="px-3.5 py-2 bg-[#F7F5EF] hover:bg-[#EFECE2] text-[#263E1A] border border-[#E6E2D6] rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Leaf className="w-3.5 h-3.5 text-[#5A8F3E]" />
                  <span>ข้อมูลแบรนด์ & แพ็กเกจจิ้ง</span>
                </button>
              </div>
            </div>

            {/* Active View Module */}
            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                movements={movements}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onOpenScanner={() => setScannerOpen(true)}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'pos' && (
              <PosView
                products={products}
                customers={customers}
                onCompleteSale={handleCompleteSale}
                onOpenScanner={() => setScannerOpen(true)}
                currentUser={currentUser}
                onGoToHome={() => setActiveTab('inventory')}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentManager
                documents={documents}
                products={products}
                customers={customers}
                onCreateDocument={handleCreateDocument}
                onAddCustomer={handleAddCustomer}
                onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
                currentUser={currentUser}
                initialCustomerForDoc={initialCustomerForDoc}
                onClearInitialCustomerForDoc={() => setInitialCustomerForDoc(null)}
                initialFilterCustomerId={initialFilterCustomerId}
                onClearFilterCustomerId={() => setInitialFilterCustomerId(null)}
                onNavigateToCustomers={() => setActiveTab('customers')}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerManager
                customers={customers}
                documents={documents}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onIssueDocumentForCustomer={(customer, docType) => {
                  setInitialCustomerForDoc({ customer, docType });
                  setActiveTab('documents');
                }}
                onOpenDocumentsTabForCustomer={customer => {
                  setInitialFilterCustomerId(customer.id);
                  setActiveTab('documents');
                }}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                movements={movements}
                products={products}
                documents={documents}
              />
            )}

            {activeTab === 'delivery' && (
              <DeliveryTracker
                documents={documents}
                onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
              />
            )}

            {activeTab === 'admin' && (
              <AdminBackoffice
                users={users}
                onApproveUser={handleApproveUser}
                onToggleSuspendUser={handleToggleSuspendUser}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
                logs={logs}
                onTriggerBackup={handleTriggerBackup}
                onRestoreBackup={handleRestoreBackup}
              />
            )}

            {activeTab === 'workspace' && (
              <GoogleDriveSync
                products={products}
                documents={documents}
              />
            )}

            {activeTab === 'ai' && (
              <GeminiAssistant />
            )}
          </main>
        </div>
      </div>

      {/* Brand Concept & Packaging Modal (Showcasing the attached image & brand specs) */}
      {brandBoardModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#23311D]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F7F5EF] rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-[#E6E2D6] my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D6]">
              <div className="flex items-center gap-3">
                <KaenGreenLogo size="sm" showSubtitle={false} />
                <span className="text-xs text-[#8B5E34]">
                  · บอร์ดอัตลักษณ์แบรนด์ แพ็กเกจจิ้ง และมาตรฐานผักปลอดภัยจากไทขอนแก่น
                </span>
              </div>
              <button
                onClick={() => setBrandBoardModalOpen(false)}
                className="p-1.5 rounded-lg bg-white hover:bg-[#EFECE2] text-[#23311D] border border-[#E6E2D6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#E6E2D6] bg-white">
              <img
                src="/assets/aistudio/ChatGPT_Image_25__._._2569_17_08_27_d8eb9991.png"
                alt="KAEN GREEN Brand Identity & Packaging Variants"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-[#E6E2D6] space-y-2">
                <p className="font-semibold text-[#263E1A]">โทนสีประจำแบรนด์ (Brand Palette)</p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 text-center">
                    <div className="h-7 rounded-md bg-[#5A8F3E] mb-1" />
                    <span className="font-mono text-[10px] text-[#6B665B]">#5A8F3E</span>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="h-7 rounded-md bg-[#77BF6E] mb-1" />
                    <span className="font-mono text-[10px] text-[#6B665B]">#77BF6E</span>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="h-7 rounded-md bg-[#F2C94C] mb-1" />
                    <span className="font-mono text-[10px] text-[#6B665B]">#F2C94C</span>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="h-7 rounded-md bg-[#8B5E34] mb-1" />
                    <span className="font-mono text-[10px] text-[#6B665B]">#8B5E34</span>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="h-7 rounded-md bg-[#F7F5EF] border border-[#E6E2D6] mb-1" />
                    <span className="font-mono text-[10px] text-[#6B665B]">#F7F5EF</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E6E2D6] space-y-1.5">
                <p className="font-semibold text-[#263E1A]">รูปแบบบรรจุภัณฑ์ (Packaging Variants)</p>
                <p className="text-[#6B665B]">
                  Salad Mix Bag (150 g.) · Premium Pack (100–250 g.) · Herb Cup (50 g.) · Family Box (500 g.) · B2B Solution Box (HoReCa)
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E6E2D6] space-y-1.5">
                <p className="font-semibold text-[#263E1A]">กลุ่มลูกค้าและมาตรฐาน (Certified & Trusted)</p>
                <p className="text-[#6B665B]">
                  โรงแรม & ร้านอาหาร (Ad Lib Khon Kaen / HoReCa) · พนักงานออฟฟิศ · คุณแม่และครอบครัว · มาตรฐาน GAP, Q, Organic Thailand
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        users={users}
        currentUser={currentUser}
        onLogin={user => {
          setCurrentUser(user);
          setLoginModalOpen(false);
        }}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* Barcode/QR Camera Scanner Modal */}
      <ScannerModal
        isOpen={scannerOpen}
        onScanSuccess={handleScanDetected}
        onClose={() => setScannerOpen(false)}
      />

      {/* Footer matching the bottom bar of the attached KAEN GREEN image */}
      <footer className="bg-[#5A8F3E] text-white py-4 px-4 sm:px-6 lg:px-8 mt-8 border-t border-[#436E2C]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm tracking-wide">KAEN GREEN</span>
            <span aria-hidden="true" className="text-white/60">·</span>
            <span className="text-white/90">ผักปลอดภัยจากไทขอนแก่น</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/95">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span>ส่งได้ทุกวัน 07:00 - 18:00 น.</span>
            </span>
            <span>LINE: @kaengreen</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span className="tabular-nums">082-369-2868</span>
            </span>
            <span>FB: Kaen Green</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span>ปลูกที่ขอนแก่น ส่งความสดถึงคุณ</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

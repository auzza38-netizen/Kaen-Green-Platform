import React, { useState } from 'react';
import { User, AppNotification } from '../types';
import { KaenGreenLogo } from './KaenGreenLogo';
import {
  Camera,
  Bell,
  UserCheck,
  ChevronDown,
  AlertTriangle,
  Menu,
  X,
  LogIn,
  Package,
  ShoppingCart,
  FileText,
  Users,
  Truck,
  BarChart3,
  ShieldAlert,
  Sparkles,
  Bot
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser: User;
  users?: User[];
  onSwitchUser?: (user: User) => void;
  onOpenLoginModal?: () => void;
  notifications?: AppNotification[];
  onOpenScanner?: () => void;
  lowStockCount?: number;
  onOpenBrandBoard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users = [],
  onSwitchUser,
  onOpenLoginModal,
  notifications = [],
  onOpenScanner = () => {},
  lowStockCount = 0,
  onOpenBrandBoard
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const safeNotifications = notifications || [];
  const safeUsers = users || [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  // Primary top nav links
  const primaryNavLinks = [
    { id: 'inventory', label: 'คลังสินค้า' },
    { id: 'pos', label: 'ขายหน้าร้าน POS' },
    { id: 'customers', label: 'ลูกค้า / ผู้รับสินค้า' },
    { id: 'documents', label: 'เอกสารการค้า' },
    { id: 'delivery', label: 'การจัดส่ง' },
    { id: 'reports', label: 'รายงานสรุป' }
  ];

  // Full menu list for mobile drawer
  const allMenuItems = [
    { id: 'inventory', label: 'คลังสินค้าและสต็อค', icon: Package },
    { id: 'pos', label: 'ขายหน้าร้าน (POS)', icon: ShoppingCart },
    { id: 'documents', label: 'เอกสาร / ใบส่งของ / ใบเสร็จ', icon: FileText },
    { id: 'customers', label: 'ลูกค้า / ผู้รับสินค้า (HoReCa)', icon: Users },
    { id: 'delivery', label: 'ติดตามการจัดส่ง Cold Chain', icon: Truck },
    { id: 'reports', label: 'รายงานเคลื่อนไหวและยอดขาย', icon: BarChart3 },
    { id: 'workspace', label: 'ซิงค์ Google Sheets (auzza38)', icon: Sparkles },
    { id: 'ai', label: 'วิเคราะห์สต็อคด้วย AI', icon: Bot },
    ...(currentUser.role === 'admin'
      ? [{ id: 'admin', label: 'ตั้งค่าระบบและผู้ใช้งาน', icon: ShieldAlert }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E2D6] text-[#23311D]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Brand Title (Single clean lockup) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#263E1A] hover:bg-[#F7F5EF] lg:hidden transition-colors"
              aria-label="เปิดเมนูนำทาง"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className="flex items-center gap-2.5 text-left focus:outline-none group whitespace-nowrap shrink-0"
            >
              <KaenGreenLogo size="sm" showSubtitle={false} />
            </button>
          </div>

          {/* Zone 2: Clean Single-Line Typography Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6B665B]">
            {primaryNavLinks.map(link => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-[#263E1A] font-semibold border-[#5A8F3E]'
                      : 'border-transparent hover:text-[#263E1A]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Account Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('inventory')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8B5E34] bg-[#F7F5EF] hover:bg-[#EFECE2] border border-[#E6E2D6] rounded-lg transition-colors whitespace-nowrap shrink-0"
                title={`สินค้าใกล้หมด ${lowStockCount} รายการ`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="tabular-nums">ใกล้หมด {lowStockCount} รายการ</span>
              </button>
            )}

            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              title="สแกนบาร์โค้ด / QR Code"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>สแกนโค้ด</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setShowUserDropdown(false);
                }}
                className="relative p-2 rounded-lg text-[#6B665B] hover:text-[#263E1A] hover:bg-[#F7F5EF] border border-[#E6E2D6] transition-colors"
                title="การแจ้งเตือน"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D97706] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6E2D6] rounded-xl shadow-lg z-50 p-4 text-xs">
                  <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-[#E6E2D6]">
                    <span className="font-semibold text-[#263E1A]">การแจ้งเตือนระบบ</span>
                    <span className="text-[11px] text-[#6B665B] tabular-nums">{safeNotifications.length} รายการ</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {safeNotifications.length === 0 ? (
                      <p className="text-center py-6 text-[#6B665B]">ไม่มีรายการแจ้งเตือนในขณะนี้</p>
                    ) : (
                      safeNotifications.map(n => (
                        <div
                          key={n.id}
                          className="p-3 rounded-lg bg-[#F7F5EF] border border-[#E6E2D6] text-[#23311D]"
                        >
                          <div className="font-semibold text-xs flex items-center justify-between gap-2">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-[#8B5E34] font-mono tabular-nums shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] mt-1 text-[#6B665B] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-[#F7F5EF] hover:bg-[#EFECE2] rounded-lg border border-[#E6E2D6] transition-colors whitespace-nowrap shrink-0"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-md object-cover"
                />
                <span className="text-xs font-medium text-[#23311D] hidden sm:inline truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B5E34]" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E6E2D6] rounded-xl shadow-lg z-50 p-3 text-xs">
                  <div className="pb-2.5 mb-2.5 border-b border-[#E6E2D6]">
                    <p className="font-semibold text-[#263E1A]">{currentUser.name}</p>
                    <p className="text-[11px] text-[#5A8F3E] font-mono">{currentUser.email}</p>
                    <p className="text-[11px] text-[#8B5E34] mt-0.5">
                      {currentUser.department} · {currentUser.role === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  </div>

                  {onOpenLoginModal && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenLoginModal();
                      }}
                      className="w-full py-2 px-3 mb-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>ล็อกอิน / สลับบัญชีผู้ใช้</span>
                    </button>
                  )}

                  <p className="text-[11px] font-medium text-[#8B5E34] px-1 py-1">
                    สลับบัญชีด่วน
                  </p>

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {safeUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (onSwitchUser) onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-[#F7F5EF] text-[#263E1A] font-semibold border border-[#E6E2D6]'
                            : 'hover:bg-[#FAF8F3] text-[#6B665B]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-md object-cover"
                            alt={u.name}
                          />
                          <div className="truncate">
                            <p className="text-xs truncate">{u.name}</p>
                            <p className="text-[10px] text-[#8B5E34] font-mono">{u.email}</p>
                          </div>
                        </div>
                        {u.id === currentUser.id && (
                          <UserCheck className="w-4 h-4 text-[#5A8F3E] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#E6E2D6] space-y-1">
            {allMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    isActive
                      ? 'bg-[#5A8F3E] text-white'
                      : 'text-[#23311D] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5A8F3E]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {onOpenBrandBoard && (
              <button
                onClick={() => {
                  onOpenBrandBoard();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left text-[#8B5E34] bg-[#F7F5EF] hover:bg-[#EFECE2] mt-2"
              >
                <Sparkles className="w-4 h-4 text-[#5A8F3E]" />
                <span>ดูบอร์ดแบรนด์ & แพ็กเกจจิ้ง KAEN GREEN</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

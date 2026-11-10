import React, { useState } from 'react';
import { User } from '../types';
import { KaenGreenLogo } from './KaenGreenLogo';
import { Mail, Lock, LogIn, CheckCircle2, User as UserIcon, AlertCircle, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onLogin: (user: User) => void;
  onRegisterNewMember?: (email: string, name: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users = [],
  currentUser,
  onLogin,
  onRegisterNewMember
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'email' | 'members'>('gmail');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const adminUser = users.find(u => u.email === 'auzza38@gmail.com' || u.role === 'admin') || {
    id: 'usr-admin-1',
    name: 'ปณิธาน ศรีบุญเรือง',
    email: 'auzza38@gmail.com',
    role: 'admin' as const,
    phone: '082-369-2868',
    department: 'ผู้ดูแลระบบ (Admin) KAEN GREEN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    approved: true,
    createdAt: new Date().toISOString(),
    loginMethod: 'google' as const
  };

  const handleGmailAdminLogin = () => {
    setErrorMsg('');
    setSuccessMsg('กำลังเข้าสู่ระบบในนาม ปณิธาน ศรีบุญเรือง (auzza38@gmail.com)...');
    setTimeout(() => {
      onLogin(adminUser);
      setSuccessMsg('');
      onClose();
    }, 400);
  };

  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput.trim()) return;

    const matchedUser = users.find(
      u => u.email.toLowerCase() === emailInput.trim().toLowerCase()
    );

    if (matchedUser) {
      if (matchedUser.suspended) {
        setErrorMsg('บัญชีนี้ถูกระงับการใช้งานชั่วคราว โปรดติดต่อ Admin');
        return;
      }
      if (!matchedUser.approved) {
        setErrorMsg('บัญชีนี้ยังรอการอนุมัติจากผู้ดูแลระบบ');
        return;
      }
      setSuccessMsg(`ยินดีต้อนรับคุณ ${matchedUser.name}`);
      setTimeout(() => {
        onLogin(matchedUser);
        setSuccessMsg('');
        onClose();
      }, 400);
    } else {
      setErrorMsg('ไม่พบบัญชีอีเมลนี้ในระบบ');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regName) return;

    if (onRegisterNewMember) {
      onRegisterNewMember(regEmail, regName);
      setSuccessMsg('ส่งคำขอลงทะเบียนให้ Admin อนุมัติเรียบร้อยแล้ว');
      setRegisterMode(false);
      setRegEmail('');
      setRegName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23311D]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E6E2D6] space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B5E34] hover:text-[#23311D] p-1.5 rounded-lg hover:bg-[#F7F5EF] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <KaenGreenLogo size="md" />
          </div>
          <p className="text-xs text-[#6B665B]">
            เข้าสู่ระบบจัดการคลังสินค้าและ POS ผักปลอดภัยจากไทขอนแก่น
          </p>
        </div>

        {/* Segmented Tab Bar */}
        <div className="flex bg-[#F7F5EF] p-1 rounded-xl border border-[#E6E2D6] text-xs font-medium">
          <button
            onClick={() => {
              setActiveTab('gmail');
              setRegisterMode(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'gmail' ? 'bg-[#5A8F3E] text-white' : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            <span>Gmail Admin</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('email');
              setRegisterMode(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'email' ? 'bg-[#5A8F3E] text-white' : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>อีเมลพนักงาน</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('members');
              setRegisterMode(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'members' ? 'bg-[#5A8F3E] text-white' : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>สลับบัญชี</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#F7F5EF] border border-[#DC2626] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-[#F7F5EF] border border-[#5A8F3E] rounded-xl text-xs text-[#263E1A] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5A8F3E]" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === 'gmail' && (
          <div className="space-y-4">
            <div className="bg-[#F7F5EF] p-4 rounded-xl border border-[#E6E2D6] text-center space-y-2">
              <p className="text-[11px] font-medium text-[#8B5E34]">ผู้ดูแลระบบหลัก (System Owner)</p>
              <div className="flex items-center justify-center gap-3 pt-1">
                <img
                  src={adminUser.avatarUrl}
                  alt={adminUser.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover border border-[#5A8F3E]"
                />
                <div className="text-left">
                  <h4 className="font-bold text-[#263E1A] text-sm">{adminUser.name}</h4>
                  <p className="text-xs text-[#5A8F3E] font-mono">{adminUser.email}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGmailAdminLogin}
              className="w-full py-3 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>เข้าสู่ระบบด้วยบัญชี Gmail ({adminUser.email})</span>
            </button>
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            {!registerMode ? (
              <form onSubmit={handleEmailLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">อีเมลพนักงาน</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8B5E34] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="เช่น suda@kaengreen.com"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-mono focus:outline-none focus:border-[#5A8F3E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8B5E34] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">อีเมล</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#5A8F3E] text-white rounded-xl font-semibold text-xs"
                >
                  ส่งคำขอลงทะเบียน
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  if (u.suspended || !u.approved) return;
                  onLogin(u);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                  currentUser.id === u.id
                    ? 'border-[#5A8F3E] bg-[#F7F5EF] text-[#263E1A] font-semibold'
                    : 'border-[#E6E2D6] hover:bg-[#FAF8F3] text-[#23311D]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={u.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover border border-[#E6E2D6]"
                  />
                  <div>
                    <p className="font-semibold text-xs">{u.name}</p>
                    <p className="text-[10px] text-[#8B5E34] font-mono">{u.email}</p>
                  </div>
                </div>
                <span className="text-[11px] text-[#5A8F3E] font-medium">
                  {u.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

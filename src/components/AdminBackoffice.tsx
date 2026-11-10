import React, { useState, useEffect } from 'react';
import { User, BackupRecord } from '../types';
import {
  Users,
  Database,
  History,
  CheckCircle2,
  XCircle,
  Upload,
  Clock,
  HardDrive,
  X
} from 'lucide-react';

interface AdminBackofficeProps {
  users: User[];
  onApproveUser: (userId: string, approved: boolean, role?: 'admin' | 'member') => void;
  onToggleSuspendUser?: (userId: string, suspended: boolean) => void;
  onAddUser?: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onDeleteUser?: (userId: string) => void;
  currentUser: User;
  logs: { id: string; action: string; user: string; details: string; timestamp: string }[];
  onTriggerBackup: () => void;
  onRestoreBackup: (filename?: string, backupData?: any) => void;
}

export const AdminBackoffice: React.FC<AdminBackofficeProps> = ({
  users = [],
  onApproveUser,
  onToggleSuspendUser,
  onAddUser,
  onDeleteUser,
  currentUser,
  logs = [],
  onTriggerBackup,
  onRestoreBackup
}) => {
  const safeUsers = users || [];
  const safeLogs = logs || [];
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'backup' | 'logs'>('users');
  const [backupsList, setBackupsList] = useState<BackupRecord[]>([]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'member' as 'admin' | 'member',
    phone: '',
    department: 'แผนกคลังและจัดส่ง Cold Chain',
    approved: true
  });

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBackupsList(data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [activeSubTab]);

  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.products) {
          onRestoreBackup(file.name, json);
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Quick Add */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D6] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-xs font-medium bg-[#F7F5EF] p-1 rounded-xl border border-[#E6E2D6]">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'users'
                ? 'bg-[#5A8F3E] text-white'
                : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>จัดการสมาชิก ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'backup'
                ? 'bg-[#5A8F3E] text-white'
                : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>สำรองข้อมูลคลาวด์</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'logs'
                ? 'bg-[#5A8F3E] text-white'
                : 'text-[#6B665B] hover:text-[#23311D]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ประวัติระบบ (Audit Logs)</span>
          </button>
        </div>

        {activeSubTab === 'users' && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-medium rounded-xl text-xs transition-colors whitespace-nowrap shrink-0"
          >
            + เพิ่มสมาชิกใหม่
          </button>
        )}
      </div>

      {/* Subtab 1: Manage Users */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#E6E2D6] overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6]">
              <tr className="text-[#8B5E34] font-semibold">
                <th className="px-5 py-3.5">ชื่อสมาชิก</th>
                <th className="px-5 py-3.5">อีเมล</th>
                <th className="px-5 py-3.5">แผนก</th>
                <th className="px-5 py-3.5">สิทธิ์การใช้งาน</th>
                <th className="px-5 py-3.5">สถานะบัญชี</th>
                <th className="px-5 py-3.5 text-right">จัดการสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D6]">
              {safeUsers.map(u => (
                <tr key={u.id} className="hover:bg-[#FAF8F3] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover border border-[#E6E2D6]"
                      />
                      <div>
                        <p className="font-semibold text-[#263E1A] text-sm">{u.name}</p>
                        {u.phone && <p className="text-[11px] text-[#8B5E34] font-mono tabular-nums">{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#6B665B] font-mono whitespace-nowrap">{u.email}</td>
                  <td className="px-5 py-3.5 text-[#6B665B] whitespace-nowrap">{u.department || 'ทั่วไป'}</td>
                  <td className="px-5 py-3.5 font-medium text-[#263E1A] whitespace-nowrap">
                    {u.role === 'admin' ? 'Admin (ผู้ดูแลระบบ)' : 'Member (พนักงาน)'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {u.suspended ? (
                      <span className="text-[#DC2626] font-medium inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ระงับใช้งาน</span>
                      </span>
                    ) : u.approved ? (
                      <span className="text-[#5A8F3E] font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>อนุมัติแล้ว</span>
                      </span>
                    ) : (
                      <span className="text-[#D97706] font-medium inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>รออนุมัติ</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {!u.approved ? (
                        <button
                          onClick={() => onApproveUser(u.id, true)}
                          className="px-2.5 py-1 bg-[#5A8F3E] text-white rounded-lg font-medium text-xs"
                        >
                          อนุมัติ
                        </button>
                      ) : (
                        <button
                          onClick={() => onApproveUser(u.id, false)}
                          className="px-2.5 py-1 bg-[#F7F5EF] text-[#6B665B] hover:text-[#23311D] border border-[#E6E2D6] rounded-lg text-xs"
                        >
                          ยกเลิกอนุมัติ
                        </button>
                      )}

                      <button
                        onClick={() => onApproveUser(u.id, u.approved, u.role === 'admin' ? 'member' : 'admin')}
                        className="px-2.5 py-1 bg-[#F7F5EF] text-[#23311D] hover:bg-[#EFECE2] border border-[#E6E2D6] rounded-lg text-xs"
                      >
                        สลับเป็น {u.role === 'admin' ? 'Member' : 'Admin'}
                      </button>

                      {u.id !== currentUser.id && u.email !== 'auzza38@gmail.com' && (
                        <>
                          <button
                            onClick={() => onToggleSuspendUser && onToggleSuspendUser(u.id, !u.suspended)}
                            className="px-2.5 py-1 bg-[#F7F5EF] text-[#8B5E34] border border-[#E6E2D6] rounded-lg text-xs"
                          >
                            {u.suspended ? 'ปลดระงับ' : 'ระงับ'}
                          </button>
                          <button
                            onClick={() => onDeleteUser && onDeleteUser(u.id)}
                            className="px-2.5 py-1 text-[#DC2626] hover:bg-[#F7F5EF] rounded-lg text-xs"
                          >
                            ลบ
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-[#23311D]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6E2D6] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E6E2D6] pb-3">
              <h3 className="font-bold text-[#263E1A] text-base">เพิ่มสมาชิกใหม่เข้าระบบ</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-[#8B5E34]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newUserForm.name || !newUserForm.email) return;
                if (onAddUser) {
                  onAddUser({
                    ...newUserForm,
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  });
                }
                setShowAddUserModal(false);
                setNewUserForm({
                  name: '',
                  email: '',
                  role: 'member',
                  phone: '',
                  department: 'แผนกคลังและจัดส่ง Cold Chain',
                  approved: true
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#23311D] mb-1">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">อีเมล (Email Address) *</label>
                <input
                  type="email"
                  required
                  placeholder="เช่น somchai@kaengreen.com"
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono focus:outline-none focus:border-[#5A8F3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">บทบาทสิทธิ์</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as 'admin' | 'member' })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-medium"
                  >
                    <option value="member">Member (พนักงาน)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#23311D] mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="081-xxx-xxxx"
                    value={newUserForm.phone}
                    onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#23311D] mb-1">แผนก / ตำแหน่ง</label>
                <input
                  type="text"
                  value={newUserForm.department}
                  onChange={e => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E6E2D6]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-[#F7F5EF] text-[#23311D] rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-xl font-semibold"
                >
                  บันทึกเพิ่มสมาชิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subtab 2: Cloud Backup */}
      {activeSubTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-[#E6E2D6] p-6 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E2D6]">
            <div>
              <h3 className="font-bold text-[#263E1A] text-sm">ระบบสำรองข้อมูลคลังสินค้า (Cloud Snapshot)</h3>
              <p className="text-[#6B665B] mt-0.5">บันทึกข้อมูลสินค้า เอกสาร และประวัติทั้งหมดเก็บไว้เป็นไฟล์ JSON</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3.5 py-2 border border-[#E6E2D6] hover:bg-[#F7F5EF] text-[#23311D] font-medium rounded-xl cursor-pointer transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#5A8F3E]" />
                <span>คืนค่าจากไฟล์ JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUploadRestore}
                  className="hidden"
                />
              </label>

              <button
                onClick={async () => {
                  await onTriggerBackup();
                  fetchBackups();
                }}
                className="px-4 py-2 bg-[#5A8F3E] hover:bg-[#436E2C] text-white font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>สร้าง Snapshot ทันที</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6]">
                <tr className="text-[#8B5E34] font-semibold">
                  <th className="px-5 py-3.5">ชื่อไฟล์สำรอง</th>
                  <th className="px-5 py-3.5">ประเภท</th>
                  <th className="px-5 py-3.5">ขนาด</th>
                  <th className="px-5 py-3.5">วัน-เวลา</th>
                  <th className="px-5 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D6]">
                {backupsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[#6B665B]">
                      ยังไม่มีประวัติไฟล์สำรอง
                    </td>
                  </tr>
                ) : (
                  backupsList.map(b => (
                    <tr key={b.id} className="hover:bg-[#FAF8F3]">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#263E1A]">{b.filename}</td>
                      <td className="px-5 py-3.5 text-[#6B665B]">
                        {b.auto ? 'สำรองอัตโนมัติ' : 'สร้างด้วยตนเอง'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#6B665B] tabular-nums">{b.size}</td>
                      <td className="px-5 py-3.5 font-mono text-[#6B665B] tabular-nums">
                        {new Date(b.createdAt).toLocaleString('th-TH')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onRestoreBackup(b.filename)}
                          className="px-3 py-1.5 bg-[#5A8F3E] hover:bg-[#436E2C] text-white rounded-lg font-medium text-xs"
                        >
                          คืนค่าข้อมูล
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: System Audit Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-[#E6E2D6] overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#FAF8F3] border-b border-[#E6E2D6]">
              <tr className="text-[#8B5E34] font-semibold">
                <th className="px-5 py-3.5">วันและเวลา</th>
                <th className="px-5 py-3.5">กิจกรรม</th>
                <th className="px-5 py-3.5">ผู้ทำรายการ</th>
                <th className="px-5 py-3.5">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D6]">
              {safeLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#FAF8F3]">
                  <td className="px-5 py-3.5 font-mono text-[#6B665B] tabular-nums whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('th-TH')}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#263E1A]">{log.action}</td>
                  <td className="px-5 py-3.5 text-[#23311D] font-medium">{log.user}</td>
                  <td className="px-5 py-3.5 text-[#6B665B]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

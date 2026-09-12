'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { SafeStudentAccount, StudentRole, ROLE_CONFIG } from '@/utils/studentTypes';
import { 
  updateStudentRoleAction, 
  resetStudentPasswordAction, 
  createStudentAction, 
  deleteStudentAction, 
  updateStudentInfoAction 
} from './actions';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Search,
  Shield,
  Crown,
  DollarSign,
  User,
  RotateCcw,
  Sparkles,
  Lock,
  Flame,
  UserPlus,
  Trash2,
  Edit,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RolesClientProps {
  initialAccounts: SafeStudentAccount[];
  currentUserRole?: StudentRole;
}

const ROLES_LIST: StudentRole[] = ['Student', 'Leader', 'Finance', 'Admin', 'SuperAdmin'];

export default function RolesClient({ initialAccounts, currentUserRole = 'Student' }: RolesClientProps) {
  const [accounts, setAccounts] = useState<SafeStudentAccount[]>(initialAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentNo, setNewStudentNo] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newPrefix, setNewPrefix] = useState('ด.ช.');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newRole, setNewRole] = useState<StudentRole>('Student');
  const [isSubmittingNewStudent, setIsSubmittingNewStudent] = useState(false);

  // Edit Student Modal State (SuperAdmin Only)
  const [editingStudent, setEditingStudent] = useState<SafeStudentAccount | null>(null);
  const [editStudentNo, setEditStudentNo] = useState('');
  const [editPrefix, setEditPrefix] = useState('ด.ช.');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editRole, setEditRole] = useState<StudentRole>('Student');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const isSuperAdmin = currentUserRole === 'SuperAdmin';
  const isRanked = currentUserRole !== 'Student';

  // Stats calculation
  const stats = {
    total: accounts.length,
    superadmin: accounts.filter((a) => a.role === 'SuperAdmin').length,
    admin: accounts.filter((a) => a.role === 'Admin').length,
    leader: accounts.filter((a) => a.role === 'Leader').length,
    finance: accounts.filter((a) => a.role === 'Finance').length,
    student: accounts.filter((a) => a.role === 'Student').length,
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter((account) => {
    const matchesRole =
      selectedRoleFilter === 'all' || account.role === selectedRoleFilter;

    if (!matchesRole) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    return (
      account.student_id.toLowerCase().includes(query) ||
      account.full_name.toLowerCase().includes(query) ||
      account.nickname.toLowerCase().includes(query) ||
      String(account.student_no) === query
    );
  });

  const handleRoleChange = (studentId: string, newRoleValue: StudentRole) => {
    if (studentId === '30260' && !isSuperAdmin) {
      toast.error('เฉพาะ SuperAdmin (โคตรพ่อโคตรแม่ผู้ดูแลระบบ) เท่านั้นที่เปลี่ยนสิทธิ์บัญชีนี้ได้');
      return;
    }

    if (!isSuperAdmin && (newRoleValue === 'SuperAdmin' || newRoleValue === 'Admin')) {
      toast.error('เฉพาะ SuperAdmin เท่านั้นที่สามารถแต่งตั้ง Admin หรือ SuperAdmin ได้');
      return;
    }

    setUpdatingId(studentId);

    // Optimistic update
    setAccounts((prev) =>
      prev.map((a) => (a.student_id === studentId ? { ...a, role: newRoleValue } : a))
    );

    startTransition(async () => {
      const res = await updateStudentRoleAction(studentId, newRoleValue);
      setUpdatingId(null);

      if (res.success) {
        toast.success(`เปลี่ยนบทบาทเป็น "${ROLE_CONFIG[newRoleValue].title}" เรียบร้อยแล้ว`, {
          icon: '✨',
        });
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนบทบาท');
        setAccounts(initialAccounts);
      }
    });
  };

  const handleResetPassword = (student: SafeStudentAccount) => {
    if (student.student_id === '30260' && !isSuperAdmin) {
      toast.error('ไม่อนุญาตให้รีเซ็ตรหัสผ่านของ SuperAdmin');
      return;
    }

    const confirmed = window.confirm(
      `คุณต้องการรีเซ็ตรหัสผ่านของ "${student.full_name} (${student.nickname})" กลับเป็นค่าเริ่มต้นใช่หรือไม่?\n(รหัสเริ่มต้น: bBb@${student.student_id})`
    );
    if (!confirmed) return;

    setUpdatingId(student.student_id);

    startTransition(async () => {
      const res = await resetStudentPasswordAction(student.student_id);
      setUpdatingId(null);

      if (res.success) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.student_id === student.student_id
              ? { ...a, is_first_login: true }
              : a
          )
        );
        toast.success(`รีเซ็ตรหัสผ่านของ "${student.full_name}" สำเร็จ!`, {
          icon: '🔒',
        });
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentNo || !newStudentId || !newFirstName || !newLastName || !newNickname) {
      toast.error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setIsSubmittingNewStudent(true);
    const toastId = toast.loading('กำลังเพิ่มนักเรียนใหม่...');

    try {
      const res = await createStudentAction({
        student_no: Number(newStudentNo),
        student_id: newStudentId.trim(),
        prefix: newPrefix,
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        nickname: newNickname.trim(),
        role: newRole,
      });

      if (res.success && res.account) {
        toast.success(`เพิ่มนักเรียน "${res.account.full_name} (${res.account.nickname})" เรียบร้อยแล้ว!`, { id: toastId });
        setAccounts((prev) => [...prev, res.account!].sort((a, b) => a.student_no - b.student_no));
        setIsAddModalOpen(false);
        // Reset form
        setNewStudentNo('');
        setNewStudentId('');
        setNewFirstName('');
        setNewLastName('');
        setNewNickname('');
        setNewRole('Student');
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด', { id: toastId });
    } finally {
      setIsSubmittingNewStudent(false);
    }
  };

  const handleDeleteStudent = async (student: SafeStudentAccount) => {
    if (!isSuperAdmin) {
      toast.error('เฉพาะ SuperAdmin เท่านั้นที่สามารถลบนักเรียนได้');
      return;
    }

    if (student.student_id === '30260') {
      toast.error('ไม่อนุญาตให้ลบบัญชี SuperAdmin');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ยืนยันการลบนักเรียน:\n"${student.full_name} (${student.nickname})" เลขที่ ${student.student_no} (รหัส ${student.student_id})\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!`
    );
    if (!confirmed) return;

    setUpdatingId(student.student_id);
    const toastId = toast.loading('กำลังลบนักเรียน...');

    try {
      const res = await deleteStudentAction(student.student_id);
      if (res.success) {
        toast.success(`ลบนักเรียน "${student.full_name}" สำเร็จ`, { id: toastId });
        setAccounts((prev) => prev.filter((a) => a.student_id !== student.student_id));
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการลบ', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด', { id: toastId });
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (student: SafeStudentAccount) => {
    setEditingStudent(student);
    setEditStudentNo(String(student.student_no));
    setEditPrefix(student.prefix || 'ด.ช.');
    setEditFirstName(student.first_name || '');
    setEditLastName(student.last_name || '');
    setEditNickname(student.nickname || '');
    setEditRole(student.role);
  };

  const handleUpdateStudentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSubmittingEdit(true);
    const toastId = toast.loading('กำลังบันทึกการแก้ไข...');

    try {
      const res = await updateStudentInfoAction(editingStudent.student_id, {
        student_no: Number(editStudentNo),
        prefix: editPrefix,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        nickname: editNickname.trim(),
        role: editRole,
      });

      if (res.success && res.account) {
        toast.success(`อัปเดตข้อมูล "${res.account.full_name}" เรียบร้อยแล้ว`, { id: toastId });
        setAccounts((prev) =>
          prev
            .map((a) => (a.student_id === editingStudent.student_id ? res.account! : a))
            .sort((a, b) => a.student_no - b.student_no)
        );
        setEditingStudent(null);
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการแก้ไข', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด', { id: toastId });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          กลับหน้าตั้งค่า
        </Link>
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-xs flex items-center gap-1.5">
              <Flame size={13} />
              SuperAdmin (ทำได้ทุกอย่าง)
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <Shield size={13} />
              ยศของคุณ: {ROLE_CONFIG[currentUserRole]?.title || currentUserRole}
            </span>
          )}
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
            ทั้งหมด {stats.total} คน
          </span>
        </div>
      </div>

      {/* Hero / Title Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                จัดการสิทธิ์และนักเรียน (Student Roles)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isSuperAdmin 
                  ? '👑 โหมด SuperAdmin: จัดการสิทธิ์ เพิ่ม ลบ แก้ไขข้อมูลนักเรียนได้ทั้งหมด 100%' 
                  : '✨ ผู้มียศสามารถเพิ่มนักเรียนใหม่ และจัดการสิทธิ์เพื่อนๆ ในห้องได้'}
              </p>
            </div>
          </div>

          {/* Add Student Button (Available for all Ranked Users) */}
          {isRanked && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <UserPlus size={18} />
              เพิ่มนักเรียนใหม่
            </button>
          )}
        </div>

        {/* Stats Grid - 5 Roles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
          {/* SuperAdmin */}
          <div
            onClick={() => setSelectedRoleFilter('SuperAdmin')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all ${
              selectedRoleFilter === 'SuperAdmin'
                ? 'bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 border-purple-400 ring-2 ring-purple-300'
                : 'bg-purple-50/60 border-purple-200/70 hover:bg-purple-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-purple-900">SuperAdmin</span>
              <Flame size={15} className="text-rose-600" />
            </div>
            <div className="text-2xl font-black text-purple-950 mt-2">{stats.superadmin}</div>
            <p className="text-[10px] font-bold text-purple-700/90 mt-0.5 truncate">โคตรพ่อโคตรแม่</p>
          </div>

          {/* Admin */}
          <div
            onClick={() => setSelectedRoleFilter('Admin')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all ${
              selectedRoleFilter === 'Admin'
                ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-300'
                : 'bg-indigo-50/70 border-indigo-200/80 hover:bg-indigo-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800">Admin</span>
              <Shield size={15} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-900 mt-2">{stats.admin}</div>
            <p className="text-[10px] text-indigo-700/80 mt-0.5 truncate">ผู้ดูแลระบบ</p>
          </div>

          {/* Leader */}
          <div
            onClick={() => setSelectedRoleFilter('Leader')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all ${
              selectedRoleFilter === 'Leader'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800">Leader</span>
              <Crown size={15} className="text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900 mt-2">{stats.leader}</div>
            <p className="text-[10px] text-amber-700/80 mt-0.5 truncate">หัวหน้าห้อง</p>
          </div>

          {/* Finance */}
          <div
            onClick={() => setSelectedRoleFilter('Finance')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all ${
              selectedRoleFilter === 'Finance'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300'
                : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800">Finance</span>
              <DollarSign size={15} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900 mt-2">{stats.finance}</div>
            <p className="text-[10px] text-emerald-700/80 mt-0.5 truncate">เหรัญญิกห้อง</p>
          </div>

          {/* Student */}
          <div
            onClick={() => setSelectedRoleFilter('Student')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all ${
              selectedRoleFilter === 'Student'
                ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-300'
                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Student</span>
              <User size={15} className="text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">{stats.student}</div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">นักเรียนทั่วไป</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ, ชื่อเล่น, เลขที่, หรือเลขประจำตัว..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedRoleFilter === 'all'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({stats.total})
          </button>
          {ROLES_LIST.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRoleFilter === role
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'SuperAdmin' ? 'SuperAdmin' : ROLE_CONFIG[role].title}
            </button>
          ))}
        </div>
      </div>

      {/* Student Accounts List */}
      <div className="space-y-3">
        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
            <p className="text-slate-400 font-medium">ไม่พบรายชื่อนักเรียนที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          filteredAccounts.map((student) => {
            const avatar =
              student.prefix === 'ด.ญ.' ? '/asset/student-girl.webp' : '/asset/student-boy.webp';
            const isCurrentlyUpdating = updatingId === student.student_id;
            const isTargetSuperAdmin = student.student_id === '30260' || student.role === 'SuperAdmin';
            const isTargetAdmin = student.role === 'Admin';
            
            // Permissions
            const canModifyRole = isSuperAdmin || (!isTargetSuperAdmin && !isTargetAdmin);
            const canResetPassword = isSuperAdmin || !isTargetSuperAdmin;
            const canDeleteStudent = isSuperAdmin && student.student_id !== '30260';
            const canEditInfo = isSuperAdmin;

            return (
              <div
                key={student.student_id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isTargetSuperAdmin
                    ? 'border-purple-200 ring-1 ring-purple-100/70 bg-gradient-to-r from-white via-purple-50/20 to-pink-50/20'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-13 h-13 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
                    <img
                      src={avatar}
                      alt={student.nickname}
                      className={`w-full h-full object-contain ${
                        student.prefix === 'ด.ช.' ? 'scale-115' : ''
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight truncate">
                        {student.full_name}
                      </h3>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {student.nickname}
                      </span>
                      {isTargetSuperAdmin && (
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-xs flex items-center gap-1">
                          <Flame size={12} />
                          SuperAdmin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium flex-wrap">
                      <span className="font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-md">เลขที่ {student.student_no}</span>
                      <span>·</span>
                      <span className="font-mono">รหัส {student.student_id}</span>
                      <span>·</span>
                      {student.is_first_login ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium">
                          รหัสเริ่มต้น
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1 font-medium">
                          <Shield size={12} />
                          รหัสส่วนตัว
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Role Selector & Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                  {/* Role Selector Dropdown */}
                  <div className="relative">
                    <select
                      value={student.role}
                      disabled={isCurrentlyUpdating || !canModifyRole}
                      onChange={(e) =>
                        handleRoleChange(student.student_id, e.target.value as StudentRole)
                      }
                      title={!canModifyRole ? 'ไม่มีสิทธิ์เปลี่ยนบทบาทของบุคคลนี้' : ''}
                      className={`text-xs font-bold rounded-xl px-3 py-2 border cursor-pointer transition-all outline-none appearance-none pr-7 ${
                        ROLE_CONFIG[student.role]?.badgeColor || 'bg-slate-100 text-slate-700'
                      } ${
                        isCurrentlyUpdating || !canModifyRole
                          ? 'opacity-70 cursor-not-allowed'
                          : 'hover:shadow-xs'
                      }`}
                    >
                      <option value="Student">Student (นักเรียนปกติ)</option>
                      <option value="Leader">Leader (หัวหน้าห้อง)</option>
                      <option value="Finance">Finance (เหรัญญิก)</option>
                      {isSuperAdmin && <option value="Admin">Admin (ผู้ดูแลระบบ)</option>}
                      {isSuperAdmin && <option value="SuperAdmin">SuperAdmin (โคตรพ่อโคตรแม่)</option>}
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      ▾
                    </div>
                  </div>

                  {/* Edit Info Button (SuperAdmin Only) */}
                  {canEditInfo && (
                    <button
                      type="button"
                      onClick={() => openEditModal(student)}
                      title="แก้ไขข้อมูลนักเรียน (SuperAdmin Only)"
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                    >
                      <Edit size={15} />
                    </button>
                  )}

                  {/* Reset Password Button */}
                  <button
                    type="button"
                    onClick={() => handleResetPassword(student)}
                    disabled={isCurrentlyUpdating || !canResetPassword}
                    title={
                      !canResetPassword
                        ? 'ไม่อนุญาตให้รีเซ็ตรหัสผ่านของ SuperAdmin'
                        : 'รีเซ็ตรหัสผ่านกลับเป็นค่าเริ่มต้น'
                    }
                    className={`p-2 rounded-xl border transition-colors ${
                      !canResetPassword
                        ? 'text-slate-300 border-transparent cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 hover:border-rose-200'
                    }`}
                  >
                    <RotateCcw size={15} />
                  </button>

                  {/* Delete Student Button (SuperAdmin Only) */}
                  {canDeleteStudent && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(student)}
                      disabled={isCurrentlyUpdating}
                      title="ลบนักเรียนออกจากระบบ (SuperAdmin Only)"
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">เพิ่มนักเรียนใหม่</h2>
                    <p className="text-xs text-slate-400">ระบบจะสร้างรหัสเริ่มต้น bBb@รหัสประจำตัว อัตโนมัติ</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เลขที่ (Student No) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={newStudentNo}
                      onChange={(e) => setNewStudentNo(e.target.value)}
                      placeholder="เช่น 53"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสประจำตัว (5 หลัก) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      placeholder="เช่น 30299"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">คำนำหน้า</label>
                    <select
                      value={newPrefix}
                      onChange={(e) => setNewPrefix(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="ด.ช.">ด.ช.</option>
                      <option value="ด.ญ.">ด.ญ.</option>
                      <option value="นาย">นาย</option>
                      <option value="น.ส.">น.ส.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อจริง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="เช่น ปัณณพัฒน์"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="เช่น สมสี"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อเล่น <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      placeholder="เช่น บุ้งกี๋"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่งเริ่มต้น</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as StudentRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Student">Student (นักเรียนปกติ)</option>
                    <option value="Leader">Leader (หัวหน้าห้อง)</option>
                    <option value="Finance">Finance (เหรัญญิก)</option>
                    {isSuperAdmin && <option value="Admin">Admin (ผู้ดูแลระบบ)</option>}
                    {isSuperAdmin && <option value="SuperAdmin">SuperAdmin (โคตรพ่อโคตรแม่)</option>}
                  </select>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNewStudent}
                    className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} />
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Info Modal (SuperAdmin Only) */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">แก้ไขข้อมูลนักเรียน</h2>
                    <p className="text-xs text-slate-400">รหัสประจำตัว: {editingStudent.student_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateStudentInfo} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">เลขที่</label>
                    <input
                      type="number"
                      required
                      value={editStudentNo}
                      onChange={(e) => setEditStudentNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">คำนำหน้า</label>
                    <select
                      value={editPrefix}
                      onChange={(e) => setEditPrefix(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ด.ช.">ด.ช.</option>
                      <option value="ด.ญ.">ด.ญ.</option>
                      <option value="นาย">นาย</option>
                      <option value="น.ส.">น.ส.</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อจริง</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">นามสกุล</label>
                    <input
                      type="text"
                      required
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อเล่น</label>
                    <input
                      type="text"
                      required
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as StudentRole)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Student">Student (นักเรียนปกติ)</option>
                      <option value="Leader">Leader (หัวหน้าห้อง)</option>
                      <option value="Finance">Finance (เหรัญญิก)</option>
                      <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                      <option value="SuperAdmin">SuperAdmin (โคตรพ่อโคตรแม่)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} />
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { SafeStudentAccount, StudentRole, ROLE_CONFIG } from '@/utils/studentTypes';
import { updateStudentRoleAction, resetStudentPasswordAction } from './actions';
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
} from 'lucide-react';

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

  const isSuperAdmin = currentUserRole === 'SuperAdmin';

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

  const handleRoleChange = (studentId: string, newRole: StudentRole) => {
    // Prevent non-superadmin from touching superadmin
    if (studentId === '30260' && !isSuperAdmin) {
      toast.error('เฉพาะ SuperAdmin (โคตรพ่อโคตรแม่ผู้ดูแลระบบ) เท่านั้นที่เปลี่ยนสิทธิ์บัญชีนี้ได้');
      return;
    }

    setUpdatingId(studentId);

    // Optimistic update
    setAccounts((prev) =>
      prev.map((a) => (a.student_id === studentId ? { ...a, role: newRole } : a))
    );

    startTransition(async () => {
      const res = await updateStudentRoleAction(studentId, newRole);
      setUpdatingId(null);

      if (res.success) {
        toast.success(`เปลี่ยนบทบาทเป็น "${ROLE_CONFIG[newRole].title}" เรียบร้อยแล้ว`, {
          icon: '✨',
        });
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนบทบาท');
        // Rollback
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
      `คุณต้องการรีเซ็ตรหัสผ่านของ "${student.full_name} (${student.nickname})" กลับเป็นค่าเริ่มต้นใช่หรือไม่?\n(เพื่อความปลอดภัย นักเรียนจะต้องเข้าสู่ระบบและตั้งรหัสผ่านใหม่ด้วยตนเอง)`
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
        toast.success(`รีเซ็ตรหัสผ่านของ "${student.full_name}" กลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว`, {
          icon: '🔒',
        });
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    });
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
          {isSuperAdmin && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs flex items-center gap-1.5">
              <Flame size={13} />
              SuperAdmin Mode
            </span>
          )}
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
            ห้อง ม.2/3 · ทั้งหมด {stats.total} คน
          </span>
        </div>
      </div>

      {/* Hero / Title Section */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                จัดการสิทธิ์และบทบาท (Student Roles)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                กำหนดบทบาทนักเรียนในห้อง · ระบบเข้ารหัสรหัสผ่านปลอดภัย 100% (ห้ามใครดูรหัสผ่านผู้อื่น)
              </p>
            </div>
          </div>
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
            const canModify = isSuperAdmin || !isTargetSuperAdmin;

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
                      <span>เลขที่ {student.student_no}</span>
                      <span>·</span>
                      <span className="font-mono">เลขประจำตัว: {student.student_id}</span>
                      <span>·</span>
                      {student.is_first_login ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium">
                          รหัสเริ่มต้น (รอเปลี่ยน)
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1 font-medium">
                          <Shield size={12} />
                          ตั้งรหัสส่วนตัวแล้ว (เข้ารหัสปลอดภัย)
                        </span>
                      )}
                      {student.has_security_question && (
                        <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60 flex items-center gap-1 font-medium">
                          <Sparkles size={12} />
                          มีคำถามความปลอดภัย
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Role Selector & Actions */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 flex-wrap">
                  {/* Role Selector Dropdown */}
                  <div className="relative">
                    <select
                      value={student.role}
                      disabled={isCurrentlyUpdating || !canModify}
                      onChange={(e) =>
                        handleRoleChange(student.student_id, e.target.value as StudentRole)
                      }
                      title={!canModify ? 'เฉพาะ SuperAdmin เท่านั้นที่สามารถเปลี่ยนสิทธิ์ของ SuperAdmin ได้' : ''}
                      className={`text-xs font-bold rounded-xl px-3.5 py-2 border cursor-pointer transition-all outline-none appearance-none pr-8 ${
                        ROLE_CONFIG[student.role].badgeColor
                      } ${
                        isCurrentlyUpdating || !canModify
                          ? 'opacity-70 cursor-not-allowed'
                          : 'hover:shadow-xs'
                      }`}
                    >
                      <option value="Student">Student (นักเรียนปกติ)</option>
                      <option value="Leader">Leader (หัวหน้าห้อง)</option>
                      <option value="Finance">Finance (เหรัญญิก)</option>
                      <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                      <option value="SuperAdmin">SuperAdmin (โคตรพ่อโคตรแม่ผู้ดูแลระบบ)</option>
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                      ▾
                    </div>
                  </div>

                  {/* Reset Password Button */}
                  <button
                    type="button"
                    onClick={() => handleResetPassword(student)}
                    disabled={isCurrentlyUpdating || !canModify}
                    title={
                      !canModify
                        ? 'ไม่อนุญาตให้รีเซ็ตรหัสผ่านของ SuperAdmin'
                        : 'รีเซ็ตรหัสผ่านกลับเป็นค่าเริ่มต้น'
                    }
                    className={`p-2 rounded-xl border transition-colors ${
                      !canModify
                        ? 'text-slate-300 border-transparent cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-200'
                    }`}
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getAllUsersWithRoles, updateUserRole } from './actions';

type UserData = {
  id: string;
  email?: string;
  created_at: string;
  role: string;
};

export default function RolesPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const result = await getAllUsersWithRoles();
    if (result.error) {
      toast.error(result.error);
    } else if (result.users) {
      setUsers(result.users);
    }
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole} หรือไม่?`)) return;

    setIsUpdating(userId);
    const toastId = toast.loading('กำลังอัปเดตสิทธิ์...');
    
    const result = await updateUserRole(userId, newRole);
    
    setIsUpdating(null);
    if (result.error) {
      toast.error(result.error, { id: toastId });
    } else {
      toast.success('อัปเดตสิทธิ์สำเร็จ!', { id: toastId });
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">จัดการสิทธิ์ผู้ใช้งาน (Roles) 👑</h1>
            <p className="text-slate-500 mt-1">กำหนดสิทธิ์ Admin, Jod (คนจดงาน), Tuang (คนทวงเงิน)</p>
          </div>
          <Link
            href="/settings"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            กลับไปการตั้งค่า
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-500 py-8">ไม่พบข้อมูลผู้ใช้งาน</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-sm">
                    <th className="pb-4 font-medium">อีเมลผู้ใช้</th>
                    <th className="pb-4 font-medium">วันที่สมัคร</th>
                    <th className="pb-4 font-medium">สิทธิ์ปัจจุบัน (Role)</th>
                    <th className="pb-4 font-medium text-right">เปลี่ยนสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-slate-700 font-medium">
                        {user.email}
                      </td>
                      <td className="py-4 text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          user.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          user.role === 'tuang' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          user.role === 'jod' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <select
                          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-auto ml-auto p-2"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={isUpdating === user.id}
                        >
                          <option value="user">User (ทั่วไป)</option>
                          <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                          <option value="tuang">Tuang (คนทวงเงิน)</option>
                          <option value="jod">Jod (คนจดงาน)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

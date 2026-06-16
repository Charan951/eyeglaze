import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface AdminUserRow {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  ordersCount: number;
  role: string;
  membershipActive: boolean;
}

const mockUsers: AdminUserRow[] = [
  { _id: 'u1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com', createdAt: '2026-01-10', ordersCount: 5, role: 'user', membershipActive: true },
  { _id: 'u2', name: 'Priya Patel', phone: '9123456780', email: 'priya@email.com', createdAt: '2026-02-15', ordersCount: 3, role: 'user', membershipActive: false },
  { _id: 'u3', name: 'Amit Kumar', phone: '', email: 'amit@company.com', createdAt: '2026-03-20', ordersCount: 8, role: 'user', membershipActive: true },
  { _id: 'u4', name: 'Admin User', phone: '', email: 'admin@eyeglaze.com', createdAt: '2025-12-01', ordersCount: 0, role: 'admin', membershipActive: false },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>(mockUsers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/admin/users')
      .then(res => {
        if (!active) return;
        const data = res.data?.users;
        if (data?.length) setUsers(data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="text-center text-[#888] py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <div className="text-[#888] text-sm">{users.length} total users</div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#888] text-xs uppercase border-b border-[#2A2A2A]">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Phone / Email</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Orders</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Membership</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b border-[#2A2A2A] hover:bg-[#222] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] text-xs font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-white text-xs">{user.phone && `+91 ${user.phone}`}</div>
                    <div className="text-[#888] text-xs">{user.email}</div>
                  </td>
                  <td className="px-5 py-4 text-[#888]">{user.createdAt}</td>
                  <td className="px-5 py-4 text-white font-semibold">{user.ordersCount}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      user.role === 'admin'
                        ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                        : 'bg-[#2A2A2A] text-[#888]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.membershipActive ? (
                      <span className="text-[#C9A84C] text-xs font-bold">★ Active</span>
                    ) : (
                      <span className="text-[#888] text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

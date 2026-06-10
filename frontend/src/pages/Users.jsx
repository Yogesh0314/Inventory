import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Users as UsersIcon, 
  Shield, 
  User, 
  Trash2, 
  AlertTriangle,
  Mail,
  Calendar,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import SkeletonRow from '../components/SkeletonRow';

const Users = () => {
  const { token, user: currentUser, API_URL } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/users`, { headers });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }
      
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, API_URL]);

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.id) {
      addToast('Security Policy: You cannot demote your own Administrative status.', 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update role');
      }

      addToast('User role updated successfully.', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      addToast('Security Policy: Self-deletion is disabled for active Administrative sessions.', 'warning');
      return;
    }

    if (window.confirm('Are you absolutely sure you want to permanently delete this user account? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_URL}/auth/users/${userId}`, {
          method: 'DELETE',
          headers
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete user');
        }

        addToast('User account removed.', 'success');
        fetchUsers();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-primaryText flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-accentPurple" />
            System User Management
          </h3>
          <p className="text-sm text-secondaryText">Manage internal staff roles, audit registered accounts, and control system-wide access levels.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-950/20 border border-rose-900/30 p-4 text-xs text-rose-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel rounded-3xl border border-glassBorder overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glassBorder bg-white/3">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Identity & Username</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Email Address</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Account Role</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Registered Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glassBorder">
              {loading ? (
                <>
                  <SkeletonRow columns={5} />
                  <SkeletonRow columns={5} />
                  <SkeletonRow columns={5} />
                </>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-secondaryText italic text-sm">No registered users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className={`hover:bg-white/2 transition-colors ${user._id === currentUser.id ? 'bg-accentBlue/5' : ''}`}>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm border ${
                          user.role === 'admin' 
                            ? 'bg-accentPurple/10 text-accentPurple border-accentPurple/20' 
                            : 'bg-accentBlue/10 text-accentBlue border-accentBlue/20'
                        }`}>
                          {user.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-primaryText leading-none">
                            {user.username}
                            {user._id === currentUser.id && (
                              <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-secondaryText font-normal">You</span>
                            )}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-secondaryText">
                            <User className="h-3 w-3" />
                            <span>ID: {user._id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-secondaryText font-medium">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${
                        user.role === 'admin'
                          ? 'bg-accentPurple/15 text-accentPurple border-accentPurple/20'
                          : 'bg-accentBlue/15 text-accentBlue border-accentBlue/20'
                      }`}>
                        {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-secondaryText font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* Change Role Logic */}
                        <div className="flex p-1 rounded-xl bg-darkBg/60 border border-glassBorder">
                          <button
                            onClick={() => handleRoleChange(user._id, 'staff')}
                            disabled={user.role === 'staff'}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                              user.role === 'staff'
                                ? 'bg-accentBlue text-white shadow-lg shadow-accentBlue/20'
                                : 'text-secondaryText hover:text-primaryText cursor-pointer'
                            }`}
                          >
                            Staff
                          </button>
                          <button
                            onClick={() => handleRoleChange(user._id, 'admin')}
                            disabled={user.role === 'admin'}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                              user.role === 'admin'
                                ? 'bg-accentPurple text-white shadow-lg shadow-accentPurple/20'
                                : 'text-secondaryText hover:text-primaryText cursor-pointer'
                            }`}
                          >
                            Admin
                          </button>
                        </div>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={user._id === currentUser.id}
                          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                            user._id === currentUser.id
                              ? 'opacity-30 cursor-not-allowed bg-white/5 text-white/20'
                              : 'bg-accentRose/10 hover:bg-accentRose/25 border border-accentRose/20 text-accentRose cursor-pointer'
                          }`}
                          title="Permanently Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Search, 
  User, 
  Clock, 
  Box, 
  ChevronRight,
  Eye
} from 'lucide-react';
import SkeletonRow from '../components/SkeletonRow';
import Pagination from '../components/Pagination';

const AuditLog = () => {
  const { token, API_URL } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedLog, setSelectedLog] = useState(null);

  const headers = { 'Authorization': `Bearer ${token}` };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, page],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/audit?search=${search}&page=${page}&limit=${limit}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
    keepPreviousData: true
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 0;

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'UPDATE': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'DELETE': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-accentBlue bg-accentBlue/10 border-accentBlue/20';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-primaryText flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-accentBlue" />
            System Audit Trail
          </h3>
          <p className="text-sm text-secondaryText">Complete immutable record of all administrative actions and data modifications.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-glassBorder">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondaryText">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm"
            placeholder="Search by User, Action, or Target..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-glassBorder overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glassBorder bg-white/3">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Action</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">User</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Target</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText">Time</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-secondaryText text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glassBorder">
                {isLoading ? (
                  <SkeletonRow columns={5} />
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-secondaryText mb-4 border border-glassBorder">
                          <Box className="h-6 w-6" />
                        </div>
                        <h5 className="font-semibold text-sm text-primaryText">No logs found</h5>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr 
                      key={log._id} 
                      className={`hover:bg-white/2 transition-colors cursor-pointer ${selectedLog?._id === log._id ? 'bg-white/5' : ''}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-accentBlue border border-glassBorder">
                            {log.user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-primaryText">{log.user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-primaryText">{log.target.name}</div>
                        <div className="text-[10px] text-secondaryText uppercase tracking-tight">{log.target.collection}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs text-primaryText font-medium">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-secondaryText">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 rounded-lg bg-white/5 text-secondaryText hover:text-accentBlue hover:bg-accentBlue/10 border border-transparent hover:border-accentBlue/20 transition-all">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
          />
        </div>

        {/* Log Details Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-glassBorder sticky top-8">
            <h4 className="text-lg font-bold text-primaryText mb-6 flex items-center gap-2">
              <Eye className="h-5 w-5 text-accentBlue" />
              Change Insights
            </h4>

            {selectedLog ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/3 border border-glassBorder">
                    <p className="text-[10px] font-bold text-secondaryText uppercase tracking-wider mb-1">Status</p>
                    <p className={`text-xs font-black uppercase ${getActionColor(selectedLog.action).split(' ')[0]}`}>{selectedLog.action}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/3 border border-glassBorder">
                    <p className="text-[10px] font-bold text-secondaryText uppercase tracking-wider mb-1">Time</p>
                    <p className="text-xs font-black text-primaryText">{new Date(selectedLog.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-secondaryText uppercase tracking-widest mb-3 flex items-center gap-2">
                      <div className="h-1 w-4 bg-accentBlue rounded-full" />
                      Detailed Delta
                    </h5>
                    
                    <div className="space-y-3">
                      {selectedLog.oldValue ? (
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Previous State</p>
                          <pre className="text-[10px] text-rose-200/70 overflow-auto whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(selectedLog.oldValue, null, 2)}
                          </pre>
                        </div>
                      ) : null}

                      {selectedLog.newValue ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Updated State</p>
                          <pre className="text-[10px] text-emerald-200/70 overflow-auto whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(selectedLog.newValue, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                          <p className="text-xs font-bold text-rose-400">Object Permantly Deleted</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-glassBorder">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-secondaryText font-medium">Log Signature:</span>
                    <span className="font-mono text-white/30 truncate ml-4">{selectedLog._id}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <Clock className="h-10 w-10 mb-4" />
                <p className="text-xs font-medium max-w-[180px]">Select a log entry from the table to inspect details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;

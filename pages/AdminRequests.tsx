
import React, { useState, useEffect } from 'react';
import { LeaveRequest } from '../types';
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from '../constants';
import { dataService } from '../services/dataService';

const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await dataService.getRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    await dataService.updateRequestStatus(id, newStatus);
    fetchRequests();
  };

  if (loading) return <div className="flex items-center justify-center h-full pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6 md:space-y-8 pb-10 px-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">신청 승인</h1>
        <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black">
          {requests.filter(r => r.status === 'PENDING').length} 건 대기
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">신청자</th>
                <th className="px-6 py-4">유형</th>
                <th className="px-6 py-4">일정</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-900">{req.userName}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${LEAVE_TYPE_COLORS[req.type]}`}>{LEAVE_TYPE_LABELS[req.type]}</span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                    {req.startDate} ~ {req.endDate}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {req.status === 'PENDING' ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleAction(req.id, 'APPROVED')} className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-lg shadow-sm">승인</button>
                        <button onClick={() => handleAction(req.id, 'REJECTED')} className="px-3 py-1.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded-lg">반려</button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-black uppercase tracking-widest ${req.status === 'APPROVED' ? 'text-emerald-500' : 'text-slate-300'}`}>{req.status}</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-300 text-xs italic">내역이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;

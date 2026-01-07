
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
    fetchRequests(); // 데이터 갱신
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">신청 승인 관리</h1>
          <p className="text-sm text-slate-500">전체 직원의 신청 내역을 서버에서 실시간으로 불러옵니다.</p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold">대기 {pendingRequests.length}건</div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
              <th className="px-6 py-4">신청자</th>
              <th className="px-6 py-4">유형</th>
              <th className="px-6 py-4">일정</th>
              <th className="px-6 py-4">상태</th>
              <th className="px-6 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-sm">{req.userName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${LEAVE_TYPE_COLORS[req.type]}`}>{LEAVE_TYPE_LABELS[req.type]}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-600">{req.startDate} ~ {req.endDate}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold ${req.status === 'APPROVED' ? 'text-emerald-500' : req.status === 'PENDING' ? 'text-amber-500' : 'text-red-500'}`}>{req.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleAction(req.id, 'APPROVED')} className="px-3 py-1 bg-emerald-600 text-white text-[10px] rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition-all">승인</button>
                      <button onClick={() => handleAction(req.id, 'REJECTED')} className="px-3 py-1 bg-red-100 text-red-600 text-[10px] rounded-lg font-bold hover:bg-red-200 transition-all">반려</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400">내역이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRequests;

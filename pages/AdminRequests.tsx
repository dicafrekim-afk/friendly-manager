
import React, { useState, useEffect } from 'react';
import { LeaveRequest, User } from '../types';
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from '../constants';
import { dataService, isSuperAdmin } from '../services/dataService';

const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const session = localStorage.getItem('friendly_current_session');
    if (session) {
      const parsedUser = JSON.parse(session);
      setCurrentUser(parsedUser);
      
      const allRequests = await dataService.getRequests();
      const userIsSuper = isSuperAdmin(parsedUser.email);
      
      // Filter logic based on role and team
      let filtered = allRequests;
      if (!userIsSuper) {
        // PL only sees requests from their own team that are at 'PENDING_PL' status
        filtered = allRequests.filter(req => 
          req.userTeam === parsedUser.team && 
          (req.status === 'PENDING_PL' || req.userId === parsedUser.id)
        );
      }
      
      setRequests(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, newStatus: any) => {
    await dataService.updateRequestStatus(id, newStatus);
    fetchRequests();
  };

  if (loading || !currentUser) return <div className="flex items-center justify-center h-full pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const userIsSuper = isSuperAdmin(currentUser.email);

  return (
    <div className="space-y-6 md:space-y-8 pb-10 px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">신청 승인 관리</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            {userIsSuper ? '✨ 최고관리자: 전사 최종 승인 권한' : `👤 PL (${currentUser.team}팀): 1차 검토 권한`}
          </p>
        </div>
        <div className="flex gap-2">
          {!userIsSuper && (
            <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-xl text-[10px] font-black border border-amber-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              내 팀 검토 대기: {requests.filter(r => r.status === 'PENDING_PL').length}
            </div>
          )}
          {userIsSuper && (
            <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl text-[10px] font-black border border-indigo-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              전사 최종 승인 대기: {requests.filter(r => r.status === 'PENDING_FINAL').length}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">신청자/팀</th>
                <th className="px-6 py-4">유형</th>
                <th className="px-6 py-4">사유</th>
                <th className="px-6 py-4">일정</th>
                <th className="px-6 py-4">현재 상태</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map(req => {
                const canReview = !userIsSuper && req.status === 'PENDING_PL' && req.userId !== currentUser.id;
                const canFinalApprove = userIsSuper && req.status === 'PENDING_FINAL';
                const canReject = (userIsSuper && (req.status === 'PENDING_PL' || req.status === 'PENDING_FINAL')) || (!userIsSuper && req.status === 'PENDING_PL' && req.userId !== currentUser.id);

                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">{req.userName}</p>
                      <p className="text-[9px] font-bold text-slate-400">{req.userTeam || '공통'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase w-fit ${LEAVE_TYPE_COLORS[req.type]}`}>
                          {LEAVE_TYPE_LABELS[req.type]}
                        </span>
                        {req.type === 'HALF_DAY' && req.halfDayType && (
                          <span className="text-[8px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 w-fit">
                            {req.halfDayType === 'MORNING' ? '오전' : '오후'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-slate-500 line-clamp-1 max-w-[200px]">{req.reason}</p>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap">
                      {req.type === 'HALF_DAY' ? req.startDate : `${req.startDate} ~ ${req.endDate}`}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg w-fit ${
                          req.status === 'PENDING_PL' ? 'bg-amber-50 text-amber-600' :
                          req.status === 'PENDING_FINAL' ? 'bg-indigo-50 text-indigo-600' :
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {req.status === 'PENDING_PL' ? 'PL 검토 대기' :
                           req.status === 'PENDING_FINAL' ? '최종 승인 대기' :
                           req.status === 'APPROVED' ? '승인 완료' : '반려됨'}
                        </span>
                        {req.status === 'PENDING_FINAL' && <span className="text-[8px] font-bold text-indigo-300 ml-1">PL 검토 완료 ✓</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex gap-2 justify-end">
                        {canReview && (
                          <button 
                            onClick={() => handleAction(req.id, 'PENDING_FINAL')} 
                            className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                          >
                            검토 승인
                          </button>
                        )}
                        {canFinalApprove && (
                          <button 
                            onClick={() => handleAction(req.id, 'APPROVED')} 
                            className="px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black rounded-lg shadow-sm hover:bg-emerald-600 transition-colors"
                          >
                            최종 승인
                          </button>
                        )}
                        {canReject && (
                          <button 
                            onClick={() => handleAction(req.id, 'REJECTED')} 
                            className="px-3 py-1.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            반려
                          </button>
                        )}
                        {req.status === 'APPROVED' && <span className="text-[9px] font-black text-emerald-500 tracking-widest uppercase py-1.5">FINALIZED</span>}
                        {req.status === 'REJECTED' && <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase py-1.5">REJECTED</span>}
                        {req.userId === currentUser.id && req.status.startsWith('PENDING') && <span className="text-[9px] font-black text-slate-300 italic py-1.5">본인 신청 건</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {requests.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-300 text-xs italic">내역이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;

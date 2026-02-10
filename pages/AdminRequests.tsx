
import React, { useState, useEffect } from 'react';
import { LeaveRequest, User, ExtraWorkReport } from '../types';
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from '../constants';
import { dataService, isSuperAdmin } from '../services/dataService';

const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [extraReports, setExtraReports] = useState<ExtraWorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tab, setTab] = useState<'LEAVE' | 'WORK'>('LEAVE');

  const fetchData = async () => {
    setLoading(true);
    const session = localStorage.getItem('friendly_current_session');
    if (session) {
      const parsedUser = JSON.parse(session);
      setCurrentUser(parsedUser);
      const [allRequests, allExtra] = await Promise.all([dataService.getRequests(), dataService.getExtraWorkReports()]);
      const userIsSuper = isSuperAdmin(parsedUser.email);
      
      if (userIsSuper) {
        setRequests(allRequests);
        setExtraReports(allExtra);
      } else {
        setRequests(allRequests.filter(r => r.userTeam === parsedUser.team));
        setExtraReports(allExtra.filter(r => r.userTeam === parsedUser.team));
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, status: any) => {
    await dataService.updateRequestStatus(id, status);
    fetchData();
  };

  const handleExtraAction = async (id: string, status: any) => {
    await dataService.updateExtraWorkStatus(id, status);
    fetchData();
  };

  if (loading || !currentUser) return <div className="p-20 text-center">로딩 중...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900">신청 승인 관리</h1>
           <p className="text-sm font-bold text-slate-400">팀원들의 모든 요청을 실시간으로 관리하세요.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[20px] shadow-inner">
           <button onClick={() => setTab('LEAVE')} className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${tab === 'LEAVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>휴가/출장 ({requests.length})</button>
           <button onClick={() => setTab('WORK')} className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${tab === 'WORK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>추가 근무 ({extraReports.length})</button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        {tab === 'LEAVE' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black">
                 <tr>
                    <th className="px-8 py-5">신청자</th>
                    <th className="px-8 py-5">유형</th>
                    <th className="px-8 py-5">사유</th>
                    <th className="px-8 py-5">일정</th>
                    <th className="px-8 py-5 text-right">관리</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {requests.map(req => (
                    <tr key={req.id}>
                       <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900">{req.userName}</p>
                          <p className="text-[9px] font-bold text-slate-400">{req.userTeam}</p>
                       </td>
                       <td className="px-8 py-6"><span className={`px-2 py-1 rounded text-[9px] font-black border ${LEAVE_TYPE_COLORS[req.type]}`}>{LEAVE_TYPE_LABELS[req.type]}</span></td>
                       <td className="px-8 py-6 text-[11px] font-bold text-slate-500 max-w-xs truncate">{req.reason}</td>
                       <td className="px-8 py-6 text-[10px] font-black text-slate-400">{req.startDate} {req.endDate !== req.startDate ? `~ ${req.endDate}` : ''}</td>
                       <td className="px-8 py-6 text-right">
                          {req.status.startsWith('PENDING') ? (
                             <div className="flex justify-end gap-2">
                                <button onClick={() => handleAction(req.id, 'APPROVED')} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-100">승인</button>
                                <button onClick={() => handleAction(req.id, 'REJECTED')} className="px-4 py-2 bg-slate-100 text-slate-400 text-[10px] font-black rounded-xl">반려</button>
                             </div>
                          ) : <span className="text-[10px] font-black uppercase text-slate-300">{req.status}</span>}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black">
                 <tr>
                    <th className="px-8 py-5">보고자</th>
                    <th className="px-8 py-5">유형</th>
                    <th className="px-8 py-5">보상 수량</th>
                    <th className="px-8 py-5">업무 상세</th>
                    <th className="px-8 py-5 text-right">관리</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {extraReports.map(rep => (
                    <tr key={rep.id}>
                       <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900">{rep.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{rep.workDate}</p>
                       </td>
                       <td className="px-8 py-6"><span className={`px-2 py-1 rounded text-[9px] font-black border ${rep.workType === 'WEEKEND' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-violet-50 text-violet-600 border-violet-100'}`}>{rep.workType === 'WEEKEND' ? '주말 근무' : '철야 근무'}</span></td>
                       <td className="px-8 py-6 font-black text-slate-900 text-sm">{rep.rewardAmount}d <span className="text-[10px] text-slate-300">합산 예정</span></td>
                       <td className="px-8 py-6 text-[11px] font-bold text-slate-500 max-w-xs truncate">{rep.reason}</td>
                       <td className="px-8 py-6 text-right">
                          {rep.status === 'PENDING_PL' ? (
                             <div className="flex justify-end gap-2">
                                <button onClick={() => handleExtraAction(rep.id, 'APPROVED')} className="px-4 py-2 bg-violet-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-violet-100">근무 승인</button>
                                <button onClick={() => handleExtraAction(rep.id, 'REJECTED')} className="px-4 py-2 bg-slate-100 text-slate-400 text-[10px] font-black rounded-xl">반려</button>
                             </div>
                          ) : <span className="text-[10px] font-black uppercase text-slate-300">{rep.status}</span>}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;

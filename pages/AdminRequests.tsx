
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
      try {
        const parsedUser = JSON.parse(session);
        setCurrentUser(parsedUser);
        
        // 데이터 강제 로드
        const [allRequests, allExtra] = await Promise.all([
          dataService.getRequests(),
          dataService.getExtraWorkReports()
        ]);

        const hasFullAccess = isSuperAdmin(parsedUser.email) || parsedUser.role === 'ADMIN';
        
        if (hasFullAccess) {
          setRequests(allRequests || []);
          setExtraReports(allExtra || []);
          console.log("Admin Loaded Work Data:", allExtra);
        } else {
          setRequests((allRequests || []).filter(r => r.userTeam === parsedUser.team));
          setExtraReports((allExtra || []).filter(r => r.userTeam === parsedUser.team));
        }
      } catch (err) {
        console.error("Data load error", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleTabChange = (newTab: 'LEAVE' | 'WORK') => {
    setTab(newTab);
    fetchData();
  };

  const handleAction = async (id: string, status: any) => {
    await dataService.updateRequestStatus(id, status);
    fetchData();
  };

  const handleExtraAction = async (id: string, status: any) => {
    await dataService.updateExtraWorkStatus(id, status);
    fetchData();
  };

  const formatTimeRange = (start?: any, end?: any) => {
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return '시간 정보 없음';
    try {
      const s = start.includes('T') ? start.split('T')[1].substring(0, 5) : start;
      const e = end.includes('T') ? end.split('T')[1].substring(0, 5) : end;
      return `${s} ~ ${e}`;
    } catch (e) { return '형식 오류'; }
  };

  if (loading || !currentUser) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 pb-20 px-2 md:px-0 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">신청 승인 관리</h1>
           <p className="text-xs md:text-sm font-bold text-slate-400 mt-1">팀원들의 모든 요청을 실시간으로 관리하세요.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] shadow-inner w-full lg:w-auto overflow-x-auto scrollbar-hide">
           <button onClick={() => handleTabChange('LEAVE')} className={`flex-1 lg:flex-none px-6 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${tab === 'LEAVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>휴가/출장 ({requests.length})</button>
           <button onClick={() => handleTabChange('WORK')} className={`flex-1 lg:flex-none px-6 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${tab === 'WORK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>추가 근무 ({extraReports.length})</button>
        </div>
      </div>

      {tab === 'LEAVE' && (
        <div className="space-y-4 md:space-y-0">
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {requests.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] text-center border border-slate-100 italic text-slate-300 text-sm">신청 내역이 없습니다.</div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{req.userName || '알 수 없음'}</h3>
                      <p className="text-[10px] font-bold text-slate-400">{req.userTeam || '팀 미지정'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${LEAVE_TYPE_COLORS[req.type]}`}>{LEAVE_TYPE_LABELS[req.type]}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">일정</span>
                      <span className="text-slate-600">{req.startDate} {req.endDate !== req.startDate ? `~ ${req.endDate}` : ''}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100"><p className="text-[11px] font-medium text-slate-500">{req.reason}</p></div>
                  </div>
                  <div className="flex gap-2">
                    {req.status?.startsWith('PENDING') ? (
                      <>
                        <button onClick={() => handleAction(req.id, 'APPROVED')} className="flex-1 py-3 bg-indigo-600 text-white text-[11px] font-black rounded-xl shadow-lg">승인</button>
                        <button onClick={() => handleAction(req.id, 'REJECTED')} className="flex-1 py-3 bg-slate-100 text-slate-400 text-[11px] font-black rounded-xl">반려</button>
                      </>
                    ) : <div className="w-full py-2 bg-slate-50 text-slate-300 text-[10px] font-black uppercase text-center rounded-xl">{req.status}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black">
                   <tr>
                      <th className="px-8 py-5">신청자</th><th className="px-8 py-5">유형</th><th className="px-8 py-5">사유</th><th className="px-8 py-5">일정</th><th className="px-8 py-5 text-right">관리</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {requests.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-20 text-center italic text-slate-300 text-sm">신청 내역이 없습니다.</td></tr>
                    ) : (
                      requests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-8 py-6"><p className="text-sm font-black text-slate-900">{req.userName}</p><p className="text-[9px] font-bold text-slate-400">{req.userTeam}</p></td>
                           <td className="px-8 py-6"><span className={`px-2 py-1 rounded text-[9px] font-black border ${LEAVE_TYPE_COLORS[req.type]}`}>{LEAVE_TYPE_LABELS[req.type]}</span></td>
                           <td className="px-8 py-6 text-[11px] font-bold text-slate-500">{req.reason}</td>
                           <td className="px-8 py-6 text-[10px] font-black text-slate-400">{req.startDate} {req.endDate !== req.startDate ? `~ ${req.endDate}` : ''}</td>
                           <td className="px-8 py-6 text-right">
                              {req.status?.startsWith('PENDING') ? (
                                 <div className="flex justify-end gap-2">
                                    <button onClick={() => handleAction(req.id, 'APPROVED')} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-lg">승인</button>
                                    <button onClick={() => handleAction(req.id, 'REJECTED')} className="px-4 py-2 bg-slate-100 text-slate-400 text-[10px] font-black rounded-xl">반려</button>
                                 </div>
                              ) : <span className="text-[10px] font-black uppercase text-slate-300">{req.status}</span>}
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'WORK' && (
        <div className="space-y-4 md:space-y-0">
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {extraReports.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] text-center border border-slate-100 italic text-slate-300 text-sm">보고 내역이 없습니다.</div>
            ) : (
              extraReports.map(rep => (
                <div key={rep.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div><h3 className="text-sm font-black text-slate-900">{rep.userName}</h3><p className="text-[10px] font-bold text-slate-400">{rep.workDate}</p></div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${rep.workType === 'WEEKEND' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-violet-50 text-violet-600 border-violet-100'}`}>{rep.workType === 'WEEKEND' ? '주말 근무' : '철야 근무'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black"><span className="text-slate-400 uppercase tracking-widest">Reward</span><span className="text-indigo-600 text-sm">{rep.rewardAmount}d</span></div>
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold">{formatTimeRange(rep.startDateTime, rep.endDateTime)} ({rep.workHours}h)</div>
                  </div>
                  <div className="flex gap-2">
                    {rep.status === 'PENDING_PL' ? (
                      <>
                        <button onClick={() => handleExtraAction(rep.id, 'APPROVED')} className="flex-1 py-3 bg-violet-600 text-white text-[11px] font-black rounded-xl shadow-lg">승인</button>
                        <button onClick={() => handleExtraAction(rep.id, 'REJECTED')} className="flex-1 py-3 bg-slate-100 text-slate-400 text-[11px] font-black rounded-xl">반려</button>
                      </>
                    ) : <div className="w-full py-2 bg-slate-50 text-slate-300 text-[10px] font-black uppercase text-center rounded-xl">{rep.status}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black">
                   <tr>
                      <th className="px-8 py-5">보고자</th><th className="px-8 py-5">유형</th><th className="px-8 py-5">시간</th><th className="px-8 py-5">보상 수량</th><th className="px-8 py-5 text-right">관리</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {extraReports.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-20 text-center italic text-slate-300 text-sm">보고 내역이 없습니다.</td></tr>
                    ) : (
                      extraReports.map(rep => (
                        <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-8 py-6"><p className="text-sm font-black text-slate-900">{rep.userName}</p><p className="text-[10px] font-bold text-slate-400">{rep.workDate}</p></td>
                           <td className="px-8 py-6"><span className={`px-2 py-1 rounded text-[9px] font-black border ${rep.workType === 'WEEKEND' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-violet-50 text-violet-600 border-violet-100'}`}>{rep.workType === 'WEEKEND' ? '주말 근무' : '철야 근무'}</span></td>
                           <td className="px-8 py-6 text-[10px] font-bold text-slate-900">{formatTimeRange(rep.startDateTime, rep.endDateTime)} ({rep.workHours}h)</td>
                           <td className="px-8 py-6 font-black text-slate-900 text-sm">{rep.rewardAmount}d</td>
                           <td className="px-8 py-6 text-right">
                              {rep.status === 'PENDING_PL' ? (
                                 <div className="flex justify-end gap-2">
                                    <button onClick={() => handleExtraAction(rep.id, 'APPROVED')} className="px-4 py-2 bg-violet-600 text-white text-[10px] font-black rounded-xl shadow-lg">승인</button>
                                    <button onClick={() => handleExtraAction(rep.id, 'REJECTED')} className="px-4 py-2 bg-slate-100 text-slate-400 text-[10px] font-black rounded-xl">반려</button>
                                 </div>
                              ) : <span className="text-[10px] font-black uppercase text-slate-300">{rep.status}</span>}
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;

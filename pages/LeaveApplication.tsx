
import React, { useState, useMemo, useEffect } from 'react';
import { LeaveType, LeaveRequest, User } from '../types';
import { LEAVE_TYPE_LABELS } from '../constants';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';

const LeaveApplication: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [type, setType] = useState<LeaveType>('VACATION');
  const [halfDayType, setHalfDayType] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
       const session = localStorage.getItem('friendly_current_session');
       if (session) {
         const u = JSON.parse(session);
         const users = await dataService.getUsers();
         const freshUser = users.find(x => x.id === u.id);
         if (freshUser) setCurrentUser(freshUser);
       }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if ((type === 'HALF_DAY' || type === 'EXTRA_LEAVE') && startDate) setEndDate(startDate);
  }, [type, startDate]);

  const diffDays = useMemo(() => {
    if (type === 'HALF_DAY') return 0.5;
    if (type === 'EXTRA_LEAVE') return 1.0; // 보상휴가는 기본 1일 단위 사용 (또는 반차 처리 필요)
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [type, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (type === 'EXTRA_LEAVE') {
       const available = (currentUser.extraLeaveAvailable || 0) - (currentUser.extraLeaveUsed || 0);
       if (available < diffDays) {
          alert('보유하신 보상 휴가가 부족합니다.');
          return;
       }
    }

    setIsSubmitting(true);
    try {
      const newRequest: LeaveRequest = {
        id: `req-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        type,
        halfDayType: (type === 'HALF_DAY') ? halfDayType : undefined,
        startDate,
        endDate,
        reason,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      await dataService.createRequest(newRequest);
      setSubmitted(true);
    } catch (error) {
      alert('신청 중 오류가 발생했습니다.');
    } finally { setIsSubmitting(false); }
  };

  if (!currentUser) return null;
  if (submitted) return <div className="p-20 text-center">신청이 완료되었습니다!</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-16 animate-in fade-in">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">신청하기</h1>
        <p className="text-sm text-slate-400 mt-2 font-bold">휴가 및 출장 일정을 친절하게 안내해 드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">유형 선택</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`py-4 rounded-2xl text-[11px] font-black transition-all border-2 ${type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-100'}`}>
                {LEAVE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          {type === 'EXTRA_LEAVE' && (
             <div className="p-3 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black border border-violet-100">
                보유 중인 보상 휴가: {(currentUser.extraLeaveAvailable || 0) - (currentUser.extraLeaveUsed || 0)}일
             </div>
          )}
          {type === 'HALF_DAY' && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">반차 구분</label>
              <div className="grid grid-cols-2 gap-3">
                {(['MORNING', 'AFTERNOON'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHalfDayType(t)}
                    className={`py-4 rounded-2xl text-[11px] font-black transition-all border-2 ${halfDayType === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-100'}`}
                  >
                    {t === 'MORNING' ? '오전 반차' : '오후 반차'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 기존 폼 필드들과 로직은 동일하게 유지 (시작일, 종료일, 사유 등) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">일자 선택</label>
              <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none font-black text-sm" />
           </div>
           {type !== 'HALF_DAY' && type !== 'EXTRA_LEAVE' && (
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">종료일</label>
                <input required type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none font-black text-sm" />
             </div>
           )}
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">신청 사유</label>
           <textarea required rows={5} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-6 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold resize-none" placeholder="사유를 입력하세요." />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-indigo-700 transition-all disabled:bg-slate-300">
           {isSubmitting ? '전송 중...' : '제출하기'}
        </button>
      </form>
    </div>
  );
};

export default LeaveApplication;


import React, { useState, useMemo, useEffect } from 'react';
import { LeaveType, LeaveRequest, User } from '../types';
import { LEAVE_TYPE_LABELS } from '../constants';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';

const LeaveApplication: React.FC = () => {
  const currentUser: User = JSON.parse(localStorage.getItem('friendly_current_session') || '{}');
  const [type, setType] = useState<LeaveType>('VACATION');
  const [halfDayType, setHalfDayType] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 반차 선택 시 날짜 고정 처리
  useEffect(() => {
    if (type === 'HALF_DAY' && startDate) {
      setEndDate(startDate);
    }
  }, [type, startDate]);

  const diffDays = useMemo(() => {
    if (type === 'HALF_DAY') return 0.5;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [type, startDate, endDate]);

  const handleAiSuggest = async () => {
    if (!reason) return;
    setIsAiLoading(true);
    const suggested = await aiService.suggestLeaveReason(LEAVE_TYPE_LABELS[type], reason);
    setReason(suggested);
    setIsAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 입력해 주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }
    
    const remainingLeave = currentUser.totalLeave - currentUser.usedLeave;
    if ((type === 'VACATION' || type === 'HALF_DAY') && diffDays > remainingLeave) {
      if (!window.confirm('신청하신 휴가 일수가 잔여 연차보다 많습니다. 계속하시겠습니까?')) return;
    }

    setIsSubmitting(true);
    try {
      const newRequest: LeaveRequest = {
        id: `req-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        type,
        halfDayType: type === 'HALF_DAY' ? halfDayType : undefined,
        startDate,
        endDate,
        reason,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      
      await dataService.createRequest(newRequest);
      setSubmitted(true);
    } catch (error: any) {
      console.error('신청 제출 실패 상세:', error);
      const errorMessage = error.message || '데이터베이스 연결을 확인해 주세요.';
      alert(`⚠️ 신청 중 오류가 발생했습니다.\n\n내용: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-6 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">신청 완료!</h2>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed">작성하신 내용이 성공적으로 제출되었습니다.<br/>관리자의 승인이 완료되면 알림을 드릴게요.</p>
        <button onClick={() => setSubmitted(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">확인</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 pb-16 px-2 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">신청하기</h1>
        <p className="text-sm text-slate-400 mt-2 font-bold">휴가 및 출장 일정을 친절하게 안내해 드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">유형 선택</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map(t => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setType(t)} 
                className={`py-4 px-2 rounded-2xl text-[11px] font-black transition-all border-2 flex flex-col items-center gap-2 ${
                  type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105' : 'bg-slate-50 text-slate-400 border-slate-50 hover:bg-white hover:border-slate-100'
                }`}
              >
                <span>{LEAVE_TYPE_LABELS[t]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 반차 전용 옵션 */}
        {type === 'HALF_DAY' && (
          <div className="space-y-4 animate-in slide-in-from-top-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">반차 상세 선택</label>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setHalfDayType('MORNING')}
                className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                  halfDayType === 'MORNING' ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-50'
                }`}
              >
                오전 반차
              </button>
              <button 
                type="button" 
                onClick={() => setHalfDayType('AFTERNOON')}
                className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                  halfDayType === 'AFTERNOON' ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-50'
                }`}
              >
                오후 반차
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                {type === 'HALF_DAY' ? '반차 날짜' : '시작일'}
              </label>
              <input required type="date" value={startDate} onChange={(e) => {setStartDate(e.target.value); if(!endDate || type === 'HALF_DAY') setEndDate(e.target.value);}} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-sm font-black transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">종료일</label>
              <input 
                required 
                type="date" 
                value={endDate} 
                min={startDate} 
                disabled={type === 'HALF_DAY'}
                onChange={(e) => setEndDate(e.target.value)} 
                className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-sm font-black transition-all ${type === 'HALF_DAY' ? 'opacity-50 cursor-not-allowed' : ''}`} 
              />
            </div>
          </div>
          
          {diffDays > 0 && (
            <div className="p-4 bg-indigo-50 rounded-2xl flex items-center justify-between border border-indigo-100 animate-in slide-in-from-top-2">
              <span className="text-xs font-black text-indigo-700">신청 기간 요약</span>
              <span className="text-sm font-black text-indigo-600">총 {diffDays}일</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">사유 입력</label>
            <button 
              type="button"
              onClick={handleAiSuggest}
              disabled={isAiLoading || !reason}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black hover:bg-indigo-100 transition-all disabled:opacity-50 flex items-center gap-2 border border-indigo-100"
            >
              {isAiLoading ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : '✨ AI 추천 문장'}
            </button>
          </div>
          <textarea required rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="신청 사유를 자유롭게 입력해 주세요. (예: 개인 사정으로 인한 휴가)" className="w-full px-6 py-6 rounded-3xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold resize-none transition-all placeholder:text-slate-300" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:bg-slate-200">
          {isSubmitting ? '전송 중...' : '제출하기'}
        </button>
      </form>
    </div>
  );
};

export default LeaveApplication;

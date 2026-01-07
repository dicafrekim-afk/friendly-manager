
import React, { useState } from 'react';
import { LeaveType, LeaveRequest, User } from '../types';
import { LEAVE_TYPE_LABELS } from '../constants';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';

const LeaveApplication: React.FC = () => {
  const currentUser: User = JSON.parse(localStorage.getItem('friendly_current_session') || '{}');
  const [type, setType] = useState<LeaveType>('VACATION');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAiSuggest = async () => {
    if (!reason) {
      alert('먼저 간단한 키워드(예: 가족여행, 건강검진)를 입력해주세요.');
      return;
    }
    setIsAiLoading(true);
    const suggested = await aiService.suggestLeaveReason(LEAVE_TYPE_LABELS[type], reason);
    setReason(suggested);
    setIsAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      alert('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }
    setIsSubmitting(true);
    const newRequest: LeaveRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type,
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    await dataService.createRequest(newRequest);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-50">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">신청이 접수되었습니다!</h2>
        <p className="text-slate-500 font-medium mb-10">관리자가 승인하면 팀 일정에 자동으로 반영됩니다.</p>
        <button onClick={() => setSubmitted(false)} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">확인</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="px-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">휴가 및 출장 신청</h1>
        <p className="text-slate-400 font-medium mt-2">AI 비서의 도움을 받아 더 편리하게 신청하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 space-y-10">
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">유형 선택</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map(t => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setType(t)} 
                className={`py-5 px-4 rounded-[24px] border-2 text-sm font-black transition-all ${
                  type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105' : 'bg-slate-50 text-slate-400 border-slate-50 hover:bg-white hover:border-slate-200'
                }`}
              >
                {LEAVE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">시작일</label>
            <input required type="date" value={startDate} onChange={(e) => {setStartDate(e.target.value); if(!endDate) setEndDate(e.target.value);}} className="w-full px-6 py-5 rounded-[24px] border-2 border-slate-50 bg-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold" />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">종료일</label>
            <input required type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-6 py-5 rounded-[24px] border-2 border-slate-50 bg-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold" />
          </div>
        </div>

        <div className="space-y-4 relative">
          <div className="flex justify-between items-center ml-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">신청 사유</label>
            <button 
              type="button"
              onClick={handleAiSuggest}
              disabled={isAiLoading || !reason}
              className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 rounded-full text-[10px] font-black hover:bg-violet-100 transition-all disabled:opacity-50"
            >
              {isAiLoading ? (
                <div className="w-3 h-3 border-2 border-violet-600 border-t-transparent animate-spin rounded-full"></div>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              )}
              AI로 다듬기
            </button>
          </div>
          <textarea 
            required 
            rows={4} 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="예: 가족 동반 제주도 여행, 고객사 외근..." 
            className="w-full px-8 py-6 rounded-[32px] border-2 border-slate-50 bg-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-medium resize-none text-lg" 
          />
        </div>

        <button 
          disabled={isSubmitting} 
          className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:bg-slate-200"
        >
          {isSubmitting ? '전송 중...' : '신청 완료'}
        </button>
      </form>
    </div>
  );
};

export default LeaveApplication;

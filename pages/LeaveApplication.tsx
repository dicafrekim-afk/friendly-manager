
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
    if (!reason) return;
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
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">신청 완료!</h2>
        <p className="text-slate-500 mb-8 text-sm">관리자가 확인 후 승인해 드릴게요.</p>
        <button onClick={() => setSubmitted(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">확인</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-10 pb-10">
      <div className="px-2">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900">신청하기</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">휴가 또는 출장을 간편하게 신청하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">유형</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map(t => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setType(t)} 
                className={`py-3 px-4 rounded-xl text-xs font-black transition-all border-2 ${
                  type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-50 hover:bg-white hover:border-slate-100'
                }`}
              >
                {LEAVE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">시작일</label>
            <input required type="date" value={startDate} onChange={(e) => {setStartDate(e.target.value); if(!endDate) setEndDate(e.target.value);}} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">종료일</label>
            <input required type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">사유</label>
            <button 
              type="button"
              onClick={handleAiSuggest}
              disabled={isAiLoading || !reason}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {isAiLoading ? 'AI 다듬는 중...' : '✨ AI로 다듬기'}
            </button>
          </div>
          <textarea required rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="간단히 입력 후 AI 버튼을 눌러보세요." className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-sm font-medium resize-none" />
        </div>

        <button disabled={isSubmitting} className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm md:text-lg shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:bg-slate-300">
          {isSubmitting ? '전송 중...' : '신청 제출'}
        </button>
      </form>
    </div>
  );
};

export default LeaveApplication;

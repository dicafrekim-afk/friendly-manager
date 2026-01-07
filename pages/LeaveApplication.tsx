
import React, { useState } from 'react';
import { LeaveType, LeaveRequest, User } from '../types';
import { LEAVE_TYPE_LABELS } from '../constants';
import { dataService } from '../services/dataService';

const LeaveApplication: React.FC = () => {
  const currentUser: User = JSON.parse(localStorage.getItem('friendly_current_session') || '{}');
  const [type, setType] = useState<LeaveType>('VACATION');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setStartDate(newDate);
    setEndDate(newDate);
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
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      await dataService.createRequest(newRequest);
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">신청이 완료되었습니다!</h2>
        <p className="text-slate-600 mb-8">서버 동기화가 완료되었습니다. 관리자가 승인하면 팀 일정에 반영됩니다.</p>
        <button onClick={() => setSubmitted(false)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">확인</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">휴가/출장 신청</h1>
        <p className="text-slate-500 mt-1">중앙 DB에 저장되어 모든 팀원이 실시간으로 확인 가능합니다.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">시작일</label>
            <input 
              required 
              type="date" 
              value={startDate} 
              onChange={handleStartDateChange} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">종료일</label>
            <input 
              required 
              type="date" 
              value={endDate} 
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">유형 선택</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map(t => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setType(t)} 
                className={`py-3 px-1 rounded-xl border text-[12px] font-bold transition-all ${
                  type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {LEAVE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">사유</label>
          <textarea 
            required 
            rows={4} 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="구체적인 사유를 입력해주세요." 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" 
          />
        </div>
        <button 
          disabled={isSubmitting} 
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
        >
          {isSubmitting ? '서버로 전송 중...' : '신청하기'}
        </button>
      </form>
    </div>
  );
};

export default LeaveApplication;


import React, { useState, useEffect } from 'react';
import { ExtraWorkReport, User } from '../types';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';

const ExtraWorkReportPage: React.FC = () => {
  const currentUser: User = JSON.parse(localStorage.getItem('friendly_current_session') || '{}');
  const [workDate, setWorkDate] = useState('');
  const [workHours, setWorkHours] = useState<number | string>('');
  const [workType, setWorkType] = useState<'WEEKEND' | 'OVERTIME'>('WEEKEND');
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 근무 시간에 따른 자동 보상 계산
  useEffect(() => {
    const hours = Number(workHours);
    if (hours >= 8) {
      setRewardAmount(1.0);
    } else if (hours >= 4) {
      setRewardAmount(0.5);
    } else {
      setRewardAmount(0);
    }
  }, [workHours]);

  // 만료일 계산 (근무일 + 30일)
  const getExpiryDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const handleAiSuggest = async () => {
    if (!reason) return;
    setIsAiLoading(true);
    const suggested = await aiService.suggestLeaveReason(`${workType === 'WEEKEND' ? '주말' : '철야'} 근무 보고`, reason);
    setReason(suggested);
    setIsAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDate || !reason || Number(workHours) <= 0) {
      alert('근무 일자, 시간 및 사유를 정확히 입력해 주세요.');
      return;
    }
    if (rewardAmount === 0) {
      alert('보상 휴가 기준(최소 4시간 이상)에 미달합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report: ExtraWorkReport = {
        id: `ew-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        workDate,
        workHours: Number(workHours),
        workType,
        rewardAmount,
        expiryDate: getExpiryDate(workDate),
        reason,
        status: 'PENDING_PL',
        createdAt: new Date().toISOString()
      };
      await dataService.createExtraWorkReport(report);
      setSubmitted(true);
    } catch (error) {
      alert('보고 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="max-w-md mx-auto text-center py-20 animate-in zoom-in">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
      <h2 className="text-2xl font-black mb-4">보고 완료!</h2>
      <p className="text-slate-500 mb-2">PL 승인 후 보상 휴가가 잔여량에 합산됩니다.</p>
      <p className="text-[11px] font-bold text-red-400 mb-10">* 보상 휴가는 사용 기한 내에 사용해야 합니다.</p>
      <button onClick={() => setSubmitted(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">확인</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 animate-in fade-in">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">추가 근무 보고</h1>
        <p className="text-sm font-bold text-slate-400 mt-2">주말 또는 철야 근무 후 보상 휴가를 신청하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">근무 일자</label>
             <input required type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none font-black text-sm" />
             {workDate && (
               <p className="text-[9px] font-bold text-slate-400 ml-2">사용 기한: <span className="text-red-400">{getExpiryDate(workDate)}까지</span></p>
             )}
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">근무 시간 (Hour)</label>
             <input required type="number" min="0" step="0.5" value={workHours} onChange={(e) => setWorkHours(e.target.value)} placeholder="실제 근무 시간 입력" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none font-black text-sm" />
          </div>
        </div>

        <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">근무 유형</label>
             <div className="flex gap-2">
                <button type="button" onClick={() => setWorkType('WEEKEND')} className={`flex-1 py-4 rounded-2xl text-xs font-black border-2 transition-all ${workType === 'WEEKEND' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent'}`}>주말 근무</button>
                <button type="button" onClick={() => setWorkType('OVERTIME')} className={`flex-1 py-4 rounded-2xl text-xs font-black border-2 transition-all ${workType === 'OVERTIME' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent'}`}>철야 근무</button>
             </div>
        </div>

        <div className="space-y-3">
           <div className="flex justify-between items-center ml-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">자동 계산된 보상 수량</label>
              <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">4h: 0.5d / 8h: 1.0d</span>
           </div>
           <div className="flex gap-4">
              {[0.5, 1.0].map(val => (
                <div key={val} className={`relative flex-1 group`}>
                   <button 
                    type="button" 
                    onClick={() => setRewardAmount(val)} 
                    className={`w-full py-4 rounded-2xl font-black text-sm border-2 transition-all ${rewardAmount === val ? 'bg-violet-600 text-white border-violet-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent opacity-40 hover:opacity-100'}`}
                   >
                    {val === 0.5 ? '반차 (0.5d)' : '연차 (1.0d)'}
                  </button>
                  {rewardAmount === val && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
              ))}
           </div>
           {rewardAmount === 0 && (
             <p className="text-[10px] font-bold text-slate-300 text-center pt-2 italic">시간을 입력하면 보상 수량이 자동 선택됩니다.</p>
           )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">수행 업무 상세</label>
            <button type="button" onClick={handleAiSuggest} disabled={isAiLoading || !reason} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 hover:bg-indigo-100 flex items-center gap-2">
              {isAiLoading ? '작성 중...' : '✨ AI 리포트 변환'}
            </button>
          </div>
          <textarea required rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="수행한 업무 내용을 간단히 적어주세요. AI가 전문적인 보고 문장으로 다듬어 드립니다." className="w-full px-6 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold resize-none transition-all placeholder:text-slate-300" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:bg-slate-300">
          {isSubmitting ? '보고 중...' : '근무 보고 완료'}
        </button>
      </form>
    </div>
  );
};

export default ExtraWorkReportPage;

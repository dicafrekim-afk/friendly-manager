
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ExtraWorkReport, User } from '../types';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';

const ExtraWorkReportPage: React.FC = () => {
  const currentUser: User = JSON.parse(localStorage.getItem('friendly_current_session') || '{}');
  
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [workType, setWorkType] = useState<'WEEKEND' | 'OVERTIME'>('WEEKEND');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 커스텀 피커 모달 상태
  const [pickerTarget, setPickerTarget] = useState<'START' | 'END' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerHour, setPickerHour] = useState(13);
  const [pickerMinute, setPickerMinute] = useState(0);

  // 근무 시간 및 보상 수량 자동 계산
  const { calculatedHours, autoRewardAmount } = useMemo(() => {
    if (!startDateTime || !endDateTime) return { calculatedHours: 0, autoRewardAmount: 0 };
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { calculatedHours: 0, autoRewardAmount: 0 };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    let reward = 0;
    if (diffHours >= 8) reward = 1.0;
    else if (diffHours >= 4) reward = 0.5;

    return { calculatedHours: diffHours, autoRewardAmount: reward };
  }, [startDateTime, endDateTime]);

  const expiryDate = useMemo(() => {
    if (!startDateTime) return '';
    const d = new Date(startDateTime);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, [startDateTime]);

  // 피커 모달 열기
  const openPicker = (target: 'START' | 'END') => {
    const currentVal = target === 'START' ? startDateTime : endDateTime;
    const baseDate = currentVal ? new Date(currentVal) : new Date();
    setPickerDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
    setPickerHour(baseDate.getHours());
    setPickerMinute(Math.floor(baseDate.getMinutes() / 10) * 10);
    setPickerTarget(target);
  };

  const handlePickerConfirm = () => {
    const year = pickerDate.getFullYear();
    const month = String(pickerDate.getMonth() + 1).padStart(2, '0');
    const day = String(pickerDate.getDate()).padStart(2, '0');
    const hh = String(pickerHour).padStart(2, '0');
    const mm = String(pickerMinute).padStart(2, '0');
    
    const isoString = `${year}-${month}-${day}T${hh}:${mm}:00`;
    
    if (pickerTarget === 'START') setStartDateTime(isoString);
    else setEndDateTime(isoString);
    
    setPickerTarget(null);
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
    if (!startDateTime || !endDateTime || !reason || calculatedHours <= 0) {
      alert('시작 및 종료 일시와 사유를 정확히 입력해 주세요.');
      return;
    }
    if (autoRewardAmount === 0) {
      alert('보상 휴가 기준(최소 4시간 이상)에 미달하여 보고할 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report: ExtraWorkReport = {
        id: `ew-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        workDate: startDateTime.split('T')[0],
        startDateTime,
        endDateTime,
        workHours: calculatedHours,
        workType,
        rewardAmount: autoRewardAmount,
        expiryDate: expiryDate,
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

  // 캘린더 생성 로직
  const calendarDays = useMemo(() => {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    return days;
  }, [pickerDate]);

  if (submitted) return (
    <div className="max-w-md mx-auto text-center py-20 animate-in zoom-in">
      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner text-4xl">✓</div>
      <h2 className="text-3xl font-black mb-4">보고가 완료되었습니다!</h2>
      <p className="text-slate-500 mb-2 font-bold text-sm">신청 승인 관리 탭에서 승인 상태를 확인하실 수 있습니다.</p>
      <p className="text-[11px] font-black text-red-400 mb-12">* 보상 휴가 기한: {expiryDate} 까지</p>
      <button onClick={() => setSubmitted(false)} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100">확인</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-in fade-in">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">추가 근무 보고</h1>
        <p className="text-sm font-bold text-slate-400 mt-2">사용자 편의를 위한 스마트 일시 선택 기능을 사용해 보세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[48px] shadow-sm border border-slate-100 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">시작 일시 (From)</label>
             <button 
              type="button"
              onClick={() => openPicker('START')}
              className={`w-full px-6 py-5 rounded-3xl border-2 text-left transition-all ${startDateTime ? 'border-indigo-600 bg-white' : 'border-slate-50 bg-slate-50'}`}
             >
               {startDateTime ? (
                 <div className="flex flex-col">
                   <span className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Start point</span>
                   <span className="text-sm font-black text-slate-900">{startDateTime.replace('T', ' ').substring(0, 16)}</span>
                 </div>
               ) : (
                 <span className="text-sm font-bold text-slate-300">시작 시간 선택...</span>
               )}
             </button>
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">종료 일시 (To)</label>
             <button 
              type="button"
              onClick={() => openPicker('END')}
              className={`w-full px-6 py-5 rounded-3xl border-2 text-left transition-all ${endDateTime ? 'border-indigo-600 bg-white' : 'border-slate-50 bg-slate-50'}`}
             >
               {endDateTime ? (
                 <div className="flex flex-col">
                   <span className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">End point</span>
                   <span className="text-sm font-black text-slate-900">{endDateTime.replace('T', ' ').substring(0, 16)}</span>
                 </div>
               ) : (
                 <span className="text-sm font-bold text-slate-300">종료 시간 선택...</span>
               )}
             </button>
          </div>
        </div>

        {calculatedHours > 0 && (
          <div className="bg-indigo-50/50 p-6 rounded-[32px] flex justify-between items-center animate-in slide-in-from-top-4 border border-indigo-100/50">
             <div className="flex flex-col gap-1">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">총 근무 시간</span>
               <span className="text-2xl font-black text-indigo-700 tracking-tighter">{calculatedHours} <small className="text-sm opacity-60">hours</small></span>
             </div>
             <div className="flex flex-col text-right gap-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">사용 기한 (30일 이내)</span>
               <span className="text-sm font-black text-red-400">{expiryDate} <small className="opacity-60">까지</small></span>
             </div>
          </div>
        )}

        <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">근무 유형</label>
             <div className="flex gap-4">
                <button type="button" onClick={() => setWorkType('WEEKEND')} className={`flex-1 py-5 rounded-3xl text-sm font-black border-2 transition-all ${workType === 'WEEKEND' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-100'}`}>주말 근무</button>
                <button type="button" onClick={() => setWorkType('OVERTIME')} className={`flex-1 py-5 rounded-3xl text-sm font-black border-2 transition-all ${workType === 'OVERTIME' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-100'}`}>철야 근무</button>
             </div>
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center ml-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">자동 계산된 보상 수량</label>
              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">Calculated</span>
           </div>
           <div className="flex gap-4">
              {[0.5, 1.0].map(val => (
                <div key={val} className={`relative flex-1`}>
                   <div className={`w-full py-5 rounded-3xl font-black text-sm border-2 text-center transition-all ${autoRewardAmount === val ? 'bg-violet-600 text-white border-violet-600 shadow-2xl scale-105' : 'bg-slate-50 text-slate-200 border-transparent opacity-20 cursor-not-allowed'}`}>
                    {val === 0.5 ? '반차 (0.5d)' : '연차 (1.0d)'}
                  </div>
                  {autoRewardAmount === val && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce ring-4 ring-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
              ))}
           </div>
           {(!startDateTime || !endDateTime) ? (
             <p className="text-[10px] font-bold text-slate-300 text-center pt-4 italic">시간을 입력하면 보상 휴가가 자동으로 활성화됩니다.</p>
           ) : calculatedHours < 4 ? (
             <p className="text-[10px] font-black text-red-500 text-center pt-4 bg-red-50 py-2 rounded-xl border border-red-100">⚠️ 최소 4시간 이상 근무 시에만 보상 휴가가 생성됩니다.</p>
           ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">수행 업무 상세</label>
            <button type="button" onClick={handleAiSuggest} disabled={isAiLoading || !reason} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 hover:bg-indigo-100 flex items-center gap-2 transition-all">
              {isAiLoading ? '작성 중...' : '✨ AI 리포트 변환'}
            </button>
          </div>
          <textarea required rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="수행한 업무 내용을 간단히 적어주세요. AI가 전문적인 보고 문장으로 다듬어 드립니다." className="w-full px-8 py-8 rounded-[32px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold resize-none transition-all placeholder:text-slate-300 shadow-inner" />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || autoRewardAmount === 0} 
          className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-xl shadow-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:shadow-none"
        >
          {isSubmitting ? '보고 중...' : '근무 보고 완료'}
        </button>
      </form>

      {/* 커스텀 일시 선택 피커 모달 */}
      {pickerTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 md:p-10 space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-900">{pickerTarget === 'START' ? '시작' : '종료'} 일시 설정</h3>
                   <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
                      <span className="text-sm font-black">{pickerDate.getFullYear()}년 {pickerDate.getMonth() + 1}월</span>
                      <button type="button" onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
                   </div>
                </div>

                {/* 미니 캘린더 */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-[10px] font-black text-slate-300 pb-2">{d}</div>)}
                  {calendarDays.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!day}
                      onClick={() => day && setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), day))}
                      className={`h-10 text-xs font-black rounded-xl transition-all ${!day ? 'bg-transparent' : (pickerDate.getDate() === day ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600')}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* 시간 선택 */}
                <div className="flex gap-4 items-center p-6 bg-slate-50 rounded-[32px] justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-300 mb-2 uppercase tracking-widest">Hour</span>
                    <select value={pickerHour} onChange={(e) => setPickerHour(parseInt(e.target.value))} className="bg-white px-4 py-2 rounded-xl text-sm font-black border-2 border-transparent focus:border-indigo-600 outline-none appearance-none cursor-pointer w-20 text-center">
                       {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>)}
                    </select>
                  </div>
                  <span className="text-2xl font-black text-slate-200 mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-300 mb-2 uppercase tracking-widest">Minute</span>
                    <select value={pickerMinute} onChange={(e) => setPickerMinute(parseInt(e.target.value))} className="bg-white px-4 py-2 rounded-xl text-sm font-black border-2 border-transparent focus:border-indigo-600 outline-none appearance-none cursor-pointer w-20 text-center">
                       {[0, 10, 20, 30, 40, 50].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setPickerTarget(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm">취소</button>
                  <button type="button" onClick={handlePickerConfirm} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100">설정 완료</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExtraWorkReportPage;

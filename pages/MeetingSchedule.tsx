
import React, { useState, useEffect } from 'react';
import { User, LeaveRequest, Meeting } from '../types';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';
import { LEAVE_TYPE_LABELS } from '../constants';

const MeetingSchedule: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [users, reqs] = await Promise.all([dataService.getUsers(), dataService.getRequests()]);
      setAllUsers(users.filter(u => u.status === 'APPROVED'));
      setAllRequests(reqs.filter(r => r.status === 'APPROVED'));
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAiAgenda = async () => {
    if (!title) { alert('회의 제목을 먼저 입력해주세요.'); return; }
    setIsAiLoading(true);
    const agenda = await aiService.suggestMeetingAgenda(title);
    setDescription(agenda);
    setIsAiLoading(false);
  };

  const getUserStatusOnDate = (userId: string, targetDate: string) => 
    allRequests.find(req => req.userId === userId && targetDate >= req.startDate && targetDate <= req.endDate);

  const conflictedParticipants = selectedParticipants.filter(p => getUserStatusOnDate(p.id, date));

  const toggleParticipant = (user: User) => {
    if (selectedParticipants.find(p => p.id === user.id)) setSelectedParticipants(selectedParticipants.filter(p => p.id !== user.id));
    else setSelectedParticipants([...selectedParticipants, user]);
  };

  const handleBooking = async () => {
    if (!title || !date || !time || selectedParticipants.length === 0) { alert('정보를 모두 입력해주세요.'); return; }
    setIsSubmitting(true);
    const sessionStr = localStorage.getItem('friendly_current_session');
    const currentUser: User = JSON.parse(sessionStr || '{}');
    const newMeeting: Meeting = {
      id: `mt-${Date.now()}`,
      title,
      description,
      startTime: `${date}T${time}:00`,
      endTime: `${date}T${time}:30`,
      organizerId: currentUser.id,
      participants: selectedParticipants.map(p => p.id)
    };
    await dataService.createMeeting(newMeeting);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (submitted) return (
    <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in duration-300">
      <div className="w-24 h-24 bg-violet-100 text-violet-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-violet-50"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
      <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">회의 예약 완료!</h2>
      <button onClick={() => setSubmitted(false)} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">확인</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="px-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">회의 일정 예약</h1>
        <p className="text-slate-400 font-medium mt-2">팀원들의 부재 정보를 실시간으로 감지합니다.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">회의 제목</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="회의 주제를 입력하세요..." className="w-full px-8 py-6 rounded-[24px] bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-black text-xl" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">날짜</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-6 py-5 rounded-[24px] bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold" />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">시간</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-6 py-5 rounded-[24px] bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center ml-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">회의 안건 (Description)</label>
                <button type="button" onClick={handleAiAgenda} disabled={isAiLoading || !title} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black hover:bg-indigo-100 transition-all">
                  {isAiLoading ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  AI 안건 추천
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full px-8 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-medium resize-none" />
            </div>

            <div className="pt-4 space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">참석자 선택</label>
              <div className="flex flex-wrap gap-3">
                {allUsers.map(user => {
                  const isSelected = selectedParticipants.find(p => p.id === user.id);
                  const status = getUserStatusOnDate(user.id, date);
                  return (
                    <button key={user.id} onClick={() => toggleParticipant(user)} className={`px-6 py-4 rounded-[20px] text-sm font-black transition-all border-2 flex items-center gap-3 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-slate-500 border-slate-50 hover:border-slate-200'}`}>
                      <div className={`w-2 h-2 rounded-full ${status ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                      {user.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleBooking} disabled={isSubmitting} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-[0.98] transition-all">
              {isSubmitting ? '예약 중...' : '회의 예약 완료'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 sticky top-24">
            <h3 className="text-lg font-black text-slate-900 mb-6 px-2">참석 가능 확인</h3>
            {selectedParticipants.length === 0 ? (
              <div className="py-10 text-center text-slate-300 font-bold italic">참석자를 선택해 주세요.</div>
            ) : (
              <div className="space-y-6">
                {conflictedParticipants.length > 0 ? (
                  <div className="p-6 bg-red-50 rounded-[24px] border border-red-100 text-red-600">
                    <p className="text-xs font-black uppercase tracking-widest mb-2">충돌 감지</p>
                    <p className="text-sm font-bold leading-relaxed">{conflictedParticipants.length}명이 해당 일자에 부재 중입니다.</p>
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-50 rounded-[24px] border border-emerald-100 text-emerald-600">
                    <p className="text-xs font-black uppercase tracking-widest mb-2">상태 양호</p>
                    <p className="text-sm font-bold leading-relaxed">전원 참석 가능한 일시입니다.</p>
                  </div>
                )}
                <div className="space-y-2">
                  {selectedParticipants.map(p => {
                    const status = getUserStatusOnDate(p.id, date);
                    return (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">{p.name.charAt(0)}</div>
                          <span className="text-sm font-black text-slate-700">{p.name}</span>
                        </div>
                        {status && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">{LEAVE_TYPE_LABELS[status.type]}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingSchedule;

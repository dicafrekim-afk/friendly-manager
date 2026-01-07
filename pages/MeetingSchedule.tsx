
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
    if (!title) return;
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
    if (!title || selectedParticipants.length === 0) { alert('제목과 참여자를 입력해주세요.'); return; }
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

  if (loading) return <div className="flex items-center justify-center h-full pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (submitted) return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
      <h2 className="text-2xl font-black text-slate-900 mb-6">회의 예약 완료!</h2>
      <button onClick={() => setSubmitted(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">확인</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 pb-10">
      <div className="px-2">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900">회의 예약</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">부재 중인 팀원을 실시간으로 감지합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">회의 제목</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="회의 주제를 입력하세요..." className="w-full px-5 py-3 md:py-4 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-black text-sm md:text-lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">날짜</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-50 outline-none text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">시간</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-50 outline-none text-xs font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">회의 안건</label>
                <button type="button" onClick={handleAiAgenda} disabled={isAiLoading || !title} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                  {isAiLoading ? 'AI 분석 중...' : '✨ AI 추천 안건'}
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none text-xs md:text-sm font-medium resize-none" />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">참석자 (터치하여 선택)</label>
              <div className="flex flex-wrap gap-2">
                {allUsers.map(user => {
                  const isSelected = selectedParticipants.find(p => p.id === user.id);
                  const status = getUserStatusOnDate(user.id, date);
                  return (
                    <button key={user.id} onClick={() => toggleParticipant(user)} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-50 hover:border-slate-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                      {user.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleBooking} disabled={isSubmitting} className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm md:text-lg shadow-xl shadow-indigo-100 transition-all">
              {isSubmitting ? '예약 중...' : '회의 예약 완료'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 lg:sticky lg:top-24">
            <h3 className="text-sm font-black text-slate-900 mb-6">참석 가능 확인</h3>
            {selectedParticipants.length === 0 ? (
              <div className="py-10 text-center text-slate-300 text-xs italic">참석자를 선택해 주세요.</div>
            ) : (
              <div className="space-y-4">
                {conflictedParticipants.length > 0 ? (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-[11px] font-bold">
                    ⚠️ {conflictedParticipants.length}명이 부재 중입니다.
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 text-[11px] font-bold">
                    ✅ 전원 참석 가능합니다.
                  </div>
                )}
                <div className="space-y-1">
                  {selectedParticipants.map(p => {
                    const status = getUserStatusOnDate(p.id, date);
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">{p.name}</span>
                        {status && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{LEAVE_TYPE_LABELS[status.type]}</span>}
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


import React, { useState, useEffect } from 'react';
import { User, LeaveRequest, Meeting } from '../types';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';
import { LEAVE_TYPE_LABELS } from '../constants';

const MEETING_ROOMS = ['대회의실 (1F)', '중회의실 (2F)', '창의실 (3F)', '비전룸 (5F)', '오픈 라운지'];

const MeetingSchedule: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [selectedRoom, setSelectedRoom] = useState(MEETING_ROOMS[0]);
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
      title: `[${selectedRoom}] ${title}`,
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
    <div className="max-w-md mx-auto text-center py-20 px-6 animate-in zoom-in duration-300">
      <div className="w-24 h-24 bg-violet-50 text-violet-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
      <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">회의 예약 완료!</h2>
      <button onClick={() => setSubmitted(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">확인</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-12 pb-16 px-2 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">회의 예약</h1>
        <p className="text-sm font-bold text-slate-400 mt-2">부재 중인 동료를 실시간으로 확인하고 일정을 잡으세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">회의 제목</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="논의할 핵심 주제를 입력하세요..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none font-black text-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">장소</label>
                <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none text-xs font-black appearance-none cursor-pointer focus:border-indigo-600 transition-all">
                  {MEETING_ROOMS.map(room => <option key={room} value={room}>{room}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">날짜</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none text-xs font-black" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">시간</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none text-xs font-black" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">상세 안건</label>
                <button type="button" onClick={handleAiAgenda} disabled={isAiLoading || !title} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-2">
                  {isAiLoading ? 'AI 분석 중...' : '✨ AI 추천 안건'}
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="회의에서 다룰 내용을 적어주세요." className="w-full px-6 py-6 rounded-3xl bg-slate-50 border-2 border-slate-50 outline-none text-sm font-bold resize-none transition-all placeholder:text-slate-300" />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">참석자 선택</label>
              <div className="flex flex-wrap gap-2">
                {allUsers.map(user => {
                  const isSelected = selectedParticipants.find(p => p.id === user.id);
                  const status = getUserStatusOnDate(user.id, date);
                  return (
                    <button 
                      key={user.id} 
                      onClick={() => toggleParticipant(user)} 
                      className={`px-5 py-3 rounded-2xl text-xs font-black transition-all border-2 flex items-center gap-3 ${
                        isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border-slate-50 hover:border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${status ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                      {user.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleBooking} disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
              {isSubmitting ? '예약 처리 중...' : '회의 예약 완료'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 lg:sticky lg:top-24">
            <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-2">
               <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
               실시간 참석 현황
            </h3>
            {selectedParticipants.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <p className="text-[11px] font-bold text-slate-300">참석자를 선택하면 <br/>부재 여부를 바로 알려드려요.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {conflictedParticipants.length > 0 ? (
                  <div className="p-5 bg-red-50 rounded-[24px] border border-red-100 text-red-600 animate-in slide-in-from-top-2">
                    <p className="text-xs font-black mb-1">⚠️ 주의: 부재 중인 팀원</p>
                    <p className="text-[10px] font-bold opacity-80">{conflictedParticipants.length}명이 해당 일자에 자리를 비울 예정입니다.</p>
                  </div>
                ) : (
                  <div className="p-5 bg-emerald-50 rounded-[24px] border border-emerald-100 text-emerald-600 animate-in slide-in-from-top-2">
                    <p className="text-xs font-black mb-1">✅ 전원 참석 가능!</p>
                    <p className="text-[10px] font-bold opacity-80">모든 선택된 팀원이 참여할 수 있는 날짜입니다.</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">선택된 팀원 목록</p>
                  {selectedParticipants.map(p => {
                    const status = getUserStatusOnDate(p.id, date);
                    return (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                        <span className="text-xs font-black text-slate-700">{p.name}</span>
                        {status ? (
                          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                            {LEAVE_TYPE_LABELS[status.type]} 중
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-500">참석 가능</span>
                        )}
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

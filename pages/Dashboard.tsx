
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LeaveRequest, Meeting } from '../types';
import { dataService } from '../services/dataService';
import { LEAVE_TYPE_COLORS, LEAVE_TYPE_LABELS } from '../constants';

const KOREAN_HOLIDAYS = new Set([
  // 2025
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
  '2025-03-01', '2025-05-05', '2025-05-06', '2025-06-06',
  '2025-08-15', '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09',
  '2025-12-25',
  // 2026
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-03-01', '2026-03-02',
  '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-06',
  '2026-08-15', '2026-08-17',
  '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-28',
  '2026-10-03', '2026-10-05', '2026-10-09',
  '2026-12-25',
  // 2027
  '2027-01-01', '2027-02-06', '2027-02-07', '2027-02-08',
  '2027-03-01',
  '2027-05-05', '2027-05-13',
  '2027-06-06', '2027-06-07',
  '2027-08-15', '2027-08-16',
  '2027-10-03', '2027-10-04', '2027-10-09',
  '2027-10-14', '2027-10-15', '2027-10-16',
  '2027-12-25',
]);

const getLeaveLabel = (req: LeaveRequest): string => {
  if (req.type === 'HALF_DAY') {
    return req.halfDayType === 'AFTERNOON' ? '오후반차' : '오전반차';
  }
  return LEAVE_TYPE_LABELS[req.type];
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [selectedEvent, setSelectedEvent] = useState<{type: 'REQ' | 'MEET', data: any} | null>(null);

  const fetchData = async () => {
    const sessionStr = localStorage.getItem('friendly_current_session');
    let uId = '';
    if (sessionStr) {
      try {
        const u = JSON.parse(sessionStr);
        uId = u.id;
        setCurrentUser(u);
      } catch (e) { console.error("Session parse error"); }
    }
    
    setLoading(true);
    try {
      const [reqs, users, meetings] = await Promise.all([
        dataService.getRequests().catch(() => []),
        dataService.getUsers().catch(() => []),
        dataService.getMeetings().catch(() => [])
      ]);
      
      setAllRequests(reqs.filter(r => r.status === 'APPROVED' || r.status.startsWith('PENDING')));
      setAllMeetings(meetings || []);
      
      // 유저 정보 동기화 (세션 정보가 아닌 DB의 최신 정보로 업데이트)
      if (uId) {
        const freshUser = users.find(x => x.id === uId);
        if (freshUser) {
          setCurrentUser(freshUser);
          // 세션에도 최신 정보 반영
          localStorage.setItem('friendly_current_session', JSON.stringify(freshUser));
        }
      }
    } catch (err) { 
      console.error('Dashboard data fetch failed', err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDay(null);
  };

  const getEventsForDate = useCallback((day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dailyRequests = allRequests.filter(req => dateStr >= req.startDate && dateStr <= req.endDate);
    const dailyMeetings = (allMeetings || []).filter(m => m.startTime && m.startTime.startsWith(dateStr));
    return { requests: dailyRequests, meetings: dailyMeetings };
  }, [currentDate, allRequests, allMeetings]);

  const handleCancelEvent = async () => {
    if (!selectedEvent || !window.confirm('정말 이 일정을 취소하시겠습니까?')) return;
    
    try {
      if (selectedEvent.type === 'REQ') {
        await dataService.deleteRequest(selectedEvent.data.id);
      } else {
        await dataService.deleteMeeting(selectedEvent.data.id);
      }
      setSelectedEvent(null);
      fetchData();
    } catch (e) {
      alert('일정 취소 중 오류가 발생했습니다.');
    }
  };

  if (loading && !currentUser) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const user = currentUser || { totalLeave: 15, usedLeave: 0, extraLeaveAvailable: 0, extraLeaveUsed: 0, name: '사용자' };
  const remainingExtra = (Number(user.extraLeaveAvailable) || 0) - (Number(user.extraLeaveUsed) || 0);
  const selectedDateEvents = selectedDay ? getEventsForDate(selectedDay) : { requests: [], meetings: [] };

  return (
    <div className="space-y-6 md:space-y-10 pb-20 relative animate-in fade-in duration-500">
      {/* 웰컴 섹션 */}
      <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-indigo-600 p-8 md:p-16 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4">{user.name}님, 환영합니다!</h1>
          <p className="text-indigo-100/80 mb-8 font-medium">친절한 휴가 관리를 도와드릴게요.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/apply')} className="px-8 py-4 bg-white text-indigo-600 rounded-[20px] font-black text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95">휴가 신청</button>
            <button onClick={() => navigate('/extra-work')} className="px-8 py-4 bg-indigo-500/40 text-white rounded-[20px] font-black text-sm border border-white/20 hover:bg-indigo-500/60 transition-all active:scale-95">근무 보고</button>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">잔여 연차</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black text-slate-900">{user.totalLeave - user.usedLeave}</span>
            <span className="text-sm font-bold text-slate-400">/ {user.totalLeave}d</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${((user.totalLeave - user.usedLeave) / (user.totalLeave || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
             <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">보상 휴가 잔여</p>
             <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[8px] font-black rounded-full uppercase">Reward</span>
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black text-slate-900">{remainingExtra}</span>
            <span className="text-sm font-bold text-slate-400">/ {user.extraLeaveAvailable || 0}d</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
             <div className="bg-violet-500 h-full transition-all duration-1000" style={{ width: remainingExtra > 0 ? `${(remainingExtra / (user.extraLeaveAvailable || 1)) * 100}%` : '0%' }}></div>
          </div>
          <p className="text-[9px] font-bold text-slate-300 italic">* 보상 휴가는 발생 후 1개월 이내 사용이 원칙입니다.</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">대기 중인 신청</p>
          <div className="text-5xl font-black text-slate-900 mb-6">{allRequests.filter(r => r.userId === user.id && r.status.startsWith('PENDING')).length} <span className="text-sm text-slate-400">건</span></div>
          <p className="text-[10px] font-bold text-slate-400">관리자 승인 시 알림이 발송됩니다.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 캘린더 영역 */}
        <div className="lg:col-span-8 bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl md:text-2xl font-black text-slate-900">팀 일정 캘린더</h2>
            <div className="flex items-center gap-4">
               <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
               <span className="text-sm font-black text-slate-900">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</span>
               <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 md:gap-4">
            {['일','월','화','수','목','금','토'].map((d, i) => (
              <div key={d} className={`text-center text-[10px] font-black uppercase py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-300'}`}>{d}</div>
            ))}
            {calendarDays.map((day, idx) => {
              const events = day ? getEventsForDate(day) : { requests: [], meetings: [] };
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              const isSelected = selectedDay === day;
              const dayOfWeek = idx % 7; // 0=일, 6=토
              const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const isHoliday = dateStr ? KOREAN_HOLIDAYS.has(dateStr) : false;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              const dayNumClass = isToday
                ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-lg'
                : (isHoliday || isSunday)
                  ? 'text-red-500'
                  : isSaturday
                    ? 'text-blue-500'
                    : isSelected
                      ? 'text-indigo-600'
                      : 'text-slate-400';

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(day)}
                  className={`min-h-[70px] md:min-h-[120px] p-2 rounded-2xl border transition-all cursor-pointer relative flex flex-col items-center justify-start overflow-hidden ${
                    day ? (isSelected ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100 shadow-inner' : 'bg-white border-transparent hover:border-slate-100') : 'bg-transparent border-transparent'
                  }`}
                >
                  {day && (
                    <>
                      <span className={`text-[11px] font-black ${dayNumClass}`}>{day}</span>
                      
                      {/* 이벤트 리스트 */}
                      <div className="mt-2 flex flex-col gap-1 w-full px-1">
                        {events.requests.slice(0, 3).map(req => (
                          <div key={req.id} className="w-full">
                            <div className={`hidden md:block px-2 py-0.5 rounded-md border text-[8px] font-black truncate ${LEAVE_TYPE_COLORS[req.type]}`}>
                              {getLeaveLabel(req)} | {req.userName}
                            </div>
                            <div className={`md:hidden h-1 w-full rounded-full ${LEAVE_TYPE_COLORS[req.type].split(' ')[0] === 'bg-emerald-50' ? 'bg-emerald-400' : 
                                              LEAVE_TYPE_COLORS[req.type].split(' ')[0] === 'bg-teal-50' ? 'bg-teal-400' :
                                              LEAVE_TYPE_COLORS[req.type].split(' ')[0] === 'bg-blue-50' ? 'bg-blue-400' :
                                              LEAVE_TYPE_COLORS[req.type].split(' ')[0] === 'bg-violet-50' ? 'bg-violet-400' : 'bg-indigo-400'}`}></div>
                          </div>
                        ))}
                        
                        {events.meetings.slice(0, 1).map(meet => (
                          <div key={meet.id} className="w-full">
                            <div className="hidden md:block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black truncate">
                              회의 | {meet.title}
                            </div>
                            <div className="md:hidden h-1 w-full rounded-full bg-emerald-400"></div>
                          </div>
                        ))}
                      </div>

                      {(events.requests.length + events.meetings.length > 3) && (
                        <span className="absolute bottom-1 right-2 text-[8px] font-black text-slate-300">
                          +{events.requests.length + events.meetings.length - 3}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택한 날짜 상세 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-full flex flex-col min-h-[400px]">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black text-slate-900">{selectedDay ? `${selectedDay}일의 일정` : '날짜를 선택하세요'}</h3>
                {selectedDay && <span className="text-[10px] font-black text-slate-300 uppercase">{currentDate.getFullYear()}.{currentDate.getMonth()+1}</span>}
             </div>
             
             <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                {selectedDay && (selectedDateEvents.requests.length > 0 || selectedDateEvents.meetings.length > 0) ? (
                  <>
                    {selectedDateEvents.requests.map(req => (
                      <div 
                        key={req.id} 
                        onClick={() => setSelectedEvent({type: 'REQ', data: req})}
                        className="p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer group"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{req.userName}</p>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${LEAVE_TYPE_COLORS[req.type]}`}>{getLeaveLabel(req)}</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{req.reason}</p>
                      </div>
                    ))}
                    {selectedDateEvents.meetings.map(meet => (
                      <div 
                        key={meet.id} 
                        onClick={() => setSelectedEvent({type: 'MEET', data: meet})}
                        className="p-4 rounded-2xl bg-emerald-50/50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer group"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">회의 일정</p>
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">MEETING</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-600 line-clamp-1">{meet.title}</p>
                         <p className="text-[8px] font-black text-slate-300 mt-2">{meet.startTime.split('T')[1].substring(0, 5)} - {meet.endTime.split('T')[1].substring(0, 5)}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                     <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4 italic font-black text-2xl">?</div>
                     <p className="text-[11px] font-bold text-slate-300">이날은 등록된 <br/>일정이 없습니다.</p>
                  </div>
                )}
             </div>
             
             <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                <p className="text-[10px] font-bold text-slate-400">일정을 클릭하면 상세 내용을 확인하고 <br/>본인 일정을 취소할 수 있습니다.</p>
             </div>
          </div>
        </div>
      </div>

      {/* 일정 상세 모달 */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 space-y-6">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${selectedEvent.type === 'REQ' ? LEAVE_TYPE_COLORS[selectedEvent.data.type] : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {selectedEvent.type === 'REQ' ? getLeaveLabel(selectedEvent.data) : '회의 일정'}
                       </span>
                       <h3 className="text-xl font-black text-slate-900 mt-4 leading-tight">
                          {selectedEvent.type === 'REQ' ? `${selectedEvent.data.userName}님의 신청` : selectedEvent.data.title}
                       </h3>
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                 </div>

                 <div className="space-y-4">
                    <div className="bg-slate-50 p-5 rounded-[24px]">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">상세 기간</p>
                       <p className="text-xs font-bold text-slate-600">
                          {selectedEvent.type === 'REQ' 
                            ? `${selectedEvent.data.startDate} ~ ${selectedEvent.data.endDate}` 
                            : `${selectedEvent.data.startTime.replace('T', ' ').substring(0, 16)}`}
                       </p>
                    </div>
                    
                    <div className="bg-slate-50 p-5 rounded-[24px]">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">
                          {selectedEvent.type === 'REQ' ? '신청 사유' : '회의 상세'}
                       </p>
                       <p className="text-xs font-bold text-slate-600 leading-relaxed">
                          {selectedEvent.type === 'REQ' ? selectedEvent.data.reason : selectedEvent.data.description}
                       </p>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3 pt-4">
                    {(selectedEvent.data.userId === currentUser?.id || selectedEvent.data.organizerId === currentUser?.id) ? (
                       <button 
                        onClick={handleCancelEvent}
                        className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                       >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          일정 취소하기
                       </button>
                    ) : (
                       <p className="text-[10px] font-bold text-slate-300 text-center italic">타인의 일정은 관리자만 취소할 수 있습니다.</p>
                    )}
                    <button onClick={() => setSelectedEvent(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl">닫기</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

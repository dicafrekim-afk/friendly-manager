
import React, { useState, useEffect } from 'react';
import { User, LeaveRequest, Meeting } from '../types';
import { dataService } from '../services/dataService';
import { LEAVE_TYPE_LABELS } from '../constants';

const MeetingSchedule: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [users, reqs] = await Promise.all([
          dataService.getUsers(),
          dataService.getRequests()
        ]);
        setAllUsers(users.filter(u => u.status === 'APPROVED'));
        setAllRequests(reqs.filter(r => r.status === 'APPROVED'));
      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUserStatusOnDate = (userId: string, targetDate: string) => {
    return allRequests.find(req => 
      req.userId === userId && 
      targetDate >= req.startDate && 
      targetDate <= req.endDate
    );
  };

  const conflictedParticipants = selectedParticipants.filter(p => 
    getUserStatusOnDate(p.id, date)
  );

  const toggleParticipant = (user: User) => {
    if (selectedParticipants.find(p => p.id === user.id)) {
      setSelectedParticipants(selectedParticipants.filter(p => p.id !== user.id));
    } else {
      setSelectedParticipants([...selectedParticipants, user]);
    }
  };

  const handleBooking = async () => {
    if (!title || !date || !time || selectedParticipants.length === 0) {
      alert('회의 제목, 날짜, 시간 및 참석자를 최소 1명 선택해주세요.');
      return;
    }

    const sessionStr = localStorage.getItem('friendly_current_session');
    if (!sessionStr) {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }
    const currentUser: User = JSON.parse(sessionStr);

    setIsSubmitting(true);
    
    const newMeeting: Meeting = {
      id: `mt-${Date.now()}`,
      title,
      description: description || '참석 요청된 회의입니다.',
      startTime: `${date}T${time}:00`,
      endTime: `${date}T${time}:30`, // 기본 30분
      organizerId: currentUser.id,
      participants: selectedParticipants.map(p => p.id)
    };

    try {
      await dataService.createMeeting(newMeeting);
      
      // 부재 중인 팀원이 있다면 알림 발송
      for (const p of conflictedParticipants) {
        await dataService.createNotification({
          id: `notif-${Date.now()}-${p.id}`,
          userId: p.id,
          title: '부재 중 회의 초대됨',
          message: `${currentUser.name}님이 예약하신 '${title}' 회의에 초대되었습니다. 현재 부재(휴가/출장) 기간이므로 확인이 필요합니다.`,
          type: 'WARNING',
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Booking error:', err);
      alert('회의 예약 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">회의 예약 완료!</h2>
        <p className="text-slate-600 mb-10 leading-relaxed">
          회의 일정이 성공적으로 등록되었습니다.<br/>
          참석자들에게 실시간으로 일정이 공유되었으며, 부재 중인 인원에겐 별도의 알림이 전송되었습니다.
        </p>
        <button 
          onClick={() => {
            setSubmitted(false);
            setTitle('');
            setSelectedParticipants([]);
          }} 
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">회의 일정 예약</h1>
          <p className="text-slate-500 mt-1">실제 등록된 팀원들의 일정을 실시간으로 대조하여 예약합니다.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          실시간 일정 동기화 활성
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">회의 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 주간 성과 공유 및 전략 회의"
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">날짜</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">시간</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">상세 설명 (선택)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="회의 안건이나 사전 준비 사항을 적어주세요."
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">참석자 선택</label>
                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md font-bold uppercase tracking-wider">Approved Members</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {allUsers.map(user => {
                  const isSelected = selectedParticipants.find(p => p.id === user.id);
                  const status = getUserStatusOnDate(user.id, date);
                  
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleParticipant(user)}
                      className={`relative px-5 py-3 rounded-2xl text-xs font-bold transition-all border-2 flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                          : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${status ? 'bg-amber-400' : 'bg-emerald-400 opacity-0'}`}></div>
                      {user.name}
                      {status && !isSelected && (
                        <span className="text-[8px] opacity-60">({LEAVE_TYPE_LABELS[status.type]})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              disabled={isSubmitting}
              onClick={handleBooking}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-slate-300 disabled:shadow-none transform active:scale-[0.98]"
            >
              {isSubmitting ? '서버에 예약 정보 전송 중...' : '회의 예약하기'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              참석자 상태 체크
            </h3>
            
            {selectedParticipants.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <p className="text-sm text-slate-400 italic leading-relaxed font-medium">참석자를 선택하시면<br/>일정 충돌 여부를 실시간으로<br/>감지하여 안내해 드립니다.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {conflictedParticipants.length > 0 ? (
                  <div className="p-5 bg-red-50 border border-red-100 rounded-2xl space-y-2 animate-in slide-in-from-right-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <span className="text-sm font-bold">참석자 일정 충돌!</span>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                      선택한 멤버 중 <strong>{conflictedParticipants.length}명</strong>이 해당 날짜에 부재(휴가/출장) 중입니다. 예약 시 자동 알림이 전송됩니다.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-sm font-bold">전원 참석 가능</span>
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                      선택한 날짜에 모든 참석자의 일정이 비어 있어 회의가 원활하게 진행될 수 있습니다.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected ({selectedParticipants.length})</p>
                    <button onClick={() => setSelectedParticipants([])} className="text-[10px] text-slate-400 hover:text-red-500 font-bold underline">전체 해제</button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                    {selectedParticipants.map(p => {
                      const status = getUserStatusOnDate(p.id, date);
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200">
                              {p.name.charAt(0)}
                            </div>
                            <span className="text-sm text-slate-700 font-bold">{p.name}</span>
                          </div>
                          {status && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 shadow-sm">
                              {LEAVE_TYPE_LABELS[status.type]} 중
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

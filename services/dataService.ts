
import { User, LeaveRequest, Status, Notification, Meeting, Team, LeaveType, ExtraWorkReport } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SUPER_ADMIN_EMAILS = [
  'sllee0531@mail.go.kr',
  'aldari25@naver.com',
  'lankypark@gmail.com'
];

export const isSuperAdmin = (email: string) => SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());

const INITIAL_ADMIN: User = {
  id: 'admin-001',
  email: SUPER_ADMIN_EMAILS[0],
  password: 'admin1234', 
  name: '김구현', 
  position: '최고관리자',
  team: '공통',
  role: 'ADMIN',
  status: 'APPROVED',
  totalLeave: 25,
  usedLeave: 0,
  extraLeaveAvailable: 0,
  extraLeaveUsed: 0,
  joinDate: new Date().toISOString().split('T')[0]
};

const calculateLeaveDays = (type: LeaveType, startDate: string, endDate: string): number => {
  if (type === 'HALF_DAY') return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
};

const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

const setLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dataService = {
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').select('*').order('joinDate', { ascending: false });
        if (!error && data && data.length > 0) return data as User[];
      } catch (e) { console.debug('Users table not found/error'); }
    }
    let users = getLocal('friendly_users');
    if (users.length === 0) {
      users = [INITIAL_ADMIN];
      setLocal('friendly_users', users);
    }
    return users;
  },

  async register(user: User): Promise<void> {
    const userWithDefaults = { ...user, extraLeaveAvailable: 0, extraLeaveUsed: 0, password: user.password || 'user1234' };
    if (isSupabaseConfigured) {
      try { await supabase.from('users').upsert([userWithDefaults]); } catch (e) {}
    }
    const users = await this.getUsers();
    setLocal('friendly_users', [...users.filter(u => u.id !== user.id), userWithDefaults]);
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const users = await this.getUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setLocal('friendly_users', updatedUsers);
    
    const sessionStr = localStorage.getItem('friendly_current_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr);
      if (sessionUser.id === userId) {
        localStorage.setItem('friendly_current_session', JSON.stringify({ ...sessionUser, ...updates }));
        window.dispatchEvent(new Event('storage'));
      }
    }
    if (isSupabaseConfigured) {
      try { await supabase.from('users').update(updates).eq('id', userId); } catch (e) {}
    }
  },

  async getRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('leave_requests').select('*').order('createdAt', { ascending: false });
        if (!error && data) return data;
      } catch (e) { console.debug('Requests table error'); }
    }
    return getLocal('friendly_requests');
  },

  async createRequest(request: LeaveRequest): Promise<void> {
    const sessionStr = localStorage.getItem('friendly_current_session');
    const currentUser: User = sessionStr ? JSON.parse(sessionStr) : null;
    let initialStatus: Status = isSuperAdmin(currentUser?.email || '') ? 'APPROVED' : (currentUser?.role === 'ADMIN' ? 'PENDING_FINAL' : 'PENDING_PL');
    
    const finalRequest = { ...request, status: initialStatus };
    if (isSupabaseConfigured) {
      try { await supabase.from('leave_requests').insert([finalRequest]); } catch (e) {}
    }
    const reqs = await this.getRequests();
    setLocal('friendly_requests', [...reqs, finalRequest]);
    if (initialStatus === 'APPROVED') await this.handleApprovedLeave(finalRequest);
  },

  async handleApprovedLeave(req: LeaveRequest): Promise<void> {
    const days = calculateLeaveDays(req.type, req.startDate, req.endDate);
    const users = await this.getUsers();
    const user = users.find(u => u.id === req.userId);
    if (!user) return;

    if (req.type === 'EXTRA_LEAVE') {
      await this.updateUser(user.id, { extraLeaveUsed: (user.extraLeaveUsed || 0) + days });
    } else if (req.type === 'VACATION' || req.type === 'HALF_DAY') {
      await this.updateUser(user.id, { usedLeave: (user.usedLeave || 0) + days });
    }
  },

  async deleteRequest(requestId: string): Promise<void> {
    const reqs = await this.getRequests();
    const target = reqs.find(r => r.id === requestId);
    
    if (target && target.status === 'APPROVED') {
       // 이미 승인된 건을 취소할 경우 연차 복구 로직
       const days = calculateLeaveDays(target.type, target.startDate, target.endDate);
       const users = await this.getUsers();
       const user = users.find(u => u.id === target.userId);
       if (user) {
         if (target.type === 'EXTRA_LEAVE') {
            await this.updateUser(user.id, { extraLeaveUsed: Math.max(0, (user.extraLeaveUsed || 0) - days) });
         } else if (target.type === 'VACATION' || target.type === 'HALF_DAY') {
            await this.updateUser(user.id, { usedLeave: Math.max(0, (user.usedLeave || 0) - days) });
         }
       }
    }

    if (isSupabaseConfigured) {
      try { await supabase.from('leave_requests').delete().eq('id', requestId); } catch (e) {}
    }
    setLocal('friendly_requests', reqs.filter(r => r.id !== requestId));
  },

  async updateRequestStatus(requestId: string, status: Status): Promise<void> {
    const reqs = await this.getRequests();
    const target = reqs.find(r => r.id === requestId);
    if (isSupabaseConfigured) {
      try { await supabase.from('leave_requests').update({ status }).eq('id', requestId); } catch (e) {}
    }
    setLocal('friendly_requests', reqs.map(r => r.id === requestId ? { ...r, status } : r));
    if (status === 'APPROVED' && target) await this.handleApprovedLeave(target);
  },

  async getExtraWorkReports(): Promise<ExtraWorkReport[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('extra_work_reports').select('*').order('createdAt', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }
    return getLocal('friendly_extra_work');
  },

  async createExtraWorkReport(report: ExtraWorkReport): Promise<void> {
    if (isSupabaseConfigured) {
      try { await supabase.from('extra_work_reports').insert([report]); } catch (e) {}
    }
    const reports = await this.getExtraWorkReports();
    setLocal('friendly_extra_work', [...reports, report]);
    await this.createNotification({
      id: `notif-extra-${Date.now()}`,
      userId: 'ADMIN',
      title: '추가 근무 보고 접수',
      message: `${report.userName}님이 ${report.workDate} 근무 보고를 올렸습니다.`,
      type: 'INFO',
      createdAt: new Date().toISOString(),
      isRead: false,
      link: '/admin/requests'
    });
  },

  async updateExtraWorkStatus(reportId: string, status: Status): Promise<void> {
    const reports = await this.getExtraWorkReports();
    const target = reports.find(r => r.id === reportId);
    if (isSupabaseConfigured) {
      try { await supabase.from('extra_work_reports').update({ status }).eq('id', reportId); } catch (e) {}
    }
    setLocal('friendly_extra_work', reports.map(r => r.id === reportId ? { ...r, status } : r));
    if (status === 'APPROVED' && target) {
      const users = await this.getUsers();
      const user = users.find(u => u.id === target.userId);
      if (user) await this.updateUser(user.id, { extraLeaveAvailable: (user.extraLeaveAvailable || 0) + target.rewardAmount });
    }
  },

  async getMeetings(): Promise<Meeting[]> { 
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('meetings').select('*').order('startTime', { ascending: true });
        if (!error && data) return data;
      } catch (e) {}
    }
    return getLocal('friendly_meetings');
  },

  async createMeeting(m: Meeting): Promise<void> { 
    if (isSupabaseConfigured) {
      try { await supabase.from('meetings').insert([m]); } catch (e) {}
    }
    const meetings = await this.getMeetings();
    setLocal('friendly_meetings', [...meetings, m]);
  },

  async deleteMeeting(id: string): Promise<void> { 
    if (isSupabaseConfigured) {
      try { await supabase.from('meetings').delete().eq('id', id); } catch (e) {}
    }
    const meetings = await this.getMeetings();
    setLocal('friendly_meetings', meetings.filter(m => m.id !== id));
  },

  async getNotifications(id: string): Promise<Notification[]> { 
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('notifications').select('*').eq('userId', id).order('createdAt', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }
    return getLocal('friendly_notifications').filter((n: Notification) => n.userId === id || n.userId === 'ADMIN');
  },

  async createNotification(n: Notification): Promise<void> { 
    if (isSupabaseConfigured) {
      try { await supabase.from('notifications').insert([n]); } catch (e) {}
    }
    const localNotifs = getLocal('friendly_notifications');
    setLocal('friendly_notifications', [...localNotifs, n]);
  },

  async markAsRead(id: string): Promise<void> { 
    if (isSupabaseConfigured) {
      try { await supabase.from('notifications').update({ isRead: true }).eq('id', id); } catch (e) {}
    }
    const notifs = getLocal('friendly_notifications');
    setLocal('friendly_notifications', notifs.map((n: any) => n.id === id ? { ...n, isRead: true } : n));
  },

  async findUserToReset(e: string, n: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase().trim() === e.toLowerCase().trim() && u.name === n) || null;
  },

  async updateUserStatus(id: string, s: any): Promise<void> { 
    await this.updateUser(id, { status: s });
  },

  async deleteUser(id: string): Promise<void> { 
    if (isSupabaseConfigured) {
      try { await supabase.from('users').delete().eq('id', id); } catch (e) {}
    }
    const users = await this.getUsers();
    setLocal('friendly_users', users.filter(u => u.id !== id));
  }
};

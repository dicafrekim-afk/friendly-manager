
import { User, LeaveRequest, Status, Notification, Meeting, Team, LeaveType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SUPER_ADMIN_EMAILS = [
  'dicafrekim@naver.com',
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
  joinDate: new Date().toISOString().split('T')[0]
};

const calculateLeaveDays = (type: LeaveType, startDate: string, endDate: string): number => {
  if (type === 'HALF_DAY') return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
};

export const dataService = {
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error, status } = await supabase.from('users').select('*').order('joinDate', { ascending: false });
        if (status === 404) throw new Error('Table not found');
        if (error) throw error;
        
        if (data && data.length > 0) {
          return data.map(u => ({
            ...u,
            password: u.password || 'user1234'
          })) as User[];
        }
        
        await this.register(INITIAL_ADMIN);
        return [INITIAL_ADMIN];
      } catch (e) {
        console.error('❌ Supabase 조회 실패:', e);
      }
    }
    const localData = localStorage.getItem('friendly_users');
    let users = localData ? JSON.parse(localData) : [];
    if (users.length === 0) {
      users = [INITIAL_ADMIN];
      localStorage.setItem('friendly_users', JSON.stringify(users));
    }
    return users;
  },

  async register(user: User): Promise<void> {
    const userWithDefaults = { 
      ...user, 
      position: user.position || '팀원',
      team: user.team || '공통',
      password: user.password || 'user1234'
    };
    
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('users').upsert([userWithDefaults]);
      if (error) {
        console.error('❌ Supabase register error:', error);
        throw error;
      }
    }
    const users = await this.getUsers();
    localStorage.setItem('friendly_users', JSON.stringify([...users.filter(u => u.id !== user.id), userWithDefaults]));
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const localData = localStorage.getItem('friendly_users');
    const users: User[] = localData ? JSON.parse(localData) : [];
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('friendly_users', JSON.stringify(updatedUsers));
    
    const sessionStr = localStorage.getItem('friendly_current_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr) as User;
      if (sessionUser.id === userId) {
        const newSession = { ...sessionUser, ...updates };
        localStorage.setItem('friendly_current_session', JSON.stringify(newSession));
        window.dispatchEvent(new Event('storage'));
      }
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('users').update(updates).eq('id', userId);
      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }
    }
  },

  async updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    await this.updateUser(userId, { status });
  },

  async deleteUser(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('users').delete().eq('id', userId);
    }
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem('friendly_users', JSON.stringify(filtered));
  },

  async getRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('leave_requests').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        return data as LeaveRequest[];
      } catch (e) {
        console.error('❌ Supabase getRequests error:', e);
      }
    }
    const localData = localStorage.getItem('friendly_requests');
    return localData ? JSON.parse(localData) : [];
  },

  async createRequest(request: LeaveRequest): Promise<void> {
    const sessionStr = localStorage.getItem('friendly_current_session');
    const currentUser: User = sessionStr ? JSON.parse(sessionStr) : null;
    
    let initialStatus: Status = 'PENDING_PL';
    if (currentUser) {
      if (isSuperAdmin(currentUser.email)) {
        initialStatus = 'APPROVED';
      } else if (currentUser.role === 'ADMIN') {
        initialStatus = 'PENDING_FINAL';
      }
    }
    
    const finalRequest = { 
      ...request, 
      status: initialStatus,
      userTeam: currentUser?.team || request.userTeam || '공통'
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('leave_requests').insert([finalRequest]);
      if (error) throw error;
    }
    
    const reqs = await this.getRequests();
    localStorage.setItem('friendly_requests', JSON.stringify([...reqs.filter(r => r.id !== request.id), finalRequest]));

    if (initialStatus === 'APPROVED' && (request.type === 'VACATION' || request.type === 'HALF_DAY')) {
      const diffDays = calculateLeaveDays(request.type, request.startDate, request.endDate);
      await this.deductLeave(request.userId, diffDays);
    }

    // 알림 생성
    if (initialStatus !== 'APPROVED') {
        const adminNotif: Notification = {
            id: `notif-${Date.now()}`,
            userId: 'ADMIN',
            title: '신규 승인 요청',
            message: `${request.userName}님의 ${request.type} 신청을 확인해 주세요.`,
            type: 'INFO',
            createdAt: new Date().toISOString(),
            isRead: false,
            link: '/admin/requests' // 링크 추가
        };
        await this.createNotification(adminNotif);
    }
  },

  async updateRequestStatus(requestId: string, status: Status): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('leave_requests').update({ status }).eq('id', requestId);
      if (error) throw error;
    }
    const reqs = await this.getRequests();
    const targetReq = reqs.find(r => r.id === requestId);
    const updatedReqs = reqs.map(r => r.id === requestId ? { ...r, status } : r);
    localStorage.setItem('friendly_requests', JSON.stringify(updatedReqs));

    if (status === 'APPROVED' && targetReq && (targetReq.type === 'VACATION' || targetReq.type === 'HALF_DAY')) {
      const diffDays = calculateLeaveDays(targetReq.type, targetReq.startDate, targetReq.endDate);
      await this.deductLeave(targetReq.userId, diffDays);
    }

    // 신청자에게 알림
    if (targetReq) {
        const userNotif: Notification = {
            id: `res-${Date.now()}`,
            userId: targetReq.userId,
            title: '신청 결과 안내',
            message: `제출하신 신청건이 ${status === 'APPROVED' ? '승인' : '반려'}되었습니다.`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
            createdAt: new Date().toISOString(),
            isRead: false,
            link: '/' // 홈(대시보드)으로 이동
        };
        await this.createNotification(userNotif);
    }
  },

  async deleteRequest(requestId: string): Promise<void> {
    const reqs = await this.getRequests();
    const targetReq = reqs.find(r => r.id === requestId);
    
    if (targetReq && targetReq.status === 'APPROVED' && (targetReq.type === 'VACATION' || targetReq.type === 'HALF_DAY')) {
      const diffDays = calculateLeaveDays(targetReq.type, targetReq.startDate, targetReq.endDate);
      await this.restoreLeave(targetReq.userId, diffDays);
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('leave_requests').delete().eq('id', requestId);
      if (error) throw error;
    }
    
    localStorage.setItem('friendly_requests', JSON.stringify(reqs.filter(r => r.id !== requestId)));
  },

  async deductLeave(userId: string, days: number): Promise<void> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      const newUsedLeave = (user.usedLeave || 0) + days;
      await this.updateUser(userId, { usedLeave: newUsedLeave });
    }
  },

  async restoreLeave(userId: string, days: number): Promise<void> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      const newUsedLeave = Math.max(0, (user.usedLeave || 0) - days);
      await this.updateUser(userId, { usedLeave: newUsedLeave });
    }
  },

  async getMeetings(): Promise<Meeting[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('meetings').select('*');
        if (error) throw error;
        return data as Meeting[];
      } catch (e) {
        console.error('❌ Supabase getMeetings error:', e);
      }
    }
    const localData = localStorage.getItem('friendly_meetings');
    return localData ? JSON.parse(localData) : [];
  },

  async createMeeting(meeting: Meeting): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('meetings').insert([meeting]);
      if (error) throw error;
    }
    const meetings = await this.getMeetings();
    localStorage.setItem('friendly_meetings', JSON.stringify([...meetings.filter(m => m.id !== meeting.id), meeting]));
  },

  async deleteMeeting(meetingId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
      if (error) throw error;
    }
    const meetings = await this.getMeetings();
    localStorage.setItem('friendly_meetings', JSON.stringify(meetings.filter(m => m.id !== meetingId)));
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const localData = localStorage.getItem('friendly_notifications');
    const allNotifs: Notification[] = localData ? JSON.parse(localData) : [];
    const sessionStr = localStorage.getItem('friendly_current_session');
    const currentUser: User = sessionStr ? JSON.parse(sessionStr) : null;
    
    return allNotifs.filter(n => {
        if (n.userId === 'ADMIN') {
            return currentUser?.role === 'ADMIN' || isSuperAdmin(currentUser?.email || '');
        }
        return n.userId === userId;
    });
  },

  async createNotification(notification: Notification): Promise<void> {
    const localData = localStorage.getItem('friendly_notifications');
    const allNotifs: Notification[] = localData ? JSON.parse(localData) : [];
    if (allNotifs.some(n => n.id === notification.id)) return;
    localStorage.setItem('friendly_notifications', JSON.stringify([notification, ...allNotifs]));
  },

  async markAsRead(notificationId: string): Promise<void> {
    const localData = localStorage.getItem('friendly_notifications');
    const allNotifs: Notification[] = localData ? JSON.parse(localData) : [];
    const updated = allNotifs.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
    localStorage.setItem('friendly_notifications', JSON.stringify(updated));
  },

  async checkMeetingReminders(): Promise<void> {
    const meetings = await this.getMeetings();
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourAndTenLater = new Date(now.getTime() + 70 * 60 * 1000);

    for (const mt of meetings) {
      const startTime = new Date(mt.startTime);
      if (startTime > oneHourLater && startTime < oneHourAndTenLater) {
        for (const participantId of mt.participants) {
          const reminderNotif: Notification = {
            id: `rem-${mt.id}-${participantId}`,
            userId: participantId,
            title: '회의 리마인더',
            message: `1시간 후에 [${mt.title}] 회의가 시작됩니다.`,
            type: 'WARNING',
            createdAt: new Date().toISOString(),
            isRead: false,
            link: '/meetings'
          };
          await this.createNotification(reminderNotif);
        }
      }
    }
  },

  async findUserToReset(email: string, name: string): Promise<User | null> {
    const users = await this.getUsers();
    const searchEmail = email.toLowerCase().trim();
    const searchName = name.trim();
    let user = users.find(u => u.email.toLowerCase().trim() === searchEmail && u.name.trim() === searchName);
    if (!user && SUPER_ADMIN_EMAILS.includes(searchEmail)) {
        user = users.find(u => u.email.toLowerCase().trim() === searchEmail);
    }
    return user || null;
  }
};

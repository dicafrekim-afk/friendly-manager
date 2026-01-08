
import { User, LeaveRequest, Status, Notification, Meeting, Team } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const INITIAL_ADMIN: User = {
  id: 'admin-001',
  email: 'dicafrekim@naver.com',
  name: '최고관리자',
  position: 'PL',
  team: '공통', // 초기 관리자 팀 설정
  role: 'ADMIN',
  status: 'APPROVED',
  totalLeave: 25,
  usedLeave: 0,
  joinDate: new Date().toISOString().split('T')[0]
};

const SUPER_ADMIN_EMAIL = 'dicafrekim@naver.com';

export const dataService = {
  // --- User Operations ---
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error, status } = await supabase.from('users').select('*').order('joinDate', { ascending: false });
        if (status === 404) throw new Error('Table not found');
        if (error) throw error;
        if (data && data.length > 0) return data as User[];
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
      team: user.team || '공통'
    };
    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').upsert([userWithDefaults]);
      } catch (e) {}
    }
    const users = await this.getUsers();
    localStorage.setItem('friendly_users', JSON.stringify([...users.filter(u => u.id !== user.id), userWithDefaults]));
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    // 1. Cloud DB 업데이트 (활성화된 경우)
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('users').update(updates).eq('id', userId);
        if (error) {
          console.error('❌ Supabase Update Error:', error);
          // DB 스키마에 컬럼이 없거나 권한 문제가 있을 수 있음
        }
      } catch (e) {
        console.error('❌ DB 업데이트 실패:', e);
      }
    }

    // 2. 로컬 스토리지 즉시 업데이트 (항상 동기화 보장)
    const localData = localStorage.getItem('friendly_users');
    const users: User[] = localData ? JSON.parse(localData) : [];
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('friendly_users', JSON.stringify(updatedUsers));
    
    // 3. 현재 세션 유저인 경우 세션 정보도 업데이트
    const sessionStr = localStorage.getItem('friendly_current_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr) as User;
      if (sessionUser.id === userId) {
        localStorage.setItem('friendly_current_session', JSON.stringify({ ...sessionUser, ...updates }));
      }
    }
  },

  async deleteUser(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
      } catch (e) {
        console.error('❌ DB 삭제 에러:', e);
      }
    }
    const localData = localStorage.getItem('friendly_users');
    const users: User[] = localData ? JSON.parse(localData) : [];
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem('friendly_users', JSON.stringify(filtered));
  },

  async updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    await this.updateUser(userId, { status });
  },

  // --- Request Operations ---
  async getRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('leave_requests').select('*').order('createdAt', { ascending: false });
        if (!error && data) return data as LeaveRequest[];
      } catch (e) {}
    }
    const localData = localStorage.getItem('friendly_requests');
    return localData ? JSON.parse(localData) : [];
  },

  async createRequest(request: LeaveRequest): Promise<void> {
    const sessionStr = localStorage.getItem('friendly_current_session');
    const currentUser: User = sessionStr ? JSON.parse(sessionStr) : null;
    
    let initialStatus: Status = 'PENDING_PL';
    if (currentUser) {
      if (currentUser.email === SUPER_ADMIN_EMAIL) {
        initialStatus = 'APPROVED';
      } else if (currentUser.role === 'ADMIN') {
        initialStatus = 'PENDING_FINAL';
      }
    }
    
    const finalRequest = { 
      ...request, 
      status: initialStatus,
      userTeam: currentUser?.team || '공통'
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('leave_requests').insert([finalRequest]);
        return;
      } catch (e) {}
    }
    const reqs = await this.getRequests();
    localStorage.setItem('friendly_requests', JSON.stringify([...reqs.filter(r => r.id !== request.id), finalRequest]));
  },

  async updateRequestStatus(requestId: string, status: Status): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('leave_requests').update({ status }).eq('id', requestId);
      } catch (e) {}
    }
    const reqs = await this.getRequests();
    const targetReq = reqs.find(r => r.id === requestId);
    const updatedReqs = reqs.map(r => r.id === requestId ? { ...r, status } : r);
    localStorage.setItem('friendly_requests', JSON.stringify(updatedReqs));

    if (status === 'APPROVED' && targetReq && targetReq.type === 'VACATION') {
      const start = new Date(targetReq.startDate);
      const end = new Date(targetReq.endDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      await this.deductLeave(targetReq.userId, diffDays);
    }
  },

  async deductLeave(userId: string, days: number): Promise<void> {
    const localData = localStorage.getItem('friendly_users');
    const users: User[] = localData ? JSON.parse(localData) : [];
    const user = users.find(u => u.id === userId);
    if (user) {
      const newUsedLeave = (user.usedLeave || 0) + days;
      await this.updateUser(userId, { usedLeave: newUsedLeave });
    }
  },

  async getMeetings(): Promise<Meeting[]> {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from('meetings').select('*');
        if (data) return data as Meeting[];
      } catch (e) {}
    }
    const localData = localStorage.getItem('friendly_meetings');
    return localData ? JSON.parse(localData) : [];
  },

  async createMeeting(meeting: Meeting): Promise<void> {
    if (isSupabaseConfigured) {
      try { await supabase.from('meetings').insert([meeting]); } catch (e) {}
    }
    const meetings = await this.getMeetings();
    localStorage.setItem('friendly_meetings', JSON.stringify([...meetings.filter(m => m.id !== meeting.id), meeting]));
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const localData = localStorage.getItem('friendly_notifications');
    const allNotifs: Notification[] = localData ? JSON.parse(localData) : [];
    return allNotifs.filter(n => n.userId === userId || n.userId === 'ADMIN');
  },

  async createNotification(notification: Notification): Promise<void> {
    const localData = localStorage.getItem('friendly_notifications');
    const allNotifs: Notification[] = localData ? JSON.parse(localData) : [];
    localStorage.setItem('friendly_notifications', JSON.stringify([notification, ...allNotifs]));
  },

  async markAsRead(notificationId: string): Promise<void> {
    const localData = localStorage.getItem('friendly_notifications');
    const allNotifs: Notification[] = localData ? JSON.parse(localData) : [];
    const updated = allNotifs.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
    localStorage.setItem('friendly_notifications', JSON.stringify(updated));
  }
};


import { User, LeaveRequest, Status, Notification, Meeting, Team } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// 최고 관리자(Super Admin) 명단 업데이트
export const SUPER_ADMIN_EMAILS = [
  'dicafrekim@naver.com',
  'aldari25@naver.com', // 서지연 님
  'lankypark@gmail.com'  // 박희수(lankypark) 님 최고 관리자 권한 부여
];

export const isSuperAdmin = (email: string) => SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());

const INITIAL_ADMIN: User = {
  id: 'admin-001',
  email: SUPER_ADMIN_EMAILS[0], // dicafrekim@naver.com
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

// 날짜 차이 계산 유틸리티
const calculateDiffDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
};

export const dataService = {
  // --- User Operations ---
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

  async findUserToReset(email: string, name: string): Promise<User | null> {
    const users = await this.getUsers();
    const searchEmail = email.toLowerCase().trim();
    const searchName = name.trim();
    
    let user = users.find(u => 
      u.email.toLowerCase().trim() === searchEmail && 
      u.name.trim() === searchName
    );

    if (!user && SUPER_ADMIN_EMAILS.includes(searchEmail)) {
        user = users.find(u => u.email.toLowerCase().trim() === searchEmail);
    }
    
    return user || null;
  },

  async deleteUser(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('users').delete().eq('id', userId);
    }
    const users = await this.getUsers();
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
      if (error) {
        console.error('❌ Supabase insert error detailed:', error);
        if (error.code === 'PGRST204') {
          throw new Error(`데이터베이스 구조(userTeam 컬럼)가 업데이트되지 않았습니다. 관리자에게 문의해 주세요. (${error.message})`);
        }
        throw error;
      }
    }
    
    const reqs = await this.getRequests();
    localStorage.setItem('friendly_requests', JSON.stringify([...reqs.filter(r => r.id !== request.id), finalRequest]));

    // 자동 승인된 경우(최고관리자 등) 즉시 연차 차감 로직 수행
    if (initialStatus === 'APPROVED' && request.type === 'VACATION') {
      const diffDays = calculateDiffDays(request.startDate, request.endDate);
      await this.deductLeave(request.userId, diffDays);
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

    // 관리자가 수동으로 승인할 때 차감 로직
    if (status === 'APPROVED' && targetReq && targetReq.type === 'VACATION') {
      const diffDays = calculateDiffDays(targetReq.startDate, targetReq.endDate);
      await this.deductLeave(targetReq.userId, diffDays);
    }
  },

  async deductLeave(userId: string, days: number): Promise<void> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      const newUsedLeave = (user.usedLeave || 0) + days;
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

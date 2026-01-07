import { User, LeaveRequest, Status, Notification, Meeting } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const INITIAL_ADMIN: User = {
  id: 'admin-001',
  email: 'dicafrekim@naver.com',
  name: '최고관리자',
  role: 'ADMIN',
  status: 'APPROVED',
  totalLeave: 25,
  usedLeave: 0,
  joinDate: new Date().toISOString().split('T')[0]
};

export const dataService = {
  // --- User Operations ---
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').select('*').order('joinDate', { ascending: false });
        if (error) throw error;
        
        if (data && data.length > 0) return data as User[];
        
        // 데이터가 아예 없는 경우 초기 관리자 생성 시도
        console.log('ℹ️ DB가 비어있어 초기 관리자를 생성합니다.');
        await this.register(INITIAL_ADMIN);
        return [INITIAL_ADMIN];
      } catch (e) {
        console.error('❌ Supabase 연결 실패:', e);
      }
    }
    
    // 로컬 저장소 폴백
    const localData = localStorage.getItem('friendly_users');
    let users = localData ? JSON.parse(localData) : [];
    if (users.length === 0) {
      users = [INITIAL_ADMIN];
      localStorage.setItem('friendly_users', JSON.stringify(users));
    }
    return users;
  },

  async register(user: User): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('users').upsert([user]);
        if (!error) return;
        console.error('❌ DB 등록 에러:', error.message);
      } catch (e) {
        console.warn('DB 등록 실패, 로컬에 저장합니다.');
      }
    }
    const users = await this.getUsers();
    localStorage.setItem('friendly_users', JSON.stringify([...users.filter(u => u.id !== user.id), user]));
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('users').update(updates).eq('id', userId);
        if (error) console.error('❌ DB 업데이트 에러:', error.message);
      } catch (e) {
        console.warn('DB 업데이트 실패');
      }
    }
    const users = await this.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('friendly_users', JSON.stringify(updated));

    const sessionStr = localStorage.getItem('friendly_current_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr) as User;
      if (sessionUser.id === userId) {
        localStorage.setItem('friendly_current_session', JSON.stringify({ ...sessionUser, ...updates }));
      }
    }
  },

  async updateUserStatus(userId: string, status: Status): Promise<void> {
    await this.updateUser(userId, { status });
  },

  // --- Request Operations ---
  async getRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('leave_requests').select('*').order('createdAt', { ascending: false });
        if (!error && data) return data as LeaveRequest[];
      } catch (e) {
        console.warn('DB 요청 목록 조회 실패');
      }
    }
    const localData = localStorage.getItem('friendly_requests');
    return localData ? JSON.parse(localData) : [];
  },

  async createRequest(request: LeaveRequest): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('leave_requests').insert([request]);
        if (!error) return;
      } catch (e) {
        console.warn('DB 요청 생성 실패');
      }
    }
    const reqs = await this.getRequests();
    localStorage.setItem('friendly_requests', JSON.stringify([...reqs.filter(r => r.id !== request.id), request]));
  },

  async updateRequestStatus(requestId: string, status: Status): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('leave_requests').update({ status }).eq('id', requestId);
        if (error) console.error('❌ DB 상태 업데이트 에러:', error.message);
      } catch (e) {
        console.warn('DB 상태 업데이트 실패');
      }
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
    const users = await this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      const newUsedLeave = (user.usedLeave || 0) + days;
      await this.updateUser(userId, { usedLeave: newUsedLeave });
    }
  },

  // --- Meeting Operations ---
  async getMeetings(): Promise<Meeting[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('meetings').select('*');
        if (!error && data) return data as Meeting[];
      } catch (e) {
        console.warn('DB 회의 목록 조회 실패');
      }
    }
    const localData = localStorage.getItem('friendly_meetings');
    return localData ? JSON.parse(localData) : [];
  },

  async createMeeting(meeting: Meeting): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('meetings').insert([meeting]);
        if (!error) return;
      } catch (e) {
        console.warn('DB 회의 생성 실패');
      }
    }
    const meetings = await this.getMeetings();
    localStorage.setItem('friendly_meetings', JSON.stringify([...meetings.filter(m => m.id !== meeting.id), meeting]));
  },

  // --- Notification Operations ---
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
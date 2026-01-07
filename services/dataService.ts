
import { User, LeaveRequest, Status, Notification, Meeting } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * 이 서비스는 Supabase 연동을 시도하되, 
 * 연결이 불가능하면 즉시 localStorage를 사용하여 앱이 멈추지 않게 합니다.
 */
export const dataService = {
  // --- User Operations ---
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').select('*').order('joinDate', { ascending: false });
        if (!error && data) return data as User[];
      } catch (e) {
        console.warn('Supabase fetch failed, using local storage.');
      }
    }
    const localData = localStorage.getItem('friendly_users');
    return localData ? JSON.parse(localData) : [];
  },

  async register(user: User): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').insert([user]);
      } catch (e) {
        console.warn('DB register failed');
      }
    }
    const users = await this.getUsers();
    localStorage.setItem('friendly_users', JSON.stringify([...users, user]));
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').update(updates).eq('id', userId);
      } catch (e) {
        console.warn('DB update failed');
      }
    }
    const users = await this.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('friendly_users', JSON.stringify(updated));

    // 세션 업데이트 (로그인한 본인 정보를 수정한 경우)
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
        console.warn('Supabase fetch failed');
      }
    }
    const localData = localStorage.getItem('friendly_requests');
    return localData ? JSON.parse(localData) : [];
  },

  async createRequest(request: LeaveRequest): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('leave_requests').insert([request]);
      } catch (e) {
        console.warn('DB create request failed');
      }
    }
    const reqs = await this.getRequests();
    localStorage.setItem('friendly_requests', JSON.stringify([...reqs, request]));
  },

  async updateRequestStatus(requestId: string, status: Status): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('leave_requests').update({ status }).eq('id', requestId);
      } catch (e) {
        console.warn('DB update request status failed');
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
        console.warn('Supabase meeting fetch failed');
      }
    }
    const localData = localStorage.getItem('friendly_meetings');
    return localData ? JSON.parse(localData) : [];
  },

  async createMeeting(meeting: Meeting): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('meetings').insert([meeting]);
      } catch (e) {
        console.warn('DB create meeting failed');
      }
    }
    const meetings = await this.getMeetings();
    localStorage.setItem('friendly_meetings', JSON.stringify([...meetings, meeting]));
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

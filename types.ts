
export type Role = 'ADMIN' | 'USER';
export type Status = 'PENDING' | 'PENDING_PL' | 'PENDING_FINAL' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'VACATION' | 'BUSINESS_TRIP' | 'SICK_LEAVE' | 'OTHER';

export interface User {
  id: string;
  email: string;
  name: string;
  position: string;
  role: Role;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // 계정 승인 상태
  totalLeave: number;
  usedLeave: number;
  joinDate: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: Status; // 결재 상태
  approverId?: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  organizerId: string;
  participants: string[]; // User IDs
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  createdAt: string;
  isRead: boolean;
}

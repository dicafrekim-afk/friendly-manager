
export type Role = 'ADMIN' | 'USER';
export type Status = 'PENDING' | 'PENDING_PL' | 'PENDING_FINAL' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'VACATION' | 'HALF_DAY' | 'BUSINESS_TRIP' | 'SICK_LEAVE' | 'OTHER';
export type Team = '공채' | '경채' | '특정직' | '공통';

export interface User {
  id: string;
  email: string;
  password: string; 
  name: string;
  position: string;
  team: Team; 
  role: Role;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; 
  totalLeave: number;
  usedLeave: number;
  joinDate: string;
  phone?: string;         // 전화번호 추가
  profileImage?: string;  // 프로필 이미지 (Base64) 추가
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userTeam: Team; 
  type: LeaveType;
  halfDayType?: 'MORNING' | 'AFTERNOON'; // 반차 상세 유형 추가
  startDate: string;
  endDate: string;
  reason: string;
  status: Status; 
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
  participants: string[]; 
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  createdAt: string;
  isRead: boolean;
  link?: string; // 이동할 경로 추가
}

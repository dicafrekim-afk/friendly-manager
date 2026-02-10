
export type Role = 'ADMIN' | 'USER';
export type Status = 'PENDING' | 'PENDING_PL' | 'PENDING_FINAL' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'VACATION' | 'HALF_DAY' | 'BUSINESS_TRIP' | 'SICK_LEAVE' | 'OTHER' | 'EXTRA_LEAVE';
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
  extraLeaveAvailable: number; // 보유 보상 휴가
  extraLeaveUsed: number;      // 사용 보상 휴가
  joinDate: string;
  phone?: string;
  profileImage?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userTeam: Team; 
  type: LeaveType;
  halfDayType?: 'MORNING' | 'AFTERNOON';
  startDate: string;
  endDate: string;
  reason: string;
  status: Status; 
  approverId?: string;
  createdAt: string;
}

// 추가 근무(주말/철야) 보고 인터페이스
export interface ExtraWorkReport {
  id: string;
  userId: string;
  userName: string;
  userTeam: Team;
  workDate: string;
  workType: 'WEEKEND' | 'OVERTIME'; // 주말 또는 철야
  rewardAmount: number; // 보상 수량 (0.5 또는 1.0)
  reason: string;
  status: Status;
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
  link?: string;
}


export type Role = 'ADMIN' | 'USER';
export type Status = 'PENDING' | 'PENDING_PL' | 'PENDING_FINAL' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'VACATION' | 'HALF_DAY' | 'BUSINESS_TRIP' | 'SICK_LEAVE' | 'OTHER' | 'EXTRA_LEAVE';
export type Team = '공채' | '경채' | '특정직' | '공통' | '위기대응';

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
  isSuperAdmin?: boolean;      // Super Admin 여부 (DB 기반)
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userTeam: Team;
  type: LeaveType;
  halfDayType?: 'MORNING' | 'AFTERNOON';
  isHalfDay?: boolean; // 보상휴가 반차 여부 (EXTRA_LEAVE 0.5일 사용 시)
  startDate: string;
  endDate: string;
  reason: string;
  status: Status;
  approverId?: string;
  isAdminDirect?: boolean;
  adminName?: string;
  createdAt: string;
}

// 추가 근무(주말/철야) 보고 인터페이스
export interface ExtraWorkReport {
  id: string;
  userId: string;
  userName: string;
  userTeam: Team;
  workDate: string; // 시작 날짜 기준
  startDateTime: string; // 시작 일시
  endDateTime: string;   // 종료 일시
  workHours: number; // 계산된 근무 시간
  workType: 'WEEKEND' | 'OVERTIME'; // 주말 또는 철야
  rewardAmount: number; // 보상 수량 (0.5 또는 1.0)
  expiryDate: string; // 만료일 (근무일 + 30일)
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

export interface RewardLeaveGrant {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  grantedByName: string;
  grantedAt: string;
}

// 출퇴근 기록 상태
// CONFIRMED: GPS 반경 내에서 정상 등록
// PENDING_MANUAL: GPS 반경 밖/실패로 수동 등록 요청, 관리자 승인 대기
// REJECTED: 관리자가 수동 등록 요청을 반려
export type AttendanceStatus = 'CONFIRMED' | 'PENDING_MANUAL' | 'REJECTED';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userTeam: Team;
  date: string; // YYYY-MM-DD (근무일 기준)
  checkInTime?: string; // ISO datetime
  checkOutTime?: string; // ISO datetime
  checkInStatus?: AttendanceStatus;
  checkOutStatus?: AttendanceStatus;
  checkInDistance?: number; // 사무실 기준 거리(m)
  checkOutDistance?: number;
  checkInAccuracy?: number; // GPS accuracy(m)
  checkOutAccuracy?: number;
  checkInReason?: string; // 수동 등록 사유
  checkOutReason?: string;
  approverId?: string;
  createdAt: string;
  updatedAt: string;
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

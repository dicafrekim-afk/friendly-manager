
import { LeaveType } from './types';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  VACATION: '휴가',
  BUSINESS_TRIP: '출장',
  SICK_LEAVE: '병가',
  OTHER: '기타'
};

export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  VACATION: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100',
  BUSINESS_TRIP: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100',
  SICK_LEAVE: 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100',
  OTHER: 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-100'
};


import { LeaveType } from './types';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  VACATION: '연차',
  HALF_DAY: '반차',
  BUSINESS_TRIP: '출장',
  SICK_LEAVE: '병가',
  OTHER: '기타',
  EXTRA_LEAVE: '보상휴가'
};

export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  VACATION: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100',
  HALF_DAY: 'bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-100',
  BUSINESS_TRIP: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100',
  SICK_LEAVE: 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100',
  OTHER: 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-100',
  EXTRA_LEAVE: 'bg-violet-50 text-violet-700 border-violet-200 ring-1 ring-violet-100'
};

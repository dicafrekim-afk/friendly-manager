
import { LeaveType } from './types';
import { GeoPoint } from './lib/geo';

// 인사혁신처(정부세종2청사 17동) 근사 좌표 — OpenStreetMap 기준
// Super Admin이 출퇴근 위치를 변경하지 않았을 때 쓰이는 기본값(fallback)입니다.
// 실제 출입구 위치와 5~15m 정도 차이가 날 수 있으니, 관리자 페이지에서 정확한 좌표로 보정하는 것을 권장합니다.
export const DEFAULT_OFFICE_LOCATION: GeoPoint = {
  lat: 36.4839106,
  lng: 127.2611459,
};
export const DEFAULT_OFFICE_ADDRESS = '세종특별자치시 정부2청사로 13 (인사혁신처)';

// 출퇴근 버튼 활성화 반경(m) 기본값
export const DEFAULT_ATTENDANCE_RADIUS_METERS = 50;

// 관리자가 선택할 수 있는 반경 옵션(m)
export const ATTENDANCE_RADIUS_OPTIONS = [30, 50, 70];

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

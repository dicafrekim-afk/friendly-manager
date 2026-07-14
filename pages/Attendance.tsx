
import React, { useState, useEffect, useCallback } from 'react';
import { User, AttendanceRecord, AttendanceSettings } from '../types';
import { dataService, isSuperAdmin } from '../services/dataService';
import { ATTENDANCE_RADIUS_OPTIONS } from '../constants';
import { getCurrentPosition, distanceInMeters, geocodeAddress, GeoError, CurrentPosition, GeocodeResult } from '../lib/geo';

type GeoState = 'idle' | 'checking' | 'in_range' | 'out_of_range' | 'error';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTime = (iso?: string) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const statusBadge = (status?: string) => {
  switch (status) {
    case 'CONFIRMED': return <span className="px-2 py-0.5 rounded-full text-[9px] font-black border bg-emerald-50 text-emerald-600 border-emerald-100">확정됨</span>;
    case 'PENDING_MANUAL': return <span className="px-2 py-0.5 rounded-full text-[9px] font-black border bg-amber-50 text-amber-600 border-amber-100">관리자 승인 대기</span>;
    case 'REJECTED': return <span className="px-2 py-0.5 rounded-full text-[9px] font-black border bg-red-50 text-red-600 border-red-100">반려됨</span>;
    default: return null;
  }
};

const mapEmbedUrl = (lat: number, lng: number) => {
  const d = 0.003;
  const bbox = `${lng - d}%2C${lat - d * 0.7}%2C${lng + d}%2C${lat + d * 0.7}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
};

const Attendance: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [geoMessage, setGeoMessage] = useState('');
  const [position, setPosition] = useState<CurrentPosition | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const [showManualModal, setShowManualModal] = useState<'IN' | 'OUT' | null>(null);
  const [manualReason, setManualReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 관리자 위치/반경 설정 폼
  const [editingSettings, setEditingSettings] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [pendingLocation, setPendingLocation] = useState<GeocodeResult | null>(null);
  const [pendingRadius, setPendingRadius] = useState<number>(50);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = useCallback(async () => {
    const sessionStr = localStorage.getItem('friendly_current_session');
    if (!sessionStr) { setLoading(false); return; }
    const user: User = JSON.parse(sessionStr);
    setCurrentUser(user);

    setLoading(true);
    try {
      const [rec, all, settingsData] = await Promise.all([
        dataService.getTodayAttendance(user.id, todayStr()),
        dataService.getAttendanceRecords(),
        dataService.getAttendanceSettings(),
      ]);
      setToday(rec);
      setHistory(all.filter(r => r.userId === user.id).slice(0, 14));
      setSettings(settingsData);
      setPendingRadius(settingsData.radiusMeters);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const checkLocation = useCallback(async (office: AttendanceSettings) => {
    setGeoState('checking');
    setGeoMessage('');
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      const dist = distanceInMeters(pos, { lat: office.officeLat, lng: office.officeLng });
      setDistance(dist);
      if (dist <= office.radiusMeters) {
        setGeoState('in_range');
      } else {
        setGeoState('out_of_range');
        setGeoMessage(`반경 ${office.radiusMeters}m 밖입니다 (현재 약 ${Math.round(dist)}m 떨어짐).`);
      }
    } catch (e) {
      setGeoState('error');
      setGeoMessage(e instanceof GeoError ? e.message : '위치 확인 중 오류가 발생했습니다.');
    }
  }, []);

  useEffect(() => { if (settings) checkLocation(settings); }, [settings, checkLocation]);

  const handleConfirmedAction = async (type: 'IN' | 'OUT') => {
    if (!currentUser || !position || distance === null) return;
    setSubmitting(true);
    try {
      const opts = { status: 'CONFIRMED' as const, distance, accuracy: position.accuracy, lat: position.lat, lng: position.lng };
      if (type === 'IN') await dataService.checkIn(currentUser, todayStr(), opts);
      else await dataService.checkOut(currentUser, todayStr(), opts);
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!currentUser || !showManualModal || !manualReason.trim()) return;
    setSubmitting(true);
    try {
      const opts = {
        status: 'PENDING_MANUAL' as const,
        distance: distance ?? undefined,
        accuracy: position?.accuracy,
        lat: position?.lat,
        lng: position?.lng,
        reason: manualReason.trim(),
      };
      if (showManualModal === 'IN') await dataService.checkIn(currentUser, todayStr(), opts);
      else await dataService.checkOut(currentUser, todayStr(), opts);
      setShowManualModal(null);
      setManualReason('');
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const openSettingsEditor = () => {
    if (!settings) return;
    setAddressInput(settings.officeAddress);
    setPendingLocation({ label: settings.officeAddress, lat: settings.officeLat, lng: settings.officeLng });
    setPendingRadius(settings.radiusMeters);
    setGeocodeResults([]);
    setGeocodeError('');
    setEditingSettings(true);
  };

  const handleGeocode = async () => {
    if (!addressInput.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    setGeocodeResults([]);
    try {
      const results = await geocodeAddress(addressInput.trim());
      if (results.length === 0) setGeocodeError('검색 결과가 없습니다. 주소를 다르게 입력해 보세요.');
      setGeocodeResults(results);
    } catch (e) {
      setGeocodeError('주소 검색 중 오류가 발생했습니다.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser || !pendingLocation) return;
    setSavingSettings(true);
    try {
      await dataService.updateAttendanceSettings({
        officeLat: pendingLocation.lat,
        officeLng: pendingLocation.lng,
        officeAddress: pendingLocation.label,
        radiusMeters: pendingRadius,
        updatedBy: currentUser.id,
        updatedAt: new Date().toISOString(),
      });
      setEditingSettings(false);
      await fetchData();
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading || !settings) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const canCheckIn = geoState === 'in_range' && !today?.checkInTime;
  const canCheckOut = geoState === 'in_range' && !!today?.checkInTime && !today?.checkOutTime;
  const accuracyRisky = position && position.accuracy > settings.radiusMeters;
  const superAdm = currentUser ? isSuperAdmin(currentUser) : false;

  return (
    <div className="space-y-6 md:space-y-10 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">출퇴근 관리</h1>
        <p className="text-xs md:text-sm font-bold text-slate-400 mt-1">{settings.officeAddress} 반경 {settings.radiusMeters}m 이내에서만 출퇴근 등록이 가능합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 출퇴근 액션 카드 */}
        <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
          {/* 위치 상태 */}
          <div className={`p-5 rounded-[24px] border flex items-start gap-4 ${
            geoState === 'in_range' ? 'bg-emerald-50 border-emerald-100' :
            geoState === 'checking' ? 'bg-slate-50 border-slate-100' :
            'bg-amber-50 border-amber-100'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              geoState === 'in_range' ? 'bg-emerald-500 text-white' :
              geoState === 'checking' ? 'bg-slate-300 text-white' :
              'bg-amber-500 text-white'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-900">
                {geoState === 'checking' && '위치 확인 중...'}
                {geoState === 'in_range' && `반경 이내입니다 (약 ${Math.round(distance || 0)}m)`}
                {geoState === 'out_of_range' && '반경 밖입니다'}
                {geoState === 'error' && '위치를 확인할 수 없습니다'}
                {geoState === 'idle' && '위치 확인 대기 중'}
              </p>
              {geoMessage && <p className="text-[10px] font-bold text-slate-500 mt-1">{geoMessage}</p>}
              {accuracyRisky && geoState !== 'checking' && (
                <p className="text-[9px] font-bold text-amber-600 mt-1">GPS 오차범위(약 {Math.round(position!.accuracy)}m)가 반경보다 커서 측정이 부정확할 수 있습니다.</p>
              )}
              <button onClick={() => checkLocation(settings)} className="mt-3 text-[10px] font-black text-indigo-600 underline underline-offset-2">위치 다시 확인</button>
            </div>
          </div>

          {/* 오늘 상태 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">출근</p>
              <p className="text-3xl font-black text-slate-900 mb-2">{formatTime(today?.checkInTime)}</p>
              {statusBadge(today?.checkInStatus)}
            </div>
            <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">퇴근</p>
              <p className="text-3xl font-black text-slate-900 mb-2">{formatTime(today?.checkOutTime)}</p>
              {statusBadge(today?.checkOutStatus)}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                disabled={!canCheckIn || submitting}
                onClick={() => handleConfirmedAction('IN')}
                className={`flex-1 py-5 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 ${canCheckIn && !submitting ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                출근하기
              </button>
              <button
                disabled={!canCheckOut || submitting}
                onClick={() => handleConfirmedAction('OUT')}
                className={`flex-1 py-5 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 ${canCheckOut && !submitting ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                퇴근하기
              </button>
            </div>

            {(geoState === 'out_of_range' || geoState === 'error') && (!today?.checkInTime || (!!today?.checkInTime && !today?.checkOutTime)) && (
              <button
                onClick={() => setShowManualModal(!today?.checkInTime ? 'IN' : 'OUT')}
                className="w-full py-4 rounded-2xl font-black text-xs text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-all"
              >
                반경 밖 · 관리자 승인용 수동 등록 요청
              </button>
            )}
          </div>
        </div>

        {/* 최근 이력 */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-6">최근 출퇴근 이력</h3>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-hide">
            {history.length === 0 ? (
              <p className="text-center text-[11px] font-bold text-slate-300 py-16">아직 등록된 기록이 없습니다.</p>
            ) : (
              history.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-transparent">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-900">{r.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span>출근 {formatTime(r.checkInTime)} {statusBadge(r.checkInStatus)}</span>
                    <span>퇴근 {formatTime(r.checkOutTime)} {statusBadge(r.checkOutStatus)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 관리자용 위치/반경 설정 */}
      {superAdm && (
        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900">출퇴근 위치 설정 (관리자)</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">근무지 이전 시 여기서 기준 위치와 반경을 변경할 수 있습니다.</p>
            </div>
            {!editingSettings && (
              <button onClick={openSettingsEditor} className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all">위치 변경</button>
            )}
          </div>

          {!editingSettings ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">현재 기준 주소</p>
                <p className="text-xs font-bold text-slate-700">{settings.officeAddress}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2">좌표: {settings.officeLat.toFixed(6)}, {settings.officeLng.toFixed(6)}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">활성화 반경</p>
                <p className="text-2xl font-black text-indigo-600">{settings.radiusMeters}m</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">주소 검색</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={e => setAddressInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGeocode(); } }}
                    placeholder="예: 세종특별자치시 정부2청사로 13"
                    className="flex-1 px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold transition-all"
                  />
                  <button
                    onClick={handleGeocode}
                    disabled={geocoding || !addressInput.trim()}
                    className={`px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition-all ${geocoding || !addressInput.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {geocoding ? '검색 중...' : '주소 검색'}
                  </button>
                </div>
                {geocodeError && <p className="text-[10px] font-bold text-red-500">{geocodeError}</p>}
              </div>

              {geocodeResults.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">검색 결과 (선택)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                    {geocodeResults.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPendingLocation(r)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 text-[11px] font-bold transition-all ${pendingLocation?.lat === r.lat && pendingLocation?.lng === r.lng ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pendingLocation && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">지도 미리보기</label>
                  <div className="rounded-2xl overflow-hidden border border-slate-100 h-64">
                    <iframe
                      title="office-location-preview"
                      className="w-full h-full"
                      src={mapEmbedUrl(pendingLocation.lat, pendingLocation.lng)}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400">좌표: {pendingLocation.lat.toFixed(6)}, {pendingLocation.lng.toFixed(6)}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">활성화 반경</label>
                <div className="grid grid-cols-3 gap-3">
                  {ATTENDANCE_RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setPendingRadius(r)}
                      className={`py-3 rounded-2xl border-2 text-sm font-black transition-all ${pendingRadius === r ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingSettings(false)} className="flex-1 py-4 text-xs font-black text-slate-400 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">취소</button>
                <button
                  onClick={handleSaveSettings}
                  disabled={!pendingLocation || savingSettings}
                  className={`flex-1 py-4 text-xs font-black rounded-2xl shadow-lg transition-all ${pendingLocation && !savingSettings ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  {savingSettings ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 수동 등록 모달 */}
      {showManualModal && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 duration-300">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">{showManualModal === 'IN' ? '출근' : '퇴근'} 수동 등록 요청</h3>
              <button onClick={() => setShowManualModal(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                <p className="text-[10px] font-black text-amber-600">GPS 반경 밖 또는 위치 확인 실패로 자동 등록이 불가합니다. 사유를 입력하면 관리자 승인 후 확정됩니다.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사유</label>
                <textarea
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value)}
                  placeholder="예: 외근 중 이동, GPS 오작동 등"
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none text-sm font-bold resize-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowManualModal(null)} className="flex-1 py-4 text-xs font-black text-slate-400 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">취소</button>
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualReason.trim() || submitting}
                  className={`flex-1 py-4 text-xs font-black rounded-2xl shadow-lg transition-all ${manualReason.trim() && !submitting ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  요청하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

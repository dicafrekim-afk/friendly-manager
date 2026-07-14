
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface CurrentPosition extends GeoPoint {
  accuracy: number; // meters
}

// Haversine 공식: 두 좌표 간 거리(m)
export const distanceInMeters = (a: GeoPoint, b: GeoPoint): number => {
  const R = 6371000; // 지구 반지름(m)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
};

export type GeoErrorReason = 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'TIMEOUT';

export class GeoError extends Error {
  reason: GeoErrorReason;
  constructor(reason: GeoErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export const getCurrentPosition = (): Promise<CurrentPosition> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoError('UNSUPPORTED', '이 브라우저에서는 위치 확인을 지원하지 않습니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new GeoError('PERMISSION_DENIED', '위치 권한이 거부되었습니다.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new GeoError('TIMEOUT', '위치 확인 시간이 초과되었습니다.'));
        } else {
          reject(new GeoError('UNAVAILABLE', '위치 정보를 가져올 수 없습니다.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
};

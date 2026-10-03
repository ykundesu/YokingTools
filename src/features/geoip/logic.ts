export interface GeoIpResult {
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  organization: string | null;
  note: string;
  source: string;
}

export function formatCoordinates(result: GeoIpResult): string {
  if (result.latitude === null || result.longitude === null) return "座標情報なし";
  return `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`;
}

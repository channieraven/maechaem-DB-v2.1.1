import proj4 from 'proj4';

const WGS84 = 'EPSG:4326';
const UTM47N = '+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface UTMCoordinates {
  easting: number;
  northing: number;
}

export function utmToLatLng(
  easting: number,
  northing: number,
  utmProjection = UTM47N
): LatLng {
  const [lng, lat] = proj4(utmProjection, WGS84, [easting, northing]);
  return { lat, lng };
}

export function latLngToUtm(
  lat: number,
  lng: number,
  utmProjection = UTM47N
): UTMCoordinates {
  const [easting, northing] = proj4(WGS84, utmProjection, [lng, lat]);
  return { easting, northing };
}

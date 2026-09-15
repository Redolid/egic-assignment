/** Shape of a record in the data provided with the assignment. */
export interface RawTrader {
  SAL_CODE: number
  SHOP_NAME: string
  LATITUDE: number
  LONGITUDE: number
}

/** App-level shape: id, name, latitude, longitude (as the requirements describe a location). */
export interface Trader {
  id: number
  name: string
  lat: number
  lng: number
}

const isValidCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

/**
 * Maps the source format to the app format in one place, so a change in the
 * data source (e.g. a real API) only touches this function.
 * Records with missing or out-of-range coordinates are skipped instead of breaking the map.
 */
export function normalizeTraders(raw: RawTrader[]): Trader[] {
  return raw
    .filter((record) => isValidCoordinate(record.LATITUDE, record.LONGITUDE))
    .map((record) => ({
      id: record.SAL_CODE,
      name: record.SHOP_NAME.trim(),
      lat: record.LATITUDE,
      lng: record.LONGITUDE,
    }))
}

export const googleMapsUrl = (trader: Trader) =>
  `https://www.google.com/maps/search/?api=1&query=${trader.lat},${trader.lng}`

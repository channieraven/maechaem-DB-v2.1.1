declare module 'georaster' {
  type GeoRaster = Record<string, unknown>

  export default function parseGeoraster(data: ArrayBuffer | string): Promise<GeoRaster>
}

declare module 'georaster-layer-for-leaflet' {
  import * as L from 'leaflet'

  export default class GeoRasterLayer extends L.GridLayer {
    constructor(options: Record<string, unknown>)
    getBounds(): L.LatLngBounds | null
  }
}

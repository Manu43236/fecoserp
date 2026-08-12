// Date
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// Numbers
export const formatGallons = (n: number) => `${n.toLocaleString()} gal`
export const formatRate    = (n: number) => `${n} gal/day`
export const formatMiles   = (n: number) => `${n.toLocaleString()} mi`

// Currency
export const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

// GPS
export const formatGps = (lat: number, lng: number) =>
  `${lat.toFixed(6)}, ${lng.toFixed(6)}`

// Off-target detection
export const isOffTarget = (recRate: number, actualRate: number) =>
  Math.abs((actualRate - recRate) / recRate) > 0.1

export const offTargetPercent = (recRate: number, actualRate: number) =>
  (((actualRate - recRate) / recRate) * 100).toFixed(1)

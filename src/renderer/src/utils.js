export function fmtFull(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + 'đ'
}

export function fmt(n) {
  n = n || 0
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'tr'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return fmtFull(n)
}

export function todayDisplay() {
  const d = new Date()
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear()
  ].join('/')
}

export function todayISO() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-')
}

export function isoToDisplay(iso) {
  if (!iso || !iso.includes('-')) return iso || ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function displayToISO(dd) {
  if (!dd || !dd.includes('/')) return dd || ''
  const [d, m, y] = dd.split('/')
  return `${y}-${m}-${d}`
}

export function dayLabel() {
  const d = new Date()
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

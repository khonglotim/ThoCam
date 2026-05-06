const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'don-ban', label: '🧾 Đơn bán sỉ' },
  { id: 'nhap-hang', label: '📥 Nhập hàng' },
  { id: 'thu-no', label: '💳 Thu nợ' },
  { id: 'hang-hoa', label: '📦 Hàng hoá' },
  { id: 'khach-hang', label: '👥 Khách hàng' },
  { id: 'bao-cao', label: '📈 Báo cáo' }
]

export default function TabNav({ view, onNavigate }) {
  return (
    <div className="tab-nav">
      {TABS.map(t => (
        <div
          key={t.id}
          className={`tab${view === t.id ? ' active' : ''}`}
          onClick={() => onNavigate(t.id)}
        >
          {t.label}
        </div>
      ))}
    </div>
  )
}

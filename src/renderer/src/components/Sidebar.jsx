import { useState, useEffect } from 'react'
import { customers as customersApi } from '../api'
import { useData } from '../contexts/DataContext'

export default function Sidebar({ view, onNavigate }) {
  const [debtCount, setDebtCount] = useState(0)
  const { refreshKey } = useData()

  useEffect(() => {
    customersApi.getAll()
      .then(list => setDebtCount(list.filter(c => c.debt > 0).length))
      .catch(() => {})
  }, [view, refreshKey])

  const item = (id, icon, label, badge) => (
    <div
      className={`nav-item${view === id ? ' active' : ''}`}
      onClick={() => onNavigate(id)}
    >
      <span className="nav-icon">{icon}</span>
      {label}
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </div>
  )

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-icon">🧵</span>
        <div className="logo-title">Thổ Cẩm<br />Quản Lý</div>
        <div className="logo-sub">Quản lý bán sỉ</div>
      </div>
      <nav className="nav">
        <div className="nav-section-label">Tổng quan</div>
        {item('dashboard', '📊', 'Tổng quan')}
        <div className="nav-section-label">Kinh doanh</div>
        {item('don-ban', '🧾', 'Đơn bán sỉ')}
        {item('nhap-hang', '📥', 'Nhập hàng')}
        {item('thu-no', '💳', 'Thu nợ', debtCount)}
        <div className="nav-section-label">Danh mục</div>
        {item('hang-hoa', '📦', 'Hàng hoá')}
        {item('khach-hang', '👥', 'Khách hàng')}
        <div className="nav-section-label">Phân tích</div>
        {item('bao-cao', '📈', 'Báo cáo')}
      </nav>
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="avatar">TC</div>
          <div>
            <div className="user-name">Thổ Cẩm Shop</div>
            <div className="user-role">Quản trị viên</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

import { useState, useEffect } from 'react'
import { dashboard as dashboardApi } from '../api'
import { fmt, fmtFull, dayLabel } from '../utils'

function StatusBadge({ status }) {
  if (status === 'paid') return <span className="badge badge-green">✓ Đã trả đủ</span>
  if (status === 'partial') return <span className="badge badge-yellow">⏳ Còn nợ</span>
  return <span className="badge badge-red">✕ Chưa trả</span>
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    dashboardApi.getStats()
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="page-view">
        <div className="content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text3)', fontSize: 14 }}>Đang tải...</div>
        </div>
      </div>
    )
  }

  const s = stats || {}

  return (
    <div className="page-view">
      <div className="topbar">
        <div>
          <div className="page-title">Tổng quan hôm nay 👋</div>
          <div className="page-sub">{dayLabel()}</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => onNavigate('bao-cao')}>📅 Xem báo cáo</button>
          <button className="btn btn-primary" onClick={() => onNavigate('don-ban')}>＋ Tạo đơn bán</button>
        </div>
      </div>

      <div className="content">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-top">
              <div>
                <div className="kpi-label">Doanh thu tháng</div>
                <div className="kpi-value" style={{ color: 'var(--accent)' }}>{fmt(s.revenue)}</div>
              </div>
              <div className="kpi-icon-box" style={{ background: '#e3f0ff' }}>💰</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--green)' }}>
              Giá vốn: {fmt(s.cost)}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-top">
              <div>
                <div className="kpi-label">Lợi nhuận</div>
                <div className="kpi-value" style={{ color: 'var(--green)' }}>{fmt(s.profit)}</div>
              </div>
              <div className="kpi-icon-box" style={{ background: 'var(--green-lt)' }}>📈</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--green)' }}>
              ▲ Tỷ suất {s.profitRate || 0}%
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-top">
              <div>
                <div className="kpi-label">Tổng công nợ</div>
                <div className="kpi-value" style={{ color: 'var(--red)' }}>{fmt(s.totalDebt)}</div>
              </div>
              <div className="kpi-icon-box" style={{ background: 'var(--red-lt)' }}>⚠️</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--red)' }}>
              {s.debtorsCount || 0} khách đang nợ
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-top">
              <div>
                <div className="kpi-label">Cảnh báo tồn kho</div>
                <div className="kpi-value" style={{ color: 'var(--yellow)' }}>{s.lowStock || 0}</div>
              </div>
              <div className="kpi-icon-box" style={{ background: 'var(--yellow-lt)' }}>📦</div>
            </div>
            <div className="kpi-change" style={{ color: s.lowStock > 0 ? 'var(--red)' : 'var(--green)' }}>
              {s.lowStock > 0 ? `▼ ${s.lowStock} loại sắp hết` : '✓ Tồn kho ổn định'}
            </div>
          </div>
        </div>

        <div className="bottom-grid">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">🧾 Đơn bán gần đây</div>
              <span className="panel-link" onClick={() => onNavigate('don-ban')}>Xem tất cả →</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Mã đơn</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(!s.recentOrders || s.recentOrders.length === 0) && (
                  <tr><td colSpan={4} className="empty-state">Chưa có đơn hàng</td></tr>
                )}
                {s.recentOrders?.map(o => (
                  <tr key={o.id}>
                    <td className="td-name">{o.customer_name}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 800 }}>{o.code}</td>
                    <td className="td-amount" style={{ color: 'var(--accent)' }}>{fmtFull(o.total_amount)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">💳 Khách đang nợ</div>
              <span className="tag">Tổng: {fmt(s.totalDebt)}</span>
            </div>
            <div>
              {(!s.topDebtors || s.topDebtors.length === 0) && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  Không có công nợ
                </div>
              )}
              {s.topDebtors?.map(c => {
                const pct = c.total_purchased > 0
                  ? Math.min(100, (c.debt / c.total_purchased) * 100)
                  : 100
                return (
                  <div key={c.id} className="debt-item" onClick={() => onNavigate('thu-no')}>
                    <div className="debt-row1">
                      <span className="debt-cust">{c.name}</span>
                      <span className="debt-amount">{fmt(c.debt)}</span>
                    </div>
                    <div className="debt-bar-bg">
                      <div className="debt-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="debt-meta">
                      <span>Đã trả: {fmt(c.total_paid)}</span>
                      <span>Tổng mua: {fmt(c.total_purchased)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

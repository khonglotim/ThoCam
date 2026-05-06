import { useState, useEffect } from 'react'
import { reports as reportsApi } from '../api'
import { fmtFull, fmt } from '../utils'

export default function BaoCao() {
  const [monthly, setMonthly] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [m, t] = await Promise.all([
        reportsApi.getMonthly(),
        reportsApi.getTopCustomers()
      ])
      setMonthly(m)
      setTopCustomers(t)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0)
  const totalCost = monthly.reduce((s, r) => s + r.cost, 0)
  const totalProfit = monthly.reduce((s, r) => s + r.profit, 0)
  const totalOrders = monthly.reduce((s, r) => s + r.order_count, 0)
  const profitRate = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0

  return (
    <div className="page-view">
      <div className="topbar">
        <div>
          <div className="page-title">Báo cáo & Thống kê</div>
          <div className="page-sub">Doanh thu, lợi nhuận, top khách hàng</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={load}>🔄 Làm mới</button>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty-state">Đang tải...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-top">
                  <div>
                    <div className="kpi-label">Tổng doanh thu</div>
                    <div className="kpi-value" style={{ color: 'var(--accent)' }}>{fmt(totalRevenue)}</div>
                  </div>
                  <div className="kpi-icon-box" style={{ background: '#e3f0ff' }}>💰</div>
                </div>
                <div className="kpi-change" style={{ color: 'var(--text3)' }}>{totalOrders} đơn hàng</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-top">
                  <div>
                    <div className="kpi-label">Tổng giá vốn</div>
                    <div className="kpi-value" style={{ color: 'var(--yellow)' }}>{fmt(totalCost)}</div>
                  </div>
                  <div className="kpi-icon-box" style={{ background: 'var(--yellow-lt)' }}>📦</div>
                </div>
                <div className="kpi-change" style={{ color: 'var(--text3)' }}>Chi phí hàng hoá</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-top">
                  <div>
                    <div className="kpi-label">Lợi nhuận gộp</div>
                    <div className="kpi-value" style={{ color: 'var(--green)' }}>{fmt(totalProfit)}</div>
                  </div>
                  <div className="kpi-icon-box" style={{ background: 'var(--green-lt)' }}>📈</div>
                </div>
                <div className="kpi-change" style={{ color: 'var(--green)' }}>▲ Tỷ suất {profitRate}%</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-top">
                  <div>
                    <div className="kpi-label">Số đơn hàng</div>
                    <div className="kpi-value" style={{ color: 'var(--accent)' }}>{totalOrders}</div>
                  </div>
                  <div className="kpi-icon-box" style={{ background: 'var(--accent-lt)' }}>🧾</div>
                </div>
                <div className="kpi-change" style={{ color: 'var(--text3)' }}>Tổng tất cả thời gian</div>
              </div>
            </div>

            <div className="bottom-grid">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">📅 Doanh thu theo tháng</div>
                </div>
                {monthly.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tháng</th>
                        <th>Số đơn</th>
                        <th>Doanh thu</th>
                        <th>Giá vốn</th>
                        <th>Lợi nhuận</th>
                        <th>Tỷ suất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((r, i) => {
                        const rate = r.revenue > 0 ? (r.profit / r.revenue * 100).toFixed(1) : 0
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{r.month}</td>
                            <td>{r.order_count}</td>
                            <td className="td-amount" style={{ color: 'var(--accent)' }}>{fmtFull(r.revenue)}</td>
                            <td style={{ color: 'var(--text2)' }}>{fmtFull(r.cost)}</td>
                            <td style={{ color: 'var(--green)', fontWeight: 800 }}>{fmtFull(r.profit)}</td>
                            <td>
                              <span className={`badge ${rate >= 20 ? 'badge-green' : rate >= 10 ? 'badge-yellow' : 'badge-red'}`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">🏆 Top khách hàng</div>
                </div>
                {topCustomers.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu</div>
                ) : (
                  <div>
                    {topCustomers.map((c, i) => {
                      const maxPurchased = topCustomers[0].total_purchased
                      const pct = maxPurchased > 0 ? (c.total_purchased / maxPurchased * 100) : 0
                      return (
                        <div key={c.id} className="debt-item">
                          <div className="debt-row1">
                            <span className="debt-cust">
                              <span style={{ color: 'var(--text3)', marginRight: 6, fontSize: 12 }}>#{i + 1}</span>
                              {c.name}
                            </span>
                            <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 14 }}>
                              {fmt(c.total_purchased)}
                            </span>
                          </div>
                          <div className="debt-bar-bg">
                            <div className="debt-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="debt-meta">
                            <span>Đã trả: {fmt(c.total_paid)}</span>
                            <span style={{ color: c.debt > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                              {c.debt > 0 ? `Còn nợ: ${fmt(c.debt)}` : '✓ Đã trả đủ'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { collections as collectionsApi, customers as customersApi } from '../api'
import { fmtFull, fmt, todayDisplay } from '../utils'

function ThuTienModal({ customer, customerOrders, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [orderId, setOrderId] = useState('')
  const [date, setDate] = useState(todayDisplay())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const unpaidOrders = customerOrders.filter(o => o.status !== 'paid')

  const handleSave = async () => {
    const n = Number(amount)
    if (!n || n <= 0) { setError('Số tiền không hợp lệ'); return }
    if (n > customer.debt) { setError('Số tiền vượt quá công nợ của khách hàng'); return }
    setSaving(true)
    try {
      await onSave({
        customer_id: customer.id,
        amount: n,
        date,
        notes,
        order_id: orderId ? parseInt(orderId) : null
      })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-peek">
        <div className="modal-header">
          <div className="modal-title">💳 Thu nợ – {customer.name}</div>
          <div className="close-btn" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}
          <div className="summary-box">
            <div className="summary-row"><span>Khách hàng</span><span style={{ fontWeight: 700 }}>{customer.name}</span></div>
            <div className="summary-row"><span>Tổng đã mua</span><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmtFull(customer.total_purchased)}</span></div>
            <div className="summary-row"><span>Đã thanh toán</span><span style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtFull(customer.total_paid)}</span></div>
            <div className="summary-row"><span>Còn nợ</span><span style={{ fontWeight: 800, color: 'var(--red)' }}>{fmtFull(customer.debt)}</span></div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày thu</label>
              <input className="form-input" placeholder="DD/MM/YYYY" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Số tiền thu</label>
              <input className="form-input" type="number" min="0" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="Nhập số tiền..." autoFocus />
            </div>
          </div>

          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12, marginBottom: 16 }}
            onClick={() => setAmount(customer.debt)}>
            Thu hết nợ {fmtFull(customer.debt)}
          </button>

          {unpaidOrders.length > 0 && (
            <div className="form-group">
              <label className="form-label">Gắn với đơn hàng (tuỳ chọn)</label>
              <select className="form-input" value={orderId} onChange={e => setOrderId(e.target.value)}>
                <option value="">Không gắn với đơn cụ thể</option>
                {unpaidOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.code} – Còn nợ {fmtFull(o.remaining_debt)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-input" style={{ height: 60, resize: 'none' }}
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ghi chú thêm..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : '✓ Xác nhận thu'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function ThuNo() {
  const [customers, setCustomers] = useState([])
  const [collections, setCollections] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [tab, setTab] = useState('cong-no')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [custs, cols] = await Promise.all([
        customersApi.getAll(),
        collectionsApi.getAll()
      ])
      setCustomers(custs.filter(c => c.debt > 0))
      setCollections(cols)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openModal = async (customer) => {
    const ords = await customersApi.getOrders(customer.id)
    setCustomerOrders(ords)
    setSelectedCustomer(customer)
  }

  const totalDebt = customers.reduce((s, c) => s + c.debt, 0)

  return (
    <div className="page-view">
      <div className="topbar">
        <div>
          <div className="page-title">Quản lý thu nợ</div>
          <div className="page-sub">Theo dõi công nợ khách hàng</div>
        </div>
      </div>

      <div className="content">
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { k: 'cong-no', label: '⚠️ Đang nợ' },
            { k: 'lich-su', label: '📋 Lịch sử thu' }
          ].map(t => (
            <span key={t.k} className={`badge`}
              style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', background: tab === t.k ? 'var(--accent-lt)' : 'var(--surface)', border: '1.5px solid var(--border)', color: tab === t.k ? 'var(--accent)' : 'var(--text2)' }}
              onClick={() => setTab(t.k)}>
              {t.label}
            </span>
          ))}
        </div>

        {tab === 'cong-no' && (
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">💳 Danh sách khách đang nợ</div>
              <span className="tag">Tổng nợ: {fmt(totalDebt)}</span>
            </div>
            {loading ? <div className="empty-state">Đang tải...</div> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã KH</th><th>Khách hàng</th><th>Tổng đã mua</th>
                    <th>Đã thanh toán</th><th>Còn nợ</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 && (
                    <tr><td colSpan={6} className="empty-state">Không có khách hàng nào đang nợ</td></tr>
                  )}
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--accent)', fontWeight: 800 }}>{c.code}</td>
                      <td className="td-name">{c.name}</td>
                      <td>{fmtFull(c.total_purchased)}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtFull(c.total_paid)}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 800 }}>{fmtFull(c.debt)}</td>
                      <td>
                        <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: 12 }}
                          onClick={() => openModal(c)}>
                          Thu tiền
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'lich-su' && (
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">📋 Lịch sử thu nợ</div>
            </div>
            {loading ? <div className="empty-state">Đang tải...</div> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ngày thu</th><th>Khách hàng</th><th>Đơn hàng</th>
                    <th>Số tiền thu</th><th>Nợ trước</th><th>Nợ sau</th><th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.length === 0 && (
                    <tr><td colSpan={7} className="empty-state">Chưa có lịch sử thu nợ</td></tr>
                  )}
                  {collections.map(c => (
                    <tr key={c.id}>
                      <td>{c.date}</td>
                      <td className="td-name">{c.customer_name}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{c.order_code || '—'}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 800 }}>{fmtFull(c.amount)}</td>
                      <td style={{ color: 'var(--red)' }}>{fmtFull(c.debt_before)}</td>
                      <td style={{ color: c.debt_after > 0 ? 'var(--yellow)' : 'var(--green)', fontWeight: 700 }}>{fmtFull(c.debt_after)}</td>
                      <td style={{ color: 'var(--text3)' }}>{c.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <ThuTienModal
          customer={selectedCustomer}
          customerOrders={customerOrders}
          onClose={() => setSelectedCustomer(null)}
          onSave={async (data) => { await collectionsApi.create(data); await load() }}
        />
      )}
    </div>
  )
}

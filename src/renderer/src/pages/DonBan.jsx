import { useState, useEffect } from 'react'
import { orders as ordersApi, customers as customersApi, products as productsApi } from '../api'
import { fmtFull, todayDisplay } from '../utils'

function StatusBadge({ status }) {
  if (status === 'paid') return <span className="badge badge-green">✓ Đã trả đủ</span>
  if (status === 'partial') return <span className="badge badge-yellow">⏳ Còn nợ</span>
  return <span className="badge badge-red">✕ Chưa trả</span>
}

function TaoDoModal({ customers, products, onClose, onSave }) {
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState(todayDisplay())
  const [notes, setNotes] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasData = customerId || items.some(i => i.product_id)
  const handleClose = () => {
    if (hasData && !confirm('Bạn có dữ liệu chưa lưu. Đóng lại?')) return
    onClose()
  }

  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
  const remaining = Math.max(0, total - (Number(paidAmount) || 0))

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      if (field === 'product_id') {
        const p = products.find(p => p.id === parseInt(value))
        if (p) next[idx].unit_price = p.sell_price
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!customerId) { setError('Vui lòng chọn khách hàng'); return }
    if (items.some(i => !i.product_id || Number(i.quantity) <= 0)) {
      setError('Vui lòng điền đầy đủ thông tin sản phẩm')
      return
    }
    setSaving(true); setError('')
    try {
      await onSave({
        customer_id: parseInt(customerId),
        date,
        notes,
        paid_amount: Number(paidAmount) || 0,
        items: items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
          unit_price: Number(i.unit_price)
        }))
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
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal-peek">
        <div className="modal-header">
          <div className="modal-title">🧾 Tạo đơn bán mới</div>
          <div className="close-btn" onClick={handleClose}>✕</div>
        </div>
        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Khách hàng</label>
            <select className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Chọn khách hàng...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ngày bán</label>
            <input className="form-input" placeholder="DD/MM/YYYY" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <label className="form-label">Sản phẩm</label>
          {items.map((item, idx) => (
            <div key={idx} className="product-block">
              <div className="form-row" style={{ marginBottom: 10 }}>
                <div>
                  <div className="form-label">Tên sản phẩm</div>
                  <select className="form-input" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                    <option value="">Chọn sản phẩm...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (tồn: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="form-label">Số lượng</div>
                  <input className="form-input" type="number" min="1" value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <div className="form-label">Đơn giá (đ)</div>
                  <input className="form-input" type="number" min="0" value={item.unit_price}
                    onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                </div>
                <div>
                  <div className="form-label">Thành tiền</div>
                  <input className="form-input" value={fmtFull(Number(item.quantity) * Number(item.unit_price))}
                    readOnly style={{ color: 'var(--accent)', fontWeight: 800 }} />
                </div>
              </div>
              {items.length > 1 && (
                <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12, padding: '4px 10px', color: 'var(--red)' }}
                  onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>
                  ✕ Xoá dòng
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12, marginBottom: 16 }}
            onClick={() => setItems(prev => [...prev, { product_id: '', quantity: 1, unit_price: 0 }])}>
            ＋ Thêm sản phẩm
          </button>

          <div className="summary-box">
            <div className="summary-row">
              <span>Tổng tiền đơn</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}>{fmtFull(total)}</span>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Tiền khách trả ngay</label>
              <input className="form-input" type="number" min="0" value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)} placeholder="Nhập số tiền..." />
            </div>
            <div className="summary-row">
              <span>Còn nợ lại</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--red)' }}>{fmtFull(remaining)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-input" style={{ height: 72, resize: 'none' }}
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thông tin thêm nếu cần..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : '✓ Xác nhận đơn'}
          </button>
        </div>
      </div>
    </>
  )
}

function ThuTienModal({ order, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const n = Number(amount)
    if (!n || n <= 0) { setError('Số tiền không hợp lệ'); return }
    if (n > order.remaining_debt) { setError('Số tiền vượt quá công nợ còn lại'); return }
    setSaving(true)
    try {
      await onSave(order.id, n)
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
          <div className="modal-title">💳 Thu tiền – {order.code}</div>
          <div className="close-btn" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}
          <div className="summary-box">
            <div className="summary-row"><span>Khách hàng</span><span style={{ fontWeight: 700 }}>{order.customer_name}</span></div>
            <div className="summary-row"><span>Tổng đơn</span><span style={{ fontWeight: 800, color: 'var(--accent)' }}>{fmtFull(order.total_amount)}</span></div>
            <div className="summary-row"><span>Đã thu</span><span style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtFull(order.paid_amount)}</span></div>
            <div className="summary-row"><span>Còn nợ</span><span style={{ fontWeight: 800, color: 'var(--red)' }}>{fmtFull(order.remaining_debt)}</span></div>
          </div>
          <div className="form-group">
            <label className="form-label">Số tiền thu</label>
            <input className="form-input" type="number" min="0" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="Nhập số tiền..." autoFocus />
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12 }}
            onClick={() => setAmount(order.remaining_debt)}>
            Thu hết {fmtFull(order.remaining_debt)}
          </button>
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

export default function DonBan() {
  const [orderList, setOrderList] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showPayment, setShowPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [ords, custs, prods] = await Promise.all([
        ordersApi.getAll(),
        customersApi.getAll(),
        productsApi.getAll()
      ])
      setOrderList(ords)
      setCustomers(custs)
      setProducts(prods)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = orderList.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return o.customer_name.toLowerCase().includes(s) || o.code.toLowerCase().includes(s)
    }
    return true
  })

  const counts = {
    all: orderList.length,
    paid: orderList.filter(o => o.status === 'paid').length,
    partial: orderList.filter(o => o.status === 'partial').length,
    unpaid: orderList.filter(o => o.status === 'unpaid').length
  }

  return (
    <div className="page-view">
      <div className="topbar">
        <div>
          <div className="page-title">Đơn bán sỉ</div>
          <div className="page-sub">Quản lý toàn bộ đơn hàng</div>
        </div>
        <div className="topbar-actions">
          <input className="form-input" style={{ width: 230 }} placeholder="🔍  Tìm khách hàng, mã đơn..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>＋ Tạo đơn mới</button>
        </div>
      </div>

      <div className="content">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { k: 'all', label: `Tất cả (${counts.all})`, cls: 'badge-blue' },
            { k: 'paid', label: `✓ Đã thanh toán (${counts.paid})`, cls: 'badge-green' },
            { k: 'partial', label: `⏳ Còn nợ (${counts.partial})`, cls: 'badge-yellow' },
            { k: 'unpaid', label: `✕ Chưa trả (${counts.unpaid})`, cls: 'badge-red' }
          ].map(b => (
            <span key={b.k} className={`badge ${b.cls}`}
              style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', opacity: filter === b.k ? 1 : 0.55 }}
              onClick={() => setFilter(b.k)}>
              {b.label}
            </span>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Danh sách đơn hàng</div>
          </div>
          {loading ? (
            <div className="empty-state">Đang tải...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th><th>Ngày bán</th><th>Khách hàng</th>
                  <th>Tổng tiền</th><th>Đã thu</th><th>Còn nợ</th>
                  <th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="empty-state">Không có đơn hàng nào</td></tr>
                )}
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td style={{ color: 'var(--accent)', fontWeight: 800 }}>{o.code}</td>
                    <td>{o.date}</td>
                    <td className="td-name">{o.customer_name}</td>
                    <td className="td-amount" style={{ color: 'var(--accent)' }}>{fmtFull(o.total_amount)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtFull(o.paid_amount)}</td>
                    <td style={{ color: o.remaining_debt > 0 ? 'var(--red)' : 'var(--text3)', fontWeight: 800 }}>
                      {fmtFull(o.remaining_debt)}
                    </td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      {o.status !== 'paid' && (
                        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={() => setShowPayment(o)}>
                          Thu tiền
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <TaoDoModal
          customers={customers}
          products={products}
          onClose={() => setShowCreate(false)}
          onSave={async (data) => { await ordersApi.create(data); await load() }}
        />
      )}
      {showPayment && (
        <ThuTienModal
          order={showPayment}
          onClose={() => setShowPayment(null)}
          onSave={async (id, amt) => { await ordersApi.updatePayment(id, amt); await load() }}
        />
      )}
    </div>
  )
}

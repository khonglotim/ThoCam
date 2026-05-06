import { useState, useEffect } from 'react'
import { imports as importsApi, products as productsApi } from '../api'
import { fmtFull, fmt, todayDisplay } from '../utils'
import { useData } from '../contexts/DataContext'

function PhieuNhapModal({ products, onClose, onSave }) {
  const [date, setDate] = useState(todayDisplay())
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1, cost_price: 0 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasData = supplier || items.some(i => i.product_id)
  const handleClose = () => {
    if (hasData && !confirm('Bạn có dữ liệu chưa lưu. Đóng lại?')) return
    onClose()
  }

  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.cost_price) || 0), 0)

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      if (field === 'product_id') {
        const p = products.find(p => p.id === parseInt(value))
        if (p) next[idx].cost_price = p.cost_price
      }
      return next
    })
  }

  const handleSave = async () => {
    if (items.some(i => !i.product_id || Number(i.quantity) <= 0)) {
      setError('Vui lòng điền đầy đủ thông tin sản phẩm')
      return
    }
    setSaving(true); setError('')
    try {
      await onSave({
        date, supplier, notes,
        items: items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
          cost_price: Number(i.cost_price)
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
          <div className="modal-title">📥 Phiếu nhập hàng mới</div>
          <div className="close-btn" onClick={handleClose}>✕</div>
        </div>
        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày nhập</label>
              <input className="form-input" placeholder="DD/MM/YYYY" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nhà cung cấp</label>
              <input className="form-input" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Tên NCC..." />
            </div>
          </div>

          <label className="form-label">Sản phẩm nhập</label>
          {items.map((item, idx) => (
            <div key={idx} className="product-block">
              <div className="form-group">
                <div className="form-label">Tên sản phẩm</div>
                <select className="form-input" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                  <option value="">Chọn sản phẩm...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div>
                  <div className="form-label">Số lượng</div>
                  <input className="form-input" type="number" min="1" value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                </div>
                <div>
                  <div className="form-label">Giá vốn (đ)</div>
                  <input className="form-input" type="number" min="0" value={item.cost_price}
                    onChange={e => updateItem(idx, 'cost_price', e.target.value)} />
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
            onClick={() => setItems(prev => [...prev, { product_id: '', quantity: 1, cost_price: 0 }])}>
            ＋ Thêm sản phẩm
          </button>

          <div className="summary-box">
            <div className="summary-row">
              <span>Tổng tiền nhập</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}>{fmtFull(total)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-input" style={{ height: 60, resize: 'none' }}
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ghi chú thêm..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : '✓ Xác nhận nhập'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function NhapHang() {
  const [productList, setProductList] = useState([])
  const [importList, setImportList] = useState([])
  const [tab, setTab] = useState('ton-kho')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useData()

  const load = async () => {
    setLoading(true)
    try {
      const [prods, imps] = await Promise.all([productsApi.getAll(), importsApi.getAll()])
      setProductList(prods)
      setImportList(imps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const lowStock = productList.filter(p => p.stock <= p.stock_warning).length
  const totalStock = productList.reduce((s, p) => s + p.stock, 0)
  const monthImport = importList.reduce((s, i) => s + i.total_amount, 0)

  const filteredProducts = productList.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  )

  const stockStatus = (p) => {
    if (p.stock <= 0) return <span className="badge badge-red">⚠️ Hết hàng</span>
    if (p.stock <= p.stock_warning) return <span className="badge badge-red">⚠️ Sắp hết</span>
    if (p.stock <= p.stock_warning * 2) return <span className="badge badge-yellow">⚡ Còn ít</span>
    return <span className="badge badge-green">✓ Đủ hàng</span>
  }

  return (
    <div className="page-view">
      <div className="topbar">
        <div>
          <div className="page-title">Nhập hàng</div>
          <div className="page-sub">Quản lý kho & phiếu nhập</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>＋ Phiếu nhập mới</button>
        </div>
      </div>

      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="kpi-card">
            <div className="kpi-top">
              <div>
                <div className="kpi-label">Tổng nhập</div>
                <div className="kpi-value" style={{ color: 'var(--accent)' }}>{fmt(monthImport)}</div>
              </div>
              <div className="kpi-icon-box" style={{ background: 'var(--accent-lt)' }}>📥</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--text3)' }}>{importList.length} phiếu nhập</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top">
              <div>
                <div className="kpi-label">Tổng mặt hàng</div>
                <div className="kpi-value" style={{ color: 'var(--yellow)' }}>{totalStock}</div>
              </div>
              <div className="kpi-icon-box" style={{ background: 'var(--yellow-lt)' }}>📦</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--text3)' }}>Trong kho hiện tại</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top">
              <div>
                <div className="kpi-label">Cảnh báo hết hàng</div>
                <div className="kpi-value" style={{ color: 'var(--red)' }}>{lowStock}</div>
              </div>
              <div className="kpi-icon-box" style={{ background: 'var(--red-lt)' }}>⚠️</div>
            </div>
            <div className="kpi-change" style={{ color: lowStock > 0 ? 'var(--red)' : 'var(--green)' }}>
              {lowStock > 0 ? 'Cần nhập thêm gấp' : 'Tồn kho ổn định'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { k: 'ton-kho', label: '📦 Tồn kho' },
            { k: 'phieu-nhap', label: '📥 Lịch sử nhập' }
          ].map(t => (
            <span key={t.k} className={`badge ${tab === t.k ? 'badge-blue' : ''}`}
              style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', background: tab === t.k ? 'var(--accent-lt)' : 'var(--surface)', border: '1.5px solid var(--border)', color: tab === t.k ? 'var(--accent)' : 'var(--text2)' }}
              onClick={() => setTab(t.k)}>
              {t.label}
            </span>
          ))}
        </div>

        {tab === 'ton-kho' && (
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">📦 Tồn kho hiện tại</div>
              <input className="form-input" style={{ width: 200 }} placeholder="🔍 Tìm sản phẩm..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {loading ? <div className="empty-state">Đang tải...</div> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã SP</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Đơn vị</th>
                    <th>Giá vốn</th><th>Giá bán sỉ</th><th>Tồn kho</th><th>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan={8} className="empty-state">Không có sản phẩm nào</td></tr>
                  )}
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--accent)', fontWeight: 800 }}>{p.code}</td>
                      <td className="td-name">{p.name}</td>
                      <td>{p.category}</td>
                      <td>{p.unit}</td>
                      <td>{fmtFull(p.cost_price)}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmtFull(p.sell_price)}</td>
                      <td style={{ fontWeight: 800, color: p.stock <= p.stock_warning ? 'var(--red)' : p.stock <= p.stock_warning * 2 ? 'var(--yellow)' : 'var(--green)' }}>
                        {p.stock}
                      </td>
                      <td>{stockStatus(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'phieu-nhap' && (
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">📥 Lịch sử phiếu nhập</div>
            </div>
            {loading ? <div className="empty-state">Đang tải...</div> : (
              <table className="data-table">
                <thead>
                  <tr><th>Mã phiếu</th><th>Ngày nhập</th><th>Nhà cung cấp</th><th>Số mặt hàng</th><th>Tổng tiền</th></tr>
                </thead>
                <tbody>
                  {importList.length === 0 && (
                    <tr><td colSpan={5} className="empty-state">Chưa có phiếu nhập nào</td></tr>
                  )}
                  {importList.map(i => (
                    <tr key={i.id}>
                      <td style={{ color: 'var(--accent)', fontWeight: 800 }}>{i.code}</td>
                      <td>{i.date}</td>
                      <td className="td-name">{i.supplier || '—'}</td>
                      <td>{i.item_count} loại</td>
                      <td className="td-amount" style={{ color: 'var(--accent)' }}>{fmtFull(i.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <PhieuNhapModal
          products={productList}
          onClose={() => setShowCreate(false)}
          onSave={async (data) => { await importsApi.create(data); await load(); triggerRefresh() }}
        />
      )}
    </div>
  )
}

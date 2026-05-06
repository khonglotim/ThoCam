import { useState, useEffect } from 'react'
import { products as productsApi } from '../api'
import { fmtFull } from '../utils'

function ProductModal({ product, onClose, onSave }) {
  const editing = !!product
  const [name, setName] = useState(product?.name || '')
  const [category, setCategory] = useState(product?.category || '')
  const [unit, setUnit] = useState(product?.unit || 'Cái')
  const [costPrice, setCostPrice] = useState(product?.cost_price || '')
  const [sellPrice, setSellPrice] = useState(product?.sell_price || '')
  const [stock, setStock] = useState(product?.stock || 0)
  const [stockWarning, setStockWarning] = useState(product?.stock_warning || 10)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (name && !confirm('Bạn có dữ liệu chưa lưu. Đóng lại?')) return
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Tên sản phẩm không được để trống'); return }
    setSaving(true); setError('')
    try {
      await onSave({
        name: name.trim(),
        category, unit,
        cost_price: Number(costPrice) || 0,
        sell_price: Number(sellPrice) || 0,
        stock: editing ? undefined : Number(stock) || 0,
        stock_warning: Number(stockWarning) || 10
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
          <div className="modal-title">{editing ? '✏️ Sửa sản phẩm' : '📦 Thêm sản phẩm mới'}</div>
          <div className="close-btn" onClick={handleClose}>✕</div>
        </div>
        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Tên sản phẩm *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên sản phẩm..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Danh mục</label>
              <input className="form-input" value={category} onChange={e => setCategory(e.target.value)} placeholder="VD: Khăn, Túi..." />
            </div>
            <div className="form-group">
              <label className="form-label">Đơn vị tính</label>
              <select className="form-input" value={unit} onChange={e => setUnit(e.target.value)}>
                {['Cái', 'Chiếc', 'Mét', 'Bộ', 'Đôi', 'Kg', 'Cuộn'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Giá vốn (đ)</label>
              <input className="form-input" type="number" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Giá bán sỉ (đ)</label>
              <input className="form-input" type="number" min="0" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0" />
            </div>
          </div>
          {!editing && (
            <div className="form-group">
              <label className="form-label">Tồn kho ban đầu</label>
              <input className="form-input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Ngưỡng cảnh báo tồn kho</label>
            <input className="form-input" type="number" min="0" value={stockWarning} onChange={e => setStockWarning(e.target.value)} />
          </div>
          {Number(costPrice) > 0 && Number(sellPrice) > 0 && (
            <div className="summary-box">
              <div className="summary-row">
                <span>Biên lợi nhuận</span>
                <span style={{ fontWeight: 800, color: 'var(--green)' }}>
                  {fmtFull(Number(sellPrice) - Number(costPrice))} ({((Number(sellPrice) - Number(costPrice)) / Number(sellPrice) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : editing ? '✓ Cập nhật' : '✓ Thêm sản phẩm'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function HangHoa() {
  const [productList, setProductList] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | product object
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { setProductList(await productsApi.getAll()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = productList.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (p) => {
    if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return
    try {
      await productsApi.delete(p.id)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  const stockColor = (p) => {
    if (p.stock <= 0) return 'var(--red)'
    if (p.stock <= p.stock_warning) return 'var(--red)'
    if (p.stock <= p.stock_warning * 2) return 'var(--yellow)'
    return 'var(--green)'
  }

  return (
    <div className="page-view">
      <div className="topbar">
        <div>
          <div className="page-title">Hàng hoá</div>
          <div className="page-sub">Danh mục sản phẩm thổ cẩm</div>
        </div>
        <div className="topbar-actions">
          <input className="form-input" style={{ width: 220 }} placeholder="🔍 Tìm sản phẩm..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setModal('create')}>＋ Thêm sản phẩm</button>
        </div>
      </div>

      <div className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">📦 Danh sách sản phẩm ({filtered.length})</div>
          </div>
          {loading ? <div className="empty-state">Đang tải...</div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã SP</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Đơn vị</th>
                  <th>Giá vốn</th><th>Giá bán sỉ</th><th>Tồn kho</th><th>Cảnh báo</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="empty-state">Không có sản phẩm nào</td></tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--accent)', fontWeight: 800 }}>{p.code}</td>
                    <td className="td-name">{p.name}</td>
                    <td>{p.category || '—'}</td>
                    <td>{p.unit}</td>
                    <td>{fmtFull(p.cost_price)}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmtFull(p.sell_price)}</td>
                    <td style={{ fontWeight: 800, color: stockColor(p) }}>{p.stock}</td>
                    <td>{p.stock_warning}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => setModal(p)}>
                          Sửa
                        </button>
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleDelete(p)}>
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal === 'create') await productsApi.create(data)
            else await productsApi.update(modal.id, data)
            await load()
          }}
        />
      )}
    </div>
  )
}

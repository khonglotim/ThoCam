import { useState, useEffect } from 'react'
import { customers as customersApi } from '../api'
import { fmtFull, fmt } from '../utils'
import { useData } from '../contexts/DataContext'

function CustomerModal({ customer, onClose, onSave }) {
  const editing = !!customer
  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [address, setAddress] = useState(customer?.address || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (name && !editing && !confirm('Bạn có dữ liệu chưa lưu. Đóng lại?')) return
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Tên khách hàng không được để trống'); return }
    setSaving(true); setError('')
    try {
      await onSave({ name: name.trim(), phone, address })
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
          <div className="modal-title">{editing ? '✏️ Sửa khách hàng' : '👥 Thêm khách hàng mới'}</div>
          <div className="close-btn" onClick={handleClose}>✕</div>
        </div>
        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Tên khách hàng *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Tên cửa hàng / đại lý..." />
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0xxx xxx xxx" />
          </div>
          <div className="form-group">
            <label className="form-label">Địa chỉ</label>
            <textarea className="form-input" style={{ height: 72, resize: 'none' }}
              value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ..." />
          </div>
          {editing && (
            <div className="summary-box">
              <div className="summary-row"><span>Mã khách hàng</span><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{customer.code}</span></div>
              <div className="summary-row"><span>Tổng đã mua</span><span style={{ fontWeight: 700 }}>{fmtFull(customer.total_purchased)}</span></div>
              <div className="summary-row"><span>Công nợ hiện tại</span><span style={{ fontWeight: 800, color: customer.debt > 0 ? 'var(--red)' : 'var(--green)' }}>{fmtFull(customer.debt)}</span></div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : editing ? '✓ Cập nhật' : '✓ Thêm khách hàng'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function KhachHang() {
  const [customerList, setCustomerList] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useData()

  const load = async () => {
    setLoading(true)
    try { setCustomerList(await customersApi.getAll()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = customerList.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const handleDelete = async (c) => {
    if (!confirm(`Xoá khách hàng "${c.name}"?`)) return
    try {
      await customersApi.delete(c.id)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  const totalDebt = customerList.reduce((s, c) => s + c.debt, 0)
  const debtors = customerList.filter(c => c.debt > 0).length

  return (
    <div className="page-view">
      <div className="topbar">
        <div>
          <div className="page-title">Khách hàng</div>
          <div className="page-sub">Danh sách đại lý, người mua sỉ</div>
        </div>
        <div className="topbar-actions">
          <input className="form-input" style={{ width: 220 }} placeholder="🔍 Tìm khách hàng..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setModal('create')}>＋ Thêm khách hàng</button>
        </div>
      </div>

      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="kpi-card">
            <div className="kpi-top">
              <div><div className="kpi-label">Tổng khách hàng</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{customerList.length}</div></div>
              <div className="kpi-icon-box" style={{ background: 'var(--accent-lt)' }}>👥</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--text3)' }}>Đại lý & người mua sỉ</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top">
              <div><div className="kpi-label">Đang có nợ</div><div className="kpi-value" style={{ color: 'var(--red)' }}>{debtors}</div></div>
              <div className="kpi-icon-box" style={{ background: 'var(--red-lt)' }}>⚠️</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--red)' }}>Khách chưa trả hết</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top">
              <div><div className="kpi-label">Tổng công nợ</div><div className="kpi-value" style={{ color: 'var(--red)' }}>{fmt(totalDebt)}</div></div>
              <div className="kpi-icon-box" style={{ background: 'var(--red-lt)' }}>💳</div>
            </div>
            <div className="kpi-change" style={{ color: 'var(--text3)' }}>Tổng tiền chưa thu</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">👥 Danh sách khách hàng ({filtered.length})</div>
          </div>
          {loading ? <div className="empty-state">Đang tải...</div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã KH</th><th>Tên khách hàng</th><th>SĐT</th><th>Địa chỉ</th>
                  <th>Tổng đã mua</th><th>Đã thanh toán</th><th>Công nợ</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="empty-state">Không có khách hàng nào</td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--accent)', fontWeight: 800 }}>{c.code}</td>
                    <td className="td-name">{c.name}</td>
                    <td>{c.phone || '—'}</td>
                    <td style={{ color: 'var(--text3)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{fmtFull(c.total_purchased)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtFull(c.total_paid)}</td>
                    <td style={{ color: c.debt > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 800 }}>
                      {c.debt > 0 ? fmtFull(c.debt) : '✓ Đã trả đủ'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => setModal(c)}>
                          Sửa
                        </button>
                        {c.total_purchased === 0 && (
                          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => handleDelete(c)}>
                            Xoá
                          </button>
                        )}
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
        <CustomerModal
          customer={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal === 'create') await customersApi.create(data)
            else await customersApi.update(modal.id, data)
            await load(); triggerRefresh()
          }}
        />
      )}
    </div>
  )
}

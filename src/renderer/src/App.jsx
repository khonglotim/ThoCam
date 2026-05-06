import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TabNav from './components/TabNav'
import Dashboard from './pages/Dashboard'
import DonBan from './pages/DonBan'
import NhapHang from './pages/NhapHang'
import ThuNo from './pages/ThuNo'
import HangHoa from './pages/HangHoa'
import KhachHang from './pages/KhachHang'
import BaoCao from './pages/BaoCao'

const PAGES = {
  'dashboard': Dashboard,
  'don-ban': DonBan,
  'nhap-hang': NhapHang,
  'thu-no': ThuNo,
  'hang-hoa': HangHoa,
  'khach-hang': KhachHang,
  'bao-cao': BaoCao
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const Page = PAGES[view] || Dashboard

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Sidebar view={view} onNavigate={setView} />
      <div className="main">
        <TabNav view={view} onNavigate={setView} />
        <Page onNavigate={setView} />
      </div>
    </div>
  )
}

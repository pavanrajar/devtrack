
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const MainLayout = () => (
  <div className="flex h-screen overflow-hidden bg-[#F8F9F5]">
    <Sidebar />

    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-7 lg:px-8">
        <Outlet />
      </main>
    </div>
  </div>
)

export default MainLayout

import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X, GraduationCap, LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — mobile slide-in */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:relative lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Desktop brand */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-[#1e3a5f]">SSR Institute</span>
          </div>

          <div className="flex-1" />

          {/* Admin info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
              <p className="text-xs text-gray-500">{admin?.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-semibold">
              {admin?.name?.charAt(0) ?? 'A'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

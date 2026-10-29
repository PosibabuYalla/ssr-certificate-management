import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Award,
  PlusCircle,
  Users,
  FileText,
  BookOpen,
  ShieldCheck,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Certificates', icon: Award, to: '/admin/certificates' },
  { label: 'Create Certificate', icon: PlusCircle, to: '/admin/certificates/new' },
  { label: 'Students', icon: Users, to: '/admin/students' },
  { label: 'Certificate Templates', icon: FileText, to: '/admin/templates' },
  { label: 'Course Management', icon: BookOpen, to: '/admin/courses' },
  { label: 'Verification Records', icon: ShieldCheck, to: '/admin/verification-records' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col bg-[#1e3a5f]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d97706]">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">SSR Institute</p>
          <p className="text-xs text-white/60">Certificate Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-[#d97706] text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

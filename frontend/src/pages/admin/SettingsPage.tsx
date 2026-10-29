import React, { useState, useRef } from 'react'
import { GraduationCap, Upload } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useToast } from '../../components/ui/toast'
import apiClient from '../../lib/api'

export default function SettingsPage() {
  const { admin } = useAuth()
  const toast = useToast()
  const logoRef = useRef<HTMLInputElement>(null)

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPw, setIsChangingPw] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setIsChangingPw(true)
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to change password'
      toast.error(msg)
    } finally {
      setIsChangingPw(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingLogo(true)
    try {
      const form = new FormData()
      form.append('logo', file)
      const res = await apiClient.post<{ data: { logoUrl: string } }>('/settings/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLogoUrl(res.data.data.logoUrl)
      toast.success('Logo uploaded successfully')
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setIsUploadingLogo(false)
      if (logoRef.current) logoRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Settings</h1>

      {/* Institute Info */}
      <Card>
        <CardHeader>
          <CardTitle>Institute Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-lg" />
              ) : (
                <GraduationCap size={28} className="text-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">SSR Institute</p>
              <p className="text-sm text-gray-500">ssrinstitute.in</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-24">Name:</span>
              <span>SSR Institute</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-24">Website:</span>
              <a href="https://ssrinstitute.in" target="_blank" rel="noreferrer" className="text-[#1e3a5f] underline">
                ssrinstitute.in
              </a>
            </div>
          </div>

          {/* Logo upload */}
          <div className="border-t pt-3 mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Institute Logo</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoRef.current?.click()}
              disabled={isUploadingLogo}
            >
              <Upload size={14} />
              {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </Button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, or SVG. Recommended: 200x200px</p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Account */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-24">Name:</span>
            <span className="font-medium">{admin?.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24">Email:</span>
            <span>{admin?.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24">Role:</span>
            <span className="capitalize">{admin?.role}</span>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Current Password</label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">New Password</label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Enter new password (min 6 chars)"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
              <Input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                required
              />
            </div>
            <Button type="submit" disabled={isChangingPw}>
              {isChangingPw ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

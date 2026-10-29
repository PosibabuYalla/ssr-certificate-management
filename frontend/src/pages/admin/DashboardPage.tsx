import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  CalendarDays,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { dashboard, certificates } from '../../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import type { CertificateStatus, RecentCertificate } from '../../types'
import { useToast } from '../../components/ui/toast'

const statusVariant: Record<CertificateStatus, 'issued' | 'draft' | 'revoked'> = {
  issued: 'issued',
  draft: 'draft',
  revoked: 'revoked',
}

const statCards = [
  { label: 'Total Certificates', key: 'totalCertificates', icon: Award, color: 'text-[#1e3a5f] bg-blue-50' },
  { label: 'This Month', key: 'thisMonth', icon: CalendarDays, color: 'text-emerald-700 bg-emerald-50' },
  { label: 'Total Students', key: 'totalStudents', icon: Users, color: 'text-violet-700 bg-violet-50' },
  { label: 'Pending Issuance', key: 'pendingIssuance', icon: Clock, color: 'text-amber-700 bg-amber-50' },
  { label: 'Valid Certificates', key: 'validCertificates', icon: CheckCircle2, color: 'text-green-700 bg-green-50' },
  { label: 'Revoked', key: 'revokedCertificates', icon: XCircle, color: 'text-red-700 bg-red-50' },
]

export default function DashboardPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboard.stats().then((r) => r.data.data),
  })

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => dashboard.recentCertificates().then((r) => r.data.data),
  })

  const handleDownload = async (cert: RecentCertificate) => {
    try {
      const res = await certificates.getPdf(cert.id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${cert.certificateId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download PDF')
    }
  }

  const handleRevoke = async (cert: RecentCertificate) => {
    const reason = window.prompt('Enter revocation reason:')
    if (!reason) return
    try {
      await certificates.revoke(cert.id, reason)
      toast.success('Certificate revoked')
    } catch {
      toast.error('Failed to revoke certificate')
    }
  }

  const categoryData = statsData
    ? [
        { name: 'Electrical', count: statsData.byCategory.electrical },
        { name: 'Software', count: statsData.byCategory.software },
      ]
    : []

  const filtered = (recentData ?? []).filter((c) => {
    const matchSearch =
      !search ||
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.certificateId.toLowerCase().includes(search.toLowerCase()) ||
      c.courseName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Dashboard</h1>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map(({ label, key, icon: Icon, color }) => (
            <Card key={key} className="p-4 flex flex-col gap-2">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {statsData ? (statsData as unknown as Record<string, number>)[key] : 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Category chart */}
      <Card>
        <CardHeader>
          <CardTitle>Certificates by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 0, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 13 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Certificates" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent certificates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Certificates</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Search by ID, student or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-1">
              {['all', 'issued', 'draft', 'revoked'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    statusFilter === s
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No certificates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-xs">{cert.certificateId}</TableCell>
                      <TableCell>{cert.studentName}</TableCell>
                      <TableCell>{cert.courseName}</TableCell>
                      <TableCell>
                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[cert.status]}>
                          {cert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/verify/${cert.certificateId}`, '_blank')}
                            title="View"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(cert)}
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </Button>
                          {cert.status !== 'revoked' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRevoke(cert)}
                              title="Revoke"
                            >
                              <XCircle size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { verificationRecords } from '../../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table'
import { Spinner } from '../../components/ui/spinner'

export default function VerificationRecordsPage() {
  const [action, setAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['verification-records', action, startDate, endDate, page],
    queryFn: () =>
      verificationRecords.list({ action: action || undefined, startDate, endDate, page, limit: 20 }).then((r) => r.data),
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Verification Records</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} className="w-48">
              <option value="">All Actions</option>
              <option value="certificate.verify">Certificate Verify</option>
              <option value="certificate.issue">Certificate Issue</option>
              <option value="certificate.revoke">Certificate Revoke</option>
              <option value="certificate.create">Certificate Create</option>
              <option value="certificate.download">Certificate Download</option>
              <option value="student.create">Student Create</option>
              <option value="admin.login">Admin Login</option>
            </Select>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" title="Start date" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" title="End date" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(rec.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{rec.action}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-gray-700">{rec.entity}</span>
                          {rec.entityId && (
                            <span className="text-gray-400 text-xs ml-1 font-mono">#{rec.entityId.slice(0, 8)}</span>
                          )}
                        </TableCell>
                        <TableCell>{rec.actorName ?? rec.actorId ?? '—'}</TableCell>
                        <TableCell className="text-xs font-mono">{rec.ipAddress ?? '—'}</TableCell>
                        <TableCell className="text-xs text-gray-400 max-w-xs truncate">
                          {rec.metadata ? JSON.stringify(rec.metadata) : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages} — {data?.total} records
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft size={16} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

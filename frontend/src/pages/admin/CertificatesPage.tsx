import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { certificates } from '../../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import { Spinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import type { Certificate, CertificateStatus } from '../../types'

const statusVariant: Record<CertificateStatus, 'issued' | 'draft' | 'revoked'> = {
  issued: 'issued',
  draft: 'draft',
  revoked: 'revoked',
}

export default function CertificatesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null)
  const [revokeReason, setRevokeReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['certificates', search, status, category, startDate, endDate, page],
    queryFn: () =>
      certificates
        .list({ search, status, category, startDate, endDate, page, limit: 15 })
        .then((r) => r.data),
  })

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      certificates.revoke(id, reason),
    onSuccess: () => {
      toast.success('Certificate revoked')
      setRevokeDialogOpen(false)
      setRevokeReason('')
      qc.invalidateQueries({ queryKey: ['certificates'] })
    },
    onError: () => toast.error('Failed to revoke certificate'),
  })

  const handleDownload = async (cert: Certificate) => {
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

  const openRevoke = (cert: Certificate) => {
    setRevokeTarget(cert)
    setRevokeDialogOpen(true)
  }

  const totalPages = data ? Math.ceil(data.total / 15) : 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Certificates</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Certificates</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Search by ID or student..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="max-w-xs"
            />
            <Select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="w-36"
            >
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="draft">Draft</option>
              <option value="revoked">Revoked</option>
            </Select>
            <Select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="w-40"
            >
              <option value="">All Categories</option>
              <option value="electrical">Electrical</option>
              <option value="software">Software</option>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
              title="Start date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
              title="End date"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
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
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                        No certificates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-xs">{cert.certificateId}</TableCell>
                        <TableCell>{cert.student?.fullName ?? '—'}</TableCell>
                        <TableCell>{cert.course?.name ?? '—'}</TableCell>
                        <TableCell>
                          {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[cert.status]}>{cert.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCert(cert)}
                              title="View details"
                            >
                              <Eye size={14} />
                            </Button>
                            {cert.status === 'issued' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(cert)}
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </Button>
                            )}
                            {cert.status !== 'revoked' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => openRevoke(cert)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages} — {data?.total} total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-xs">Certificate ID</p>
                  <p className="font-mono font-medium">{selectedCert.certificateId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Status</p>
                  <Badge variant={statusVariant[selectedCert.status]}>{selectedCert.status}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Student</p>
                  <p className="font-medium">{selectedCert.student?.fullName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Course</p>
                  <p>{selectedCert.course?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Issue Date</p>
                  <p>{selectedCert.issueDate ? new Date(selectedCert.issueDate).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Duration</p>
                  <p>{selectedCert.trainingDuration ?? '—'}</p>
                </div>
                {selectedCert.revokedReason && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Revocation Reason</p>
                    <p className="text-red-600">{selectedCert.revokedReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedCert?.status === 'issued' && (
              <Button variant="golden" size="sm" onClick={() => { if (selectedCert) handleDownload(selectedCert) }}>
                <Download size={14} /> Download PDF
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedCert(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Certificate</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Revoking certificate <span className="font-mono font-medium">{revokeTarget?.certificateId}</span> will
            invalidate it permanently. Please provide a reason.
          </p>
          <Input
            placeholder="Reason for revocation..."
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            className="mt-3"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!revokeReason.trim() || revokeMutation.isPending}
              onClick={() => revokeTarget && revokeMutation.mutate({ id: revokeTarget.id, reason: revokeReason })}
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Certificate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

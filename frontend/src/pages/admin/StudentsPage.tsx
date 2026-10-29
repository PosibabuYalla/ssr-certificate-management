import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { students } from '../../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import { Spinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import type { Student } from '../../types'

export default function StudentsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [importResults, setImportResults] = useState<{ created: number; errors: unknown[] } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const [newStudent, setNewStudent] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    address: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, page],
    queryFn: () => students.list({ search, page, limit: 15 }).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Student>) => students.create(data),
    onSuccess: () => {
      toast.success('Student added')
      setAddOpen(false)
      setNewStudent({ fullName: '', studentId: '', email: '', phone: '', address: '' })
      qc.invalidateQueries({ queryKey: ['students'] })
    },
    onError: () => toast.error('Failed to add student'),
  })

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const res = await students.importCSV(file)
      setImportResults(res.data.data)
      setImportOpen(true)
      qc.invalidateQueries({ queryKey: ['students'] })
    } catch {
      toast.error('CSV import failed')
    } finally {
      setIsImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const totalPages = data ? Math.ceil(data.total / 15) : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isImporting}>
            {isImporting ? <Spinner size="sm" /> : <Upload size={16} />}
            Import CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add Student
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by name or student ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="max-w-xs"
            />
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
                    <TableHead>Student ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Certificates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-10">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                        <TableCell className="font-medium">{s.fullName}</TableCell>
                        <TableCell>{s.email ?? '—'}</TableCell>
                        <TableCell>{s.certificatesCount ?? 0}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailStudent(s)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages} — {data?.total} students
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

      {/* Add student dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Full Name *</label>
              <Input
                value={newStudent.fullName}
                onChange={(e) => setNewStudent((s) => ({ ...s, fullName: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Student ID *</label>
              <Input
                value={newStudent.studentId}
                onChange={(e) => setNewStudent((s) => ({ ...s, studentId: e.target.value }))}
                placeholder="e.g. SSR-2024-001"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Email</label>
              <Input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent((s) => ({ ...s, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Phone</label>
              <Input
                value={newStudent.phone}
                onChange={(e) => setNewStudent((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Address</label>
              <Input
                value={newStudent.address}
                onChange={(e) => setNewStudent((s) => ({ ...s, address: e.target.value }))}
                placeholder="Address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!newStudent.fullName || !newStudent.studentId || createMutation.isPending}
              onClick={() => createMutation.mutate(newStudent)}
            >
              {createMutation.isPending ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student detail dialog */}
      <Dialog open={!!detailStudent} onOpenChange={() => setDetailStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {detailStudent && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500 text-xs">Student ID</p>
                  <p className="font-mono font-medium">{detailStudent.studentId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Full Name</p>
                  <p className="font-medium">{detailStudent.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Email</p>
                  <p>{detailStudent.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Phone</p>
                  <p>{detailStudent.phone ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">Address</p>
                  <p>{detailStudent.address ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Joined</p>
                  <p>{new Date(detailStudent.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetailStudent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import results dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>CSV Import Results</DialogTitle></DialogHeader>
          {importResults && (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-medium">
                {importResults.created} student{importResults.created !== 1 ? 's' : ''} imported successfully
              </p>
              {importResults.errors.length > 0 && (
                <div>
                  <p className="text-sm text-red-600 font-medium mb-2">
                    {importResults.errors.length} error{importResults.errors.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded border border-red-100 bg-red-50 p-3 space-y-1">
                    {importResults.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">
                        {typeof err === 'string' ? err : JSON.stringify(err)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button size="sm" onClick={() => setImportOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

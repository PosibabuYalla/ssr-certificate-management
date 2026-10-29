import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2 } from 'lucide-react'
import { courses } from '../../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import { Spinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import type { Course } from '../../types'

const emptyForm = {
  name: '',
  code: '',
  prefix: '',
  category: 'electrical' as 'electrical' | 'software',
  description: '',
  defaultDuration: '',
}

export default function CoursesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courses.list().then((r) => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Course>) => courses.create(data),
    onSuccess: () => {
      toast.success('Course created')
      setAddOpen(false)
      setForm(emptyForm)
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: () => toast.error('Failed to create course'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Course> }) =>
      courses.update(id, data),
    onSuccess: () => {
      toast.success('Course updated')
      setEditCourse(null)
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: () => toast.error('Failed to update course'),
  })

  const openEdit = (course: Course) => {
    setEditCourse(course)
    setForm({
      name: course.name,
      code: course.code,
      prefix: course.prefix,
      category: course.category,
      description: course.description ?? '',
      defaultDuration: course.defaultDuration,
    })
  }

  const toggleArchive = (course: Course) => {
    updateMutation.mutate({ id: course.id, data: { isActive: !course.isActive } })
  }

  const electrical = (data ?? []).filter((c) => c.category === 'electrical')
  const software = (data ?? []).filter((c) => c.category === 'software')

  const CourseCard = ({ course }: { course: Course }) => (
    <div className="rounded-lg border border-gray-200 p-4 flex items-start justify-between gap-3 hover:border-gray-300 transition-colors">
      <div>
        <p className="font-semibold text-gray-900">{course.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{course.code} &bull; {course.prefix} &bull; {course.defaultDuration}</p>
        {course.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</p>}
        <div className="flex gap-2 mt-2">
          <Badge variant={course.isActive ? 'success' : 'secondary'}>
            {course.isActive ? 'Active' : 'Archived'}
          </Badge>
          {course.templateId && <Badge variant="default">Has Template</Badge>}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => openEdit(course)}>
          <Edit2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={course.isActive ? 'text-red-500' : 'text-green-600'}
          onClick={() => toggleArchive(course)}
        >
          {course.isActive ? 'Archive' : 'Restore'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Courses</h1>
        <Button size="sm" onClick={() => { setForm(emptyForm); setAddOpen(true) }}>
          <Plus size={16} /> Add Course
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="warning">Electrical</Badge>
                <span>{electrical.length} courses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {electrical.length === 0 ? (
                <p className="text-gray-400 text-sm">No electrical courses</p>
              ) : (
                electrical.map((c) => <CourseCard key={c.id} course={c} />)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="default">Software</Badge>
                <span>{software.length} courses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {software.length === 0 ? (
                <p className="text-gray-400 text-sm">No software courses</p>
              ) : (
                software.map((c) => <CourseCard key={c.id} course={c} />)
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit dialog */}
      {(addOpen || !!editCourse) && (
        <Dialog open={addOpen || !!editCourse} onOpenChange={() => { setAddOpen(false); setEditCourse(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Course Name *</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Industrial Electrician" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Course Code *</label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="IE-101" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Certificate Prefix</label>
                  <Input value={form.prefix} onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))} placeholder="SSR-IE" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Category *</label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as 'electrical' | 'software' }))}
                >
                  <option value="electrical">Electrical</option>
                  <option value="software">Software</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Default Duration</label>
                <Input value={form.defaultDuration} onChange={(e) => setForm((f) => ({ ...f, defaultDuration: e.target.value }))} placeholder="e.g. 3 months" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] min-h-[60px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Course description..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => { setAddOpen(false); setEditCourse(null) }}>Cancel</Button>
              <Button
                size="sm"
                disabled={!form.name || !form.code || createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  if (editCourse) {
                    updateMutation.mutate({ id: editCourse.id, data: form })
                  } else {
                    createMutation.mutate(form)
                  }
                }}
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editCourse ? 'Save Changes' : 'Create Course'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

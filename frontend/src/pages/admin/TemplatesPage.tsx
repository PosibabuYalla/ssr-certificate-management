import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Edit2, Copy } from 'lucide-react'
import { templates } from '../../lib/api'
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
import type { CertificateTemplate } from '../../types'

export default function TemplatesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [category, setCategory] = useState('')
  const [editTemplate, setEditTemplate] = useState<CertificateTemplate | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    orientation: 'landscape' as 'landscape' | 'portrait',
    defaultWording: '',
    signatories: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templates.list().then((r) => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CertificateTemplate> }) =>
      templates.update(id, data),
    onSuccess: () => {
      toast.success('Template updated')
      setEditTemplate(null)
      qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: () => toast.error('Failed to update template'),
  })

  const toggleActive = (tpl: CertificateTemplate) => {
    updateMutation.mutate({ id: tpl.id, data: { isActive: !tpl.isActive } })
  }

  const openEdit = (tpl: CertificateTemplate) => {
    setEditTemplate(tpl)
    setEditForm({
      orientation: tpl.orientation,
      defaultWording: tpl.defaultWording ?? '',
      signatories: JSON.stringify(tpl.signatories ?? []),
    })
  }

  const handlePreview = async (tpl: CertificateTemplate) => {
    try {
      const res = await templates.preview(tpl.id)
      const url = URL.createObjectURL(res.data)
      setPreviewUrl(url)
      setPreviewOpen(true)
    } catch {
      toast.error('Failed to load preview')
    }
  }

  const handleDuplicate = async (tpl: CertificateTemplate) => {
    try {
      await templates.create({
        courseId: tpl.courseId,
        orientation: tpl.orientation,
        defaultWording: tpl.defaultWording,
        signatories: tpl.signatories,
        isActive: false,
      })
      toast.success('Template duplicated')
      qc.invalidateQueries({ queryKey: ['templates'] })
    } catch {
      toast.error('Failed to duplicate template')
    }
  }

  const handleSaveEdit = () => {
    if (!editTemplate) return
    let parsedSignatories
    try {
      parsedSignatories = JSON.parse(editForm.signatories)
    } catch {
      toast.error('Invalid signatories JSON')
      return
    }
    updateMutation.mutate({
      id: editTemplate.id,
      data: {
        orientation: editForm.orientation,
        defaultWording: editForm.defaultWording,
        signatories: parsedSignatories,
      },
    })
  }

  const filtered = (data ?? []).filter((t) => {
    if (!category) return true
    return t.course?.category === category
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Certificate Templates</h1>

      <div className="flex gap-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
          <option value="">All Categories</option>
          <option value="electrical">Electrical</option>
          <option value="software">Software</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No templates found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{tpl.course?.name ?? 'Template'}</CardTitle>
                  <Badge variant={tpl.isActive ? 'success' : 'secondary'}>
                    {tpl.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant={tpl.course?.category === 'electrical' ? 'warning' : 'default'}>
                    {tpl.course?.category ?? '—'}
                  </Badge>
                  <span className="text-xs text-gray-400">v{tpl.version} &bull; {tpl.orientation}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-2 pt-0">
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Button variant="outline" size="sm" onClick={() => handlePreview(tpl)}>
                    <Eye size={14} /> Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(tpl)}>
                    <Edit2 size={14} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(tpl)}>
                    <Copy size={14} />
                  </Button>
                  <Button
                    variant={tpl.isActive ? 'destructive' : 'secondary'}
                    size="sm"
                    onClick={() => toggleActive(tpl)}
                  >
                    {tpl.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 mb-3">
            Editing will increment the template version. Previously issued certificates are unaffected.
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Orientation</label>
              <Select
                value={editForm.orientation}
                onChange={(e) => setEditForm((f) => ({ ...f, orientation: e.target.value as 'landscape' | 'portrait' }))}
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Default Wording</label>
              <textarea
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] min-h-[80px]"
                value={editForm.defaultWording}
                onChange={(e) => setEditForm((f) => ({ ...f, defaultWording: e.target.value }))}
                placeholder="This is to certify that..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Signatories (JSON array)</label>
              <textarea
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] min-h-[60px]"
                value={editForm.signatories}
                onChange={(e) => setEditForm((f) => ({ ...f, signatories: e.target.value }))}
                placeholder='[{"name":"Director","title":"Director","order":1}]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditTemplate(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Template Preview</DialogTitle></DialogHeader>
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full h-[500px] rounded-lg border border-gray-200" title="Template preview" />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">Preview not available</div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  GraduationCap,
  ExternalLink,
} from 'lucide-react'
import { publicApi, certificates } from '../../lib/api'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Spinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'

export default function VerifyPage() {
  const { certificateId } = useParams<{ certificateId: string }>()
  const toast = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify', certificateId],
    queryFn: () => publicApi.verifyCertificate(certificateId!).then((r) => r.data.data),
    retry: false,
  })

  const handleDownload = async () => {
    if (!data) return
    try {
      // For public we'd need a separate endpoint — attempt with cert ID
      const res = await certificates.getPdf(certificateId!)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${certificateId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF download unavailable')
    }
  }

  const isNotFound =
    !isLoading &&
    (error || !data) &&
    (error as { response?: { status?: number } })?.response?.status === 404

  const isRevoked = data?.status === 'revoked'
  const isValid = data?.status === 'issued'

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#d97706] flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight">SSR Institute</p>
            <p className="text-white/60 text-xs">Certificate Verification</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner size="lg" />
              <p className="text-gray-500 text-sm">Verifying certificate...</p>
            </div>
          )}

          {/* Not found */}
          {!isLoading && (isNotFound || (!data && error)) && (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <AlertCircle size={32} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Found</h2>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                The certificate ID <span className="font-mono font-medium">{certificateId}</span> could not be
                verified in the SSR Institute records. Please check the ID and try again.
              </p>
              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 inline-block">
                <p className="text-xs text-gray-500">Searched ID</p>
                <p className="font-mono font-semibold text-gray-900">{certificateId}</p>
              </div>
            </div>
          )}

          {/* Revoked */}
          {!isLoading && isRevoked && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-700">Certificate Revoked</h2>
                  <p className="text-sm text-red-600">This certificate is no longer valid</p>
                </div>
              </div>
              <p className="text-sm text-red-700 mb-4">
                This certificate has been revoked by SSR Institute and is no longer valid.
              </p>
              <div className="rounded-lg bg-white border border-red-200 p-4 space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32">Certificate ID:</span>
                  <span className="font-mono font-semibold">{data?.certificateId}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32">Student:</span>
                  <span>{data?.studentName}</span>
                </div>
                {data?.revokedAt && (
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-32">Revoked on:</span>
                    <span>{new Date(data.revokedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Valid */}
          {!isLoading && isValid && (
            <div className="rounded-xl border-2 border-green-200 bg-white shadow-sm overflow-hidden">
              {/* Verified header */}
              <div className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-green-700">Certificate Verified</h2>
                    <Badge variant="success">Valid</Badge>
                  </div>
                  <p className="text-sm text-green-600">
                    This certificate is currently valid in the SSR Institute verification system.
                  </p>
                </div>
              </div>

              {/* Certificate details */}
              <div className="p-6 space-y-5">
                {/* Certificate ID */}
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">Certificate ID</p>
                  <p className="font-mono font-bold text-[#1e3a5f] text-xl">{data?.certificateId}</p>
                </div>

                {/* Student Name */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Awarded To</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.studentName}</p>
                </div>

                {/* Course details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Course</p>
                    <p className="font-medium text-gray-900">{data?.courseName}</p>
                    <Badge variant={data?.courseCategory === 'electrical' ? 'warning' : 'default'} className="mt-1">
                      {data?.courseCategory}
                    </Badge>
                  </div>
                  {data?.duration && (
                    <div>
                      <p className="text-gray-500 text-xs">Duration</p>
                      <p className="font-medium text-gray-900">{data.duration}</p>
                    </div>
                  )}
                  {data?.completionDate && (
                    <div>
                      <p className="text-gray-500 text-xs">Completion Date</p>
                      <p className="font-medium text-gray-900">{new Date(data.completionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {data?.issueDate && (
                    <div>
                      <p className="text-gray-500 text-xs">Issue Date</p>
                      <p className="font-medium text-gray-900">{new Date(data.issueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {data?.signatoryName && (
                    <div>
                      <p className="text-gray-500 text-xs">Signatory</p>
                      <p className="font-medium text-gray-900">{data.signatoryName}</p>
                      {data.signatoryTitle && <p className="text-xs text-gray-500">{data.signatoryTitle}</p>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                  <Button variant="golden" size="sm" onClick={handleDownload}>
                    <Download size={16} /> Download Certificate
                  </Button>
                  <a href="https://ssrinstitute.in" target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink size={16} /> Visit SSR Institute
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white/60 text-xs px-4 py-4 mt-auto">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} SSR Institute. All rights reserved.</span>
          <a href="https://ssrinstitute.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            ssrinstitute.in
          </a>
        </div>
      </footer>
    </div>
  )
}

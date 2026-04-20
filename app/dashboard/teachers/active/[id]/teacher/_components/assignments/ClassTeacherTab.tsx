'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  School, BookOpen, Calendar, Clock, Edit2, Plus, Trash2, AlertCircle, Save, Eye,
  UserPlus,
} from 'lucide-react'
import { classesApi } from '@/lib/api/classes'
import { subjectsByClassApi } from '@/lib/api/subjects'
import type { ClassMaster, ClassSection, ClassTeacherAssignment } from '@/lib/api/classes'
import type { SubjectByClass } from '@/lib/api/subjects'
import type { AssignmentFromAPI, EditAssignmentForm } from './types'
import {
  extractId, safeStr, toDateInput, resolveClassName, resolveSectionName,
  resolveSubjectName, getSubjectOptions, formatDate, objStr, ITEMS_PER_PAGE,
} from './types'
import {
  SectionSkeleton, Pagination, ErrorBanner,
  EditAssignmentDialog, ViewAssignmentDialog, EndAssignmentDialog,
} from './shared-components'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClassTeacherTabProps {
  teacherId: string
  assignments: AssignmentFromAPI[]   // pre-filtered: only role === 'class_teacher'
  classList: ClassMaster[]
  subjectsByClassMap: Record<string, SubjectByClass[]>
  loading: boolean
  error: string | null
  onRefresh: () => void
  onClassListLoad: (list: ClassMaster[]) => void
  onSubjectsLoad: (classId: string, subjects: SubjectByClass[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClassTeacherTab({
  teacherId,
  assignments,
  classList,
  subjectsByClassMap,
  loading,
  error,
  onRefresh,
  onClassListLoad,
  onSubjectsLoad,
}: ClassTeacherTabProps) {
  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(assignments.length / ITEMS_PER_PAGE)
  const paged = assignments.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ── Add dialog ────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [form, setForm] = useState({
    class_id: '', section_id: '', academic_year: '', assigned_from: '',
  })
  const [sections, setSections] = useState<ClassSection[]>([])

  // ── Edit dialog ───────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AssignmentFromAPI | null>(null)
  const [editForm, setEditForm] = useState<EditAssignmentForm>({
    section_id: '', academic_year: '', assigned_from: '', assigned_to: '', status: 'active',
  })
  const [editSections, setEditSections] = useState<ClassSection[]>([])
  const [isEditSaving, setIsEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // ── End dialog ────────────────────────────────────────────────────────────
  const [endOpen, setEndOpen] = useState(false)
  const [endTarget, setEndTarget] = useState<AssignmentFromAPI | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  // ── View dialog ───────────────────────────────────────────────────────────
  const [viewTarget, setViewTarget] = useState<AssignmentFromAPI | null>(null)

  // ── Fetch classes ─────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    if (classList.length > 0) return
    try {
      const instituteId = typeof window !== 'undefined'
        ? (localStorage.getItem('instituteId') ?? '') : ''
      const instituteType = localStorage.getItem('instituteType') ?? ''
      const res = await classesApi.getAll({
        ...(instituteId ? { instituteId } : {}),
        status: 'active',
        ...(instituteType === 'school' || instituteType === 'coaching'
          ? { class_type: instituteType } : {}),
      })
      if (!res.success) throw new Error(res.message ?? 'Failed to load classes')
      onClassListLoad(res.result ?? [])
      //console.log('[ClassTeacherTab] Classes loaded:', res.result?.length)
    } catch (err) {
      setDialogError('Unable to load class list. Please close and try again.')
      console.error('[ClassTeacherTab] fetchClasses error:', err)
    }
  }, [classList.length, onClassListLoad])

  // ── Open add dialog ───────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setDialogError(null)
    setForm({ class_id: '', section_id: '', academic_year: '', assigned_from: '' })
    setSections([])
    void fetchClasses()
    setAddOpen(true)
  }

  // ── Class change in add form ──────────────────────────────────────────────
  const handleClassChange = useCallback(async (classId: string) => {
    setForm((p) => ({ ...p, class_id: classId, section_id: '' }))
    setSections([])
    if (!classId) return
    try {
      const res = await classesApi.getSectionsByClass(classId)
      if (res.success && res.result) setSections(res.result)
      //console.log('[ClassTeacherTab] Sections loaded for class:', classId, res.result?.length)
    } catch (e) {
      console.warn('[ClassTeacherTab] Sections fetch failed:', e)
    }
  }, [])

  // ── Save new class teacher assignment ─────────────────────────────────────
  const handleAdd = async () => {
    if (!form.class_id) { setDialogError('Class is required.'); return }
    if (!form.academic_year.trim()) { setDialogError('Academic Year is required.'); return }
    setIsSaving(true); setDialogError(null)
    try {
      // NOTE: is_active is NOT sent — not in backend model
      const payload: Omit<ClassTeacherAssignment, 'is_active'> = {
        class_id: form.class_id,
        teacher_id: teacherId,
        role: 'class_teacher',
        section_id: form.section_id || null,
        academic_year: form.academic_year.trim(),
        assigned_from: form.assigned_from || undefined,
      }
      const res = await classesApi.createTeacherAssignment(payload as ClassTeacherAssignment)
      if (!res.success) throw new Error(res.message ?? 'Failed to create assignment')
      //console.log('[ClassTeacherTab] Class teacher assignment created:', res.result?._id)
      onRefresh()
      setForm({ class_id: '', section_id: '', academic_year: '', assigned_from: '' })
      setSections([])
    } catch (err) {
      setDialogError('Failed to create class teacher assignment. Please try again.')
      console.error('[ClassTeacherTab] handleAdd error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Open edit dialog ──────────────────────────────────────────────────────
  const handleOpenEdit = async (a: AssignmentFromAPI) => {
    setEditTarget(a)
    setEditError(null)
    const classId = extractId(a.class_id)
    setEditForm({
      section_id: extractId(a.section_id),
      academic_year: safeStr(a.academic_year ?? null),
      assigned_from: toDateInput(a.assigned_from),
      assigned_to: toDateInput(a.assigned_to),
      status: a.status ?? 'active',
    })
    setEditSections([])
    if (classId) {
      try {
        const res = await classesApi.getSectionsByClass(classId)
        if (res.success && res.result) setEditSections(res.result)
        //console.log('[ClassTeacherTab] Edit sections loaded:', res.result?.length)
      } catch (e) {
        console.warn('[ClassTeacherTab] Edit sections fetch failed:', e)
      }
    }
    setEditOpen(true)
  }

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editTarget?._id) return
    if (!editForm.academic_year.trim()) { setEditError('Academic Year is required.'); return }
    setIsEditSaving(true); setEditError(null)
    try {
      const payload: Partial<ClassTeacherAssignment> = {
        section_id: editForm.section_id || null,
        academic_year: editForm.academic_year.trim(),
        assigned_from: editForm.assigned_from || undefined,
        assigned_to: editForm.assigned_to || null,
        status: editForm.status,
      }
      const res = await classesApi.updateTeacherAssignment(editTarget._id, payload)
      if (!res.success) throw new Error(res.message ?? 'Failed to update assignment.')
      //console.log('[ClassTeacherTab] Assignment updated:', editTarget._id)
      onRefresh()
      setEditOpen(false)
    } catch (err) {
      setEditError('Failed to update assignment. Please try again.')
      console.error('[ClassTeacherTab] handleEditSave error:', err)
    } finally {
      setIsEditSaving(false)
    }
  }

  // ── End assignment ────────────────────────────────────────────────────────
  const handleEnd = (a: AssignmentFromAPI) => {
    setEndTarget(a); setEndError(null); setEndOpen(true)
  }

  const confirmEnd = async () => {
    if (!endTarget?._id) return
    setIsEnding(true)
    try {
      // PATCH /:id/end with empty body — backend sets assigned_to = new Date() and status = inactive
      const res = await classesApi.endTeacherAssignment(endTarget._id)
      if (!res.success) throw new Error(res.message ?? 'Failed to end assignment')
      //console.log('[ClassTeacherTab] Assignment ended:', endTarget._id)
      onRefresh()
      setEndOpen(false)
      setEndTarget(null)
    } catch (err) {
      setEndError('Failed to end assignment. Please try again.')
      console.error('[ClassTeacherTab] confirmEnd error:', err)
    } finally {
      setIsEnding(false)
    }
  }

  // ── Assignment card ───────────────────────────────────────────────────────
  const renderCard = (a: AssignmentFromAPI) => {
    const classIdStr = extractId(a.class_id)
    const className = resolveClassName(a.class_id, classList)
    const sectionName = resolveSectionName(a.section_id)
    // Show subject if present on this class_teacher assignment (backend allows it)
    const subjectName = a.subject_id
      ? resolveSubjectName(a.subject_id, subjectsByClassMap, classIdStr)
      : null

    return (
      <Card
        key={a._id}
        className="border-2 bg-emerald-50/30 hover:border-emerald-500/50 transition-all"
      >
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 font-semibold text-xs">
                ✓ Class Teacher
              </Badge>
              <Badge className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white border-0 font-semibold text-xs">
                {className}{sectionName ? ` — ${sectionName}` : ''}
              </Badge>
              {/* Show subject if backend returned one with this assignment */}
              {subjectName && subjectName !== '—' && (
                <Badge className="bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white border-0 text-xs">
                  {subjectName}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs font-mono">
                {safeStr(a.academic_year ?? null) || '—'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant="outline"
                className={
                  a.status === 'active'
                    ? 'bg-green-50 text-green-700 border-green-300 text-xs'
                    : a.status === 'archived'
                      ? 'bg-orange-50 text-orange-700 border-orange-300 text-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-300 text-xs'
                }
              >
                {a.status === 'active' ? 'Active' : a.status ?? 'Inactive'}
              </Badge>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                title="View details"
                onClick={() => setViewTarget(a)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Edit assignment"
                onClick={() => void handleOpenEdit(a)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                title={a.status !== 'active' ? 'Assignment already ended' : 'End assignment'}
                onClick={() => handleEnd(a)}
                disabled={a.status !== 'active'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            {a.assigned_from && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>From {formatDate(a.assigned_from)}</span>
              </div>
            )}
            {a.assigned_to && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Till {formatDate(a.assigned_to)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} onRetry={onRefresh} />}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Classes where this teacher is assigned as the primary class teacher.
          </p>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs sm:text-sm">Add Class Teacher Role</span>
          </Button>
        </div>

        {loading ? (
          <SectionSkeleton />
        ) : assignments.length > 0 ? (
          <>
            <div className="space-y-3">
              {paged.map((a) => renderCard(a))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={assignments.length}
              onPageChange={setPage}
            />
          </>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            No class teacher assignments found. Click "Add Class Teacher Role" to create one.
          </div>
        )}
      </div>

      {/* ── Add Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Add Class Teacher Role</DialogTitle>
            <DialogDescription className="text-sm">
              Assign this teacher as a class teacher for a class/section.
            </DialogDescription>
          </DialogHeader>

          {dialogError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /><span>{dialogError}</span>
            </div>
          )}

          {/* Current assignments summary */}
          {assignments.length > 0 && (
            <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-emerald-900">Current Assignments</p>
                <Badge className="bg-emerald-600 text-white text-xs">{assignments.length}</Badge>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {assignments.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-emerald-200"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-emerald-600 text-white text-xs">
                        {resolveClassName(a.class_id, classList)}
                        {resolveSectionName(a.section_id) ? ` — ${resolveSectionName(a.section_id)}` : ''}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {safeStr(a.academic_year ?? null) || '—'}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => { setAddOpen(false); void handleOpenEdit(a) }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      {a.status === 'active' && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => { setAddOpen(false); handleEnd(a) }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New assignment form */}
          <div className="rounded-lg border-2 p-3 sm:p-4 space-y-3 bg-muted/30">
            <h4 className="font-semibold text-sm">New Assignment</h4>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">
                  Class <span className="text-red-500">*</span>
                </Label>
                <Select value={form.class_id} onValueChange={handleClassChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classList.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.class_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Section</Label>
                <Select
                  value={form.section_id || '__none__'}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, section_id: v === '__none__' ? '' : v }))
                  }
                  disabled={sections.length === 0}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={sections.length === 0 ? 'Select class first' : 'Section (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s._id ?? s.section_name} value={s._id ?? s.section_name}>
                        {s.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">
                  Academic Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. 2024-25"
                  value={form.academic_year}
                  onChange={(e) => setForm((p) => ({ ...p, academic_year: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Assigned From</Label>
                <Input
                  type="date"
                  value={form.assigned_from}
                  onChange={(e) => setForm((p) => ({ ...p, assigned_from: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
      <Button
  size="sm"
  className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 gap-2"
  onClick={handleAdd}
  disabled={isSaving}
>
  <UserPlus className="h-4 w-4" />
  {isSaving ? 'Saving...' : 'Save & Assign Teacher'}
</Button>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)} className="h-9">
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] h-9 gap-2"
              onClick={() => { setAddOpen(false); onRefresh() }}
            >
              <Save className="h-4 w-4" />Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <EditAssignmentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editTarget={editTarget}
        editForm={editForm}
        editSections={editSections}
        isEditSaving={isEditSaving}
        editError={editError}
        classList={classList}
        onFormChange={setEditForm}
        onSave={handleEditSave}
      />

      {/* ── View Dialog ── */}
      <ViewAssignmentDialog
        viewTarget={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(a) => void handleOpenEdit(a)}
        classList={classList}
        subjectsByClassMap={subjectsByClassMap}
      />

      {/* ── End Dialog ── */}
      <EndAssignmentDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        assignment={endTarget}
        isDeleting={isEnding}
        error={endError}
        onConfirm={confirmEnd}
      />
    </>
  )
}
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  School, BookOpen, BookMarked, Plus, Trash2,
  CheckCircle, Users, Loader2, AlertCircle, Save,
} from 'lucide-react'
import {
  classesApi,
  type ClassMaster, type ClassSection, type ClassTeacherAssignment,
} from '@/lib/api/classes'
import { subjectsMasterApi, type SubjectMaster } from '@/lib/api/subjects'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubjectAllocation {
  subject_id: string
  subject_name: string
  classes: { classId: string; className: string; sectionId: string; sectionName: string }[]
}

interface ClassWithSections extends ClassMaster {
  sections: ClassSection[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClassAllocationTabProps {
  teacherId: string
  onNotify?: (n: { type: 'success' | 'error'; message: string }) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClassAllocationTab({ teacherId, onNotify }: ClassAllocationTabProps) {
  const instituteId =
    typeof window !== 'undefined' ? localStorage.getItem('instituteId') || '' : ''

  // ── Data state ──────────────────────────────────────────────────────────────
  const [classesWithSections, setClassesWithSections] = useState<ClassWithSections[]>([])
  const [subjects, setSubjects] = useState<SubjectMaster[]>([])
  const [academicYear, setAcademicYear] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // ── Class Teacher state ─────────────────────────────────────────────────────
  const [isClassTeacher, setIsClassTeacher] = useState(false)
  const [classTeacherClassId, setClassTeacherClassId] = useState('')
  const [classTeacherSectionId, setClassTeacherSectionId] = useState('')
  const [classTeacherSubjectIds, setClassTeacherSubjectIds] = useState<string[]>([])

  // ── Subject Allocations state ───────────────────────────────────────────────
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([])

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!instituteId || !teacherId) {
      setLoadError('Institute or Teacher ID is missing. Please refresh the page.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError('')
    try {
      // 1. Fetch only active classes for the institute
      const classRes = await classesApi.getAll({ instituteId, status: 'active' })
      const classList: ClassMaster[] = classRes.success && Array.isArray(classRes.result)
        ? classRes.result
        : []

      // 2. Fetch sections for each class in parallel
      const sectionsResults = await Promise.allSettled(
        classList.map(cls => classesApi.getSectionsByClass(cls._id))
      )

      const classesWithSecs: ClassWithSections[] = classList.map((cls, i) => {
        const secRes = sectionsResults[i]
        const sections: ClassSection[] =
          secRes.status === 'fulfilled' && secRes.value.success && Array.isArray(secRes.value.result)
            ? secRes.value.result
            : []
        return { ...cls, sections }
      })
      setClassesWithSections(classesWithSecs)

      // Derive academic year from first class (required field for all assignment API calls)
      const derivedAcademicYear = classList[0]?.academic_year || ''
      setAcademicYear(derivedAcademicYear)

      // 3. Fetch subjects for institute
      const subjectRes = await subjectsMasterApi.getByInstitute(instituteId)
      const subjectList: SubjectMaster[] = subjectRes.success && Array.isArray(subjectRes.result)
        ? subjectRes.result.filter(s => s.status === 'active')
        : []
      setSubjects(subjectList)

      // 4. Fetch existing teacher assignments scoped to the current academic year
      //    so stale data from previous years does not pre-fill the form
      const assignRes = await classesApi.getTeacherAssignmentsByTeacher(
        teacherId,
        derivedAcademicYear ? { academic_year: derivedAcademicYear } : undefined
      )

      if (assignRes.success && Array.isArray(assignRes.result)) {
        const assignments: ClassTeacherAssignment[] = assignRes.result

        // ── Pre-populate class teacher assignment ───────────────────────────
        // Saving creates one assignment per selected subject under role=class_teacher,
        // so there may be N records — collect all of them to restore every subject ID.
        const ctAssignments = assignments.filter(a => a.role === 'class_teacher')
        if (ctAssignments.length > 0) {
          const first = ctAssignments[0]
          const ctClassId =
            typeof first.class_id === 'object' ? (first.class_id as any)._id : first.class_id
          const ctSectionId =
            typeof first.section_id === 'object'
              ? (first.section_id as any)?._id
              : first.section_id

          // Collect every non-null subject_id across all class_teacher rows
          const ctSubjectIds: string[] = ctAssignments
            .map(a => {
              if (!a.subject_id) return null
              return typeof a.subject_id === 'object'
                ? (a.subject_id as any)._id
                : a.subject_id
            })
            .filter((id): id is string => Boolean(id))

          setIsClassTeacher(true)
          setClassTeacherClassId(ctClassId)
          setClassTeacherSectionId(ctSectionId || '')
          setClassTeacherSubjectIds(ctSubjectIds)
        }

        // ── Pre-populate subject teacher assignments — grouped by subject_id ─
        const subjectTeachers = assignments.filter(a => a.role === 'subject_teacher')
        const grouped: Record<string, SubjectAllocation> = {}

        subjectTeachers.forEach(a => {
          if (!a.subject_id) return
          const subjectId =
            typeof a.subject_id === 'object' ? (a.subject_id as any)._id : a.subject_id
          const classId =
            typeof a.class_id === 'object' ? (a.class_id as any)._id : a.class_id
          const sectionId =
            typeof a.section_id === 'object' ? (a.section_id as any)?._id : a.section_id
          const subj = subjectList.find(s => s._id === subjectId)
          const cls = classesWithSecs.find(c => c._id === classId)
          const sec = cls?.sections.find(s => s._id === sectionId)

          if (!subj || !cls) {
            console.warn(
              '[ClassAllocation] Skipping assignment — subject or class not found in active list:',
              { subjectId, classId }
            )
            return
          }

          if (!grouped[subjectId]) {
            grouped[subjectId] = {
              subject_id: subjectId,
              subject_name: subj.subject_name,
              classes: [],
            }
          }
          grouped[subjectId].classes.push({
            classId,
            className: cls.class_name,
            sectionId: sectionId || '',
            sectionName: sec?.section_name || '',
          })
        })
        setSubjectAllocations(Object.values(grouped))
      }
    } catch (err: any) {
      console.error('[ClassAllocation] Failed to load data:', err)
      setLoadError(err?.message || 'Failed to load class data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [teacherId, instituteId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const selectedClassTeacherClass = classesWithSections.find(c => c._id === classTeacherClassId)
  const selectedClassTeacherSection = selectedClassTeacherClass?.sections.find(
    s => s._id === classTeacherSectionId
  )

  const toggleClassTeacherSubject = (subjectId: string) => {
    setClassTeacherSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    )
  }

  const addSubjectAllocation = () => {
    setSubjectAllocations(prev => [
      ...prev,
      { subject_id: '', subject_name: '', classes: [] },
    ])
  }

  const removeSubjectAllocation = (index: number) => {
    setSubjectAllocations(prev => prev.filter((_, i) => i !== index))
  }

  const updateSubjectAllocationSubject = (index: number, subjectId: string) => {
    const subj = subjects.find(s => s._id === subjectId)
    if (!subj) return
    setSubjectAllocations(prev =>
      prev.map((a, i) =>
        i === index
          ? { ...a, subject_id: subjectId, subject_name: subj.subject_name, classes: [] }
          : a
      )
    )
  }

  const toggleSectionForSubject = (
    allocationIndex: number,
    cls: ClassWithSections,
    section: ClassSection
  ) => {
    setSubjectAllocations(prev =>
      prev.map((a, i) => {
        if (i !== allocationIndex) return a
        const exists = a.classes.some(
          c => c.classId === cls._id && c.sectionId === section._id
        )
        return {
          ...a,
          classes: exists
            ? a.classes.filter(c => !(c.classId === cls._id && c.sectionId === section._id))
            : [
                ...a.classes,
                {
                  classId: cls._id,
                  className: cls.class_name,
                  sectionId: section._id || '',
                  sectionName: section.section_name,
                },
              ],
        }
      })
    )
  }

  const isSectionSelected = (
    allocationIndex: number,
    classId: string,
    sectionId: string
  ) =>
    subjectAllocations[allocationIndex]?.classes.some(
      c => c.classId === classId && c.sectionId === sectionId
    ) || false

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!academicYear) {
      onNotify?.({ type: 'error', message: 'Academic year not found. Please refresh and try again.' })
      return
    }
    setIsSaving(true)
    try {
      // Step 1: Delete all existing assignments for this teacher in the current academic year
      const existingRes = await classesApi.getTeacherAssignmentsByTeacher(teacherId, {
        academic_year: academicYear,
      })
      if (existingRes.success && Array.isArray(existingRes.result) && existingRes.result.length > 0) {
        await Promise.allSettled(
          existingRes.result.map((a: ClassTeacherAssignment) => {
            const assignId = typeof a._id === 'object' ? (a._id as any)._id : a._id
            return assignId ? classesApi.deleteTeacherAssignment(assignId) : Promise.resolve()
          })
        )
      }

      const promises: Promise<any>[] = []

      // Step 2: Class teacher assignment — one record per selected subject
      if (isClassTeacher && classTeacherClassId && classTeacherSectionId) {
        if (classTeacherSubjectIds.length === 0) {
          promises.push(
            classesApi.createTeacherAssignment({
              class_id: classTeacherClassId,
              teacher_id: teacherId,
              role: 'class_teacher',
              section_id: classTeacherSectionId,
              academic_year: academicYear,
            })
          )
        } else {
          classTeacherSubjectIds.forEach(subjectId => {
            promises.push(
              classesApi.createTeacherAssignment({
                class_id: classTeacherClassId,
                teacher_id: teacherId,
                role: 'class_teacher',
                subject_id: subjectId,
                section_id: classTeacherSectionId,
                academic_year: academicYear,
              })
            )
          })
        }
      }

      // Step 3: Subject teacher assignments
      subjectAllocations.forEach(allocation => {
        if (!allocation.subject_id) return
        allocation.classes.forEach(cls => {
          promises.push(
            classesApi.createTeacherAssignment({
              class_id: cls.classId,
              teacher_id: teacherId,
              role: 'subject_teacher',
              subject_id: allocation.subject_id,
              section_id: cls.sectionId || undefined,
              academic_year: academicYear,
            })
          )
        })
      })

      if (promises.length === 0) {
        onNotify?.({ type: 'error', message: 'No allocations to save. Please add at least one.' })
        setIsSaving(false)
        return
      }

      const results = await Promise.allSettled(promises)
      const failed = results.filter(
        r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)
      )

      if (failed.length > 0) {
        console.error('[ClassAllocation] Save failures:', failed.map((f, i) => ({
          index: i,
          reason:
            f.status === 'rejected'
              ? (f as PromiseRejectedResult).reason
              : (f as PromiseFulfilledResult<any>).value?.message,
        })))
      }

      if (failed.length === 0) {
        onNotify?.({ type: 'success', message: 'Class allocations saved successfully!' })
      } else if (failed.length < results.length) {
        console.warn(
          `[ClassAllocation] Partial save: ${results.length - failed.length}/${results.length} succeeded`
        )
        onNotify?.({
          type: 'success',
          message: 'Most allocations saved. A few could not be saved — please check and try again.',
        })
      } else {
        onNotify?.({ type: 'error', message: 'Could not save allocations. Please refresh and try again.' })
      }
    } catch (err: any) {
      console.error('[ClassAllocation] Unexpected error during save:', err)
      onNotify?.({ type: 'error', message: 'Something went wrong. Please refresh the page and try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#1897C6]" />
        <p className="text-sm text-muted-foreground">Loading class data...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-600 font-medium">{loadError}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  const hasSummary =
    (isClassTeacher && classTeacherClassId && classTeacherSectionId) ||
    subjectAllocations.some(a => a.subject_id && a.classes.length > 0)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">

      {/* ── Card 1: Class Teacher Assignment ── */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1897C6] to-[#67BAC3] text-white shadow-sm">
                <School className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Class Teacher Assignment</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Assign as class teacher with teaching subjects
                </p>
              </div>
            </div>
            <Checkbox
              checked={isClassTeacher}
              onCheckedChange={checked => {
                setIsClassTeacher(checked as boolean)
                if (!checked) {
                  setClassTeacherClassId('')
                  setClassTeacherSectionId('')
                  setClassTeacherSubjectIds([])
                }
              }}
              className="h-6 w-6 border-2 border-blue-500 bg-blur-500/20 data-[state=checked]:bg-[#0f6a8f] data-[state=checked]:border-[#0f6a8f]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {isClassTeacher ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Class select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Class <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={classTeacherClassId}
                    onValueChange={val => {
                      setClassTeacherClassId(val)
                      setClassTeacherSectionId('')
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesWithSections.map(cls => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Section select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Section <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={classTeacherSectionId}
                    onValueChange={setClassTeacherSectionId}
                    disabled={!classTeacherClassId}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClassTeacherClass?.sections.map(sec => (
                        <SelectItem key={sec._id} value={sec._id || ''}>
                          Section {sec.section_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subjects for class teacher */}
              {classTeacherClassId && classTeacherSectionId && (
                <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 border-2 border-[#1897C6]/20">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-5 w-5 text-[#1897C6]" />
                    <Label className="text-sm font-semibold">
                      Subjects Teaching (As Class Teacher)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select subjects this class teacher will teach in{' '}
                    {selectedClassTeacherClass?.class_name} —{' '}
                    Section {selectedClassTeacherSection?.section_name}
                  </p>

                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No subjects found for this institute.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {subjects.map(subject => (
                        <div
                          key={subject._id}
                          className="flex items-center space-x-2 p-2 rounded-md bg-white border"
                        >
                          <Checkbox
                            id={`ct-subject-${subject._id}`}
                            checked={classTeacherSubjectIds.includes(subject._id)}
                            onCheckedChange={() => toggleClassTeacherSubject(subject._id)}
                          />
                          <label
                            htmlFor={`ct-subject-${subject._id}`}
                            className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {subject.subject_name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {classTeacherSubjectIds.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border-2 border-[#1897C6]/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Selected Subjects:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {classTeacherSubjectIds.map(id => {
                          const s = subjects.find(sub => sub._id === id)
                          return (
                            <Badge
                              key={id}
                              className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white"
                            >
                              {s?.subject_name || id}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Enable to assign as class teacher</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Card 2: Subject Teaching Allocation ── */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Subject Teaching Allocation</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Assign subjects across different classes
                </p>
              </div>
            </div>
            <Button
              onClick={addSubjectAllocation}
              className="gap-2 bg-gradient-to-r from-[#F1AF37] to-[#D88931] hover:from-[#F1AF37]/90 hover:to-[#D88931]/90 h-9 w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Subject</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {subjectAllocations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No subject allocations yet</p>
              <Button onClick={addSubjectAllocation} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Subject
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subjectAllocations.map((allocation, index) => (
                <Card key={index} className="border-2 overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-medium">Subject {index + 1}</Label>
                        <Select
                          value={allocation.subject_id}
                          onValueChange={val => updateSubjectAllocationSubject(index, val)}
                        >
                          <SelectTrigger className="h-10 bg-white">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject._id} value={subject._id}>
                                {subject.subject_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubjectAllocation(index)}
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {allocation.subject_id && (
                    <CardContent className="p-4 space-y-4">
                      <Label className="text-sm font-medium">Assign Classes &amp; Sections</Label>
                      <div className="space-y-4">
                        {classesWithSections.map(cls => (
                          <div key={cls._id} className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              {cls.class_name}
                            </p>
                            {cls.sections.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic pl-1">
                                No sections found
                              </p>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {cls.sections.map(section => {
                                  const selected = isSectionSelected(
                                    index,
                                    cls._id,
                                    section._id || ''
                                  )
                                  return (
                                    <button
                                      key={section._id}
                                      type="button"
                                      onClick={() => toggleSectionForSubject(index, cls, section)}
                                      className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                        selected
                                          ? 'bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white border-transparent shadow-md'
                                          : 'bg-white border-border hover:border-[#F1AF37] hover:bg-[#F1AF37]/5'
                                      }`}
                                    >
                                      {section.section_name}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {allocation.classes.length > 0 && (
                        <div className="mt-2 p-3 bg-gradient-to-r from-[#F1AF37]/10 to-[#D88931]/10 rounded-lg border-2 border-[#F1AF37]/30">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Selected:{' '}
                            {allocation.classes.length}{' '}
                            {allocation.classes.length === 1 ? 'section' : 'sections'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {allocation.classes.map((cls, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-white text-[#D87331] border-[#F1AF37]/40"
                              >
                                {cls.className} — {cls.sectionName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Card 3: Allocation Summary ── */}
      {hasSummary && (
        <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base sm:text-lg text-emerald-900">
                Allocation Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isClassTeacher && classTeacherClassId && classTeacherSectionId && (
              <div className="p-3 bg-white rounded-lg border-2 border-emerald-200">
                <p className="text-sm font-semibold text-emerald-900 mb-2">Class Teacher:</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white">
                    {selectedClassTeacherClass?.class_name} —{' '}
                    Section {selectedClassTeacherSection?.section_name}
                  </Badge>
                  {classTeacherSubjectIds.length > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">teaching</span>
                      {classTeacherSubjectIds.map(id => {
                        const s = subjects.find(sub => sub._id === id)
                        return (
                          <Badge
                            key={id}
                            variant="outline"
                            className="bg-[#1897C6]/10 text-[#1897C6] border-[#1897C6]/30"
                          >
                            {s?.subject_name || id}
                          </Badge>
                        )
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            {subjectAllocations
              .filter(a => a.subject_id && a.classes.length > 0)
              .map((allocation, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border-2 border-emerald-200">
                  <p className="text-sm font-semibold text-emerald-900 mb-2">
                    {allocation.subject_name}:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allocation.classes.map((cls, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs bg-[#F1AF37]/10 text-[#D87331] border-[#F1AF37]/30"
                      >
                        {cls.className} — {cls.sectionName}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2 pb-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasSummary}
          className="gap-2 bg-gradient-to-r from-[#1897C6] to-[#67BAC3] hover:from-[#1897C6]/90 hover:to-[#67BAC3]/90 shadow-md h-11 px-8 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Allocations
            </>
          )}
        </Button>
      </div>
    </div>
  )
}



















//22-03-2026
// 'use client'

// import React, { useState, useEffect, useCallback } from 'react'
// import { useParams } from 'next/navigation'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { Label } from '@/components/ui/label'
// import { Checkbox } from '@/components/ui/checkbox'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import {
//   School, BookOpen, BookMarked, Plus, Trash2,
//   CheckCircle, Users, Loader2, AlertCircle, Save,
// } from 'lucide-react'
// import {
//   classesApi,
//   type ClassMaster, type ClassSection, type ClassTeacherAssignment,
// } from '@/lib/api/classes'
// import { subjectsMasterApi, type SubjectMaster } from '@/lib/api/subjects'

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface SubjectAllocation {
//   subject_id: string
//   subject_name: string
//   classes: { classId: string; className: string; sectionId: string; sectionName: string }[]
// }

// interface ClassWithSections extends ClassMaster {
//   sections: ClassSection[]
// }

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface ClassAllocationTabProps {
//   teacherId: string
//   onNotify?: (n: { type: 'success' | 'error'; message: string }) => void
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// export default function ClassAllocationTab({ teacherId, onNotify }: ClassAllocationTabProps) {
//   const instituteId =
//     typeof window !== 'undefined' ? localStorage.getItem('instituteId') || '' : ''

//   // ── Data state ──────────────────────────────────────────────────────────────
//   const [classesWithSections, setClassesWithSections] = useState<ClassWithSections[]>([])
//   const [subjects, setSubjects] = useState<SubjectMaster[]>([])
//   const [academicYear, setAcademicYear] = useState('')   // derived from first class's academic_year
//   const [isLoading, setIsLoading] = useState(true)
//   const [loadError, setLoadError] = useState('')
//   const [isSaving, setIsSaving] = useState(false)

//   // ── Class Teacher state ─────────────────────────────────────────────────────
//   const [isClassTeacher, setIsClassTeacher] = useState(false)
//   const [classTeacherClassId, setClassTeacherClassId] = useState('')
//   const [classTeacherSectionId, setClassTeacherSectionId] = useState('')
//   const [classTeacherSubjectIds, setClassTeacherSubjectIds] = useState<string[]>([])

//   // ── Subject Allocations state ───────────────────────────────────────────────
//   const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([])

//   // ── Fetch all data ──────────────────────────────────────────────────────────
//   const fetchData = useCallback(async () => {
//     if (!instituteId || !teacherId) {
//       setLoadError('Institute or Teacher ID missing')
//       setIsLoading(false)
//       return
//     }
//     setIsLoading(true)
//     setLoadError('')
//     try {
//       // 1. Fetch all classes for institute
//       const classRes = await classesApi.getAll({ instituteId })
//       const classList: ClassMaster[] = classRes.success && Array.isArray(classRes.result)
//         ? classRes.result
//         : []

//       // 2. Fetch sections for each class in parallel
//       const sectionsResults = await Promise.allSettled(
//         classList.map(cls => classesApi.getSectionsByClass(cls._id))
//       )

//       const classesWithSecs: ClassWithSections[] = classList.map((cls, i) => {
//         const secRes = sectionsResults[i]
//         const sections: ClassSection[] =
//           secRes.status === 'fulfilled' && secRes.value.success && Array.isArray(secRes.value.result)
//             ? secRes.value.result
//             : []
//         return { ...cls, sections }
//       })
//       setClassesWithSections(classesWithSecs)
//       // Derive academic_year from first class (backend required field)
//       const derivedAcademicYear = classList[0]?.academic_year || ""
//       setAcademicYear(derivedAcademicYear)


//       // 3. Fetch subjects for institute
//       const subjectRes = await subjectsMasterApi.getByInstitute(instituteId)
//       const subjectList: SubjectMaster[] = subjectRes.success && Array.isArray(subjectRes.result)
//         ? subjectRes.result.filter(s => s.status === 'active')
//         : []
//       setSubjects(subjectList)

//       // 4. Fetch existing teacher assignments and pre-populate
//       const assignRes = await classesApi.getTeacherAssignmentsByTeacher(teacherId)
//       if (assignRes.success && Array.isArray(assignRes.result)) {
//         const assignments: ClassTeacherAssignment[] = assignRes.result

//         // Pre-populate class teacher assignment
// const ctAssignment = assignments.find(a => a.role === 'class_teacher')
//         if (ctAssignment) {
//           setIsClassTeacher(true)
//           const ctClassId = typeof ctAssignment.class_id === 'object' ? (ctAssignment.class_id as any)._id : ctAssignment.class_id
//           const ctSectionId = typeof ctAssignment.section_id === 'object' ? (ctAssignment.section_id as any)?._id : ctAssignment.section_id
//           const ctSubjectId = typeof ctAssignment.subject_id === 'object' ? (ctAssignment.subject_id as any)?._id : ctAssignment.subject_id
//           setClassTeacherClassId(ctClassId)
//           setClassTeacherSectionId(ctSectionId || '')
//           setClassTeacherSubjectIds(ctSubjectId ? [ctSubjectId] : [])
//         }

//         // Pre-populate subject teacher assignments — group by subject_id
//         const subjectTeachers = assignments.filter(a => a.role === 'subject_teacher')
//         const grouped: Record<string, SubjectAllocation> = {}
//  subjectTeachers.forEach(a => {
//           if (!a.subject_id) return
//           const subjectId = typeof a.subject_id === 'object' ? (a.subject_id as any)._id : a.subject_id
//           const classId = typeof a.class_id === 'object' ? (a.class_id as any)._id : a.class_id
//           const sectionId = typeof a.section_id === 'object' ? (a.section_id as any)?._id : a.section_id
//           const subj = subjectList.find(s => s._id === subjectId)
//           const cls = classesWithSecs.find(c => c._id === classId)
//           const sec = cls?.sections.find(s => s._id === sectionId)
//           if (!subj || !cls) return
//           if (!grouped[subjectId]) {
//             grouped[subjectId] = {
//               subject_id: subjectId,
//               subject_name: subj.subject_name,
//               classes: [],
//             }
//           }
//           grouped[subjectId].classes.push({
//             classId: classId,
//             className: cls.class_name,
//             sectionId: sectionId || '',
//             sectionName: sec?.section_name || '',
//           })
//         })
//         setSubjectAllocations(Object.values(grouped))
//       }
//     } catch (err: any) {
//       setLoadError(err?.message || 'Failed to load data')
//     } finally {
//       setIsLoading(false)
//     }
//   }, [teacherId, instituteId])

//   useEffect(() => { fetchData() }, [fetchData])

//   // ── Helpers ─────────────────────────────────────────────────────────────────

//   const selectedClassTeacherClass = classesWithSections.find(c => c._id === classTeacherClassId)
//   const selectedClassTeacherSection = selectedClassTeacherClass?.sections.find(
//     s => s._id === classTeacherSectionId
//   )

//   const toggleClassTeacherSubject = (subjectId: string) => {
//     setClassTeacherSubjectIds(prev =>
//       prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
//     )
//   }

//   const addSubjectAllocation = () => {
//     setSubjectAllocations(prev => [
//       ...prev,
//       { subject_id: '', subject_name: '', classes: [] },
//     ])
//   }

//   const removeSubjectAllocation = (index: number) => {
//     setSubjectAllocations(prev => prev.filter((_, i) => i !== index))
//   }

//   const updateSubjectAllocationSubject = (index: number, subjectId: string) => {
//     const subj = subjects.find(s => s._id === subjectId)
//     if (!subj) return
//     setSubjectAllocations(prev =>
//       prev.map((a, i) =>
//         i === index
//           ? { ...a, subject_id: subjectId, subject_name: subj.subject_name, classes: [] }
//           : a
//       )
//     )
//   }

//   const toggleSectionForSubject = (
//     allocationIndex: number,
//     cls: ClassWithSections,
//     section: ClassSection
//   ) => {
//     setSubjectAllocations(prev =>
//       prev.map((a, i) => {
//         if (i !== allocationIndex) return a
//         const exists = a.classes.some(
//           c => c.classId === cls._id && c.sectionId === section._id
//         )
//         return {
//           ...a,
//           classes: exists
//             ? a.classes.filter(c => !(c.classId === cls._id && c.sectionId === section._id))
//             : [
//                 ...a.classes,
//                 {
//                   classId: cls._id,
//                   className: cls.class_name,
//                   sectionId: section._id || '',
//                   sectionName: section.section_name,
//                 },
//               ],
//         }
//       })
//     )
//   }

//   const isSectionSelected = (
//     allocationIndex: number,
//     classId: string,
//     sectionId: string
//   ) =>
//     subjectAllocations[allocationIndex]?.classes.some(
//       c => c.classId === classId && c.sectionId === sectionId
//     ) || false

//   // ── Save ─────────────────────────────────────────────────────────────────────
// const handleSave = async () => {
//     if (!academicYear) {
//       onNotify?.({ type: 'error', message: 'Academic year not found. Please refresh and try again.' })
//       return
//     }
//     setIsSaving(true)
//     try {
//       // Step 1: Delete all existing assignments for this teacher first
//       const existingRes = await classesApi.getTeacherAssignmentsByTeacher(teacherId)
//       if (existingRes.success && Array.isArray(existingRes.result) && existingRes.result.length > 0) {
//         await Promise.allSettled(
//           existingRes.result.map((a: ClassTeacherAssignment) => {
//             const assignId = typeof a._id === 'object' ? (a._id as any)._id : a._id
//             return assignId ? classesApi.deleteTeacherAssignment(assignId) : Promise.resolve()
//           })
//         )
//       }

//       const promises: Promise<any>[] = []

//       // 1. Class Teacher assignment
//       if (isClassTeacher && classTeacherClassId && classTeacherSectionId) {
//         // Create one assignment per subject (or one without subject if none selected)
//         if (classTeacherSubjectIds.length === 0) {
//           promises.push(
//             classesApi.createTeacherAssignment({
//               class_id: classTeacherClassId,
//               teacher_id: teacherId,
//               role: 'class_teacher',
//               section_id: classTeacherSectionId,
//               academic_year: academicYear,
//             })
//           )
//         } else {
//           classTeacherSubjectIds.forEach(subjectId => {
//             promises.push(
//               classesApi.createTeacherAssignment({
//                 class_id: classTeacherClassId,
//                 teacher_id: teacherId,
//                 role: 'class_teacher',
//                 subject_id: subjectId,
//                 section_id: classTeacherSectionId,
//                 academic_year: academicYear,
//               })
//             )
//           })
//         }
//       }

//       // 2. Subject Teacher assignments
//       subjectAllocations.forEach(allocation => {
//         if (!allocation.subject_id) return
//         allocation.classes.forEach(cls => {
//           promises.push(
//             classesApi.createTeacherAssignment({
//               class_id: cls.classId,
//               teacher_id: teacherId,
//               role: 'subject_teacher',
//               subject_id: allocation.subject_id,
//               section_id: cls.sectionId || undefined,
//               academic_year: academicYear,
//             })
//           )
//         })
//       })

//       if (promises.length === 0) {
//         onNotify?.({ type: 'error', message: 'No allocations to save. Please add at least one.' })
//         setIsSaving(false)
//         return
//       }

// const results = await Promise.allSettled(promises)
//       const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))

//       // Developer logs
//       if (failed.length > 0) {
//         console.error('[ClassAllocation] Save failures:', failed.map((f, i) => ({
//           index: i,
//           reason: f.status === 'rejected' ? f.reason : (f as any).value?.message,
//         })))
//       }

//       if (failed.length === 0) {
//         onNotify?.({ type: 'success', message: 'Class allocations saved successfully!' })
//       } else if (failed.length < results.length) {
//         console.warn(`[ClassAllocation] Partial save: ${results.length - failed.length}/${results.length} succeeded`)
//         onNotify?.({ type: 'success', message: 'Most allocations saved. A few could not be saved — please check and try again.' })
//       } else {
//         onNotify?.({ type: 'error', message: 'Could not save allocations. Please refresh and try again.' })
//       }
//     } catch (err: any) {
//       console.error('[ClassAllocation] Unexpected error during save:', err)
//       onNotify?.({ type: 'error', message: 'Something went wrong. Please refresh the page and try again.' })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // ── Loading ──────────────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 gap-3">
//         <Loader2 className="h-8 w-8 animate-spin text-[#1897C6]" />
//         <p className="text-sm text-muted-foreground">Loading class data...</p>
//       </div>
//     )
//   }

//   if (loadError) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 gap-3">
//         <AlertCircle className="h-8 w-8 text-red-500" />
//         <p className="text-sm text-red-600 font-medium">{loadError}</p>
//         <Button variant="outline" size="sm" onClick={fetchData}>Retry</Button>
//       </div>
//     )
//   }

//   const hasSummary =
//     (isClassTeacher && classTeacherClassId && classTeacherSectionId) ||
//     subjectAllocations.some(a => a.subject_id && a.classes.length > 0)

//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//     <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">

//       {/* ── Card 1: Class Teacher Assignment ── */}
//       <Card className="border-2 shadow-sm">
//         <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 pb-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1897C6] to-[#67BAC3] text-white shadow-sm">
//                 <School className="h-5 w-5" />
//               </div>
//               <div>
//                 <CardTitle className="text-base sm:text-lg">Class Teacher Assignment</CardTitle>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   Assign as class teacher with teaching subjects
//                 </p>
//               </div>
//             </div>
//             <Checkbox
//               checked={isClassTeacher}
//               onCheckedChange={checked => {
//                 setIsClassTeacher(checked as boolean)
//                 if (!checked) {
//                   setClassTeacherClassId('')
//                   setClassTeacherSectionId('')
//                   setClassTeacherSubjectIds([])
//                 }
//               }}
// className="h-6 w-6 border-2 border-blue-500 bg-blur-500/20 data-[state=checked]:bg-[#0f6a8f] data-[state=checked]:border-[#0f6a8f]"
//             />
//           </div>
//         </CardHeader>

//         <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
//           {isClassTeacher ? (
//             <>
//               <div className="grid gap-4 sm:grid-cols-2">
//                 {/* Class select */}
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">
//                     Class <span className="text-red-500">*</span>
//                   </Label>
//                   <Select
//                     value={classTeacherClassId}
//                     onValueChange={val => {
//                       setClassTeacherClassId(val)
//                       setClassTeacherSectionId('')
//                     }}
//                   >
//                     <SelectTrigger className="h-11">
//                       <SelectValue placeholder="Select class" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {classesWithSections.map(cls => (
//                         <SelectItem key={cls._id} value={cls._id}>
//                           {cls.class_name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Section select */}
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">
//                     Section <span className="text-red-500">*</span>
//                   </Label>
//                   <Select
//                     value={classTeacherSectionId}
//                     onValueChange={setClassTeacherSectionId}
//                     disabled={!classTeacherClassId}
//                   >
//                     <SelectTrigger className="h-11">
//                       <SelectValue placeholder="Select section" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {selectedClassTeacherClass?.sections.map(sec => (
//                         <SelectItem key={sec._id} value={sec._id || ''}>
//                           Section {sec.section_name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               {/* Subjects for class teacher */}
//               {classTeacherClassId && classTeacherSectionId && (
//                 <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 border-2 border-[#1897C6]/20">
//                   <div className="flex items-center gap-2">
//                     <BookMarked className="h-5 w-5 text-[#1897C6]" />
//                     <Label className="text-sm font-semibold">
//                       Subjects Teaching (As Class Teacher)
//                     </Label>
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     Select subjects this class teacher will teach in{' '}
//                     {selectedClassTeacherClass?.class_name} —{' '}
//                     Section {selectedClassTeacherSection?.section_name}
//                   </p>

//                   {subjects.length === 0 ? (
//                     <p className="text-xs text-muted-foreground italic">
//                       No subjects found for this institute.
//                     </p>
//                   ) : (
//                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
//                       {subjects.map(subject => (
//                         <div
//                           key={subject._id}
//                           className="flex items-center space-x-2 p-2 rounded-md bg-white border"
//                         >
//                           <Checkbox
//                             id={`ct-subject-${subject._id}`}
//                             checked={classTeacherSubjectIds.includes(subject._id)}
//                             onCheckedChange={() => toggleClassTeacherSubject(subject._id)}
//                           />
//                           <label
//                             htmlFor={`ct-subject-${subject._id}`}
//                             className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                           >
//                             {subject.subject_name}
//                           </label>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {classTeacherSubjectIds.length > 0 && (
//                     <div className="mt-3 p-3 bg-white rounded-lg border-2 border-[#1897C6]/30">
//                       <p className="text-xs font-medium text-muted-foreground mb-2">
//                         Selected Subjects:
//                       </p>
//                       <div className="flex flex-wrap gap-2">
//                         {classTeacherSubjectIds.map(id => {
//                           const s = subjects.find(sub => sub._id === id)
//                           return (
//                             <Badge
//                               key={id}
//                               className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white"
//                             >
//                               {s?.subject_name || id}
//                             </Badge>
//                           )
//                         })}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="text-center py-8 text-muted-foreground">
//               <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
//               <p className="text-sm">Enable to assign as class teacher</p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* ── Card 2: Subject Teaching Allocation ── */}
//       <Card className="border-2 shadow-sm">
//         <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 pb-4">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
//                 <BookOpen className="h-5 w-5" />
//               </div>
//               <div>
//                 <CardTitle className="text-base sm:text-lg">Subject Teaching Allocation</CardTitle>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   Assign subjects across different classes
//                 </p>
//               </div>
//             </div>
//             <Button
//               onClick={addSubjectAllocation}
//               className="gap-2 bg-gradient-to-r from-[#F1AF37] to-[#D88931] hover:from-[#F1AF37]/90 hover:to-[#D88931]/90 h-9 w-full sm:w-auto"
//               size="sm"
//             >
//               <Plus className="h-4 w-4" />
//               <span className="text-sm">Add Subject</span>
//             </Button>
//           </div>
//         </CardHeader>

//         <CardContent className="p-4 sm:p-6 space-y-4">
//           {subjectAllocations.length === 0 ? (
//             <div className="text-center py-12 border-2 border-dashed rounded-lg">
//               <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
//               <p className="text-sm text-muted-foreground mb-4">No subject allocations yet</p>
//               <Button onClick={addSubjectAllocation} variant="outline" className="gap-2">
//                 <Plus className="h-4 w-4" />
//                 Add First Subject
//               </Button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {subjectAllocations.map((allocation, index) => (
//                 <Card key={index} className="border-2 overflow-hidden">
//                   <CardHeader className="bg-muted/30 pb-3">
//                     <div className="flex items-center justify-between gap-3">
//                       <div className="flex-1 space-y-2">
//                         <Label className="text-sm font-medium">Subject {index + 1}</Label>
//                         <Select
//                           value={allocation.subject_id}
//                           onValueChange={val => updateSubjectAllocationSubject(index, val)}
//                         >
//                           <SelectTrigger className="h-10 bg-white">
//                             <SelectValue placeholder="Select subject" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {subjects.map(subject => (
//                               <SelectItem key={subject._id} value={subject._id}>
//                                 {subject.subject_name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={() => removeSubjectAllocation(index)}
//                         className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </CardHeader>

//                   {allocation.subject_id && (
//                     <CardContent className="p-4 space-y-4">
//                       <Label className="text-sm font-medium">Assign Classes &amp; Sections</Label>
//                       <div className="space-y-4">
//                         {classesWithSections.map(cls => (
//                           <div key={cls._id} className="space-y-2">
//                             <p className="text-sm font-medium text-muted-foreground">
//                               {cls.class_name}
//                             </p>
//                             {cls.sections.length === 0 ? (
//                               <p className="text-xs text-muted-foreground italic pl-1">
//                                 No sections found
//                               </p>
//                             ) : (
//                               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
//                                 {cls.sections.map(section => {
//                                   const selected = isSectionSelected(
//                                     index,
//                                     cls._id,
//                                     section._id || ''
//                                   )
//                                   return (
//                                     <button
//                                       key={section._id}
//                                       type="button"
//                                       onClick={() => toggleSectionForSubject(index, cls, section)}
//                                       className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
//                                         selected
//                                           ? 'bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white border-transparent shadow-md'
//                                           : 'bg-white border-border hover:border-[#F1AF37] hover:bg-[#F1AF37]/5'
//                                       }`}
//                                     >
//                                       {section.section_name}
//                                     </button>
//                                   )
//                                 })}
//                               </div>
//                             )}
//                           </div>
//                         ))}
//                       </div>

//                       {allocation.classes.length > 0 && (
//                         <div className="mt-2 p-3 bg-gradient-to-r from-[#F1AF37]/10 to-[#D88931]/10 rounded-lg border-2 border-[#F1AF37]/30">
//                           <p className="text-xs font-medium text-muted-foreground mb-2">
//                             Selected:{' '}
//                             {allocation.classes.length}{' '}
//                             {allocation.classes.length === 1 ? 'section' : 'sections'}
//                           </p>
//                           <div className="flex flex-wrap gap-2">
//                             {allocation.classes.map((cls, idx) => (
//                               <Badge
//                                 key={idx}
//                                 variant="outline"
//                                 className="bg-white text-[#D87331] border-[#F1AF37]/40"
//                               >
//                                 {cls.className} — {cls.sectionName}
//                               </Badge>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </CardContent>
//                   )}
//                 </Card>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* ── Card 3: Allocation Summary ── */}
//       {hasSummary && (
//         <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
//           <CardHeader className="pb-3">
//             <div className="flex items-center gap-3">
//               <CheckCircle className="h-5 w-5 text-emerald-600" />
//               <CardTitle className="text-base sm:text-lg text-emerald-900">
//                 Allocation Summary
//               </CardTitle>
//             </div>
//           </CardHeader>
//           <CardContent className="space-y-3">
//             {isClassTeacher && classTeacherClassId && classTeacherSectionId && (
//               <div className="p-3 bg-white rounded-lg border-2 border-emerald-200">
//                 <p className="text-sm font-semibold text-emerald-900 mb-2">Class Teacher:</p>
//                 <div className="flex flex-wrap items-center gap-2">
//                   <Badge className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white">
//                     {selectedClassTeacherClass?.class_name} —{' '}
//                     Section {selectedClassTeacherSection?.section_name}
//                   </Badge>
//                   {classTeacherSubjectIds.length > 0 && (
//                     <>
//                       <span className="text-xs text-muted-foreground">teaching</span>
//                       {classTeacherSubjectIds.map(id => {
//                         const s = subjects.find(sub => sub._id === id)
//                         return (
//                           <Badge
//                             key={id}
//                             variant="outline"
//                             className="bg-[#1897C6]/10 text-[#1897C6] border-[#1897C6]/30"
//                           >
//                             {s?.subject_name || id}
//                           </Badge>
//                         )
//                       })}
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}

//             {subjectAllocations
//               .filter(a => a.subject_id && a.classes.length > 0)
//               .map((allocation, index) => (
//                 <div key={index} className="p-3 bg-white rounded-lg border-2 border-emerald-200">
//                   <p className="text-sm font-semibold text-emerald-900 mb-2">
//                     {allocation.subject_name}:
//                   </p>
//                   <div className="flex flex-wrap gap-1.5">
//                     {allocation.classes.map((cls, idx) => (
//                       <Badge
//                         key={idx}
//                         variant="outline"
//                         className="text-xs bg-[#F1AF37]/10 text-[#D87331] border-[#F1AF37]/30"
//                       >
//                         {cls.className} — {cls.sectionName}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//           </CardContent>
//         </Card>
//       )}

//       {/* ── Save Button ── */}
//       <div className="flex justify-end pt-2 pb-4">
//         <Button
//           onClick={handleSave}
//           disabled={isSaving || !hasSummary}
//           className="gap-2 bg-gradient-to-r from-[#1897C6] to-[#67BAC3] hover:from-[#1897C6]/90 hover:to-[#67BAC3]/90 shadow-md h-11 px-8 disabled:opacity-50"
//         >
//           {isSaving ? (
//             <>
//               <Loader2 className="h-4 w-4 animate-spin" />
//               Saving...
//             </>
//           ) : (
//             <>
//               <Save className="h-4 w-4" />
//               Save Allocations
//             </>
//           )}
//         </Button>
//       </div>
//     </div>
//   )
// }
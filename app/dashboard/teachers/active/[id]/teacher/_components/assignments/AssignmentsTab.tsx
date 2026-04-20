'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { School, BookOpen, ShieldCheck } from 'lucide-react'
import type { ClassMaster } from '@/lib/api/classes'
import type { SubjectByClass } from '@/lib/api/subjects'
import type { AssignmentFromAPI } from './types'
import { ADMIN_ROLES } from './types'
import { ErrorBanner } from './shared-components'
import ClassTeacherTab from './ClassTeacherTab'
import SubjectTeacherTab from './SubjectTeacherTab'
import PrincipalTab from './PrincipalTab'

// ─── Tab definition (driven by backend role enum, not hardcoded UI) ───────────

type TabId = 'class_teacher' | 'subject_teacher' | 'admin'

interface TabConfig {
  id: TabId
  label: string
  shortLabel: string
  icon: React.ReactNode
  activeClass: string
  badgeClass: string
  countFn: (all: AssignmentFromAPI[]) => number
}

const TABS: TabConfig[] = [
  {
    id: 'class_teacher',
    label: 'Class Teacher',
    shortLabel: 'Class',
    icon: <School className="h-4 w-4" />,
    activeClass: 'bg-white border-b-2 border-emerald-500 text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    countFn: (all) => all.filter((a) => a.role === 'class_teacher').length,
  },
  {
    id: 'subject_teacher',
    label: 'Subject Teacher',
    shortLabel: 'Subject',
    icon: <BookOpen className="h-4 w-4" />,
    activeClass: 'bg-white border-b-2 border-[#1897C6] text-[#1897C6]',
    badgeClass: 'bg-[#1897C6]/10 text-[#1897C6]',
    countFn: (all) => all.filter((a) => a.role === 'subject_teacher').length,
  },
  {
    id: 'admin',
    label: 'Principal',
    shortLabel: 'Admin',
    icon: <ShieldCheck className="h-4 w-4" />,
    activeClass: 'bg-white border-b-2 border-purple-500 text-purple-700',
    badgeClass: 'bg-purple-100 text-purple-700',
    // Covers principal | vice_principal | lab_assistant — all from backend enum
    countFn: (all) => all.filter((a) => ADMIN_ROLES.includes(a.role)).length,
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssignmentsTabProps {
  teacherId: string
  assignments: AssignmentFromAPI[]
  classList: ClassMaster[]
  subjectsByClassMap: Record<string, SubjectByClass[]>
  loading: boolean
  error: string | null
  onRefresh: () => void
  onClassListLoad: (list: ClassMaster[]) => void
  onSubjectsLoad: (classId: string, subjects: SubjectByClass[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssignmentsTab({
  teacherId,
  assignments,
  classList,
  subjectsByClassMap,
  loading,
  error,
  onRefresh,
  onClassListLoad,
  onSubjectsLoad,
}: AssignmentsTabProps) {
  const [activeTab, setActiveTab] = useState<TabId>('class_teacher')

  // Pre-filter assignments per tab — child components receive only what they need
  const ctAssignments = assignments.filter((a) => a.role === 'class_teacher')
  const stAssignments = assignments.filter((a) => a.role === 'subject_teacher')
  const adminAssignments = assignments.filter((a) => ADMIN_ROLES.includes(a.role))

  return (
    <div className="space-y-4">
      {/* Top-level error from parent (e.g. initial load failure) */}
      {error && !loading && (
        <ErrorBanner message={error} onRetry={onRefresh} />
      )}

      {/* ── Role Tabs ── */}
      <div className="rounded-xl border-2 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b bg-muted/30">
          {TABS.map((tab) => {
            const count = tab.countFn(assignments)
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors
                  ${isActive ? tab.activeClass : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                `}
                aria-selected={isActive}
                role="tab"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span
                  className={`
                    ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold
                    ${isActive ? tab.badgeClass : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tab panels */}
        <div className="p-3 sm:p-6" role="tabpanel">
          {activeTab === 'class_teacher' && (
            <ClassTeacherTab
              teacherId={teacherId}
              assignments={ctAssignments}
              classList={classList}
              subjectsByClassMap={subjectsByClassMap}
              loading={loading}
              error={null}   // top-level error shown above; child handles its own errors
              onRefresh={onRefresh}
              onClassListLoad={onClassListLoad}
              onSubjectsLoad={onSubjectsLoad}
            />
          )}
          {activeTab === 'subject_teacher' && (
            <SubjectTeacherTab
              teacherId={teacherId}
              assignments={stAssignments}
              classList={classList}
              subjectsByClassMap={subjectsByClassMap}
              loading={loading}
              error={null}
              onRefresh={onRefresh}
              onClassListLoad={onClassListLoad}
              onSubjectsLoad={onSubjectsLoad}
            />
          )}
          {activeTab === 'admin' && (
            <PrincipalTab
              teacherId={teacherId}
              assignments={adminAssignments}
              classList={classList}
              subjectsByClassMap={subjectsByClassMap}
              loading={loading}
              error={null}
              onRefresh={onRefresh}
              onClassListLoad={onClassListLoad}
            />
          )}
        </div>
      </div>
    </div>
  )
}
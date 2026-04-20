'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  IndianRupee, Clock, BookOpen, TrendingUp, Layers,
  Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle,
  Calendar, Percent, Hash, Edit2, Info, XCircle,
} from 'lucide-react'
import { teachersApi, type TeacherSalaryStructure } from '@/lib/api/teachers'

// ─── Types ────────────────────────────────────────────────────────────────────

type SalaryType = 'fixed_monthly' | 'per_lecture' | 'hourly' | 'percentage' | 'hybrid'
type PayFrequency = 'monthly' | 'weekly' | 'bi_weekly' | 'per_session'

interface OtherDeduction {
  name: string
  amount: string
}

interface ModalState {
  open: boolean
  type: 'success' | 'error'
  title: string
  message: string
}

interface SalaryStructureTabProps {
  teacherId: string
  onNotify?: (n: { type: 'success' | 'error'; message: string }) => void
}

// ─── Salary Type Config ───────────────────────────────────────────────────────

const SALARY_TYPE_OPTIONS: {
  value: SalaryType
  label: string
  description: string
  icon: React.ElementType
  color: string
  fields: string[]
  calcNote?: string
}[] = [
  {
    value: 'fixed_monthly',
    label: 'Fixed Monthly',
    description: 'Fixed salary with allowances every month',
    icon: IndianRupee,
    color: 'from-[#1897C6] to-[#67BAC3]',
    fields: ['basic_salary', 'hra', 'da', 'conveyance_allowance', 'medical_allowance'],
  },
  {
    value: 'per_lecture',
    label: 'Per Lecture',
    description: 'Paid per lecture/session delivered',
    icon: BookOpen,
    color: 'from-[#F1AF37] to-[#D88931]',
    fields: ['per_lecture_rate', 'max_lectures_per_month'],
    calcNote: 'Gross = Rate Per Lecture × Max Lectures Per Month',
  },
  {
    value: 'hourly',
    label: 'Hourly',
    description: 'Paid based on hours worked',
    icon: Clock,
    color: 'from-purple-500 to-purple-700',
    fields: ['hourly_rate', 'max_hours_per_month'],
    calcNote: 'Gross = Hourly Rate × Max Hours Per Month',
  },
  {
    value: 'percentage',
    label: 'Percentage',
    description: 'Earns a percentage of revenue generated',
    icon: TrendingUp,
    color: 'from-emerald-500 to-emerald-700',
    fields: ['revenue_percentage'],
    calcNote: 'Gross depends on actual revenue at payout time — live preview not available.',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Fixed base combined with variable pay components',
    icon: Layers,
    color: 'from-rose-500 to-rose-700',
    fields: ['basic_salary', 'per_lecture_rate', 'hourly_rate', 'revenue_percentage'],
    calcNote:
      'Gross = Fixed Base + Per Lecture + Hourly. Revenue % is paid additionally at payout.',
  },
]

const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-Weekly' },
  { value: 'per_session', label: 'Per Session' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toNum = (v: string): number | null => {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

const toInt = (v: string): number | null => {
  const n = parseInt(v)
  return isNaN(n) ? null : n
}

const fmt = (n?: number | null) =>
  n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

// ─── Result Modal ─────────────────────────────────────────────────────────────

function ResultModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  useEffect(() => {
    if (!modal.open) return
    if (modal.type !== 'success') return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [modal.open, modal.type, onClose])

  return (
    <Dialog open={modal.open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle
            className={`flex items-center gap-2 ${
              modal.type === 'success' ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {modal.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {modal.title}
          </DialogTitle>
          {modal.type === 'success' && (
            <p className="text-xs text-muted-foreground pt-1">
              This message will close automatically.
            </p>
          )}
          <DialogDescription className="text-sm text-foreground pt-1">
            {modal.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onClose}
            className={
              modal.type === 'success'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                : 'bg-red-500 hover:bg-red-600'
            }
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reusable: Rupee Input ────────────────────────────────────────────────────

function RupeeInput({
  value,
  onChange,
  placeholder = '0.00',
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center border rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#F1AF37]/40 focus-within:border-[#F1AF37]">
      <span className="px-3 text-sm text-muted-foreground border-r bg-gray-50 h-10 flex items-center select-none">
        ₹
      </span>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="border-0 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-white"
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalaryStructureTab({
  teacherId,
  onNotify,
}: SalaryStructureTabProps) {
  const adminId =
    typeof window !== 'undefined' ? localStorage.getItem('adminId') || '' : ''

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const closeModal = useCallback(() => setModal(m => ({ ...m, open: false })), [])

  const showModal = useCallback(
    (type: 'success' | 'error', title: string, message: string) => {
      setModal({ open: true, type, title, message })
      onNotify?.({ type, message })
    },
    [onNotify]
  )

  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Core
  const [salaryType, setSalaryType] = useState<SalaryType>('fixed_monthly')
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('monthly')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveTo, setEffectiveTo] = useState('')
  const [remarks, setRemarks] = useState('')

  // Allowances
  const [basicSalary, setBasicSalary] = useState('')
  const [hra, setHra] = useState('')
  const [da, setDa] = useState('')
  const [conveyanceAllowance, setConveyanceAllowance] = useState('')
  const [medicalAllowance, setMedicalAllowance] = useState('')
  const [incentiveAmount, setIncentiveAmount] = useState('')
  const [bonusAmount, setBonusAmount] = useState('')

  // Variable
  const [perLectureRate, setPerLectureRate] = useState('')
  const [maxLecturesPerMonth, setMaxLecturesPerMonth] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [maxHoursPerMonth, setMaxHoursPerMonth] = useState('')
  const [revenuePercentage, setRevenuePercentage] = useState('')

  // Deductions
  const [pfApplicable, setPfApplicable] = useState(false)
  const [pfPercentage, setPfPercentage] = useState('')
  const [tdsApplicable, setTdsApplicable] = useState(false)
  const [tdsPercentage, setTdsPercentage] = useState('')
  const [otherDeductions, setOtherDeductions] = useState<OtherDeduction[]>([])

  // ── Reset form ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setSalaryType('fixed_monthly')
    setPayFrequency('monthly')
    setEffectiveFrom('')
    setEffectiveTo('')
    setRemarks('')
    setBasicSalary('')
    setHra('')
    setDa('')
    setConveyanceAllowance('')
    setMedicalAllowance('')
    setIncentiveAmount('')
    setBonusAmount('')
    setPerLectureRate('')
    setMaxLecturesPerMonth('')
    setHourlyRate('')
    setMaxHoursPerMonth('')
    setRevenuePercentage('')
    setPfApplicable(false)
    setPfPercentage('')
    setTdsApplicable(false)
    setTdsPercentage('')
    setOtherDeductions([])
  }

  // ── Populate form ──────────────────────────────────────────────────────────
  const populateForm = useCallback((s: TeacherSalaryStructure) => {
    setSalaryType(s.salary_type)
    setPayFrequency(s.pay_frequency)
    setEffectiveFrom(s.effective_from ? s.effective_from.slice(0, 10) : '')
    setEffectiveTo(s.effective_to ? s.effective_to.slice(0, 10) : '')
    setRemarks(s.remarks || '')
    setBasicSalary(s.basic_salary != null ? String(s.basic_salary) : '')
    setHra(s.hra != null ? String(s.hra) : '')
    setDa(s.da != null ? String(s.da) : '')
    setConveyanceAllowance(s.conveyance_allowance != null ? String(s.conveyance_allowance) : '')
    setMedicalAllowance(s.medical_allowance != null ? String(s.medical_allowance) : '')
    setIncentiveAmount(s.incentive_amount != null ? String(s.incentive_amount) : '')
    setBonusAmount(s.bonus_amount != null ? String(s.bonus_amount) : '')
    setPerLectureRate(s.per_lecture_rate != null ? String(s.per_lecture_rate) : '')
    setMaxLecturesPerMonth(
      s.max_lectures_per_month != null ? String(s.max_lectures_per_month) : ''
    )
    setHourlyRate(s.hourly_rate != null ? String(s.hourly_rate) : '')
    setMaxHoursPerMonth(s.max_hours_per_month != null ? String(s.max_hours_per_month) : '')
    setRevenuePercentage(s.revenue_percentage != null ? String(s.revenue_percentage) : '')
    setPfApplicable(s.pf_applicable || false)
    setPfPercentage(s.pf_percentage != null ? String(s.pf_percentage) : '')
    setTdsApplicable(s.tds_applicable || false)
    setTdsPercentage(s.tds_percentage != null ? String(s.tds_percentage) : '')
    setOtherDeductions(
      s.other_deductions?.map(d => ({ name: d.name, amount: String(d.amount) })) || []
    )
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!teacherId) {
      setLoadError('Teacher ID is missing. Please refresh the page.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError('')
    try {
      const res = await teachersApi.getActiveSalaryStructureByTeacher(teacherId)
      if (res.success && res.result) {
        const s = res.result as TeacherSalaryStructure
        setExistingId(s._id || null)
        populateForm(s)
        setIsEditMode(false)
      } else {
        setExistingId(null)
        setIsEditMode(true)
      }
    } catch (err: any) {
      const is404 =
        err?.statusCode === 404 ||
        err?.status === 404 ||
        err?.response?.status === 404
      if (is404) {
        setExistingId(null)
        setIsEditMode(true)
      } else {
        console.error('[SalaryStructure] Failed to load salary structure:', err)
        setLoadError(err?.message || 'Failed to load salary structure. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [teacherId, populateForm])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Calculations ───────────────────────────────────────────────────────────
  const canPreviewGross = salaryType !== 'percentage'

  const calcGross = (): number => {
    switch (salaryType) {
      case 'fixed_monthly':
        return (
          (toNum(basicSalary) || 0) +
          (toNum(hra) || 0) +
          (toNum(da) || 0) +
          (toNum(conveyanceAllowance) || 0) +
          (toNum(medicalAllowance) || 0) +
          (toNum(incentiveAmount) || 0) +
          (toNum(bonusAmount) || 0)
        )
      case 'per_lecture': {
        const rate = toNum(perLectureRate) || 0
        const max = toInt(maxLecturesPerMonth) || 0
        const base = max > 0 ? rate * max : rate
        return base + (toNum(incentiveAmount) || 0) + (toNum(bonusAmount) || 0)
      }
      case 'hourly': {
        const rate = toNum(hourlyRate) || 0
        const max = toInt(maxHoursPerMonth) || 0
        const base = max > 0 ? rate * max : rate
        return base + (toNum(incentiveAmount) || 0) + (toNum(bonusAmount) || 0)
      }
      case 'percentage':
        return 0
      case 'hybrid': {
        const fixed = toNum(basicSalary) || 0
        const lectureRate = toNum(perLectureRate) || 0
        const lectureMax = toInt(maxLecturesPerMonth) || 0
        const lectureComponent = lectureMax > 0 ? lectureRate * lectureMax : lectureRate
        const hrlyRate = toNum(hourlyRate) || 0
        const hrlyMax = toInt(maxHoursPerMonth) || 0
        const hourlyComponent = hrlyMax > 0 ? hrlyRate * hrlyMax : hrlyRate
        return (
          fixed +
          lectureComponent +
          hourlyComponent +
          (toNum(incentiveAmount) || 0) +
          (toNum(bonusAmount) || 0)
        )
      }
      default:
        return 0
    }
  }

  const calcDeductions = (): number => {
    if (!canPreviewGross) return 0
    const gross = calcGross()
    let total = 0
    if (pfApplicable && pfPercentage) total += gross * ((toNum(pfPercentage) || 0) / 100)
    if (tdsApplicable && tdsPercentage) total += gross * ((toNum(tdsPercentage) || 0) / 100)
    otherDeductions.forEach(d => { total += toNum(d.amount) || 0 })
    return Math.round(total * 100) / 100
  }

  const calcNet = (): number => Math.max(0, calcGross() - calcDeductions())

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!effectiveFrom) return 'Effective from date is required.'
    if (salaryType === 'fixed_monthly' && !basicSalary)
      return 'Basic salary is required for Fixed Monthly type.'
    if (salaryType === 'per_lecture' && !perLectureRate)
      return 'Rate per lecture is required for Per Lecture type.'
    if (salaryType === 'hourly' && !hourlyRate)
      return 'Hourly rate is required for Hourly type.'
    if (salaryType === 'percentage') {
      if (!revenuePercentage) return 'Revenue percentage is required.'
      if ((toNum(revenuePercentage) || 0) > 100)
        return 'Revenue percentage cannot exceed 100%.'
    }
    if (salaryType === 'hybrid' && !basicSalary)
      return 'Basic salary is required for Hybrid type.'
    if (pfApplicable && !pfPercentage) return 'Please enter PF percentage.'
    if (pfApplicable && (toNum(pfPercentage) || 0) > 100)
      return 'PF percentage cannot exceed 100%.'
    if (tdsApplicable && !tdsPercentage) return 'Please enter TDS percentage.'
    if (tdsApplicable && (toNum(tdsPercentage) || 0) > 100)
      return 'TDS percentage cannot exceed 100%.'
    for (const d of otherDeductions) {
      if (d.name.trim() && !d.amount) return `Please enter amount for deduction "${d.name}".`
      if (!d.name.trim() && d.amount) return 'Please enter name for all deductions.'
    }
    return null
  }

  // ── Other Deductions ───────────────────────────────────────────────────────
  const addOtherDeduction = () =>
    setOtherDeductions(prev => [...prev, { name: '', amount: '' }])

  const updateOtherDeduction = (i: number, field: 'name' | 'amount', val: string) =>
    setOtherDeductions(prev => prev.map((d, idx) => (idx === i ? { ...d, [field]: val } : d)))

  const removeOtherDeduction = (i: number) =>
    setOtherDeductions(prev => prev.filter((_, idx) => idx !== i))

  // ── Build payload ──────────────────────────────────────────────────────────
  // effective_to and remarks send null (not undefined) so update calls
  // correctly clear these fields on the backend when left empty.
  const buildPayload = (): TeacherSalaryStructure => ({
    teacher_id: teacherId,
    salary_type: salaryType,
    pay_frequency: payFrequency,
    currency: 'INR',
    effective_from: effectiveFrom,
    effective_to: effectiveTo || null,
    remarks: remarks.trim() || null,
    basic_salary: toNum(basicSalary),
    hra: toNum(hra),
    da: toNum(da),
    conveyance_allowance: toNum(conveyanceAllowance),
    medical_allowance: toNum(medicalAllowance),
    incentive_amount: toNum(incentiveAmount),
    bonus_amount: toNum(bonusAmount),
    per_lecture_rate: toNum(perLectureRate),
    max_lectures_per_month: toInt(maxLecturesPerMonth),
    hourly_rate: toNum(hourlyRate),
    max_hours_per_month: toInt(maxHoursPerMonth),
    revenue_percentage: toNum(revenuePercentage),
    pf_applicable: pfApplicable,
    pf_percentage: pfApplicable ? toNum(pfPercentage) : null,
    tds_applicable: tdsApplicable,
    tds_percentage: tdsApplicable ? toNum(tdsPercentage) : null,
    other_deductions: otherDeductions
      .filter(d => d.name.trim() && d.amount)
      .map(d => ({ name: d.name.trim(), amount: toNum(d.amount) || 0 })),
    ...(adminId && { approved_by: adminId }),
  })

  // ── Save (Create / Update) ─────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate()
    if (err) {
      showModal('error', 'Validation Error', err)
      return
    }
    setIsSaving(true)
    try {
      const payload = buildPayload()
      let res
      if (existingId) {
        // Backend update validation does not allow teacher_id in the body
        const { teacher_id, ...updatePayload } = payload
        res = await teachersApi.updateSalaryStructure(existingId, updatePayload)
      } else {
        res = await teachersApi.createSalaryStructure(payload)
      }
      if (res.success && res.result) {
        const saved = res.result as TeacherSalaryStructure
        setExistingId(saved._id || null)
        populateForm(saved)
        setIsEditMode(false)
        showModal(
          'success',
          existingId ? 'Salary Updated' : 'Salary Structure Created',
          existingId
            ? 'Salary structure has been updated successfully.'
            : 'Salary structure has been created and saved successfully.'
        )
      } else {
        console.error('[SalaryStructure] Save returned failure:', res)
        showModal(
          'error',
          'Save Failed',
          res.message || 'Failed to save salary structure. Please try again.'
        )
      }
    } catch (err: any) {
      console.error('[SalaryStructure] Unexpected error during save:', err)
      showModal('error', 'Error', err?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!existingId) return
    setIsDeleting(true)
    try {
      const res = await teachersApi.deleteSalaryStructure(existingId)
      if (res.success) {
        setExistingId(null)
        setIsEditMode(true)
        setDeleteConfirmOpen(false)
        resetForm()
        showModal('success', 'Deleted', 'Salary structure has been deleted successfully.')
      } else {
        setDeleteConfirmOpen(false)
        console.error('[SalaryStructure] Delete returned failure:', res)
        showModal('error', 'Delete Failed', res.message || 'Failed to delete salary structure.')
      }
    } catch (err: any) {
      setDeleteConfirmOpen(false)
      console.error('[SalaryStructure] Unexpected error during delete:', err)
      showModal('error', 'Error', err?.message || 'Something went wrong while deleting.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Field visibility ───────────────────────────────────────────────────────
  const showField = (field: string) =>
    SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)?.fields.includes(field) || false

  const selectedType = SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)!
  const gross = calcGross()
  const deductions = calcDeductions()
  const net = calcNet()

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#F1AF37]" />
        <p className="text-sm text-muted-foreground">Loading salary structure...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-600 font-medium">{loadError}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Retry
        </Button>
      </div>
    )
  }

  // ── Salary Summary Block (shared between view + form) ─────────────────────
  const SalarySummaryBlock = ({ label }: { label?: string }) => (
    <div className="rounded-lg border border-[#F1AF37]/30 bg-amber-50/60 p-4">
      <p className="text-sm font-semibold text-[#D87331] mb-3">{label ?? 'Salary Summary'}</p>
      {!canPreviewGross ? (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-white border border-emerald-200">
          <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Revenue-based salary</p>
            <p className="text-xs text-emerald-700 mt-1">
              {revenuePercentage
                ? <>This teacher earns <strong>{revenuePercentage}%</strong> of revenue generated. Actual payout depends on revenue collected.</>
                : 'Enter revenue percentage above to configure this salary type.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Gross Salary:</span>
            <span className="font-medium text-foreground">₹ {fmt(gross)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#D87331]">Total Deductions:</span>
            <span className="font-medium text-red-600">- ₹ {fmt(deductions)}</span>
          </div>
          {salaryType === 'hybrid' && toNum(revenuePercentage) && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>+ Revenue % (at payout):</span>
              <span>{revenuePercentage}%</span>
            </div>
          )}
          <div className="h-px bg-[#F1AF37]/30 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-[#D87331]">Net Salary:</span>
            <span className="text-lg font-bold text-[#D87331]">₹ {fmt(net)}</span>
          </div>
        </div>
      )}
    </div>
  )

  // ─── View Mode ─────────────────────────────────────────────────────────────
  if (existingId && !isEditMode) {
    const typeInfo = SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)!
    const TypeIcon = typeInfo.icon
    return (
      <div className="space-y-4 mt-4 sm:mt-6">
        <ResultModal modal={modal} onClose={closeModal} />

        {/* Header card */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-amber-50/40">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1AF37]/20 text-[#D87331]">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Salary Structure</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Active since {fmtDate(effectiveFrom)}
                  {effectiveTo && ` · Till ${fmtDate(effectiveTo)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="h-8 w-8 p-0 border-red-200 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-b">
            {[
              {
                label: 'Salary Type',
                value: (
                  <span className="flex items-center gap-1.5">
                    <TypeIcon className="h-3.5 w-3.5 text-[#D87331]" />
                    {typeInfo.label}
                  </span>
                ),
              },
              {
                label: 'Pay Frequency',
                value: payFrequency.replace(/_/g, ' '),
              },
              {
                label: 'Currency',
                value: 'INR (₹)',
              },
              {
                label: 'PF / TDS',
                value: `${pfApplicable ? `PF ${pfPercentage}%` : 'No PF'} · ${tdsApplicable ? `TDS ${tdsPercentage}%` : 'No TDS'}`,
              },
            ].map(item => (
              <div key={item.label} className="px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-sm font-semibold capitalize">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-5">
            <SalarySummaryBlock />
            {remarks && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Remarks: </span>
                {remarks}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" /> Delete Salary Structure?
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. The salary structure will be permanently deleted
                and you will need to create a new one.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 gap-2"
              >
                {isDeleting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                ) : (
                  'Confirm Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── Create / Edit Form ────────────────────────────────────────────────────
  return (
    <div className="space-y-4 mt-4 sm:mt-6">
      <ResultModal modal={modal} onClose={closeModal} />

      {/* ── Edit Mode Banner ── */}
      {existingId && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-[#F1AF37] bg-[#F1AF37]/10">
          <div className="flex items-center gap-2.5">
            <Edit2 className="h-4 w-4 text-[#D87331]" />
            <div>
              <p className="text-sm font-semibold text-[#D87331]">Edit Mode</p>
              <p className="text-xs text-muted-foreground">Editing existing salary structure</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(false)}
            disabled={isSaving}
            className="gap-1.5 h-8 text-xs border-[#F1AF37]/60 text-[#D87331]"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}

      {/* ── Card 1: Header + Salary Type + Frequency + Dates ── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-amber-50/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1AF37]/20 text-[#D87331]">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Salary Structure Configuration</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {existingId ? 'Update compensation and benefits' : 'Define compensation and benefits'}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* ── Salary Type ── */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">
              Salary Type <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SALARY_TYPE_OPTIONS.map(type => {
                const isSelected = salaryType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSalaryType(type.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/60'
                        : 'border-border bg-white hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Radio indicator */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-blue-700' : 'text-foreground'
                      }`}
                    >
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Calc note */}
            {selectedType.calcNote && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-blue-50 border border-blue-100">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">{selectedType.calcNote}</p>
              </div>
            )}
          </div>

          {/* ── Pay Frequency ── */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">
              Pay Frequency <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {PAY_FREQUENCY_OPTIONS.map(freq => {
                const isSelected = payFrequency === freq.value
                return (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => setPayFrequency(freq.value)}
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#F1AF37] text-white border-[#F1AF37] shadow-sm'
                        : 'bg-white border-border text-foreground hover:border-[#F1AF37]/60 hover:bg-amber-50/50'
                    }`}
                  >
                    {freq.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Dates ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Effective From <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={e => setEffectiveFrom(e.target.value)}
                  className="pl-9 h-10 bg-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Effective To{' '}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={effectiveTo}
                  onChange={e => setEffectiveTo(e.target.value)}
                  className="pl-9 h-10 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2: Earnings ── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b">
          <p className="text-sm font-semibold text-foreground">
            Earnings
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              — {selectedType.label}
            </span>
          </p>
        </div>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">

            {showField('basic_salary') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Basic Salary <span className="text-red-500">*</span>
                </Label>
                <RupeeInput value={basicSalary} onChange={setBasicSalary} />
              </div>
            )}
            {showField('hra') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">HRA (House Rent Allowance)</Label>
                <RupeeInput value={hra} onChange={setHra} />
              </div>
            )}
            {showField('da') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">DA (Dearness Allowance)</Label>
                <RupeeInput value={da} onChange={setDa} />
              </div>
            )}
            {showField('conveyance_allowance') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Conveyance Allowance</Label>
                <RupeeInput value={conveyanceAllowance} onChange={setConveyanceAllowance} />
              </div>
            )}
            {showField('medical_allowance') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Medical Allowance</Label>
                <RupeeInput value={medicalAllowance} onChange={setMedicalAllowance} />
              </div>
            )}
            {showField('per_lecture_rate') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Rate Per Lecture <span className="text-red-500">*</span>
                </Label>
                <RupeeInput value={perLectureRate} onChange={setPerLectureRate} />
              </div>
            )}
            {showField('max_lectures_per_month') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Max Lectures / Month</Label>
                <div className="flex items-center border rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#F1AF37]/40 focus-within:border-[#F1AF37]">
                  <span className="px-3 text-sm text-muted-foreground border-r bg-gray-50 h-10 flex items-center select-none">
                    <Hash className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={maxLecturesPerMonth}
                    onChange={e => setMaxLecturesPerMonth(e.target.value)}
                    placeholder="0"
                    className="border-0 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                  />
                </div>
              </div>
            )}
            {showField('hourly_rate') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Hourly Rate <span className="text-red-500">*</span>
                </Label>
                <RupeeInput value={hourlyRate} onChange={setHourlyRate} />
              </div>
            )}
            {showField('max_hours_per_month') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Max Hours / Month</Label>
                <div className="flex items-center border rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#F1AF37]/40 focus-within:border-[#F1AF37]">
                  <span className="px-3 text-sm text-muted-foreground border-r bg-gray-50 h-10 flex items-center select-none">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={maxHoursPerMonth}
                    onChange={e => setMaxHoursPerMonth(e.target.value)}
                    placeholder="0"
                    className="border-0 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                  />
                </div>
              </div>
            )}
            {showField('revenue_percentage') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Revenue Percentage <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center border rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#F1AF37]/40 focus-within:border-[#F1AF37]">
                  <span className="px-3 text-sm text-muted-foreground border-r bg-gray-50 h-10 flex items-center select-none">
                    <Percent className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={revenuePercentage}
                    onChange={e => setRevenuePercentage(e.target.value)}
                    placeholder="0"
                    className="border-0 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                  />
                </div>
              </div>
            )}

            {/* Incentive & Bonus — always visible */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Incentive Amount</Label>
              <RupeeInput value={incentiveAmount} onChange={setIncentiveAmount} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Bonus Amount</Label>
              <RupeeInput value={bonusAmount} onChange={setBonusAmount} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 3: Deductions ── */}
      <div className="rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-red-100 bg-red-50/40">
          <p className="text-sm font-semibold text-red-700">Deductions</p>
        </div>
        <div className="p-5 space-y-3">
          {/* PF */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
            <div className="flex items-center gap-3">
              <Checkbox
                id="pf"
                checked={pfApplicable}
                onCheckedChange={c => {
                  setPfApplicable(c as boolean)
                  if (!c) setPfPercentage('')
                }}
              />
              <Label htmlFor="pf" className="text-sm font-medium cursor-pointer">
                Provident Fund (PF)
              </Label>
            </div>
            {pfApplicable && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={pfPercentage}
                  onChange={e => setPfPercentage(e.target.value)}
                  placeholder="12"
                  className="w-20 h-9 text-sm"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            )}
          </div>

          {/* TDS */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
            <div className="flex items-center gap-3">
              <Checkbox
                id="tds"
                checked={tdsApplicable}
                onCheckedChange={c => {
                  setTdsApplicable(c as boolean)
                  if (!c) setTdsPercentage('')
                }}
              />
              <Label htmlFor="tds" className="text-sm font-medium cursor-pointer">
                TDS (Tax Deducted at Source)
              </Label>
            </div>
            {tdsApplicable && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={tdsPercentage}
                  onChange={e => setTdsPercentage(e.target.value)}
                  placeholder="10"
                  className="w-20 h-9 text-sm"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            )}
          </div>

          {/* Other Deductions */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Other Deductions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addOtherDeduction}
                className="gap-1.5 h-8 text-xs border-dashed"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {otherDeductions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-3 border border-dashed rounded-lg">
                No other deductions added
              </p>
            ) : (
              <div className="space-y-2">
                {otherDeductions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={d.name}
                      onChange={e => updateOtherDeduction(i, 'name', e.target.value)}
                      placeholder="Deduction name"
                      className="h-10 flex-1"
                    />
                    <RupeeInput
                      value={d.amount}
                      onChange={v => updateOtherDeduction(i, 'amount', v)}
                      placeholder="0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOtherDeduction(i)}
                      className="h-10 w-10 text-red-500 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Card 4: Salary Summary + Remarks ── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <SalarySummaryBlock label="Salary Summary" />

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Remarks{' '}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any additional notes about this salary structure..."
              className="resize-none min-h-[80px] bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── Save / Cancel ── */}
      <div className="flex justify-end gap-3 pt-1 pb-4">
        {existingId && (
          <Button
            variant="outline"
            onClick={() => setIsEditMode(false)}
            disabled={isSaving}
            className="h-10 px-6 text-sm"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 bg-[#F1AF37] hover:bg-[#D88931] text-white h-10 px-7 text-sm font-medium shadow-sm disabled:opacity-50"
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> {existingId ? 'Update Structure' : 'Save Structure'}</>
          )}
        </Button>
      </div>
    </div>
  )
}


















// 'use client'

// import React, { useState, useEffect, useCallback } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Checkbox } from '@/components/ui/checkbox'
// import { Textarea } from '@/components/ui/textarea'
// import { Badge } from '@/components/ui/badge'
// import {
//   Dialog, DialogContent, DialogHeader,
//   DialogTitle, DialogDescription, DialogFooter,
// } from '@/components/ui/dialog'
// import {
//   IndianRupee, Clock, BookOpen, TrendingUp, Layers,
//   Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle,
//   Calendar, Percent, Hash, Edit2, Info, XCircle,
// } from 'lucide-react'
// import { teachersApi, type TeacherSalaryStructure } from '@/lib/api/teachers'

// // ─── Types ────────────────────────────────────────────────────────────────────

// type SalaryType = 'fixed_monthly' | 'per_lecture' | 'hourly' | 'percentage' | 'hybrid'
// type PayFrequency = 'monthly' | 'weekly' | 'bi_weekly' | 'per_session'

// interface OtherDeduction {
//   name: string
//   amount: string
// }

// interface ModalState {
//   open: boolean
//   type: 'success' | 'error'
//   title: string
//   message: string
// }

// interface SalaryStructureTabProps {
//   teacherId: string
//   onNotify?: (n: { type: 'success' | 'error'; message: string }) => void
// }

// // ─── Salary Type Config ───────────────────────────────────────────────────────

// const SALARY_TYPE_OPTIONS: {
//   value: SalaryType
//   label: string
//   description: string
//   icon: React.ElementType
//   color: string
//   fields: string[]
//   calcNote?: string
// }[] = [
//   {
//     value: 'fixed_monthly',
//     label: 'Fixed Monthly',
//     description: 'Fixed salary with allowances every month',
//     icon: IndianRupee,
//     color: 'from-[#1897C6] to-[#67BAC3]',
//     fields: ['basic_salary', 'hra', 'da', 'conveyance_allowance', 'medical_allowance'],
//   },
//   {
//     value: 'per_lecture',
//     label: 'Per Lecture',
//     description: 'Paid per lecture/session delivered',
//     icon: BookOpen,
//     color: 'from-[#F1AF37] to-[#D88931]',
//     fields: ['per_lecture_rate', 'max_lectures_per_month'],
//     calcNote: 'Gross = Rate Per Lecture × Max Lectures Per Month',
//   },
//   {
//     value: 'hourly',
//     label: 'Hourly',
//     description: 'Paid based on hours worked',
//     icon: Clock,
//     color: 'from-purple-500 to-purple-700',
//     fields: ['hourly_rate', 'max_hours_per_month'],
//     calcNote: 'Gross = Hourly Rate × Max Hours Per Month',
//   },
//   {
//     value: 'percentage',
//     label: 'Percentage',
//     description: 'Earns a percentage of revenue generated',
//     icon: TrendingUp,
//     color: 'from-emerald-500 to-emerald-700',
//     fields: ['revenue_percentage'],
//     calcNote: 'Gross depends on actual revenue at payout time — live preview not available.',
//   },
//   {
//     value: 'hybrid',
//     label: 'Hybrid',
//     description: 'Fixed base combined with variable pay components',
//     icon: Layers,
//     color: 'from-rose-500 to-rose-700',
//     fields: ['basic_salary', 'per_lecture_rate', 'hourly_rate', 'revenue_percentage'],
//     calcNote:
//       'Gross = Fixed Base + Per Lecture + Hourly. Revenue % is paid additionally at payout.',
//   },
// ]

// const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
//   { value: 'monthly', label: 'Monthly' },
//   { value: 'weekly', label: 'Weekly' },
//   { value: 'bi_weekly', label: 'Bi-Weekly' },
//   { value: 'per_session', label: 'Per Session' },
// ]

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const toNum = (v: string): number | null => {
//   const n = parseFloat(v)
//   return isNaN(n) ? null : n
// }

// const toInt = (v: string): number | null => {
//   const n = parseInt(v)
//   return isNaN(n) ? null : n
// }

// const fmt = (n?: number | null) =>
//   n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'

// const fmtDate = (d?: string) =>
//   d
//     ? new Date(d).toLocaleDateString('en-IN', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//       })
//     : '—'

// // ─── Result Modal ─────────────────────────────────────────────────────────────

// function ResultModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
//   useEffect(() => {
//     if (!modal.open) return
//     if (modal.type !== 'success') return
//     const timer = setTimeout(onClose, 3000)
//     return () => clearTimeout(timer)
//   }, [modal.open, modal.type, onClose])

//   return (
//     <Dialog open={modal.open} onOpenChange={onClose}>
//       <DialogContent className="max-w-sm">
//         <DialogHeader>
//           <DialogTitle
//             className={`flex items-center gap-2 ${
//               modal.type === 'success' ? 'text-emerald-700' : 'text-red-600'
//             }`}
//           >
//             {modal.type === 'success' ? (
//               <CheckCircle className="h-5 w-5 text-emerald-500" />
//             ) : (
//               <XCircle className="h-5 w-5 text-red-500" />
//             )}
//             {modal.title}
//           </DialogTitle>
//           {modal.type === 'success' && (
//             <p className="text-xs text-muted-foreground pt-1">This message will close automatically.</p>
//           )}
//           <DialogDescription className="text-sm text-foreground pt-1">
//             {modal.message}
//           </DialogDescription>
//         </DialogHeader>
//         <DialogFooter>
//           <Button
//             onClick={onClose}
//             className={
//               modal.type === 'success'
//                 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
//                 : 'bg-red-500 hover:bg-red-600'
//             }
//           >
//             OK
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// export default function SalaryStructureTab({
//   teacherId,
//   onNotify,
// }: SalaryStructureTabProps) {
//   const adminId =
//     typeof window !== 'undefined' ? localStorage.getItem('adminId') || '' : ''

//   // ── Modal ──────────────────────────────────────────────────────────────────
//   const [modal, setModal] = useState<ModalState>({
//     open: false,
//     type: 'success',
//     title: '',
//     message: '',
//   })
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

//   const closeModal = useCallback(() => setModal(m => ({ ...m, open: false })), [])

//   const showModal = useCallback(
//     (type: 'success' | 'error', title: string, message: string) => {
//       setModal({ open: true, type, title, message })
//       onNotify?.({ type, message })
//     },
//     [onNotify]
//   )

//   // ── State ──────────────────────────────────────────────────────────────────
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSaving, setIsSaving] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [loadError, setLoadError] = useState('')
//   const [existingId, setExistingId] = useState<string | null>(null)
//   const [isEditMode, setIsEditMode] = useState(false)

//   // Core
//   const [salaryType, setSalaryType] = useState<SalaryType>('fixed_monthly')
//   const [payFrequency, setPayFrequency] = useState<PayFrequency>('monthly')
//   const [effectiveFrom, setEffectiveFrom] = useState('')
//   const [effectiveTo, setEffectiveTo] = useState('')
//   const [remarks, setRemarks] = useState('')

//   // Allowances
//   const [basicSalary, setBasicSalary] = useState('')
//   const [hra, setHra] = useState('')
//   const [da, setDa] = useState('')
//   const [conveyanceAllowance, setConveyanceAllowance] = useState('')
//   const [medicalAllowance, setMedicalAllowance] = useState('')
//   const [incentiveAmount, setIncentiveAmount] = useState('')
//   const [bonusAmount, setBonusAmount] = useState('')

//   // Variable
//   const [perLectureRate, setPerLectureRate] = useState('')
//   const [maxLecturesPerMonth, setMaxLecturesPerMonth] = useState('')
//   const [hourlyRate, setHourlyRate] = useState('')
//   const [maxHoursPerMonth, setMaxHoursPerMonth] = useState('')
//   const [revenuePercentage, setRevenuePercentage] = useState('')

//   // Deductions
//   const [pfApplicable, setPfApplicable] = useState(false)
//   const [pfPercentage, setPfPercentage] = useState('')
//   const [tdsApplicable, setTdsApplicable] = useState(false)
//   const [tdsPercentage, setTdsPercentage] = useState('')
//   const [otherDeductions, setOtherDeductions] = useState<OtherDeduction[]>([])

//   // ── Reset form ─────────────────────────────────────────────────────────────
//   const resetForm = () => {
//     setSalaryType('fixed_monthly')
//     setPayFrequency('monthly')
//     setEffectiveFrom('')
//     setEffectiveTo('')
//     setRemarks('')
//     setBasicSalary('')
//     setHra('')
//     setDa('')
//     setConveyanceAllowance('')
//     setMedicalAllowance('')
//     setIncentiveAmount('')
//     setBonusAmount('')
//     setPerLectureRate('')
//     setMaxLecturesPerMonth('')
//     setHourlyRate('')
//     setMaxHoursPerMonth('')
//     setRevenuePercentage('')
//     setPfApplicable(false)
//     setPfPercentage('')
//     setTdsApplicable(false)
//     setTdsPercentage('')
//     setOtherDeductions([])
//   }

//   // ── Populate form ──────────────────────────────────────────────────────────
//   const populateForm = useCallback((s: TeacherSalaryStructure) => {
//     setSalaryType(s.salary_type)
//     setPayFrequency(s.pay_frequency)
//     setEffectiveFrom(s.effective_from ? s.effective_from.slice(0, 10) : '')
//     setEffectiveTo(s.effective_to ? s.effective_to.slice(0, 10) : '')
//     setRemarks(s.remarks || '')
//     setBasicSalary(s.basic_salary != null ? String(s.basic_salary) : '')
//     setHra(s.hra != null ? String(s.hra) : '')
//     setDa(s.da != null ? String(s.da) : '')
//     setConveyanceAllowance(s.conveyance_allowance != null ? String(s.conveyance_allowance) : '')
//     setMedicalAllowance(s.medical_allowance != null ? String(s.medical_allowance) : '')
//     setIncentiveAmount(s.incentive_amount != null ? String(s.incentive_amount) : '')
//     setBonusAmount(s.bonus_amount != null ? String(s.bonus_amount) : '')
//     setPerLectureRate(s.per_lecture_rate != null ? String(s.per_lecture_rate) : '')
//     setMaxLecturesPerMonth(
//       s.max_lectures_per_month != null ? String(s.max_lectures_per_month) : ''
//     )
//     setHourlyRate(s.hourly_rate != null ? String(s.hourly_rate) : '')
//     setMaxHoursPerMonth(s.max_hours_per_month != null ? String(s.max_hours_per_month) : '')
//     setRevenuePercentage(s.revenue_percentage != null ? String(s.revenue_percentage) : '')
//     setPfApplicable(s.pf_applicable || false)
//     setPfPercentage(s.pf_percentage != null ? String(s.pf_percentage) : '')
//     setTdsApplicable(s.tds_applicable || false)
//     setTdsPercentage(s.tds_percentage != null ? String(s.tds_percentage) : '')
//     setOtherDeductions(
//       s.other_deductions?.map(d => ({ name: d.name, amount: String(d.amount) })) || []
//     )
//   }, [])

//   // ── Fetch ──────────────────────────────────────────────────────────────────
//   const fetchData = useCallback(async () => {
//     if (!teacherId) {
//       setLoadError('Teacher ID is missing. Please refresh the page.')
//       setIsLoading(false)
//       return
//     }
//     setIsLoading(true)
//     setLoadError('')
//     try {
//       const res = await teachersApi.getActiveSalaryStructureByTeacher(teacherId)
//       if (res.success && res.result) {
//         const s = res.result as TeacherSalaryStructure
//         setExistingId(s._id || null)
//         populateForm(s)
//         setIsEditMode(false)
//       } else {
//         // API returned success=false but no throw (e.g. no record found)
//         setExistingId(null)
//         setIsEditMode(true)
//       }
//     } catch (err: any) {
//       // 404 = no salary structure exists yet — show blank create form
//       const is404 =
//         err?.statusCode === 404 ||
//         err?.status === 404 ||
//         err?.response?.status === 404
//       if (is404) {
//         setExistingId(null)
//         setIsEditMode(true)
//       } else {
//         // Real network / server error — show error state
//         console.error('[SalaryStructure] Failed to load salary structure:', err)
//         setLoadError(err?.message || 'Failed to load salary structure. Please try again.')
//       }
//     } finally {
//       setIsLoading(false)
//     }
//   }, [teacherId, populateForm])

//   useEffect(() => {
//     fetchData()
//   }, [fetchData])

//   // ── Calculations ───────────────────────────────────────────────────────────

//   // Percentage type gross cannot be previewed — depends on actual revenue
//   const canPreviewGross = salaryType !== 'percentage'

//   const calcGross = (): number => {
//     switch (salaryType) {
//       case 'fixed_monthly':
//         return (
//           (toNum(basicSalary) || 0) +
//           (toNum(hra) || 0) +
//           (toNum(da) || 0) +
//           (toNum(conveyanceAllowance) || 0) +
//           (toNum(medicalAllowance) || 0) +
//           (toNum(incentiveAmount) || 0) +
//           (toNum(bonusAmount) || 0)
//         )

//       case 'per_lecture': {
//         const rate = toNum(perLectureRate) || 0
//         const max = toInt(maxLecturesPerMonth) || 0
//         const base = max > 0 ? rate * max : rate
//         return base + (toNum(incentiveAmount) || 0) + (toNum(bonusAmount) || 0)
//       }

//       case 'hourly': {
//         const rate = toNum(hourlyRate) || 0
//         const max = toInt(maxHoursPerMonth) || 0
//         const base = max > 0 ? rate * max : rate
//         return base + (toNum(incentiveAmount) || 0) + (toNum(bonusAmount) || 0)
//       }

//       case 'percentage':
//         return 0

//       case 'hybrid': {
//         const fixed = toNum(basicSalary) || 0
//         const lectureRate = toNum(perLectureRate) || 0
//         const lectureMax = toInt(maxLecturesPerMonth) || 0
//         const lectureComponent = lectureMax > 0 ? lectureRate * lectureMax : lectureRate
//         const hrlyRate = toNum(hourlyRate) || 0
//         const hrlyMax = toInt(maxHoursPerMonth) || 0
//         const hourlyComponent = hrlyMax > 0 ? hrlyRate * hrlyMax : hrlyRate
//         return (
//           fixed +
//           lectureComponent +
//           hourlyComponent +
//           (toNum(incentiveAmount) || 0) +
//           (toNum(bonusAmount) || 0)
//         )
//       }

//       default:
//         return 0
//     }
//   }

//   const calcDeductions = (): number => {
//     if (!canPreviewGross) return 0
//     const gross = calcGross()
//     let total = 0
//     if (pfApplicable && pfPercentage) total += gross * ((toNum(pfPercentage) || 0) / 100)
//     if (tdsApplicable && tdsPercentage) total += gross * ((toNum(tdsPercentage) || 0) / 100)
//     otherDeductions.forEach(d => {
//       total += toNum(d.amount) || 0
//     })
//     return Math.round(total * 100) / 100
//   }

//   const calcNet = (): number => Math.max(0, calcGross() - calcDeductions())

//   // ── Validation ─────────────────────────────────────────────────────────────
//   const validate = (): string | null => {
//     if (!effectiveFrom) return 'Effective from date is required.'
//     if (salaryType === 'fixed_monthly' && !basicSalary)
//       return 'Basic salary is required for Fixed Monthly type.'
//     if (salaryType === 'per_lecture' && !perLectureRate)
//       return 'Rate per lecture is required for Per Lecture type.'
//     if (salaryType === 'hourly' && !hourlyRate)
//       return 'Hourly rate is required for Hourly type.'
//     if (salaryType === 'percentage') {
//       if (!revenuePercentage) return 'Revenue percentage is required.'
//       if ((toNum(revenuePercentage) || 0) > 100)
//         return 'Revenue percentage cannot exceed 100%.'
//     }
//     if (salaryType === 'hybrid' && !basicSalary)
//       return 'Basic salary is required for Hybrid type.'
//     if (pfApplicable && !pfPercentage) return 'Please enter PF percentage.'
//     if (pfApplicable && (toNum(pfPercentage) || 0) > 100)
//       return 'PF percentage cannot exceed 100%.'
//     if (tdsApplicable && !tdsPercentage) return 'Please enter TDS percentage.'
//     if (tdsApplicable && (toNum(tdsPercentage) || 0) > 100)
//       return 'TDS percentage cannot exceed 100%.'
//     for (const d of otherDeductions) {
//       if (d.name.trim() && !d.amount) return `Please enter amount for deduction "${d.name}".`
//       if (!d.name.trim() && d.amount) return 'Please enter name for all deductions.'
//     }
//     return null
//   }

//   // ── Other Deductions ───────────────────────────────────────────────────────
//   const addOtherDeduction = () =>
//     setOtherDeductions(prev => [...prev, { name: '', amount: '' }])

//   const updateOtherDeduction = (i: number, field: 'name' | 'amount', val: string) =>
//     setOtherDeductions(prev => prev.map((d, idx) => (idx === i ? { ...d, [field]: val } : d)))

//   const removeOtherDeduction = (i: number) =>
//     setOtherDeductions(prev => prev.filter((_, idx) => idx !== i))

//   // ── Build payload ──────────────────────────────────────────────────────────
//   // FIX: effectiveTo and remarks must send `null` (not `undefined`) when empty
//   // so that update calls actually clear these fields on the backend.
//   // Sending `undefined` omits the key entirely, which means the old value stays.
//   const buildPayload = (): TeacherSalaryStructure => ({
//     teacher_id: teacherId,
//     salary_type: salaryType,
//     pay_frequency: payFrequency,
//     currency: 'INR',
//     effective_from: effectiveFrom,
//     effective_to: effectiveTo || null,
//     remarks: remarks.trim() || null,
//     basic_salary: toNum(basicSalary),
//     hra: toNum(hra),
//     da: toNum(da),
//     conveyance_allowance: toNum(conveyanceAllowance),
//     medical_allowance: toNum(medicalAllowance),
//     incentive_amount: toNum(incentiveAmount),
//     bonus_amount: toNum(bonusAmount),
//     per_lecture_rate: toNum(perLectureRate),
//     max_lectures_per_month: toInt(maxLecturesPerMonth),
//     hourly_rate: toNum(hourlyRate),
//     max_hours_per_month: toInt(maxHoursPerMonth),
//     revenue_percentage: toNum(revenuePercentage),
//     pf_applicable: pfApplicable,
//     pf_percentage: pfApplicable ? toNum(pfPercentage) : null,
//     tds_applicable: tdsApplicable,
//     tds_percentage: tdsApplicable ? toNum(tdsPercentage) : null,
//     other_deductions: otherDeductions
//       .filter(d => d.name.trim() && d.amount)
//       .map(d => ({ name: d.name.trim(), amount: toNum(d.amount) || 0 })),
//     ...(adminId && { approved_by: adminId }),
//   })

//   // ── Save (Create / Update) ─────────────────────────────────────────────────
//   const handleSave = async () => {
//     const err = validate()
//     if (err) {
//       showModal('error', 'Validation Error', err)
//       return
//     }
//     setIsSaving(true)
//     try {
//       const payload = buildPayload()
//       let res
//       if (existingId) {
//         // Backend update validation does not allow teacher_id in the body
//         const { teacher_id, ...updatePayload } = payload
//         res = await teachersApi.updateSalaryStructure(existingId, updatePayload)
//       } else {
//         res = await teachersApi.createSalaryStructure(payload)
//       }
//       if (res.success && res.result) {
//         const saved = res.result as TeacherSalaryStructure
//         setExistingId(saved._id || null)
//         populateForm(saved)
//         setIsEditMode(false)
//         showModal(
//           'success',
//           existingId ? 'Salary Updated' : 'Salary Structure Created',
//           existingId
//             ? 'Salary structure has been updated successfully.'
//             : 'Salary structure has been created and saved successfully.'
//         )
//       } else {
//         console.error('[SalaryStructure] Save returned failure:', res)
//         showModal(
//           'error',
//           'Save Failed',
//           res.message || 'Failed to save salary structure. Please try again.'
//         )
//       }
//     } catch (err: any) {
//       console.error('[SalaryStructure] Unexpected error during save:', err)
//       showModal('error', 'Error', err?.message || 'Something went wrong. Please try again.')
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // ── Delete ─────────────────────────────────────────────────────────────────
//   const handleDelete = async () => {
//     if (!existingId) return
//     setIsDeleting(true)
//     try {
//       const res = await teachersApi.deleteSalaryStructure(existingId)
//       if (res.success) {
//         setExistingId(null)
//         setIsEditMode(true)
//         setDeleteConfirmOpen(false)
//         resetForm()
//         showModal('success', 'Deleted', 'Salary structure has been deleted successfully.')
//       } else {
//         setDeleteConfirmOpen(false)
//         console.error('[SalaryStructure] Delete returned failure:', res)
//         showModal('error', 'Delete Failed', res.message || 'Failed to delete salary structure.')
//       }
//     } catch (err: any) {
//       setDeleteConfirmOpen(false)
//       console.error('[SalaryStructure] Unexpected error during delete:', err)
//       showModal('error', 'Error', err?.message || 'Something went wrong while deleting.')
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   // ── Field visibility ───────────────────────────────────────────────────────
//   const showField = (field: string) =>
//     SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)?.fields.includes(field) || false

//   const selectedType = SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)!
//   const gross = calcGross()
//   const deductions = calcDeductions()
//   const net = calcNet()

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 gap-3">
//         <Loader2 className="h-8 w-8 animate-spin text-[#F1AF37]" />
//         <p className="text-sm text-muted-foreground">Loading salary structure...</p>
//       </div>
//     )
//   }

//   if (loadError) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 gap-3">
//         <AlertCircle className="h-8 w-8 text-red-500" />
//         <p className="text-sm text-red-600 font-medium">{loadError}</p>
//         <Button variant="outline" size="sm" onClick={fetchData}>
//           Retry
//         </Button>
//       </div>
//     )
//   }

//   // ─── View Mode ────────────────────────────────────────────────────────────
//   if (existingId && !isEditMode) {
//     const typeInfo = SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)!
//     const TypeIcon = typeInfo.icon
//     return (
//       <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
//         <ResultModal modal={modal} onClose={closeModal} />

//         {/* Header */}
//         <Card className="border-2 shadow-sm">
//           <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 pb-4">
//             <div className="flex items-center justify-between flex-wrap gap-3">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
//                   <IndianRupee className="h-5 w-5" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-base sm:text-lg">Salary Structure</CardTitle>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     Active since {fmtDate(effectiveFrom)}
//                     {effectiveTo && ` · Till ${fmtDate(effectiveTo)}`}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2 flex-wrap">
//                 <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
//                   Active
//                 </Badge>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setIsEditMode(true)}
//                   className="gap-2 h-9"
//                 >
//                   <Edit2 className="h-3.5 w-3.5" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setDeleteConfirmOpen(true)}
//                   className="gap-2 h-9 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400"
//                 >
//                   <Trash2 className="h-3.5 w-3.5" />
//                 </Button>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent className="p-4 sm:p-6 space-y-4">
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">Salary Type</p>
//                 <div className="flex items-center gap-2">
//                   <div
//                     className={`flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br ${typeInfo.color} text-white shrink-0`}
//                   >
//                     <TypeIcon className="h-3 w-3" />
//                   </div>
//                   <p className="text-sm font-semibold">{typeInfo.label}</p>
//                 </div>
//               </div>
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">Pay Frequency</p>
//                 <p className="text-sm font-semibold capitalize">
//                   {payFrequency.replace(/_/g, ' ')}
//                 </p>
//               </div>
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">Currency</p>
//                 <p className="text-sm font-semibold">INR (₹)</p>
//               </div>
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">PF / TDS</p>
//                 <p className="text-sm font-semibold">
//                   {pfApplicable ? `PF ${pfPercentage}%` : 'No PF'}
//                   {tdsApplicable ? ` · TDS ${tdsPercentage}%` : ' · No TDS'}
//                 </p>
//               </div>
//             </div>

//             {remarks && (
//               <div className="p-3 rounded-lg bg-muted/20 border text-sm text-muted-foreground">
//                 <span className="font-medium text-foreground">Remarks: </span>
//                 {remarks}
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Summary */}
//         <Card className="border-2 bg-gradient-to-br from-[#F1AF37]/5 to-[#D88931]/5 shadow-sm">
//           <CardContent className="p-4 sm:p-6">
//             <h3 className="text-sm font-semibold text-[#D87331] mb-4">Salary Summary</h3>
//             {!canPreviewGross ? (
//               <div className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-emerald-200">
//                 <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm font-medium text-emerald-800">Revenue-based salary</p>
//                   <p className="text-xs text-emerald-700 mt-1">
//                     This teacher earns{' '}
//                     <strong>{revenuePercentage}%</strong> of revenue generated. Actual payout
//                     depends on revenue collected at time of salary processing.
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               <div className="p-4 rounded-lg bg-gradient-to-br from-[#F1AF37]/10 to-[#D88931]/10 border-2 border-[#F1AF37]/30 space-y-2">
//                 <div className="flex justify-between items-center text-sm">
//                   <span className="text-muted-foreground">Gross Salary:</span>
//                   <span className="font-semibold">₹ {fmt(gross)}</span>
//                 </div>
//                 <div className="flex justify-between items-center text-sm text-red-600">
//                   <span>Total Deductions:</span>
//                   <span className="font-semibold">- ₹ {fmt(deductions)}</span>
//                 </div>
//                 {salaryType === 'hybrid' && toNum(revenuePercentage) && (
//                   <div className="flex justify-between items-center text-xs text-muted-foreground">
//                     <span>+ Revenue % (at payout):</span>
//                     <span>{revenuePercentage}%</span>
//                   </div>
//                 )}
//                 <div className="h-px bg-border my-1" />
//                 <div className="flex justify-between items-center">
//                   <span className="font-bold text-[#D87331]">Net Salary:</span>
//                   <span className="font-bold text-lg text-[#D87331]">₹ {fmt(net)}</span>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Delete Confirm Dialog */}
//         <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
//           <DialogContent className="max-w-sm">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2 text-red-600">
//                 <Trash2 className="h-5 w-5" /> Delete Salary Structure?
//               </DialogTitle>
//               <DialogDescription>
//                 This action cannot be undone. The salary structure will be permanently deleted
//                 and you will need to create a new one.
//               </DialogDescription>
//             </DialogHeader>
//             <DialogFooter className="gap-2">
//               <Button
//                 variant="outline"
//                 onClick={() => setDeleteConfirmOpen(false)}
//                 disabled={isDeleting}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleDelete}
//                 disabled={isDeleting}
//                 className="bg-red-500 hover:bg-red-600 gap-2"
//               >
//                 {isDeleting ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   'Confirm Delete'
//                 )}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//     )
//   }

//   // ─── Create / Edit Form ────────────────────────────────────────────────────
//   return (
//     <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
//       <ResultModal modal={modal} onClose={closeModal} />

//       {/* ── Edit Mode Banner ── */}
//       {existingId && (
//         <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#F1AF37] bg-[#F1AF37]/10">
//           <div className="flex items-center gap-2.5">
//             <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
//               <Edit2 className="h-3.5 w-3.5" />
//             </div>
//             <div>
//               <p className="text-sm font-semibold text-[#D87331]">Edit Mode</p>
//               <p className="text-xs text-muted-foreground">You are editing an existing salary structure</p>
//             </div>
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setIsEditMode(false)}
//             disabled={isSaving}
//             className="gap-1.5 h-8 border-[#F1AF37]/50 text-[#D87331] hover:bg-[#F1AF37]/10"
//           >
//             <XCircle className="h-3.5 w-3.5" />
//             Cancel Edit
//           </Button>
//         </div>
//       )}

//       {/* ── Card 1: Type + Frequency + Dates ── */}
//       <Card className="border-2 shadow-sm">
//         <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 pb-4">
//           <div className="flex items-center gap-3">
//             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
//               <IndianRupee className="h-5 w-5" />
//             </div>
//             <div>
//               <CardTitle className="text-base sm:text-lg">
//                 Salary Structure Configuration
//               </CardTitle>
//               <p className="text-xs text-muted-foreground mt-1">
//                 {existingId ? 'Update compensation and benefits' : 'Define compensation and benefits'}
//               </p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="p-4 sm:p-6 space-y-6">

//           {/* Salary Type */}
//           <div className="space-y-3">
//             <Label className="text-sm font-medium">
//               Salary Type <span className="text-red-500">*</span>
//             </Label>
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               {SALARY_TYPE_OPTIONS.map(type => {
//                 const Icon = type.icon
//                 const isSelected = salaryType === type.value
//                 return (
//                   <button
//                     key={type.value}
//                     type="button"
//                     onClick={() => setSalaryType(type.value)}
//                     className={`relative p-3 rounded-xl border-2 text-left transition-all ${
//                       isSelected
//                         ? 'border-[#F1AF37] bg-gradient-to-br from-[#F1AF37]/10 to-[#D88931]/5 shadow-md'
//                         : 'border-border bg-white hover:border-[#F1AF37]/50 hover:bg-[#F1AF37]/5'
//                     }`}
//                   >
//                     <div className="flex items-start gap-2.5">
//                       <div
//                         className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${type.color} text-white shadow-sm`}
//                       >
//                         <Icon className="h-4 w-4" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p
//                           className={`text-sm font-semibold ${
//                             isSelected ? 'text-[#D87331]' : 'text-foreground'
//                           }`}
//                         >
//                           {type.label}
//                         </p>
//                         <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
//                           {type.description}
//                         </p>
//                       </div>
//                     </div>
//                     {isSelected && (
//                       <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#F1AF37] flex items-center justify-center">
//                         <CheckCircle className="h-3 w-3 text-white" />
//                       </div>
//                     )}
//                   </button>
//                 )
//               })}
//             </div>

//             {/* Calc note for selected type */}
//             {selectedType.calcNote && (
//               <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
//                 <p className="text-xs text-blue-700">{selectedType.calcNote}</p>
//               </div>
//             )}
//           </div>

//           {/* Pay Frequency */}
//           <div className="space-y-3">
//             <Label className="text-sm font-medium">
//               Pay Frequency <span className="text-red-500">*</span>
//             </Label>
//             <div className="flex flex-wrap gap-2">
//               {PAY_FREQUENCY_OPTIONS.map(freq => {
//                 const isSelected = payFrequency === freq.value
//                 return (
//                   <button
//                     key={freq.value}
//                     type="button"
//                     onClick={() => setPayFrequency(freq.value)}
//                     className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
//                       isSelected
//                         ? 'bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white border-transparent shadow-sm'
//                         : 'bg-white border-border text-foreground hover:border-[#F1AF37] hover:bg-[#F1AF37]/5'
//                     }`}
//                   >
//                     {freq.label}
//                   </button>
//                 )
//               })}
//             </div>
//           </div>

//           {/* Dates */}
//           <div className="grid gap-4 sm:grid-cols-2">
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">
//                 Effective From <span className="text-red-500">*</span>
//               </Label>
//               <div className="relative">
//                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
//                 <Input
//                   type="date"
//                   value={effectiveFrom}
//                   onChange={e => setEffectiveFrom(e.target.value)}
//                   className="pl-10 h-11"
//                 />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">
//                 Effective To{' '}
//                 <span className="text-xs text-muted-foreground">(optional)</span>
//               </Label>
//               <div className="relative">
//                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
//                 <Input
//                   type="date"
//                   value={effectiveTo}
//                   onChange={e => setEffectiveTo(e.target.value)}
//                   className="pl-10 h-11"
//                 />
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ── Card 2: Earnings ── */}
//       <Card className="border-2 shadow-sm">
//         <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 pb-4">
//           <div className="flex items-center gap-3">
//             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
//               <selectedType.icon className="h-5 w-5" />
//             </div>
//             <div>
//               <CardTitle className="text-base sm:text-lg">
//                 Earnings — {selectedType.label}
//               </CardTitle>
//               <p className="text-xs text-muted-foreground mt-1">Configure pay components</p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="p-4 sm:p-6">
//           <div className="grid gap-4 sm:grid-cols-2">

//             {showField('basic_salary') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Basic Salary <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('hra') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">HRA (House Rent Allowance)</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={hra} onChange={e => setHra(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('da') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">DA (Dearness Allowance)</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={da} onChange={e => setDa(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('conveyance_allowance') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Conveyance Allowance</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={conveyanceAllowance} onChange={e => setConveyanceAllowance(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('medical_allowance') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Medical Allowance</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={medicalAllowance} onChange={e => setMedicalAllowance(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('per_lecture_rate') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Rate Per Lecture <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={perLectureRate} onChange={e => setPerLectureRate(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('max_lectures_per_month') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Max Lectures / Month</Label>
//                 <div className="relative">
//                   <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={maxLecturesPerMonth} onChange={e => setMaxLecturesPerMonth(e.target.value)} placeholder="0" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('hourly_rate') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Hourly Rate <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('max_hours_per_month') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Max Hours / Month</Label>
//                 <div className="relative">
//                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={maxHoursPerMonth} onChange={e => setMaxHoursPerMonth(e.target.value)} placeholder="0" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('revenue_percentage') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Revenue Percentage <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" max="100" value={revenuePercentage} onChange={e => setRevenuePercentage(e.target.value)} placeholder="0" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}

//             {/* Incentive & Bonus — always shown */}
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">Incentive Amount</Label>
//               <div className="relative">
//                 <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input type="number" min="0" value={incentiveAmount} onChange={e => setIncentiveAmount(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">Bonus Amount</Label>
//               <div className="relative">
//                 <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input type="number" min="0" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ── Card 3: Deductions ── */}
//       <Card className="border-2 shadow-sm border-red-200">
//         <CardHeader className="bg-red-50/30 pb-4">
//           <CardTitle className="text-sm font-semibold text-red-900">Deductions</CardTitle>
//         </CardHeader>
//         <CardContent className="p-4 sm:p-6 space-y-4">
//           {/* PF */}
//           <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
//             <div className="flex items-center gap-3 flex-1">
//               <Checkbox
//                 id="pf"
//                 checked={pfApplicable}
//                 onCheckedChange={c => {
//                   setPfApplicable(c as boolean)
//                   if (!c) setPfPercentage('')
//                 }}
//               />
//               <Label htmlFor="pf" className="text-sm font-medium cursor-pointer">
//                 Provident Fund (PF)
//               </Label>
//             </div>
//             {pfApplicable && (
//               <div className="flex items-center gap-2">
//                 <Input
//                   type="number"
//                   min="0"
//                   max="100"
//                   value={pfPercentage}
//                   onChange={e => setPfPercentage(e.target.value)}
//                   placeholder="12"
//                   className="w-20 h-9 text-sm"
//                 />
//                 <span className="text-sm text-muted-foreground">%</span>
//               </div>
//             )}
//           </div>

//           {/* TDS */}
//           <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
//             <div className="flex items-center gap-3 flex-1">
//               <Checkbox
//                 id="tds"
//                 checked={tdsApplicable}
//                 onCheckedChange={c => {
//                   setTdsApplicable(c as boolean)
//                   if (!c) setTdsPercentage('')
//                 }}
//               />
//               <Label htmlFor="tds" className="text-sm font-medium cursor-pointer">
//                 TDS (Tax Deducted at Source)
//               </Label>
//             </div>
//             {tdsApplicable && (
//               <div className="flex items-center gap-2">
//                 <Input
//                   type="number"
//                   min="0"
//                   max="100"
//                   value={tdsPercentage}
//                   onChange={e => setTdsPercentage(e.target.value)}
//                   placeholder="10"
//                   className="w-20 h-9 text-sm"
//                 />
//                 <span className="text-sm text-muted-foreground">%</span>
//               </div>
//             )}
//           </div>

//           {/* Other Deductions */}
//           <div className="space-y-3">
//             <div className="flex items-center justify-between">
//               <Label className="text-sm font-medium">Other Deductions</Label>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={addOtherDeduction}
//                 className="gap-1.5 h-8 text-xs"
//               >
//                 <Plus className="h-3.5 w-3.5" /> Add
//               </Button>
//             </div>
//             {otherDeductions.length === 0 ? (
//               <p className="text-xs text-muted-foreground italic text-center py-4 border-2 border-dashed rounded-lg">
//                 No other deductions added
//               </p>
//             ) : (
//               <div className="space-y-2">
//                 {otherDeductions.map((d, i) => (
//                   <div key={i} className="flex items-center gap-2">
//                     <Input
//                       value={d.name}
//                       onChange={e => updateOtherDeduction(i, 'name', e.target.value)}
//                       placeholder="Deduction name"
//                       className="h-10 flex-1"
//                     />
//                     <div className="relative w-32 shrink-0">
//                       <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
//                       <Input
//                         type="number"
//                         min="0"
//                         value={d.amount}
//                         onChange={e => updateOtherDeduction(i, 'amount', e.target.value)}
//                         placeholder="0"
//                         className="pl-9 h-10"
//                       />
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => removeOtherDeduction(i)}
//                       className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* ── Card 4: Live Summary + Remarks ── */}
//       <Card className="border-2 bg-gradient-to-br from-[#F1AF37]/5 to-[#D88931]/5 shadow-sm">
//         <CardContent className="p-4 sm:p-6">
//           <h3 className="text-sm font-semibold text-[#D87331] mb-4">Live Salary Summary</h3>

//           {!canPreviewGross ? (
//             <div className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-emerald-200 mb-4">
//               <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
//               <div>
//                 <p className="text-sm font-medium text-emerald-800">Revenue-based salary</p>
//                 <p className="text-xs text-emerald-700 mt-1">
//                   {revenuePercentage ? (
//                     <>
//                       Teacher will earn <strong>{revenuePercentage}%</strong> of actual revenue
//                       generated. Gross cannot be previewed — it is calculated at payout time
//                       based on revenue collected.
//                     </>
//                   ) : (
//                     'Enter revenue percentage above to configure this salary type.'
//                   )}
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <div className="p-4 rounded-lg bg-gradient-to-br from-[#F1AF37]/10 to-[#D88931]/10 border-2 border-[#F1AF37]/30 space-y-2 mb-4">
//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-muted-foreground">Gross Salary:</span>
//                 <span className="font-semibold">₹ {fmt(gross)}</span>
//               </div>
//               <div className="flex justify-between items-center text-sm text-red-600">
//                 <span>Total Deductions:</span>
//                 <span className="font-semibold">- ₹ {fmt(deductions)}</span>
//               </div>
//               {salaryType === 'hybrid' && toNum(revenuePercentage) && (
//                 <div className="flex justify-between items-center text-xs text-muted-foreground">
//                   <span>+ Revenue % (at payout):</span>
//                   <span>{revenuePercentage}%</span>
//                 </div>
//               )}
//               <div className="h-px bg-border my-1" />
//               <div className="flex justify-between items-center">
//                 <span className="font-bold text-[#D87331]">Net Salary:</span>
//                 <span className="font-bold text-lg text-[#D87331]">₹ {fmt(net)}</span>
//               </div>
//             </div>
//           )}

//           <div className="space-y-2">
//             <Label className="text-sm font-medium">
//               Remarks{' '}
//               <span className="text-xs text-muted-foreground">(optional)</span>
//             </Label>
//             <Textarea
//               value={remarks}
//               onChange={e => setRemarks(e.target.value)}
//               placeholder="Any additional notes about this salary structure..."
//               className="resize-none min-h-[80px]"
//             />
//           </div>
//         </CardContent>
//       </Card>

//       {/* ── Save / Cancel ── */}
//       <div className="flex justify-end gap-3 pt-2 pb-4">
//         {existingId && (
//           <Button
//             variant="outline"
//             onClick={() => setIsEditMode(false)}
//             disabled={isSaving}
//             className="h-11 px-6"
//           >
//             Cancel
//           </Button>
//         )}
//         <Button
//           onClick={handleSave}
//           disabled={isSaving}
//           className="gap-2 bg-gradient-to-r from-[#F1AF37] to-[#D88931] hover:from-[#F1AF37]/90 hover:to-[#D88931]/90 shadow-md h-11 px-8 disabled:opacity-50"
//         >
//           {isSaving ? (
//             <>
//               <Loader2 className="h-4 w-4 animate-spin" />
//               Saving...
//             </>
//           ) : (
//             <>
//               <Save className="h-4 w-4" />
//               {existingId ? 'Update Structure' : 'Save Structure'}
//             </>
//           )}
//         </Button>
//       </div>
//     </div>
//   )
// }








//22-03-2026
// 'use client'

// import React, { useState, useEffect, useCallback } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Checkbox } from '@/components/ui/checkbox'
// import { Textarea } from '@/components/ui/textarea'
// import { Badge } from '@/components/ui/badge'
// import {
//   Dialog, DialogContent, DialogHeader,
//   DialogTitle, DialogDescription, DialogFooter,
// } from '@/components/ui/dialog'
// import {
//   IndianRupee, Clock, BookOpen, TrendingUp, Layers,
//   Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle,
//   Calendar, Percent, Hash, Edit2, Info, XCircle,
// } from 'lucide-react'
// import { teachersApi, type TeacherSalaryStructure } from '@/lib/api/teachers'

// // ─── Types ────────────────────────────────────────────────────────────────────

// type SalaryType = 'fixed_monthly' | 'per_lecture' | 'hourly' | 'percentage' | 'hybrid'
// type PayFrequency = 'monthly' | 'weekly' | 'bi_weekly' | 'per_session'

// interface OtherDeduction {
//   name: string
//   amount: string
// }

// interface ModalState {
//   open: boolean
//   type: 'success' | 'error'
//   title: string
//   message: string
// }

// interface SalaryStructureTabProps {
//   teacherId: string
//   onNotify?: (n: { type: 'success' | 'error'; message: string }) => void
// }

// // ─── Salary Type Config ───────────────────────────────────────────────────────

// const SALARY_TYPE_OPTIONS: {
//   value: SalaryType
//   label: string
//   description: string
//   icon: React.ElementType
//   color: string
//   fields: string[]
//   calcNote?: string
// }[] = [
//   {
//     value: 'fixed_monthly',
//     label: 'Fixed Monthly',
//     description: 'Fixed salary with allowances every month',
//     icon: IndianRupee,
//     color: 'from-[#1897C6] to-[#67BAC3]',
//     fields: ['basic_salary', 'hra', 'da', 'conveyance_allowance', 'medical_allowance'],
//   },
//   {
//     value: 'per_lecture',
//     label: 'Per Lecture',
//     description: 'Paid per lecture/session delivered',
//     icon: BookOpen,
//     color: 'from-[#F1AF37] to-[#D88931]',
//     fields: ['per_lecture_rate', 'max_lectures_per_month'],
//     calcNote: 'Gross = Rate Per Lecture × Max Lectures Per Month',
//   },
//   {
//     value: 'hourly',
//     label: 'Hourly',
//     description: 'Paid based on hours worked',
//     icon: Clock,
//     color: 'from-purple-500 to-purple-700',
//     fields: ['hourly_rate', 'max_hours_per_month'],
//     calcNote: 'Gross = Hourly Rate × Max Hours Per Month',
//   },
//   {
//     value: 'percentage',
//     label: 'Percentage',
//     description: "Earns a percentage of revenue generated",
//     icon: TrendingUp,
//     color: 'from-emerald-500 to-emerald-700',
//     fields: ['revenue_percentage'],
//     calcNote: 'Gross depends on actual revenue at payout time — live preview not available.',
//   },
//   {
//     value: 'hybrid',
//     label: 'Hybrid',
//     description: 'Fixed base combined with variable pay components',
//     icon: Layers,
//     color: 'from-rose-500 to-rose-700',
//     fields: ['basic_salary', 'per_lecture_rate', 'hourly_rate', 'revenue_percentage'],
//     calcNote:
//       'Gross = Fixed Base + Per Lecture + Hourly. Revenue % is paid additionally at payout.',
//   },
// ]

// const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
//   { value: 'monthly', label: 'Monthly' },
//   { value: 'weekly', label: 'Weekly' },
//   { value: 'bi_weekly', label: 'Bi-Weekly' },
//   { value: 'per_session', label: 'Per Session' },
// ]

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const toNum = (v: string): number | null => {
//   const n = parseFloat(v)
//   return isNaN(n) ? null : n
// }

// const toInt = (v: string): number | null => {
//   const n = parseInt(v)
//   return isNaN(n) ? null : n
// }

// const fmt = (n?: number | null) =>
//   n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'

// const fmtDate = (d?: string) =>
//   d
//     ? new Date(d).toLocaleDateString('en-IN', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//       })
//     : '—'

// // ─── Result Modal ─────────────────────────────────────────────────────────────

// function ResultModal({
//   modal,
//   onClose,
// }: {
//   modal: ModalState
//   onClose: () => void
// }) {

//     useEffect(() => {
//   if (!modal.open) return
//   if (modal.type !== 'success') return
//   const timer = setTimeout(onClose, 3000)
//   return () => clearTimeout(timer)
// }, [modal.open, modal.type, onClose])

//   return (
//     <Dialog open={modal.open} onOpenChange={onClose}>
//       <DialogContent className="max-w-sm">
//         <DialogHeader>
//  <DialogTitle
//             className={`flex items-center gap-2 ${
//               modal.type === 'success' ? 'text-emerald-700' : 'text-red-600'
//             }`}
//           >
//             {modal.type === 'success' ? (
//               <CheckCircle className="h-5 w-5 text-emerald-500" />
//             ) : (
//               <XCircle className="h-5 w-5 text-red-500" />
//             )}
//             {modal.title}
//           </DialogTitle>
//           {modal.type === 'success' && (
//             <p className="text-xs text-muted-foreground pt-1">This message will close automatically.</p>
//           )}

//           <DialogDescription className="text-sm text-foreground pt-1">
//             {modal.message}
//           </DialogDescription>
//         </DialogHeader>
//         <DialogFooter>
//           <Button
//             onClick={onClose}
//             className={
//               modal.type === 'success'
//                 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
//                 : 'bg-red-500 hover:bg-red-600'
//             }
//           >
//             OK
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }



// // ─── Main Component ───────────────────────────────────────────────────────────

// export default function SalaryStructureTab({
//   teacherId,
//   onNotify,
// }: SalaryStructureTabProps) {
//   const adminId =
//     typeof window !== 'undefined' ? localStorage.getItem('adminId') || '' : ''

//   // ── Modal ──────────────────────────────────────────────────────────────────
//   const [modal, setModal] = useState<ModalState>({
//     open: false,
//     type: 'success',
//     title: '',
//     message: '',
//   })
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

// const closeModal = useCallback(() => setModal(m => ({ ...m, open: false })), [])

//   const showModal = useCallback((type: 'success' | 'error', title: string, message: string) => {
//     setModal({ open: true, type, title, message })
//     onNotify?.({ type, message })
//   }, [onNotify])

//   // ── State ──────────────────────────────────────────────────────────────────
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSaving, setIsSaving] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [loadError, setLoadError] = useState('')
//   const [existingId, setExistingId] = useState<string | null>(null)
//   const [isEditMode, setIsEditMode] = useState(false)

//   // Core
//   const [salaryType, setSalaryType] = useState<SalaryType>('fixed_monthly')
//   const [payFrequency, setPayFrequency] = useState<PayFrequency>('monthly')
//   const [effectiveFrom, setEffectiveFrom] = useState('')
//   const [effectiveTo, setEffectiveTo] = useState('')
//   const [remarks, setRemarks] = useState('')

//   // Allowances
//   const [basicSalary, setBasicSalary] = useState('')
//   const [hra, setHra] = useState('')
//   const [da, setDa] = useState('')
//   const [conveyanceAllowance, setConveyanceAllowance] = useState('')
//   const [medicalAllowance, setMedicalAllowance] = useState('')
//   const [incentiveAmount, setIncentiveAmount] = useState('')
//   const [bonusAmount, setBonusAmount] = useState('')

//   // Variable
//   const [perLectureRate, setPerLectureRate] = useState('')
//   const [maxLecturesPerMonth, setMaxLecturesPerMonth] = useState('')
//   const [hourlyRate, setHourlyRate] = useState('')
//   const [maxHoursPerMonth, setMaxHoursPerMonth] = useState('')
//   const [revenuePercentage, setRevenuePercentage] = useState('')

//   // Deductions
//   const [pfApplicable, setPfApplicable] = useState(false)
//   const [pfPercentage, setPfPercentage] = useState('')
//   const [tdsApplicable, setTdsApplicable] = useState(false)
//   const [tdsPercentage, setTdsPercentage] = useState('')
//   const [otherDeductions, setOtherDeductions] = useState<OtherDeduction[]>([])

//   // ── Reset form ─────────────────────────────────────────────────────────────
//   const resetForm = () => {
//     setSalaryType('fixed_monthly')
//     setPayFrequency('monthly')
//     setEffectiveFrom('')
//     setEffectiveTo('')
//     setRemarks('')
//     setBasicSalary('')
//     setHra('')
//     setDa('')
//     setConveyanceAllowance('')
//     setMedicalAllowance('')
//     setIncentiveAmount('')
//     setBonusAmount('')
//     setPerLectureRate('')
//     setMaxLecturesPerMonth('')
//     setHourlyRate('')
//     setMaxHoursPerMonth('')
//     setRevenuePercentage('')
//     setPfApplicable(false)
//     setPfPercentage('')
//     setTdsApplicable(false)
//     setTdsPercentage('')
//     setOtherDeductions([])
//   }

//   // ── Populate form ──────────────────────────────────────────────────────────
//   const populateForm = useCallback((s: TeacherSalaryStructure) => {
//     setSalaryType(s.salary_type)
//     setPayFrequency(s.pay_frequency)
//     setEffectiveFrom(s.effective_from ? s.effective_from.slice(0, 10) : '')
//     setEffectiveTo(s.effective_to ? s.effective_to.slice(0, 10) : '')
//     setRemarks(s.remarks || '')
//     setBasicSalary(s.basic_salary != null ? String(s.basic_salary) : '')
//     setHra(s.hra != null ? String(s.hra) : '')
//     setDa(s.da != null ? String(s.da) : '')
//     setConveyanceAllowance(s.conveyance_allowance != null ? String(s.conveyance_allowance) : '')
//     setMedicalAllowance(s.medical_allowance != null ? String(s.medical_allowance) : '')
//     setIncentiveAmount(s.incentive_amount != null ? String(s.incentive_amount) : '')
//     setBonusAmount(s.bonus_amount != null ? String(s.bonus_amount) : '')
//     setPerLectureRate(s.per_lecture_rate != null ? String(s.per_lecture_rate) : '')
//     setMaxLecturesPerMonth(
//       s.max_lectures_per_month != null ? String(s.max_lectures_per_month) : ''
//     )
//     setHourlyRate(s.hourly_rate != null ? String(s.hourly_rate) : '')
//     setMaxHoursPerMonth(s.max_hours_per_month != null ? String(s.max_hours_per_month) : '')
//     setRevenuePercentage(s.revenue_percentage != null ? String(s.revenue_percentage) : '')
//     setPfApplicable(s.pf_applicable || false)
//     setPfPercentage(s.pf_percentage != null ? String(s.pf_percentage) : '')
//     setTdsApplicable(s.tds_applicable || false)
//     setTdsPercentage(s.tds_percentage != null ? String(s.tds_percentage) : '')
//     setOtherDeductions(
//       s.other_deductions?.map(d => ({ name: d.name, amount: String(d.amount) })) || []
//     )
//   }, [])

//   // ── Fetch ──────────────────────────────────────────────────────────────────
//   const fetchData = useCallback(async () => {
//     setIsLoading(true)
//     setLoadError('')
//     try {
//       const res = await teachersApi.getActiveSalaryStructureByTeacher(teacherId)
//       if (res.success && res.result) {
//         const s = res.result as TeacherSalaryStructure
//         setExistingId(s._id || null)
//         populateForm(s)
//         setIsEditMode(false)
//       } else {
//         setExistingId(null)
//         setIsEditMode(true)
//       }
//     } catch {
//       // 404 = no salary structure yet — blank create form
//       setExistingId(null)
//       setIsEditMode(true)
//     } finally {
//       setIsLoading(false)
//     }
//   }, [teacherId, populateForm])

//   useEffect(() => {
//     fetchData()
//   }, [fetchData])

//   // ── Calculations ───────────────────────────────────────────────────────────

//   // Percentage type gross cannot be previewed — depends on actual revenue
//   const canPreviewGross = salaryType !== 'percentage'

//   const calcGross = (): number => {
//     switch (salaryType) {
//       case 'fixed_monthly':
//         return (
//           (toNum(basicSalary) || 0) +
//           (toNum(hra) || 0) +
//           (toNum(da) || 0) +
//           (toNum(conveyanceAllowance) || 0) +
//           (toNum(medicalAllowance) || 0) +
//           (toNum(incentiveAmount) || 0) +
//           (toNum(bonusAmount) || 0)
//         )

//       case 'per_lecture': {
//         // Gross = rate × max lectures. If max not set, show per-lecture rate as minimum unit.
//         const rate = toNum(perLectureRate) || 0
//         const max = toInt(maxLecturesPerMonth) || 0
//         const base = max > 0 ? rate * max : rate
//         return base + (toNum(incentiveAmount) || 0) + (toNum(bonusAmount) || 0)
//       }

//       case 'hourly': {
//         // Gross = hourly rate × max hours. If max not set, show rate as minimum unit.
//         const rate = toNum(hourlyRate) || 0
//         const max = toInt(maxHoursPerMonth) || 0
//         const base = max > 0 ? rate * max : rate
//         return base + (toNum(incentiveAmount) || 0) + (toNum(bonusAmount) || 0)
//       }

//       case 'percentage':
//         // Cannot calculate — actual revenue not known at config time
//         return 0

//       case 'hybrid': {
//         // Fixed base + per-lecture component + hourly component
//         // Revenue % part is EXCLUDED from preview — paid separately at payout
//         const fixed = toNum(basicSalary) || 0
//         const lectureRate = toNum(perLectureRate) || 0
//         const lectureMax = toInt(maxLecturesPerMonth) || 0
//         const lectureComponent = lectureMax > 0 ? lectureRate * lectureMax : lectureRate
//         const hrlyRate = toNum(hourlyRate) || 0
//         const hrlyMax = toInt(maxHoursPerMonth) || 0
//         const hourlyComponent = hrlyMax > 0 ? hrlyRate * hrlyMax : hrlyRate
//         return (
//           fixed +
//           lectureComponent +
//           hourlyComponent +
//           (toNum(incentiveAmount) || 0) +
//           (toNum(bonusAmount) || 0)
//         )
//       }

//       default:
//         return 0
//     }
//   }

//   const calcDeductions = (): number => {
//     if (!canPreviewGross) return 0
//     const gross = calcGross()
//     let total = 0
//     if (pfApplicable && pfPercentage) total += gross * ((toNum(pfPercentage) || 0) / 100)
//     if (tdsApplicable && tdsPercentage) total += gross * ((toNum(tdsPercentage) || 0) / 100)
//     otherDeductions.forEach(d => {
//       total += toNum(d.amount) || 0
//     })
//     return Math.round(total * 100) / 100
//   }

//   const calcNet = (): number => Math.max(0, calcGross() - calcDeductions())

//   // ── Validation ─────────────────────────────────────────────────────────────
//   const validate = (): string | null => {
//     if (!effectiveFrom) return 'Effective from date is required.'
//     if (salaryType === 'fixed_monthly' && !basicSalary)
//       return 'Basic salary is required for Fixed Monthly type.'
//     if (salaryType === 'per_lecture' && !perLectureRate)
//       return 'Rate per lecture is required for Per Lecture type.'
//     if (salaryType === 'hourly' && !hourlyRate)
//       return 'Hourly rate is required for Hourly type.'
//     if (salaryType === 'percentage') {
//       if (!revenuePercentage) return 'Revenue percentage is required.'
//       if ((toNum(revenuePercentage) || 0) > 100)
//         return 'Revenue percentage cannot exceed 100%.'
//     }
//     if (salaryType === 'hybrid' && !basicSalary)
//       return 'Basic salary is required for Hybrid type.'
//     if (pfApplicable && !pfPercentage) return 'Please enter PF percentage.'
//     if (pfApplicable && (toNum(pfPercentage) || 0) > 100)
//       return 'PF percentage cannot exceed 100%.'
//     if (tdsApplicable && !tdsPercentage) return 'Please enter TDS percentage.'
//     if (tdsApplicable && (toNum(tdsPercentage) || 0) > 100)
//       return 'TDS percentage cannot exceed 100%.'
//     for (const d of otherDeductions) {
//       if (d.name.trim() && !d.amount) return `Please enter amount for deduction "${d.name}".`
//       if (!d.name.trim() && d.amount) return 'Please enter name for all deductions.'
//     }
//     return null
//   }

//   // ── Other Deductions ───────────────────────────────────────────────────────
//   const addOtherDeduction = () =>
//     setOtherDeductions(prev => [...prev, { name: '', amount: '' }])

//   const updateOtherDeduction = (i: number, field: 'name' | 'amount', val: string) =>
//     setOtherDeductions(prev => prev.map((d, idx) => (idx === i ? { ...d, [field]: val } : d)))

//   const removeOtherDeduction = (i: number) =>
//     setOtherDeductions(prev => prev.filter((_, idx) => idx !== i))

//   // ── Build payload ──────────────────────────────────────────────────────────
//   const buildPayload = (): TeacherSalaryStructure => ({
//     teacher_id: teacherId,
//     salary_type: salaryType,
//     pay_frequency: payFrequency,
//     currency: 'INR',
//     effective_from: effectiveFrom,
//     effective_to: effectiveTo || undefined,
//     remarks: remarks.trim() || undefined,
//     basic_salary: toNum(basicSalary),
//     hra: toNum(hra),
//     da: toNum(da),
//     conveyance_allowance: toNum(conveyanceAllowance),
//     medical_allowance: toNum(medicalAllowance),
//     incentive_amount: toNum(incentiveAmount),
//     bonus_amount: toNum(bonusAmount),
//     per_lecture_rate: toNum(perLectureRate),
//     max_lectures_per_month: toInt(maxLecturesPerMonth),
//     hourly_rate: toNum(hourlyRate),
//     max_hours_per_month: toInt(maxHoursPerMonth),
//     revenue_percentage: toNum(revenuePercentage),
//     pf_applicable: pfApplicable,
//     pf_percentage: pfApplicable ? toNum(pfPercentage) : null,
//     tds_applicable: tdsApplicable,
//     tds_percentage: tdsApplicable ? toNum(tdsPercentage) : null,
//     other_deductions: otherDeductions
//       .filter(d => d.name.trim() && d.amount)
//       .map(d => ({ name: d.name.trim(), amount: toNum(d.amount) || 0 })),
//     ...(adminId && { approved_by: adminId }),
//   })

//   // ── Save (Create / Update) ─────────────────────────────────────────────────
//   const handleSave = async () => {
//     const err = validate()
//     if (err) {
//       showModal('error', 'Validation Error', err)
//       return
//     }
//     setIsSaving(true)
//     try {
//       const payload = buildPayload()
//       let res
//       if (existingId) {
//         // backend updateValidation does NOT allow teacher_id
//         const { teacher_id, ...updatePayload } = payload
//         res = await teachersApi.updateSalaryStructure(existingId, updatePayload)
//       } else {
//         res = await teachersApi.createSalaryStructure(payload)
//       }
//       if (res.success && res.result) {
//         const saved = res.result as TeacherSalaryStructure
//         setExistingId(saved._id || null)
//         populateForm(saved)
//         setIsEditMode(false)
//         showModal(
//           'success',
//           existingId ? 'Salary Updated' : 'Salary Structure Created',
//           existingId
//             ? 'Salary structure has been updated successfully.'
//             : 'Salary structure has been created and saved successfully.'
//         )
//       } else {
//         showModal(
//           'error',
//           'Save Failed',
//           res.message || 'Failed to save salary structure. Please try again.'
//         )
//       }
//     } catch (err: any) {
//       showModal('error', 'Error', err?.message || 'Something went wrong. Please try again.')
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // ── Delete ─────────────────────────────────────────────────────────────────
//   const handleDelete = async () => {
//     if (!existingId) return
//     setIsDeleting(true)
//     try {
//       const res = await teachersApi.deleteSalaryStructure(existingId)
//       if (res.success) {
//         setExistingId(null)
//         setIsEditMode(true)
//         setDeleteConfirmOpen(false)
//         resetForm()
//         showModal('success', 'Deleted', 'Salary structure has been deleted successfully.')
//       } else {
//         setDeleteConfirmOpen(false)
//         showModal('error', 'Delete Failed', res.message || 'Failed to delete salary structure.')
//       }
//     } catch (err: any) {
//       setDeleteConfirmOpen(false)
//       showModal('error', 'Error', err?.message || 'Something went wrong while deleting.')
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   // ── Field visibility ───────────────────────────────────────────────────────
//   const showField = (field: string) =>
//     SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)?.fields.includes(field) || false

//   const selectedType = SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)!
//   const gross = calcGross()
//   const deductions = calcDeductions()
//   const net = calcNet()

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 gap-3">
//         <Loader2 className="h-8 w-8 animate-spin text-[#F1AF37]" />
//         <p className="text-sm text-muted-foreground">Loading salary structure...</p>
//       </div>
//     )
//   }

//   if (loadError) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 gap-3">
//         <AlertCircle className="h-8 w-8 text-red-500" />
//         <p className="text-sm text-red-600 font-medium">{loadError}</p>
//         <Button variant="outline" size="sm" onClick={fetchData}>
//           Retry
//         </Button>
//       </div>
//     )
//   }

//   // ─── View Mode ────────────────────────────────────────────────────────────
//   if (existingId && !isEditMode) {
//     const typeInfo = SALARY_TYPE_OPTIONS.find(t => t.value === salaryType)!
//     const TypeIcon = typeInfo.icon
//     return (
//       <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
//        <ResultModal modal={modal} onClose={closeModal} />

//         {/* Header */}
//         <Card className="border-2 shadow-sm">
//           <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 pb-4">
//             <div className="flex items-center justify-between flex-wrap gap-3">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
//                   <IndianRupee className="h-5 w-5" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-base sm:text-lg">Salary Structure</CardTitle>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     Active since {fmtDate(effectiveFrom)}
//                     {effectiveTo && ` · Till ${fmtDate(effectiveTo)}`}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2 flex-wrap">
//                 <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
//                   Active
//                 </Badge>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setIsEditMode(true)}
//                   className="gap-2 h-9"
//                 >
//                   <Edit2 className="h-3.5 w-3.5" /> 
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setDeleteConfirmOpen(true)}
//                   className="gap-2 h-9 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400"
//                 >
//                   <Trash2 className="h-3.5 w-3.5" /> 
//                 </Button>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent className="p-4 sm:p-6 space-y-4">
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">Salary Type</p>
//                 <div className="flex items-center gap-2">
//                   <div
//                     className={`flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br ${typeInfo.color} text-white shrink-0`}
//                   >
//                     <TypeIcon className="h-3 w-3" />
//                   </div>
//                   <p className="text-sm font-semibold">{typeInfo.label}</p>
//                 </div>
//               </div>
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">Pay Frequency</p>
//                 <p className="text-sm font-semibold capitalize">
//                   {payFrequency.replace(/_/g, ' ')}
//                 </p>
//               </div>
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">Currency</p>
//                 <p className="text-sm font-semibold">INR (₹)</p>
//               </div>
//               <div className="p-3 rounded-lg bg-muted/30 border">
//                 <p className="text-xs text-muted-foreground mb-1">PF / TDS</p>
//                 <p className="text-sm font-semibold">
//                   {pfApplicable ? `PF ${pfPercentage}%` : 'No PF'}
//                   {tdsApplicable ? ` · TDS ${tdsPercentage}%` : ' · No TDS'}
//                 </p>
//               </div>
//             </div>
            
//             {remarks && (
//               <div className="p-3 rounded-lg bg-muted/20 border text-sm text-muted-foreground">
//                 <span className="font-medium text-foreground">Remarks: </span>
//                 {remarks}
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Summary */}
//         <Card className="border-2 bg-gradient-to-br from-[#F1AF37]/5 to-[#D88931]/5 shadow-sm">
//           <CardContent className="p-4 sm:p-6">
//             <h3 className="text-sm font-semibold text-[#D87331] mb-4">Salary Summary</h3>
//             {!canPreviewGross ? (
//               <div className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-emerald-200">
//                 <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm font-medium text-emerald-800">Revenue-based salary</p>
//                   <p className="text-xs text-emerald-700 mt-1">
//                     This teacher earns{' '}
//                     <strong>{revenuePercentage}%</strong> of revenue generated. Actual payout
//                     depends on revenue collected at time of salary processing.
//                   </p>
//                 </div>
//               </div>
//             ) : (
// <div className="p-4 rounded-lg bg-gradient-to-br from-[#F1AF37]/10 to-[#D88931]/10 border-2 border-[#F1AF37]/30 space-y-2">
//                 <div className="flex justify-between items-center text-sm">
//                   <span className="text-muted-foreground">Gross Salary:</span>
//                   <span className="font-semibold">₹ {fmt(gross)}</span>
//                 </div>
//                 <div className="flex justify-between items-center text-sm text-red-600">
//                   <span>Total Deductions:</span>
//                   <span className="font-semibold">- ₹ {fmt(deductions)}</span>
//                 </div>
//                 {salaryType === 'hybrid' && toNum(revenuePercentage) && (
//                   <div className="flex justify-between items-center text-xs text-muted-foreground">
//                     <span>+ Revenue % (at payout):</span>
//                     <span>{revenuePercentage}%</span>
//                   </div>
//                 )}
//                 <div className="h-px bg-border my-1" />
//                 <div className="flex justify-between items-center">
//                   <span className="font-bold text-[#D87331]">Net Salary:</span>
//                   <span className="font-bold text-lg text-[#D87331]">₹ {fmt(net)}</span>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Delete Confirm Dialog */}
//         <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
//           <DialogContent className="max-w-sm">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2 text-red-600">
//                 <Trash2 className="h-5 w-5" /> Delete Salary Structure?
//               </DialogTitle>
//               <DialogDescription>
//                 This action cannot be undone. The salary structure will be permanently deleted
//                 and you will need to create a new one.
//               </DialogDescription>
//             </DialogHeader>
//             <DialogFooter className="gap-2">
//               <Button
//                 variant="outline"
//                 onClick={() => setDeleteConfirmOpen(false)}
//                 disabled={isDeleting}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleDelete}
//                 disabled={isDeleting}
//                 className="bg-red-500 hover:bg-red-600 gap-2"
//               >
//                 {isDeleting ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   'Confirm Delete'
//                 )}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//     )
//   }

//   // ─── Create / Edit Form ────────────────────────────────────────────────────
//   return (
//     <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
//       <ResultModal modal={modal} onClose={closeModal} />

//           {/* ── Edit Mode Banner ── */}
//       {existingId && (
//         <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#F1AF37] bg-[#F1AF37]/10">
//           <div className="flex items-center gap-2.5">
//             <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
//               <Edit2 className="h-3.5 w-3.5" />
//             </div>
//             <div>
//               <p className="text-sm font-semibold text-[#D87331]">Edit Mode</p>
//               <p className="text-xs text-muted-foreground">You are editing an existing salary structure</p>
//             </div>
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setIsEditMode(false)}
//             disabled={isSaving}
//             className="gap-1.5 h-8 border-[#F1AF37]/50 text-[#D87331] hover:bg-[#F1AF37]/10"
//           >
//             <XCircle className="h-3.5 w-3.5" />
//             Cancel Edit
//           </Button>
//         </div>
//       )}

//       {/* ── Card 1: Type + Frequency + Dates ── */}
//       <Card className="border-2 shadow-sm">
//         <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 pb-4">
//           <div className="flex items-center gap-3">
//             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white shadow-sm">
//               <IndianRupee className="h-5 w-5" />
//             </div>
//             <div>
//               <CardTitle className="text-base sm:text-lg">
//                 Salary Structure Configuration
//               </CardTitle>
//               <p className="text-xs text-muted-foreground mt-1">
//                 {existingId ? 'Update compensation and benefits' : 'Define compensation and benefits'}
//               </p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="p-4 sm:p-6 space-y-6">

//           {/* Salary Type */}
//           <div className="space-y-3">
//             <Label className="text-sm font-medium">
//               Salary Type <span className="text-red-500">*</span>
//             </Label>
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               {SALARY_TYPE_OPTIONS.map(type => {
//                 const Icon = type.icon
//                 const isSelected = salaryType === type.value
//                 return (
//                   <button
//                     key={type.value}
//                     type="button"
//                     onClick={() => setSalaryType(type.value)}
//                     className={`relative p-3 rounded-xl border-2 text-left transition-all ${
//                       isSelected
//                         ? 'border-[#F1AF37] bg-gradient-to-br from-[#F1AF37]/10 to-[#D88931]/5 shadow-md'
//                         : 'border-border bg-white hover:border-[#F1AF37]/50 hover:bg-[#F1AF37]/5'
//                     }`}
//                   >
//                     <div className="flex items-start gap-2.5">
//                       <div
//                         className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${type.color} text-white shadow-sm`}
//                       >
//                         <Icon className="h-4 w-4" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p
//                           className={`text-sm font-semibold ${
//                             isSelected ? 'text-[#D87331]' : 'text-foreground'
//                           }`}
//                         >
//                           {type.label}
//                         </p>
//                         <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
//                           {type.description}
//                         </p>
//                       </div>
//                     </div>
//                     {isSelected && (
//                       <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#F1AF37] flex items-center justify-center">
//                         <CheckCircle className="h-3 w-3 text-white" />
//                       </div>
//                     )}
//                   </button>
//                 )
//               })}
//             </div>

//             {/* Calc note for selected type */}
//             {selectedType.calcNote && (
//               <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
//                 <p className="text-xs text-blue-700">{selectedType.calcNote}</p>
//               </div>
//             )}
//           </div>

//           {/* Pay Frequency */}
//           <div className="space-y-3">
//             <Label className="text-sm font-medium">
//               Pay Frequency <span className="text-red-500">*</span>
//             </Label>
//             <div className="flex flex-wrap gap-2">
//               {PAY_FREQUENCY_OPTIONS.map(freq => {
//                 const isSelected = payFrequency === freq.value
//                 return (
//                   <button
//                     key={freq.value}
//                     type="button"
//                     onClick={() => setPayFrequency(freq.value)}
//                     className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
//                       isSelected
//                         ? 'bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white border-transparent shadow-sm'
//                         : 'bg-white border-border text-foreground hover:border-[#F1AF37] hover:bg-[#F1AF37]/5'
//                     }`}
//                   >
//                     {freq.label}
//                   </button>
//                 )
//               })}
//             </div>
//           </div>

//           {/* Dates */}
//           <div className="grid gap-4 sm:grid-cols-2">
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">
//                 Effective From <span className="text-red-500">*</span>
//               </Label>
//               <div className="relative">
//                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
//                 <Input
//                   type="date"
//                   value={effectiveFrom}
//                   onChange={e => setEffectiveFrom(e.target.value)}
//                   className="pl-10 h-11"
//                 />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">
//                 Effective To{' '}
//                 <span className="text-xs text-muted-foreground">(optional)</span>
//               </Label>
//               <div className="relative">
//                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
//                 <Input
//                   type="date"
//                   value={effectiveTo}
//                   onChange={e => setEffectiveTo(e.target.value)}
//                   className="pl-10 h-11"
//                 />
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ── Card 2: Earnings ── */}
//       <Card className="border-2 shadow-sm">
//         <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 pb-4">
//           <div className="flex items-center gap-3">
//             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
//               <selectedType.icon className="h-5 w-5" />
//             </div>
//             <div>
//               <CardTitle className="text-base sm:text-lg">
//                 Earnings — {selectedType.label}
//               </CardTitle>
//               <p className="text-xs text-muted-foreground mt-1">Configure pay components</p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="p-4 sm:p-6">
//           <div className="grid gap-4 sm:grid-cols-2">

//             {showField('basic_salary') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Basic Salary <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('hra') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">HRA (House Rent Allowance)</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={hra} onChange={e => setHra(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('da') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">DA (Dearness Allowance)</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={da} onChange={e => setDa(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('conveyance_allowance') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Conveyance Allowance</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={conveyanceAllowance} onChange={e => setConveyanceAllowance(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('medical_allowance') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Medical Allowance</Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={medicalAllowance} onChange={e => setMedicalAllowance(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('per_lecture_rate') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Rate Per Lecture <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={perLectureRate} onChange={e => setPerLectureRate(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('max_lectures_per_month') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Max Lectures / Month</Label>
//                 <div className="relative">
//                   <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={maxLecturesPerMonth} onChange={e => setMaxLecturesPerMonth(e.target.value)} placeholder="0" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('hourly_rate') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Hourly Rate <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('max_hours_per_month') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Max Hours / Month</Label>
//                 <div className="relative">
//                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" value={maxHoursPerMonth} onChange={e => setMaxHoursPerMonth(e.target.value)} placeholder="0" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}
//             {showField('revenue_percentage') && (
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">
//                   Revenue Percentage <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input type="number" min="0" max="100" value={revenuePercentage} onChange={e => setRevenuePercentage(e.target.value)} placeholder="0" className="pl-10 h-11" />
//                 </div>
//               </div>
//             )}

//             {/* Incentive & Bonus — always shown */}
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">Incentive Amount</Label>
//               <div className="relative">
//                 <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input type="number" min="0" value={incentiveAmount} onChange={e => setIncentiveAmount(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label className="text-sm font-medium">Bonus Amount</Label>
//               <div className="relative">
//                 <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input type="number" min="0" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="0.00" className="pl-10 h-11" />
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

// <Card className="border-2 shadow-sm border-red-200">
//         <CardHeader className="bg-red-50/30 pb-4">
//           <CardTitle className="text-sm font-semibold text-red-900">Deductions</CardTitle>
//         </CardHeader>
//         <CardContent className="p-4 sm:p-6 space-y-4">
//  {/* PF */}
//           <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
//             <div className="flex items-center gap-3 flex-1">
//               <Checkbox
//                 id="pf"
//                 checked={pfApplicable}
//                 onCheckedChange={c => {
//                   setPfApplicable(c as boolean)
//                   if (!c) setPfPercentage('')
//                 }}
//               />
//               <Label htmlFor="pf" className="text-sm font-medium cursor-pointer">
//                 Provident Fund (PF)
//               </Label>
//             </div>
//             {pfApplicable && (
//               <div className="flex items-center gap-2">
//                 <Input
//                   type="number"
//                   min="0"
//                   max="100"
//                   value={pfPercentage}
//                   onChange={e => setPfPercentage(e.target.value)}
//                   placeholder="12"
//                   className="w-20 h-9 text-sm"
//                 />
//                 <span className="text-sm text-muted-foreground">%</span>
//               </div>
//             )}
//           </div>

//           {/* TDS */}
//           <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
//             <div className="flex items-center gap-3 flex-1">
//               <Checkbox
//                 id="tds"
//                 checked={tdsApplicable}
//                 onCheckedChange={c => {
//                   setTdsApplicable(c as boolean)
//                   if (!c) setTdsPercentage('')
//                 }}
//               />
//               <Label htmlFor="tds" className="text-sm font-medium cursor-pointer">
//                 TDS (Tax Deducted at Source)
//               </Label>
//             </div>
//             {tdsApplicable && (
//               <div className="flex items-center gap-2">
//                 <Input
//                   type="number"
//                   min="0"
//                   max="100"
//                   value={tdsPercentage}
//                   onChange={e => setTdsPercentage(e.target.value)}
//                   placeholder="10"
//                   className="w-20 h-9 text-sm"
//                 />
//                 <span className="text-sm text-muted-foreground">%</span>
//               </div>
//             )}
//           </div>

//           {/* Other Deductions */}
//           <div className="space-y-3">
//             <div className="flex items-center justify-between">
//               <Label className="text-sm font-medium">Other Deductions</Label>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={addOtherDeduction}
//                 className="gap-1.5 h-8 text-xs"
//               >
//                 <Plus className="h-3.5 w-3.5" /> Add
//               </Button>
//             </div>
//             {otherDeductions.length === 0 ? (
//               <p className="text-xs text-muted-foreground italic text-center py-4 border-2 border-dashed rounded-lg">
//                 No other deductions added
//               </p>
//             ) : (
//               <div className="space-y-2">
//                 {otherDeductions.map((d, i) => (
//                   <div key={i} className="flex items-center gap-2">
//                     <Input
//                       value={d.name}
//                       onChange={e => updateOtherDeduction(i, 'name', e.target.value)}
//                       placeholder="Deduction name"
//                       className="h-10 flex-1"
//                     />
//                     <div className="relative w-32 shrink-0">
//                       <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
//                       <Input
//                         type="number"
//                         min="0"
//                         value={d.amount}
//                         onChange={e => updateOtherDeduction(i, 'amount', e.target.value)}
//                         placeholder="0"
//                         className="pl-9 h-10"
//                       />
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => removeOtherDeduction(i)}
//                       className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* ── Card 4: Live Summary + Remarks ── */}
//       <Card className="border-2 bg-gradient-to-br from-[#F1AF37]/5 to-[#D88931]/5 shadow-sm">
//         <CardContent className="p-4 sm:p-6">
//           <h3 className="text-sm font-semibold text-[#D87331] mb-4">Live Salary Summary</h3>

//           {!canPreviewGross ? (
//             <div className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-emerald-200 mb-4">
//               <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
//               <div>
//                 <p className="text-sm font-medium text-emerald-800">Revenue-based salary</p>
//                 <p className="text-xs text-emerald-700 mt-1">
//                   {revenuePercentage ? (
//                     <>
//                       Teacher will earn <strong>{revenuePercentage}%</strong> of actual revenue
//                       generated. Gross cannot be previewed — it is calculated at payout time
//                       based on revenue collected.
//                     </>
//                   ) : (
//                     'Enter revenue percentage above to configure this salary type.'
//                   )}
//                 </p>
//               </div>
//             </div>
//           ) : (
// <div className="p-4 rounded-lg bg-gradient-to-br from-[#F1AF37]/10 to-[#D88931]/10 border-2 border-[#F1AF37]/30 space-y-2 mb-4">
//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-muted-foreground">Gross Salary:</span>
//                 <span className="font-semibold">₹ {fmt(gross)}</span>
//               </div>
//               <div className="flex justify-between items-center text-sm text-red-600">
//                 <span>Total Deductions:</span>
//                 <span className="font-semibold">- ₹ {fmt(deductions)}</span>
//               </div>
//               {salaryType === 'hybrid' && toNum(revenuePercentage) && (
//                 <div className="flex justify-between items-center text-xs text-muted-foreground">
//                   <span>+ Revenue % (at payout):</span>
//                   <span>{revenuePercentage}%</span>
//                 </div>
//               )}
//               <div className="h-px bg-border my-1" />
//               <div className="flex justify-between items-center">
//                 <span className="font-bold text-[#D87331]">Net Salary:</span>
//                 <span className="font-bold text-lg text-[#D87331]">₹ {fmt(net)}</span>
//               </div>
//             </div>
//           )}

//           <div className="space-y-2">
//             <Label className="text-sm font-medium">
//               Remarks{' '}
//               <span className="text-xs text-muted-foreground">(optional)</span>
//             </Label>
//             <Textarea
//               value={remarks}
//               onChange={e => setRemarks(e.target.value)}
//               placeholder="Any additional notes about this salary structure..."
//               className="resize-none min-h-[80px]"
//             />
//           </div>
//         </CardContent>
//       </Card>

//       {/* ── Save / Cancel ── */}
//       <div className="flex justify-end gap-3 pt-2 pb-4">
//         {existingId && (
//           <Button
//             variant="outline"
//             onClick={() => setIsEditMode(false)}
//             disabled={isSaving}
//             className="h-11 px-6"
//           >
//             Cancel
//           </Button>
//         )}
//         <Button
//           onClick={handleSave}
//           disabled={isSaving}
//           className="gap-2 bg-gradient-to-r from-[#F1AF37] to-[#D88931] hover:from-[#F1AF37]/90 hover:to-[#D88931]/90 shadow-md h-11 px-8 disabled:opacity-50"
//         >
//           {isSaving ? (
//             <>
//               <Loader2 className="h-4 w-4 animate-spin" />
//               Saving...
//             </>
//           ) : (
//             <>
//               <Save className="h-4 w-4" />
//               {existingId ? 'Update Structure' : 'Save Structure'}
//             </>
//           )}
//         </Button>
//       </div>
//     </div>
//   )
// }
'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'


export default function ActiveTeacherRootPage({
  params,
}: {
  params: Promise<{ id: string }>   
}) {
  const { id } = use(params)       
  const router = useRouter()

  useEffect(() => {
    if (id && id !== 'undefined') {
      router.replace(`/dashboard/teachers/active/${id}/overview`)
    } else {
      console.error('[ActiveTeacherRootPage] Invalid teacher id:', id)
      router.replace('/dashboard/teachers/active')
    }
  }, [id, router])

  return null
}














// 'use client'

// import React, { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Separator } from '@/components/ui/separator'
// import {
//   ArrowLeft,
//   User,
//   Phone,
//   Mail,
//   MapPin,
//   Calendar,
//   Briefcase,
//   GraduationCap,
//   BookOpen,
//   Users,
//   DollarSign,
//   TrendingUp,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Edit2,
//   Plus,
//   Eye,
//   Trash2,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   School,
//   Target,
//   Award,
//   FileText,
//   Calendar as CalendarIcon,
//   Save,
//   IdCard,
//   Download,
// } from 'lucide-react'
// import Link from 'next/link'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
// import { Checkbox } from '@/components/ui/checkbox'

// const mockTeacherData = {
//   id: '1',
//   teacher_code: 'TCH001',
//   employee_code: 'EMP2024001',
//   full_name: 'Dr. Rajesh Kumar Singh',
//   email: 'rajesh.kumar@vidyakendra.com',
//   mobile: '+91 98765 43210',
//   alternate_mobile: '+91 98765 43211',
//   whatsapp_number: '+91 98765 43210',
//   date_of_birth: '1990-05-15',
//   gender: 'Male',
//   blood_group: 'O+',
//   address: '123 MG Road, Andheri West',
//   city: 'Mumbai',
//   state: 'Maharashtra',
//   pincode: '400058',
//   designation: 'Senior Teacher',
//   department: 'Science',
//   qualification: 'PhD Physics, M.Sc',
//   specialization: 'Physics',
//   experience_years: 15,
//   joining_date: '2020-04-15',
//   employment_type: 'Permanent',
//   attendance_percentage: 96.5,
//   performance_rating: 4.8,
//   total_classes_conducted: 1250,
//   avg_student_feedback: 4.7,
//   identity_documents: [
//     { type: 'aadhaar_card', number: 'XXXX-XXXX-1234', verified: true, file_url: '/documents/aadhaar.pdf' },
//     { type: 'pan_card', number: 'ABCDE1234F', verified: true, file_url: '/documents/pan.pdf' },
//     { type: 'photo', number: '', verified: true, file_url: '/photo.jpg' },
//     { type: 'passport', number: 'Z1234567', verified: true, file_url: '/documents/passport.pdf' },
//     { type: 'driving_license', number: 'MH01-20230012345', verified: true, file_url: '/documents/driving-license.pdf' },
//   ],
//   class_teacher_assignments: [
//     {
//       id: '1',
//       class: '10',
//       section: 'A',
//       subject_ids: ['PHY101', 'CHE101'], // Subjects taught in this class
//       subject_names: ['Physics', 'Chemistry'],
//       academic_year: '2024-25',
//       start_time: '08:00',
//       end_time: '14:00',
//       total_students: 45,
//       assigned_from: '2024-04-01',
//       status: 'active'
//     },
//   ],
//   subject_teacher_assignments: [
//     {
//       id: '2',
//       class: '10',
//       section: 'B',
//       subject_id: 'PHY101',
//       subject_name: 'Physics',
//       lectures_per_week: 6,
//       total_students: 42,
//       academic_year: '2024-25',
//       start_time: '09:00',
//       end_time: '10:00',
//       assigned_from: '2024-04-01',
//       status: 'active'
//     },
//     {
//       id: '3',
//       class: '11',
//       section: 'Science',
//       subject_id: 'PHY201',
//       subject_name: 'Physics',
//       lectures_per_week: 5,
//       total_students: 38,
//       academic_year: '2024-25',
//       start_time: '10:00',
//       end_time: '11:00',
//       assigned_from: '2024-04-01',
//       status: 'active'
//     },
//   ],
//   salary_structures: [
//     {
//       id: '1',
//       salary_type: 'fixed_monthly',
//       basic_salary: 50000,
//       hra: 15000,
//       da: 5000,
//       conveyance_allowance: 3000,
//       medical_allowance: 2000,
//       gross_salary: 75000,
//       pf_deduction: 6000,
//       tds_deduction: 4000,
//       net_salary: 65000,
//       effective_from: '2024-01-01',
//       effective_to: null,
//       status: 'active'
//     },
//   ],
//   salary_history: [
//     {
//       id: '1',
//       month: 'January 2024',
//       payment_month: '2024-01',
//       basic: 50000,
//       allowances: 25000,
//       gross: 75000,
//       deductions: 10000,
//       net: 65000,
//       payment_date: '2024-01-31',
//       payment_mode: 'bank_transfer',
//       status: 'paid'
//     },
//     {
//       id: '2',
//       month: 'December 2023',
//       payment_month: '2023-12',
//       basic: 50000,
//       allowances: 25000,
//       gross: 75000,
//       deductions: 10000,
//       net: 65000,
//       payment_date: '2023-12-31',
//       payment_mode: 'bank_transfer',
//       status: 'paid'
//     },
//     {
//       id: '3',
//       month: 'November 2023',
//       payment_month: '2023-11',
//       basic: 50000,
//       allowances: 25000,
//       gross: 75000,
//       deductions: 10000,
//       net: 65000,
//       payment_date: '2023-11-30',
//       payment_mode: 'bank_transfer',
//       status: 'paid'
//     },
//   ],
//   leave_requests: [
//     {
//       id: '1',
//       leave_type: 'sick',
//       from_date: '2024-02-10',
//       to_date: '2024-02-12',
//       total_days: 3,
//       reason: 'Severe fever and body pain. Need rest as advised by doctor.',
//       supporting_document_url: '/docs/medical-cert-1.pdf',
//       status: 'approved',
//       approved_by: 'Admin Name',
//       approved_at: '2024-02-09',
//       rejection_reason: null,
//       admin_remarks: 'Approved. Get well soon. Medical certificate verified.'
//     },
//     {
//       id: '2',
//       leave_type: 'casual',
//       from_date: '2024-01-15',
//       to_date: '2024-01-15',
//       total_days: 1,
//       reason: 'Family emergency - need to attend urgent family matter.',
//       supporting_document_url: null,
//       status: 'rejected',
//       approved_by: 'Admin Name',
//       approved_at: '2024-01-14',
//       rejection_reason: 'Already exceeded casual leave quota for this month. Please use paid leave instead.',
//       admin_remarks: 'Rejected due to quota limit. Consider applying for paid leave.'
//     },
//     {
//       id: '3',
//       leave_type: 'paid',
//       from_date: '2024-03-20',
//       to_date: '2024-03-22',
//       total_days: 3,
//       reason: 'Personal work - need to travel to hometown for property documentation.',
//       supporting_document_url: null,
//       status: 'pending',
//       approved_by: null,
//       approved_at: null,
//       rejection_reason: null,
//       admin_remarks: null
//     },
//   ],
// }

// // Mock attendance data for individual teacher
// const mockIndividualAttendance = {
//   weekly: [
//     { date: '2026-02-10', day: 'Mon', status: 'present', checkIn: '08:45 AM', checkOut: '04:30 PM', hours: 7.75 },
//     { date: '2026-02-11', day: 'Tue', status: 'present', checkIn: '08:50 AM', checkOut: '04:35 PM', hours: 7.75 },
//     { date: '2026-02-12', day: 'Wed', status: 'present', checkIn: '08:40 AM', checkOut: '04:25 PM', hours: 7.75 },
//     { date: '2026-02-13', day: 'Thu', status: 'present', checkIn: '08:45 AM', checkOut: '04:30 PM', hours: 7.75 },
//     { date: '2026-02-14', day: 'Fri', status: 'halfday', checkIn: '08:50 AM', checkOut: '12:30 PM', hours: 3.67 },
//     { date: '2026-02-15', day: 'Sat', status: 'present', checkIn: '08:45 AM', checkOut: '01:30 PM', hours: 4.75 },
//   ],
//   monthly: {
//     present: 23,
//     absent: 2,
//     halfday: 1,
//     totalDays: 26,
//     percentage: 92.3,
//   },
//   yearly: {
//     present: 211,
//     absent: 19,
//     halfday: 10,
//     totalDays: 240,
//     percentage: 91.2,
//   },
// }

// export default function ActiveTeacherViewPage() {
//   const router = useRouter()
//   const [activeTab, setActiveTab] = useState('overview')
  
//   // Attendance state
//   const [attendanceView, setAttendanceView] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')
//   const [selectedMonth, setSelectedMonth] = useState('2026-02')
//   const [selectedYear, setSelectedYear] = useState('2024-25')
  
//   // Salary Pagination
//   const [salaryPage, setSalaryPage] = useState(1)
//   const [salaryPerPage] = useState(5)
//   const salaryIndexOfLast = salaryPage * salaryPerPage
//   const salaryIndexOfFirst = salaryIndexOfLast - salaryPerPage
//   const currentSalaryHistory = mockTeacherData.salary_history.slice(salaryIndexOfFirst, salaryIndexOfLast)
//   const salaryTotalPages = Math.ceil(mockTeacherData.salary_history.length / salaryPerPage)

//   // Dialogs
//   const [editAssignmentDialog, setEditAssignmentDialog] = useState(false)
//   const [addSalaryDialog, setAddSalaryDialog] = useState(false)
//   const [viewSalaryDialog, setViewSalaryDialog] = useState(false)
//   const [editSalaryDialog, setEditSalaryDialog] = useState(false)
//   const [selectedSalary, setSelectedSalary] = useState<any>(null)
//   const [leaveActionDialog, setLeaveActionDialog] = useState(false)
//   const [selectedLeave, setSelectedLeave] = useState<any>(null)
//   const [leaveAction, setLeaveAction] = useState<'approve' | 'reject'>('approve')
//   const [leaveRemarks, setLeaveRemarks] = useState('')

//   // New Salary Form
//   const [newSalary, setNewSalary] = useState({
//     salary_type: 'fixed_monthly',
//     basic_salary: '',
//     hra: '',
//     da: '',
//     conveyance_allowance: '',
//     medical_allowance: '',
//     pf_applicable: true,
//     tds_applicable: true,
//     effective_from: '',
//   })

//   const handleAddSalary = () => {
//     console.log('[v0] Adding new salary structure:', newSalary)
//     setAddSalaryDialog(false)
//     // Reset form
//     setNewSalary({
//       salary_type: 'fixed_monthly',
//       basic_salary: '',
//       hra: '',
//       da: '',
//       conveyance_allowance: '',
//       medical_allowance: '',
//       pf_applicable: true,
//       tds_applicable: true,
//       effective_from: '',
//     })
//   }

//   const handleViewSalary = (salary: any) => {
//     setSelectedSalary(salary)
//     setViewSalaryDialog(true)
//   }

//   const handleEditSalary = (salary: any) => {
//     setSelectedSalary(salary)
//     setEditSalaryDialog(true)
//   }

//   const handleDeleteSalary = (salaryId: string) => {
//     console.log('[v0] Deleting salary:', salaryId)
//   }

//   const handleLeaveAction = (leave: any, action: 'approve' | 'reject') => {
//     setSelectedLeave(leave)
//     setLeaveAction(action)
//     setLeaveRemarks('')
//     setLeaveActionDialog(true)
//   }

//   const handleSubmitLeaveAction = () => {
//     console.log('[v0] Leave action:', leaveAction, 'for leave:', selectedLeave.id, 'remarks:', leaveRemarks)
//     setLeaveActionDialog(false)
//     setSelectedLeave(null)
//     setLeaveRemarks('')
//   }

//   const getLeaveStatusBadge = (status: string) => {
//     const configs: Record<string, { label: string; className: string }> = {
//       pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-300' },
//       approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
//       rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-300' },
//       cancelled: { label: 'Cancelled', className: 'bg-slate-50 text-slate-700 border-slate-300' },
//     }
//     return configs[status] || configs.pending
//   }

//   const getLeaveTypeBadge = (type: string) => {
//     const configs: Record<string, { label: string; className: string }> = {
//       casual: { label: 'Casual', className: 'bg-blue-50 text-blue-700 border-blue-300' },
//       sick: { label: 'Sick', className: 'bg-orange-50 text-orange-700 border-orange-300' },
//       paid: { label: 'Paid', className: 'bg-green-50 text-green-700 border-green-300' },
//       unpaid: { label: 'Unpaid', className: 'bg-gray-50 text-gray-700 border-gray-300' },
//       maternity: { label: 'Maternity', className: 'bg-pink-50 text-pink-700 border-pink-300' },
//       paternity: { label: 'Paternity', className: 'bg-purple-50 text-purple-700 border-purple-300' },
//     }
//     return configs[type] || configs.casual
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
//       <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
//         {/* Header */}
//         <div className="flex flex-col gap-4">
//           <div className="flex items-center gap-3">
//             <Link href="/dashboard/teachers/active">
//               <Button variant="ghost" size="sm" className="gap-2">
//                 <ArrowLeft className="h-4 w-4" />
//                 <span className="hidden sm:inline">Back to Teachers</span>
//                 <span className="sm:hidden">Back</span>
//               </Button>
//             </Link>
//           </div>

//           {/* Teacher Profile Card */}
//           <Card className="border-2 shadow-lg">
//             <CardContent className="p-4 sm:p-6">
//               <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
//                 {/* Avatar */}
//                 <div className="flex justify-center sm:justify-start">
//                   <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1897C6] to-[#67BAC3] text-white font-bold text-2xl sm:text-3xl shadow-lg">
//                     {mockTeacherData.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
//                   </div>
//                 </div>

//                 {/* Details */}
//                 <div className="flex-1 space-y-3">
//                   <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
//                     <div>
//                       <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#1897C6] to-[#67BAC3] bg-clip-text text-transparent">
//                         {mockTeacherData.full_name}
//                       </h1>
//                       <p className="text-sm text-muted-foreground mt-1">{mockTeacherData.designation} - {mockTeacherData.department}</p>
//                     </div>
//                     <Link href={`/dashboard/teachers/add?edit=${mockTeacherData.id}`}>
//                       <Button size="sm" className="gap-2 bg-gradient-to-r from-[#1897C6] to-[#67BAC3] hover:from-[#1897C6]/90 hover:to-[#67BAC3]/90 w-full sm:w-auto">
//                         <Edit2 className="h-4 w-4" />
//                         <span>Edit Profile</span>
//                       </Button>
//                     </Link>
//                   </div>

//                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//                     <div className="flex items-center gap-2">
//                       <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1897C6]/10">
//                         <User className="h-4 w-4 text-[#1897C6]" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-muted-foreground">Teacher Code</p>
//                         <p className="text-sm font-semibold font-mono">{mockTeacherData.teacher_code}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1AF37]/10">
//                         <Calendar className="h-4 w-4 text-[#F1AF37]" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-muted-foreground">Joined</p>
//                         <p className="text-sm font-semibold">{new Date(mockTeacherData.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
//                         <Briefcase className="h-4 w-4 text-green-600" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-muted-foreground">Experience</p>
//                         <p className="text-sm font-semibold">{mockTeacherData.experience_years} years</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Quick Stats */}
//           <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
//             <Card className="border-2 hover:shadow-md transition-all">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1897C6] to-[#67BAC3] text-white">
//                     <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-muted-foreground">Attendance</p>
//                     <p className="text-xl sm:text-2xl font-bold text-[#1897C6]">{mockTeacherData.attendance_percentage}%</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-2 hover:shadow-md transition-all">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F1AF37] to-[#D88931] text-white">
//                     <Award className="h-5 w-5 sm:h-6 sm:w-6" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-muted-foreground">Rating</p>
//                     <p className="text-xl sm:text-2xl font-bold text-[#F1AF37]">{mockTeacherData.performance_rating}/5</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-2 hover:shadow-md transition-all">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white">
//                     <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-muted-foreground">Classes</p>
//                     <p className="text-xl sm:text-2xl font-bold text-green-600">{mockTeacherData.total_classes_conducted}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-2 hover:shadow-md transition-all">
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
//                     <Users className="h-5 w-5 sm:h-6 sm:w-6" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-muted-foreground">Feedback</p>
//                     <p className="text-xl sm:text-2xl font-bold text-purple-600">{mockTeacherData.avg_student_feedback}/5</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {/* Tabs */}
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
//           <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto p-1 gap-1">
//             <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
//             <TabsTrigger value="teaching" className="text-xs sm:text-sm py-2">Teaching</TabsTrigger>
//             <TabsTrigger value="attendance" className="text-xs sm:text-sm py-2">Attendance</TabsTrigger>
//             <TabsTrigger value="performance" className="text-xs sm:text-sm py-2">Performance</TabsTrigger>
//             <TabsTrigger value="salary" className="text-xs sm:text-sm py-2">Salary</TabsTrigger>
//             <TabsTrigger value="leaves" className="text-xs sm:text-sm py-2">Leaves</TabsTrigger>
//           </TabsList>

//           {/* Overview Tab */}
//           <TabsContent value="overview" className="space-y-4">
//             <div className="grid gap-4 sm:grid-cols-2">
//               {/* Personal Information */}
//               <Card className="border-2">
//                 <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 p-4 sm:p-6">
//                   <div className="flex items-center gap-3">
//                     <User className="h-5 w-5 text-[#1897C6]" />
//                     <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="p-4 sm:p-6 space-y-3">
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Full Name:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.full_name}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">DOB:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{new Date(mockTeacherData.date_of_birth).toLocaleDateString('en-IN')}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Gender:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.gender}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Blood Group:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.blood_group}</span>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Contact Information */}
//               <Card className="border-2">
//                 <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 p-4 sm:p-6">
//                   <div className="flex items-center gap-3">
//                     <Phone className="h-5 w-5 text-[#1897C6]" />
//                     <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="p-4 sm:p-6 space-y-3">
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Email:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium truncate">{mockTeacherData.email}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Mobile:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.mobile}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Alt Mobile:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.alternate_mobile}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">WhatsApp:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.whatsapp_number}</span>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Professional Information */}
//               <Card className="border-2">
//                 <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 p-4 sm:p-6">
//                   <div className="flex items-center gap-3">
//                     <Briefcase className="h-5 w-5 text-[#F1AF37]" />
//                     <CardTitle className="text-base sm:text-lg">Professional Details</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="p-4 sm:p-6 space-y-3">
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Designation:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.designation}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Department:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.department}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Experience:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.experience_years} years</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Employment:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.employment_type}</span>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Qualification */}
//               <Card className="border-2">
//                 <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 p-4 sm:p-6">
//                   <div className="flex items-center gap-3">
//                     <GraduationCap className="h-5 w-5 text-[#F1AF37]" />
//                     <CardTitle className="text-base sm:text-lg">Qualification</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="p-4 sm:p-6 space-y-3">
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Degree:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.qualification}</span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <span className="text-xs sm:text-sm text-muted-foreground">Specialization:</span>
//                     <span className="col-span-2 text-xs sm:text-sm font-medium">{mockTeacherData.specialization}</span>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Address */}
//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 p-4 sm:p-6">
//                 <div className="flex items-center gap-3">
//                   <MapPin className="h-5 w-5 text-[#1897C6]" />
//                   <CardTitle className="text-base sm:text-lg">Address</CardTitle>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-4 sm:p-6">
//                 <p className="text-xs sm:text-sm">{mockTeacherData.address}, {mockTeacherData.city}, {mockTeacherData.state} - {mockTeacherData.pincode}</p>
//               </CardContent>
//             </Card>

//             {/* Identity Documents */}
//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 p-4 sm:p-6">
//                 <div className="flex items-center gap-3">
//                   <IdCard className="h-5 w-5 text-[#F1AF37]" />
//                   <CardTitle className="text-base sm:text-lg">Identity Documents</CardTitle>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
//                 {mockTeacherData.identity_documents.map((doc, index) => (
//                   <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 border hover:border-[#F1AF37]/30 transition-all">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 mb-1">
//                         <FileText className="h-4 w-4 text-[#F1AF37] shrink-0" />
//                         <p className="font-medium text-sm capitalize">{doc.type.replace('_', ' ')}</p>
//                       </div>
//                       {doc.number && (
//                         <p className="text-xs sm:text-sm text-muted-foreground ml-6">{doc.number}</p>
//                       )}
//                     </div>
//                     <div className="flex items-center gap-2 ml-6 sm:ml-0">
//                       <Badge className={doc.verified ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" : "bg-amber-50 text-amber-700 border-amber-200 text-xs"}>
//                         {doc.verified ? 'Verified' : 'Pending'}
//                       </Badge>
//                       <Button 
//                         size="sm" 
//                         variant="ghost"
//                         className="h-7 px-2 text-xs text-[#1897C6] hover:bg-[#1897C6]/10"
//                         onClick={() => window.open(doc.file_url, '_blank')}
//                       >
//                         <Eye className="h-3 w-3 mr-1" />
//                         View
//                       </Button>
//                       <Button 
//                         size="sm" 
//                         variant="ghost"
//                         className="h-7 px-2 text-xs text-green-600 hover:bg-green-50"
//                         onClick={() => {
//                           const link = document.createElement('a')
//                           link.href = doc.file_url
//                           link.download = `${doc.type}_${mockTeacherData.full_name}.pdf`
//                           link.click()
//                         }}
//                       >
//                         <Download className="h-3 w-3 mr-1" />
//                         Download
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Teaching Tab */}
//           <TabsContent value="teaching" className="space-y-4">
//             {/* Class Teacher Assignments */}
//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 p-4 sm:p-6">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//                   <div className="flex items-center gap-3">
//                     <School className="h-5 w-5 text-emerald-600" />
//                     <div>
//                       <CardTitle className="text-base sm:text-lg">Class Teacher Assignments</CardTitle>
//                       <p className="text-xs text-muted-foreground mt-1">Classes where teacher is the primary class teacher</p>
//                     </div>
//                   </div>
//                   <Button 
//                     size="sm" 
//                     onClick={() => setEditAssignmentDialog(true)}
//                     className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 h-9"
//                   >
//                     <Edit2 className="h-3.5 w-3.5" />
//                     <span className="text-xs sm:text-sm">Edit Assignments</span>
//                   </Button>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-3 sm:p-6">
//                 <div className="space-y-3">
//                   {mockTeacherData.class_teacher_assignments.length > 0 ? (
//                     mockTeacherData.class_teacher_assignments.map((assignment) => (
//                       <Card key={assignment.id} className="border-2 bg-emerald-50/30 hover:border-emerald-500/50 transition-all">
//                         <CardContent className="p-3 sm:p-4">
//                           <div className="space-y-3">
//                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                               <div className="flex items-center gap-2 flex-wrap">
//                                 <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 font-semibold text-xs">
//                                   ✓ Class Teacher
//                                 </Badge>
//                                 <Badge className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white border-0 font-semibold text-xs">
//                                   Class {assignment.class}-{assignment.section}
//                                 </Badge>
//                                 <Badge variant="outline" className="text-xs font-mono">
//                                   {assignment.academic_year}
//                                 </Badge>
//                               </div>
//                               <Badge className={assignment.status === 'active' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-700 border-gray-300'}>
//                                 {assignment.status}
//                               </Badge>
//                             </div>

//                             <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
//                               <div className="flex items-center gap-1.5">
//                                 <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                                 <span>{assignment.total_students} students</span>
//                               </div>
//                               <div className="flex items-center gap-1.5">
//                                 <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                                 <span>{assignment.start_time} - {assignment.end_time}</span>
//                               </div>
//                               <div className="flex items-center gap-1.5">
//                                 <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                                 <span>From {new Date(assignment.assigned_from).toLocaleDateString('en-IN')}</span>
//                               </div>
//                             </div>

//                             {assignment.subject_names && assignment.subject_names.length > 0 && (
//                               <div className="pt-2 border-t">
//                                 <p className="text-xs text-muted-foreground mb-2">
//                                   <span className="font-semibold">Subjects Teaching in This Class:</span>
//                                 </p>
//                                 <div className="flex flex-wrap gap-2">
//                                   {assignment.subject_names.map((subject, idx) => (
//                                     <Badge key={idx} className="bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white border-0 text-xs">
//                                       {subject}
//                                     </Badge>
//                                   ))}
//                                 </div>
//                               </div>
//                             )}

//                             <div className="pt-2 border-t">
//                               <p className="text-xs text-muted-foreground">
//                                 <span className="font-semibold">Responsibilities:</span> Managing class attendance, conducting parent meetings, monitoring overall student performance, coordinating with subject teachers, and maintaining class discipline.
//                               </p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))
//                   ) : (
//                     <div className="text-center py-8 text-muted-foreground text-sm">
//                       No class teacher assignments
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Subject Teacher Assignments */}
//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 p-4 sm:p-6">
//                 <div className="flex items-center gap-3">
//                   <BookOpen className="h-5 w-5 text-[#1897C6]" />
//                   <div>
//                     <CardTitle className="text-base sm:text-lg">Subject Teacher Assignments</CardTitle>
//                     <p className="text-xs text-muted-foreground mt-1">Subjects teaching across different classes</p>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-3 sm:p-6">
//                 <div className="space-y-3">
//                   {mockTeacherData.subject_teacher_assignments.length > 0 ? (
//                     mockTeacherData.subject_teacher_assignments.map((assignment) => (
//                       <Card key={assignment.id} className="border-2 hover:border-[#1897C6]/50 transition-all">
//                         <CardContent className="p-3 sm:p-4">
//                           <div className="space-y-3">
//                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                               <div className="flex items-center gap-2 flex-wrap">
//                                 <Badge className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white border-0 font-semibold text-xs">
//                                   Class {assignment.class}-{assignment.section}
//                                 </Badge>
//                                 <Badge className="bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white border-0 text-xs">
//                                   {assignment.subject_name}
//                                 </Badge>
//                                 <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
//                                   Subject Teacher
//                                 </Badge>
//                               </div>
//                               <Badge className={assignment.status === 'active' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-700 border-gray-300'}>
//                                 {assignment.status}
//                               </Badge>
//                             </div>

//                             <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
//                               <div className="flex items-center gap-1.5">
//                                 <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                                 <span>{assignment.lectures_per_week} lectures/week</span>
//                               </div>
//                               <div className="flex items-center gap-1.5">
//                                 <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                                 <span>{assignment.total_students} students</span>
//                               </div>
//                               <div className="flex items-center gap-1.5">
//                                 <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                                 <span>{assignment.start_time} - {assignment.end_time}</span>
//                               </div>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))
//                   ) : (
//                     <div className="text-center py-8 text-muted-foreground text-sm">
//                       No subject teacher assignments
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Attendance Tab */}
//           <TabsContent value="attendance" className="space-y-4">
//             {/* View Toggle */}
//             <Card className="border-2">
//               <CardContent className="p-4">
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                   <h3 className="font-semibold">Individual Attendance Overview</h3>
//                   <div className="flex gap-2">
//                     <Button
//                       variant={attendanceView === 'weekly' ? 'default' : 'outline'}
//                       size="sm"
//                       onClick={() => setAttendanceView('weekly')}
//                       className={attendanceView === 'weekly' ? 'bg-[#1897C6] hover:bg-[#1897C6]/90' : ''}
//                     >
//                       <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
//                       Weekly
//                     </Button>
//                     <Button
//                       variant={attendanceView === 'monthly' ? 'default' : 'outline'}
//                       size="sm"
//                       onClick={() => setAttendanceView('monthly')}
//                       className={attendanceView === 'monthly' ? 'bg-[#1897C6] hover:bg-[#1897C6]/90' : ''}
//                     >
//                       <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
//                       Monthly
//                     </Button>
//                     <Button
//                       variant={attendanceView === 'yearly' ? 'default' : 'outline'}
//                       size="sm"
//                       onClick={() => setAttendanceView('yearly')}
//                       className={attendanceView === 'yearly' ? 'bg-[#1897C6] hover:bg-[#1897C6]/90' : ''}
//                     >
//                       <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
//                       Yearly
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Weekly View */}
//             {attendanceView === 'weekly' && (
//               <Card className="border-2">
//                 <CardHeader className="pb-3 bg-muted/30">
//                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//                     <CardTitle className="text-base">Weekly Attendance</CardTitle>
//                     <Button size="sm" variant="outline">
//                       <Download className="h-3.5 w-3.5 mr-1.5" />
//                       Export
//                     </Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="p-0">
//                   <div className="overflow-x-auto">
//                     <table className="w-full">
//                       <thead>
//                         <tr className="border-b bg-muted/30">
//                           <th className="text-left p-3 text-xs sm:text-sm font-semibold">Date</th>
//                           <th className="text-left p-3 text-xs sm:text-sm font-semibold">Day</th>
//                           <th className="text-left p-3 text-xs sm:text-sm font-semibold">Status</th>
//                           <th className="text-left p-3 text-xs sm:text-sm font-semibold">Check In</th>
//                           <th className="text-left p-3 text-xs sm:text-sm font-semibold">Check Out</th>
//                           <th className="text-left p-3 text-xs sm:text-sm font-semibold">Hours</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {mockIndividualAttendance.weekly.map((day, index) => (
//                           <tr key={index} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
//                             <td className="p-3 text-xs sm:text-sm">{day.date}</td>
//                             <td className="p-3 text-xs sm:text-sm font-medium">{day.day}</td>
//                             <td className="p-3">
//                               <Badge
//                                 variant="outline"
//                                 className={
//                                   day.status === 'present'
//                                     ? 'border-green-600 text-green-600 bg-green-50'
//                                     : day.status === 'halfday'
//                                     ? 'border-yellow-600 text-yellow-600 bg-yellow-50'
//                                     : 'border-red-600 text-red-600 bg-red-50'
//                                 }
//                               >
//                                 {day.status === 'present' ? (
//                                   <><CheckCircle className="h-3 w-3 inline mr-1" />Present</>
//                                 ) : day.status === 'halfday' ? (
//                                   <><Clock className="h-3 w-3 inline mr-1" />Half Day</>
//                                 ) : (
//                                   <><XCircle className="h-3 w-3 inline mr-1" />Absent</>
//                                 )}
//                               </Badge>
//                             </td>
//                             <td className="p-3 text-xs sm:text-sm">{day.checkIn}</td>
//                             <td className="p-3 text-xs sm:text-sm">{day.checkOut}</td>
//                             <td className="p-3 text-xs sm:text-sm font-semibold text-[#1897C6]">{day.hours}h</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </CardContent>
//               </Card>
//             )}

//             {/* Monthly View */}
//             {attendanceView === 'monthly' && (
//               <div className="space-y-4">
//                 <Card className="border-2">
//                   <CardHeader className="pb-3 bg-muted/30">
//                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//                       <CardTitle className="text-base">Monthly Attendance Summary</CardTitle>
//                       <Select value={selectedMonth} onValueChange={setSelectedMonth}>
//                         <SelectTrigger className="w-[160px] border-2">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="2026-02">February 2026</SelectItem>
//                           <SelectItem value="2026-01">January 2026</SelectItem>
//                           <SelectItem value="2025-12">December 2025</SelectItem>
//                           <SelectItem value="2025-11">November 2025</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="p-4">
//                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-green-100 rounded-lg">
//                               <CheckCircle className="h-6 w-6 text-green-600" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.monthly.present}</p>
//                               <p className="text-xs text-muted-foreground">Present Days</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>

//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-red-100 rounded-lg">
//                               <XCircle className="h-6 w-6 text-red-600" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.monthly.absent}</p>
//                               <p className="text-xs text-muted-foreground">Absent Days</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>

//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-yellow-100 rounded-lg">
//                               <Clock className="h-6 w-6 text-yellow-600" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.monthly.halfday}</p>
//                               <p className="text-xs text-muted-foreground">Half Days</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>

//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-[#1897C6]/10 rounded-lg">
//                               <TrendingUp className="h-6 w-6 text-[#1897C6]" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.monthly.percentage}%</p>
//                               <p className="text-xs text-muted-foreground">Attendance Rate</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     </div>

//                     <div className="border-t pt-4">
//                       <div className="flex justify-between mb-2">
//                         <span className="text-sm font-medium">Monthly Performance</span>
//                         <span className="text-sm font-bold text-[#1897C6]">{mockIndividualAttendance.monthly.percentage}%</span>
//                       </div>
//                       <div className="h-3 bg-muted rounded-full overflow-hidden">
//                         <div 
//                           className="h-full bg-gradient-to-r from-[#1897C6] to-[#67BAC3]" 
//                           style={{ width: `${mockIndividualAttendance.monthly.percentage}%` }}
//                         />
//                       </div>
//                       <p className="text-xs text-muted-foreground mt-2">
//                         {mockIndividualAttendance.monthly.present} out of {mockIndividualAttendance.monthly.totalDays} working days
//                       </p>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             )}

//             {/* Yearly View */}
//             {attendanceView === 'yearly' && (
//               <div className="space-y-4">
//                 <Card className="border-2">
//                   <CardHeader className="pb-3 bg-muted/30">
//                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//                       <CardTitle className="text-base">Yearly Attendance Summary</CardTitle>
//                       <Select value={selectedYear} onValueChange={setSelectedYear}>
//                         <SelectTrigger className="w-[160px] border-2">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="2024-25">2024-25</SelectItem>
//                           <SelectItem value="2023-24">2023-24</SelectItem>
//                           <SelectItem value="2022-23">2022-23</SelectItem>
//                           <SelectItem value="2021-22">2021-22</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="p-4">
//                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-green-100 rounded-lg">
//                               <CheckCircle className="h-6 w-6 text-green-600" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.yearly.present}</p>
//                               <p className="text-xs text-muted-foreground">Present Days</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>

//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-red-100 rounded-lg">
//                               <XCircle className="h-6 w-6 text-red-600" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.yearly.absent}</p>
//                               <p className="text-xs text-muted-foreground">Absent Days</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>

//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-yellow-100 rounded-lg">
//                               <Clock className="h-6 w-6 text-yellow-600" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.yearly.halfday}</p>
//                               <p className="text-xs text-muted-foreground">Half Days</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>

//                       <Card className="border-2">
//                         <CardContent className="p-4">
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-[#1897C6]/10 rounded-lg">
//                               <TrendingUp className="h-6 w-6 text-[#1897C6]" />
//                             </div>
//                             <div>
//                               <p className="text-2xl font-bold">{mockIndividualAttendance.yearly.percentage}%</p>
//                               <p className="text-xs text-muted-foreground">Attendance Rate</p>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     </div>

//                     <div className="border-t pt-4">
//                       <div className="flex justify-between mb-2">
//                         <span className="text-sm font-medium">Annual Performance</span>
//                         <span className="text-sm font-bold text-[#1897C6]">{mockIndividualAttendance.yearly.percentage}%</span>
//                       </div>
//                       <div className="h-3 bg-muted rounded-full overflow-hidden">
//                         <div 
//                           className="h-full bg-gradient-to-r from-[#1897C6] to-[#67BAC3]" 
//                           style={{ width: `${mockIndividualAttendance.yearly.percentage}%` }}
//                         />
//                       </div>
//                       <p className="text-xs text-muted-foreground mt-2">
//                         {mockIndividualAttendance.yearly.present} out of {mockIndividualAttendance.yearly.totalDays} working days in Academic Year {selectedYear}
//                       </p>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             )}
//           </TabsContent>

//           {/* Performance Tab */}
//           <TabsContent value="performance" className="space-y-4">
//             <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
//               <Card className="border-2">
//                 <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 pb-3 p-3 sm:p-4">
//                   <CardTitle className="text-sm sm:text-base">Attendance Rate</CardTitle>
//                 </CardHeader>
//                 <CardContent className="p-3 sm:p-4">
//                   <div className="space-y-2 sm:space-y-3">
//                     <div className="flex items-center justify-between">
//                       <span className="text-2xl sm:text-3xl font-bold text-[#1897C6]">{mockTeacherData.attendance_percentage}%</span>
//                       <Badge className="bg-green-50 text-green-700 border-green-300 text-xs">Excellent</Badge>
//                     </div>
//                     <div className="h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-muted">
//                       <div 
//                         className="h-full bg-gradient-to-r from-[#1897C6] to-[#67BAC3] transition-all" 
//                         style={{ width: `${mockTeacherData.attendance_percentage}%` }} 
//                       />
//                     </div>
//                     <p className="text-xs text-muted-foreground">Consistent attendance over last 6 months</p>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="border-2">
//                 <CardHeader className="bg-gradient-to-r from-[#F1AF37]/5 to-[#D88931]/5 pb-3 p-3 sm:p-4">
//                   <CardTitle className="text-sm sm:text-base">Performance Rating</CardTitle>
//                 </CardHeader>
//                 <CardContent className="p-3 sm:p-4">
//                   <div className="space-y-2 sm:space-y-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-baseline gap-1">
//                         <span className="text-2xl sm:text-3xl font-bold text-[#F1AF37]">{mockTeacherData.performance_rating}</span>
//                         <span className="text-sm sm:text-lg text-muted-foreground">/5.0</span>
//                       </div>
//                       <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-xs">Outstanding</Badge>
//                     </div>
//                     <div className="h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-muted">
//                       <div 
//                         className="h-full bg-gradient-to-r from-[#F1AF37] to-[#D88931] transition-all" 
//                         style={{ width: `${(mockTeacherData.performance_rating / 5) * 100}%` }} 
//                       />
//                     </div>
//                     <p className="text-xs text-muted-foreground">Based on admin evaluation & results</p>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="border-2">
//                 <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-600/5 pb-3 p-3 sm:p-4">
//                   <CardTitle className="text-sm sm:text-base">Student Feedback</CardTitle>
//                 </CardHeader>
//                 <CardContent className="p-3 sm:p-4">
//                   <div className="space-y-2 sm:space-y-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-baseline gap-1">
//                         <span className="text-2xl sm:text-3xl font-bold text-green-600">{mockTeacherData.avg_student_feedback}</span>
//                         <span className="text-sm sm:text-lg text-muted-foreground">/5.0</span>
//                       </div>
//                       <Badge className="bg-green-50 text-green-700 border-green-300 text-xs">Great</Badge>
//                     </div>
//                     <div className="h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-muted">
//                       <div 
//                         className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" 
//                         style={{ width: `${(mockTeacherData.avg_student_feedback / 5) * 100}%` }} 
//                       />
//                     </div>
//                     <p className="text-xs text-muted-foreground">Average from 125 student surveys</p>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 p-3 sm:p-4 md:p-6">
//                 <CardTitle className="text-base sm:text-lg">Teaching Statistics</CardTitle>
//               </CardHeader>
//               <CardContent className="p-3 sm:p-4 md:p-6">
//                 <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
//                   <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2">
//                     <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#1897C6]/10">
//                       <Target className="h-5 w-5 sm:h-6 sm:w-6 text-[#1897C6]" />
//                     </div>
//                     <div className="min-w-0">
//                       <p className="text-xl sm:text-2xl font-bold">{mockTeacherData.total_classes_conducted}</p>
//                       <p className="text-xs sm:text-sm text-muted-foreground">Total Classes Conducted</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2">
//                     <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#F1AF37]/10">
//                       <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#F1AF37]" />
//                     </div>
//                     <div className="min-w-0">
//                       <p className="text-xl sm:text-2xl font-bold">{mockTeacherData.class_teacher_assignments.reduce((sum, a) => sum + a.total_students, 0) + mockTeacherData.subject_teacher_assignments.reduce((sum, a) => sum + a.total_students, 0)}</p>
//                       <p className="text-xs sm:text-sm text-muted-foreground">Total Students Taught</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2">
//                     <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
//                       <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
//                     </div>
//                     <div className="min-w-0">
//                       <p className="text-xl sm:text-2xl font-bold">{mockTeacherData.class_teacher_assignments.length + mockTeacherData.subject_teacher_assignments.length}</p>
//                       <p className="text-xs sm:text-sm text-muted-foreground">Active Assignments</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2">
//                     <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
//                       <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
//                     </div>
//                     <div className="min-w-0">
//                       <p className="text-xl sm:text-2xl font-bold">
//                         {mockTeacherData.subject_teacher_assignments.reduce((sum, a) => sum + a.lectures_per_week, 0)}
//                       </p>
//                       <p className="text-xs sm:text-sm text-muted-foreground">Lectures Per Week</p>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Salary Tab */}
//           <TabsContent value="salary" className="space-y-4">
//             {/* Current Salary Structure */}
//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-600/5 p-4 sm:p-6">
//                 <div className="flex items-center gap-3">
//                   <DollarSign className="h-5 w-5 text-green-600" />
//                   <CardTitle className="text-base sm:text-lg">Current Salary Structure</CardTitle>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-4 sm:p-6">
//                 {mockTeacherData.salary_structures.length > 0 ? (
//                   <div className="space-y-4">
//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div className="space-y-2">
//                         <p className="text-xs text-muted-foreground">Basic Salary</p>
//                         <p className="text-lg font-bold">₹{mockTeacherData.salary_structures[0].basic_salary.toLocaleString('en-IN')}</p>
//                       </div>
//                       <div className="space-y-2">
//                         <p className="text-xs text-muted-foreground">HRA</p>
//                         <p className="text-lg font-bold">₹{mockTeacherData.salary_structures[0].hra.toLocaleString('en-IN')}</p>
//                       </div>
//                       <div className="space-y-2">
//                         <p className="text-xs text-muted-foreground">Gross Salary</p>
//                         <p className="text-lg font-bold text-green-600">₹{mockTeacherData.salary_structures[0].gross_salary.toLocaleString('en-IN')}</p>
//                       </div>
//                       <div className="space-y-2">
//                         <p className="text-xs text-muted-foreground">Net Salary</p>
//                         <p className="text-lg font-bold text-[#1897C6]">₹{mockTeacherData.salary_structures[0].net_salary.toLocaleString('en-IN')}</p>
//                       </div>
//                     </div>
//                     <div className="pt-3 border-t">
//                       <div className="flex items-center justify-between text-xs text-muted-foreground">
//                         <span>Effective from: {new Date(mockTeacherData.salary_structures[0].effective_from).toLocaleDateString('en-IN')}</span>
//                         <Badge className="bg-green-50 text-green-700 border-green-300">{mockTeacherData.salary_structures[0].status}</Badge>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <p className="text-sm text-muted-foreground text-center py-4">No active salary structure</p>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Salary History */}
//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 p-4 sm:p-6">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//                   <div className="flex items-center gap-3">
//                     <FileText className="h-5 w-5 text-[#1897C6]" />
//                     <CardTitle className="text-base sm:text-lg">Salary Payment History</CardTitle>
//                   </div>
//                   <Button 
//                     size="sm" 
//                     onClick={() => setAddSalaryDialog(true)}
//                     className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#1897C6] to-[#67BAC3] hover:from-[#1897C6]/90 hover:to-[#67BAC3]/90 h-9"
//                   >
//                     <Plus className="h-3.5 w-3.5" />
//                     <span className="text-xs sm:text-sm">Add Salary</span>
//                   </Button>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-0 sm:p-6">
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 hover:from-[#1897C6]/5 hover:to-[#67BAC3]/5 border-b-2">
//                         <TableHead className="font-semibold text-sm">Month</TableHead>
//                         <TableHead className="font-semibold text-sm hidden sm:table-cell">Basic</TableHead>
//                         <TableHead className="font-semibold text-sm hidden md:table-cell">Gross</TableHead>
//                         <TableHead className="font-semibold text-sm">Net</TableHead>
//                         <TableHead className="font-semibold text-sm hidden lg:table-cell">Status</TableHead>
//                         <TableHead className="font-semibold text-sm text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {currentSalaryHistory.length > 0 ? (
//                         currentSalaryHistory.map((salary) => (
//                           <TableRow key={salary.id} className="hover:bg-gradient-to-r hover:from-[#1897C6]/5 hover:to-transparent transition-all border-b">
//                             <TableCell className="py-4">
//                               <div>
//                                 <p className="font-medium text-sm">{salary.month}</p>
//                                 <p className="text-xs text-muted-foreground lg:hidden">{salary.status}</p>
//                               </div>
//                             </TableCell>
//                             <TableCell className="py-4 hidden sm:table-cell">
//                               <p className="text-sm font-medium">₹{salary.basic.toLocaleString('en-IN')}</p>
//                             </TableCell>
//                             <TableCell className="py-4 hidden md:table-cell">
//                               <p className="text-sm font-medium">₹{salary.gross.toLocaleString('en-IN')}</p>
//                             </TableCell>
//                             <TableCell className="py-4">
//                               <p className="text-sm font-bold text-[#1897C6]">₹{salary.net.toLocaleString('en-IN')}</p>
//                             </TableCell>
//                             <TableCell className="py-4 hidden lg:table-cell">
//                               <Badge className={salary.status === 'paid' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-amber-50 text-amber-700 border-amber-300'}>
//                                 {salary.status}
//                               </Badge>
//                             </TableCell>
//                             <TableCell className="py-4">
//                               <div className="flex items-center justify-end gap-1">
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => handleViewSalary(salary)}
//                                   className="h-8 w-8 p-0 rounded-lg hover:bg-[#1897C6]/10 hover:text-[#1897C6] transition-colors"
//                                   title="View Details"
//                                 >
//                                   <Eye className="h-3.5 w-3.5" />
//                                 </Button>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => handleEditSalary(salary)}
//                                   className="h-8 w-8 p-0 rounded-lg hover:bg-[#F1AF37]/10 hover:text-[#F1AF37] transition-colors"
//                                   title="Edit"
//                                 >
//                                   <Edit2 className="h-3.5 w-3.5" />
//                                 </Button>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => handleDeleteSalary(salary.id)}
//                                   className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
//                                   title="Delete"
//                                 >
//                                   <Trash2 className="h-3.5 w-3.5" />
//                                 </Button>
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       ) : (
//                         <TableRow>
//                           <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
//                             No salary history available
//                           </TableCell>
//                         </TableRow>
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>

//                 {/* Pagination */}
//                 {mockTeacherData.salary_history.length > salaryPerPage && (
//                   <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 p-4 border-t">
//                     <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
//                       Showing {salaryIndexOfFirst + 1} - {Math.min(salaryIndexOfLast, mockTeacherData.salary_history.length)} of {mockTeacherData.salary_history.length}
//                     </div>
//                     <div className="flex items-center justify-center gap-1 sm:gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setSalaryPage(1)}
//                         disabled={salaryPage === 1}
//                         className="h-8 w-8 p-0 border-2"
//                       >
//                         <ChevronsLeft className="h-3.5 w-3.5" />
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setSalaryPage((prev) => Math.max(1, prev - 1))}
//                         disabled={salaryPage === 1}
//                         className="h-8 w-8 p-0 border-2"
//                       >
//                         <ChevronLeft className="h-3.5 w-3.5" />
//                       </Button>

//                       {Array.from({ length: Math.min(3, salaryTotalPages) }, (_, i) => {
//                         let pageNumber: number
//                         if (salaryTotalPages <= 3) {
//                           pageNumber = i + 1
//                         } else if (salaryPage <= 2) {
//                           pageNumber = i + 1
//                         } else if (salaryPage >= salaryTotalPages - 1) {
//                           pageNumber = salaryTotalPages - 2 + i
//                         } else {
//                           pageNumber = salaryPage - 1 + i
//                         }

//                         return (
//                           <Button
//                             key={pageNumber}
//                             variant={salaryPage === pageNumber ? 'default' : 'outline'}
//                             size="sm"
//                             onClick={() => setSalaryPage(pageNumber)}
//                             className={`h-8 w-8 p-0 border-2 ${
//                               salaryPage === pageNumber
//                                 ? 'bg-gradient-to-r from-[#1897C6] to-[#67BAC3] text-white'
//                                 : ''
//                             }`}
//                           >
//                             {pageNumber}
//                           </Button>
//                         )
//                       })}

//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setSalaryPage((prev) => Math.min(salaryTotalPages, prev + 1))}
//                         disabled={salaryPage === salaryTotalPages}
//                         className="h-8 w-8 p-0 border-2"
//                       >
//                         <ChevronRight className="h-3.5 w-3.5" />
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setSalaryPage(salaryTotalPages)}
//                         disabled={salaryPage === salaryTotalPages}
//                         className="h-8 w-8 p-0 border-2"
//                       >
//                         <ChevronsRight className="h-3.5 w-3.5" />
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Leaves Tab */}
//           <TabsContent value="leaves" className="space-y-4">
//             <Card className="border-2">
//               <CardHeader className="bg-gradient-to-r from-[#1897C6]/5 to-[#67BAC3]/5 p-4 sm:p-6">
//                 <div className="flex items-center gap-3">
//                   <CalendarIcon className="h-5 w-5 text-[#1897C6]" />
//                   <div>
//                     <CardTitle className="text-base sm:text-lg">Leave Requests</CardTitle>
//                     <p className="text-xs text-muted-foreground mt-1">Review and manage teacher leave applications</p>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-3 sm:p-6 space-y-4">
//                 {mockTeacherData.leave_requests.length > 0 ? (
//                   mockTeacherData.leave_requests.map((leave) => {
//                     const statusConfig = getLeaveStatusBadge(leave.status)
//                     const typeConfig = getLeaveTypeBadge(leave.leave_type)
                    
//                     return (
//                       <Card key={leave.id} className="border-2 hover:border-[#1897C6]/30 transition-all">
//                         <CardContent className="p-4 space-y-3">
//                           <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
//                             <div className="flex flex-wrap items-center gap-2">
//                               <Badge className={`${typeConfig.className} border-2`}>
//                                 {typeConfig.label} Leave
//                               </Badge>
//                               <Badge className={`${statusConfig.className} border-2`}>
//                                 {statusConfig.label}
//                               </Badge>
//                               <span className="text-xs text-muted-foreground">
//                                 {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
//                               </span>
//                             </div>
//                           </div>

//                           <div className="space-y-2">
//                             <div className="flex items-center gap-2 text-xs sm:text-sm">
//                               <Calendar className="h-4 w-4 text-muted-foreground" />
//                               <span className="font-medium">
//                                 {new Date(leave.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//                                 {' '}-{' '}
//                                 {new Date(leave.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//                               </span>
//                             </div>

//                             <div className="space-y-1">
//                               <p className="text-xs font-semibold text-muted-foreground">Reason:</p>
//                               <p className="text-xs sm:text-sm text-foreground">{leave.reason}</p>
//                             </div>

//                             {leave.supporting_document_url && (
//                               <div className="pt-2">
//                                 <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
//                                   <FileText className="h-3 w-3" />
//                                   View Supporting Document
//                                 </Button>
//                               </div>
//                             )}

//                             {leave.status === 'approved' && leave.admin_remarks && (
//                               <div className="pt-2 border-t border-green-200 bg-green-50/50 -mx-4 -mb-4 p-4 rounded-b-lg">
//                                 <div className="flex items-start gap-2">
//                                   <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
//                                   <div className="space-y-1">
//                                     <p className="text-xs font-semibold text-green-700">
//                                       Approved by {leave.approved_by} on {new Date(leave.approved_at).toLocaleDateString('en-IN')}
//                                     </p>
//                                     <p className="text-xs text-green-600">
//                                       <span className="font-semibold">Admin Remarks:</span> {leave.admin_remarks}
//                                     </p>
//                                   </div>
//                                 </div>
//                               </div>
//                             )}

//                             {leave.status === 'rejected' && (leave.rejection_reason || leave.admin_remarks) && (
//                               <div className="pt-2 border-t border-rose-200 bg-rose-50/50 -mx-4 -mb-4 p-4 rounded-b-lg">
//                                 <div className="flex items-start gap-2">
//                                   <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
//                                   <div className="space-y-1">
//                                     <p className="text-xs font-semibold text-rose-700">
//                                       Rejected by {leave.approved_by} on {new Date(leave.approved_at).toLocaleDateString('en-IN')}
//                                     </p>
//                                     {leave.rejection_reason && (
//                                       <p className="text-xs text-rose-600">
//                                         <span className="font-semibold">Rejection Reason:</span> {leave.rejection_reason}
//                                       </p>
//                                     )}
//                                     {leave.admin_remarks && (
//                                       <p className="text-xs text-rose-600">
//                                         <span className="font-semibold">Admin Remarks:</span> {leave.admin_remarks}
//                                       </p>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             )}

//                             {leave.status === 'pending' && (
//                               <div className="pt-3 border-t flex flex-col sm:flex-row gap-2">
//                                 <Button 
//                                   size="sm" 
//                                   onClick={() => handleLeaveAction(leave, 'approve')}
//                                   className="flex-1 gap-2 bg-green-600 hover:bg-green-700 h-9"
//                                 >
//                                   <CheckCircle className="h-4 w-4" />
//                                   <span className="text-xs sm:text-sm">Approve Leave</span>
//                                 </Button>
//                                 <Button 
//                                   size="sm" 
//                                   onClick={() => handleLeaveAction(leave, 'reject')}
//                                   variant="outline"
//                                   className="flex-1 gap-2 border-rose-300 text-rose-600 hover:bg-rose-50 h-9"
//                                 >
//                                   <XCircle className="h-4 w-4" />
//                                   <span className="text-xs sm:text-sm">Reject Leave</span>
//                                 </Button>
//                               </div>
//                             )}
//                           </div>
//                         </CardContent>
//                       </Card>
//                     )
//                   })
//                 ) : (
//                   <div className="text-center py-8 text-muted-foreground text-sm">
//                     No leave requests
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </div>

//       {/* Edit Assignment Dialog */}
//       <Dialog open={editAssignmentDialog} onOpenChange={setEditAssignmentDialog}>
//         <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle className="text-lg sm:text-xl">Manage Teaching Assignments</DialogTitle>
//             <DialogDescription className="text-sm">
//               Update class teacher and subject teacher roles for {mockTeacherData.full_name}
//             </DialogDescription>
//           </DialogHeader>
          
//           <Tabs defaultValue="class-teacher" className="w-full">
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="class-teacher" className="gap-2">
//                 <School className="h-4 w-4" />
//                 <span className="hidden sm:inline">Class Teacher</span>
//                 <span className="sm:hidden">Class</span>
//               </TabsTrigger>
//               <TabsTrigger value="subject-teacher" className="gap-2">
//                 <BookOpen className="h-4 w-4" />
//                 <span className="hidden sm:inline">Subject Teacher</span>
//                 <span className="sm:hidden">Subject</span>
//               </TabsTrigger>
//             </TabsList>

//             {/* Class Teacher Tab */}
//             <TabsContent value="class-teacher" className="space-y-4 mt-4">
//               <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-3 sm:p-4">
//                 <div className="flex items-center justify-between mb-3">
//                   <h3 className="font-semibold text-sm sm:text-base text-emerald-900">Current Assignments</h3>
//                   <Badge className="bg-emerald-600 text-white text-xs">
//                     {mockTeacherData.class_teacher_assignments.length}
//                   </Badge>
//                 </div>
//                 <div className="space-y-2 max-h-40 overflow-y-auto">
//                   {mockTeacherData.class_teacher_assignments.map((assignment) => (
//                     <div key={assignment.id} className="flex items-start justify-between gap-2 p-2 sm:p-3 bg-white rounded-lg border border-emerald-200">
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 flex-wrap mb-1">
//                           <Badge className="bg-emerald-600 text-white text-xs">
//                             {assignment.class}-{assignment.section}
//                           </Badge>
//                           <span className="text-xs text-muted-foreground">{assignment.academic_year}</span>
//                         </div>
//                         <p className="text-xs text-muted-foreground">
//                           {assignment.start_time} - {assignment.end_time} | {assignment.total_students} students
//                         </p>
//                       </div>
//                       <Button 
//                         size="sm" 
//                         variant="ghost"
//                         className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
//                         onClick={() => console.log('[v0] Remove:', assignment.id)}
//                       >
//                         <Trash2 className="h-3.5 w-3.5" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
              
//               <div className="rounded-lg border-2 p-3 sm:p-4 space-y-3 bg-muted/30">
//                 <h3 className="font-semibold text-sm">Add New Class Teacher Role</h3>
//                 <div className="grid gap-3 grid-cols-2">
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">Class</Label>
//                     <Select defaultValue="10">
//                       <SelectTrigger className="h-9">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => (
//                           <SelectItem key={c} value={c.toString()}>{c}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">Section</Label>
//                     <Select defaultValue="A">
//                       <SelectTrigger className="h-9">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {['A','B','C','D'].map(s => (
//                           <SelectItem key={s} value={s}>{s}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">Start Time</Label>
//                     <Input type="time" defaultValue="08:00" className="h-9" />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">End Time</Label>
//                     <Input type="time" defaultValue="14:00" className="h-9" />
//                   </div>
//                 </div>
//                 <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 h-9">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Assign as Class Teacher
//                 </Button>
//               </div>
//             </TabsContent>

//             {/* Subject Teacher Tab */}
//             <TabsContent value="subject-teacher" className="space-y-4 mt-4">
//               <div className="rounded-lg border-2 border-[#1897C6]/30 bg-[#1897C6]/5 p-3 sm:p-4">
//                 <div className="flex items-center justify-between mb-3">
//                   <h3 className="font-semibold text-sm sm:text-base text-[#1897C6]">Current Assignments</h3>
//                   <Badge className="bg-[#1897C6] text-white text-xs">
//                     {mockTeacherData.subject_teacher_assignments.length}
//                   </Badge>
//                 </div>
//                 <div className="space-y-2 max-h-40 overflow-y-auto">
//                   {mockTeacherData.subject_teacher_assignments.map((assignment) => (
//                     <div key={assignment.id} className="flex items-start justify-between gap-2 p-2 sm:p-3 bg-white rounded-lg border border-[#1897C6]/20">
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 flex-wrap mb-1">
//                           <Badge className="bg-gradient-to-r from-[#F1AF37] to-[#D88931] text-white text-xs">
//                             {assignment.subject_name}
//                           </Badge>
//                           <Badge variant="outline" className="font-mono text-xs">
//                             {assignment.class}-{assignment.section}
//                           </Badge>
//                         </div>
//                         <p className="text-xs text-muted-foreground">
//                           {assignment.start_time} - {assignment.end_time} | {assignment.lectures_per_week} lectures/week
//                         </p>
//                       </div>
//                       <Button 
//                         size="sm" 
//                         variant="ghost"
//                         className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
//                         onClick={() => console.log('[v0] Remove:', assignment.id)}
//                       >
//                         <Trash2 className="h-3.5 w-3.5" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
              
//               <div className="rounded-lg border-2 p-3 sm:p-4 space-y-3 bg-muted/30">
//                 <h3 className="font-semibold text-sm">Add New Subject Teaching</h3>
//                 <div className="grid gap-3 grid-cols-2">
//                   <div className="space-y-1.5 col-span-2 sm:col-span-1">
//                     <Label className="text-xs sm:text-sm">Subject</Label>
//                     <Select defaultValue="Mathematics">
//                       <SelectTrigger className="h-9">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Computer Science'].map(s => (
//                           <SelectItem key={s} value={s}>{s}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-1.5 col-span-2 sm:col-span-1">
//                     <Label className="text-xs sm:text-sm">Class-Section</Label>
//                     <Select defaultValue="10-A">
//                       <SelectTrigger className="h-9">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A', '12-B'].map(c => (
//                           <SelectItem key={c} value={c}>{c}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">Start Time</Label>
//                     <Input type="time" defaultValue="09:00" className="h-9" />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">End Time</Label>
//                     <Input type="time" defaultValue="10:00" className="h-9" />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">Lectures/Week</Label>
//                     <Input type="number" placeholder="5" defaultValue="5" min="1" max="10" className="h-9" />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label className="text-xs sm:text-sm">Academic Year</Label>
//                     <Input type="text" placeholder="2024-25" defaultValue="2024-25" className="h-9" />
//                   </div>
//                 </div>
//                 <Button size="sm" className="w-full bg-gradient-to-r from-[#1897C6] to-[#67BAC3] h-9">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Assign Subject Teaching
//                 </Button>
//               </div>
//             </TabsContent>
//           </Tabs>

//           <DialogFooter className="gap-2 mt-4">
//             <Button variant="outline" onClick={() => setEditAssignmentDialog(false)} className="h-9">
//               Cancel
//             </Button>
//             <Button 
//               className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3] h-9"
//               onClick={() => {
//                 console.log('[v0] Saving teaching assignments')
//                 setEditAssignmentDialog(false)
//               }}
//             >
//               <Save className="h-4 w-4 mr-2" />
//               Save All Changes
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Add Salary Dialog */}
//       <Dialog open={addSalaryDialog} onOpenChange={setAddSalaryDialog}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Add New Salary Structure</DialogTitle>
//             <DialogDescription>
//               Create a new salary structure for this teacher
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="grid gap-4 sm:grid-cols-2">
//               <div className="space-y-2">
//                 <Label htmlFor="salary_type">Salary Type</Label>
//                 <Select
//                   value={newSalary.salary_type}
//                   onValueChange={(value) => setNewSalary({ ...newSalary, salary_type: value })}
//                 >
//                   <SelectTrigger id="salary_type">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="fixed_monthly">Fixed Monthly</SelectItem>
//                     <SelectItem value="per_lecture">Per Lecture</SelectItem>
//                     <SelectItem value="hourly">Hourly</SelectItem>
//                     <SelectItem value="hybrid">Hybrid</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="effective_from">Effective From</Label>
//                 <Input
//                   id="effective_from"
//                   type="date"
//                   value={newSalary.effective_from}
//                   onChange={(e) => setNewSalary({ ...newSalary, effective_from: e.target.value })}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="basic_salary">Basic Salary (₹)</Label>
//                 <Input
//                   id="basic_salary"
//                   type="number"
//                   placeholder="50000"
//                   value={newSalary.basic_salary}
//                   onChange={(e) => setNewSalary({ ...newSalary, basic_salary: e.target.value })}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="hra">HRA (₹)</Label>
//                 <Input
//                   id="hra"
//                   type="number"
//                   placeholder="15000"
//                   value={newSalary.hra}
//                   onChange={(e) => setNewSalary({ ...newSalary, hra: e.target.value })}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="da">DA (₹)</Label>
//                 <Input
//                   id="da"
//                   type="number"
//                   placeholder="5000"
//                   value={newSalary.da}
//                   onChange={(e) => setNewSalary({ ...newSalary, da: e.target.value })}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="conveyance_allowance">Conveyance Allowance (₹)</Label>
//                 <Input
//                   id="conveyance_allowance"
//                   type="number"
//                   placeholder="3000"
//                   value={newSalary.conveyance_allowance}
//                   onChange={(e) => setNewSalary({ ...newSalary, conveyance_allowance: e.target.value })}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="medical_allowance">Medical Allowance (₹)</Label>
//                 <Input
//                   id="medical_allowance"
//                   type="number"
//                   placeholder="2000"
//                   value={newSalary.medical_allowance}
//                   onChange={(e) => setNewSalary({ ...newSalary, medical_allowance: e.target.value })}
//                 />
//               </div>
//             </div>

//             <div className="space-y-3 pt-3 border-t">
//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="pf_applicable"
//                   checked={newSalary.pf_applicable}
//                   onCheckedChange={(checked) => setNewSalary({ ...newSalary, pf_applicable: checked as boolean })}
//                 />
//                 <Label htmlFor="pf_applicable" className="text-sm cursor-pointer">
//                   PF Applicable
//                 </Label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="tds_applicable"
//                   checked={newSalary.tds_applicable}
//                   onCheckedChange={(checked) => setNewSalary({ ...newSalary, tds_applicable: checked as boolean })}
//                 />
//                 <Label htmlFor="tds_applicable" className="text-sm cursor-pointer">
//                   TDS Applicable
//                 </Label>
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setAddSalaryDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAddSalary} className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3]">
//               Add Salary Structure
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* View Salary Dialog */}
//       <Dialog open={viewSalaryDialog} onOpenChange={setViewSalaryDialog}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>Salary Details</DialogTitle>
//             <DialogDescription>
//               {selectedSalary?.month}
//             </DialogDescription>
//           </DialogHeader>
//           {selectedSalary && (
//             <div className="space-y-3 py-4">
//               <div className="flex justify-between">
//                 <span className="text-sm text-muted-foreground">Basic Salary:</span>
//                 <span className="text-sm font-medium">₹{selectedSalary.basic.toLocaleString('en-IN')}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-sm text-muted-foreground">Allowances:</span>
//                 <span className="text-sm font-medium">₹{selectedSalary.allowances.toLocaleString('en-IN')}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-sm text-muted-foreground">Gross Salary:</span>
//                 <span className="text-sm font-medium">₹{selectedSalary.gross.toLocaleString('en-IN')}</span>
//               </div>
//               <div className="flex justify-between pt-2 border-t">
//                 <span className="text-sm text-muted-foreground">Deductions:</span>
//                 <span className="text-sm font-medium text-red-600">-₹{selectedSalary.deductions.toLocaleString('en-IN')}</span>
//               </div>
//               <div className="flex justify-between pt-2 border-t">
//                 <span className="text-sm font-semibold">Net Salary:</span>
//                 <span className="text-lg font-bold text-[#1897C6]">₹{selectedSalary.net.toLocaleString('en-IN')}</span>
//               </div>
//               <div className="pt-3 border-t space-y-2">
//                 <div className="flex justify-between text-xs">
//                   <span className="text-muted-foreground">Payment Date:</span>
//                   <span className="font-medium">{new Date(selectedSalary.payment_date).toLocaleDateString('en-IN')}</span>
//                 </div>
//                 <div className="flex justify-between text-xs">
//                   <span className="text-muted-foreground">Payment Mode:</span>
//                   <span className="font-medium">{selectedSalary.payment_mode}</span>
//                 </div>
//                 <div className="flex justify-between text-xs">
//                   <span className="text-muted-foreground">Status:</span>
//                   <Badge className={selectedSalary.status === 'paid' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-amber-50 text-amber-700 border-amber-300'}>
//                     {selectedSalary.status}
//                   </Badge>
//                 </div>
//               </div>
//             </div>
//           )}
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setViewSalaryDialog(false)}>
//               Close
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Edit Salary Dialog */}
//       <Dialog open={editSalaryDialog} onOpenChange={setEditSalaryDialog}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>Edit Salary Payment</DialogTitle>
//             <DialogDescription>
//               {selectedSalary?.month}
//             </DialogDescription>
//           </DialogHeader>
//           {selectedSalary && (
//             <div className="space-y-4 py-4">
//               <p className="text-sm text-muted-foreground">
//                 Edit salary payment details and status.
//               </p>
//               {/* Add actual edit form here */}
//             </div>
//           )}
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setEditSalaryDialog(false)}>
//               Cancel
//             </Button>
//             <Button className="bg-gradient-to-r from-[#1897C6] to-[#67BAC3]">
//               Save Changes
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Leave Action Dialog */}
//       <Dialog open={leaveActionDialog} onOpenChange={setLeaveActionDialog}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {leaveAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
//             </DialogTitle>
//             <DialogDescription>
//               {selectedLeave && `${new Date(selectedLeave.from_date).toLocaleDateString('en-IN')} - ${new Date(selectedLeave.to_date).toLocaleDateString('en-IN')} (${selectedLeave.total_days} days)`}
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             {selectedLeave && (
//               <div className="space-y-3">
//                 <div className="p-3 rounded-lg bg-muted/50 space-y-2">
//                   <p className="text-xs font-semibold text-muted-foreground">Leave Reason:</p>
//                   <p className="text-sm">{selectedLeave.reason}</p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="admin_remarks">
//                     Admin Remarks {leaveAction === 'reject' && '(Required)'}
//                   </Label>
//                   <Textarea
//                     id="admin_remarks"
//                     placeholder={leaveAction === 'approve' ? 'Add any remarks for the teacher...' : 'Explain the reason for rejection...'}
//                     value={leaveRemarks}
//                     onChange={(e) => setLeaveRemarks(e.target.value)}
//                     rows={4}
//                   />
//                   <p className="text-xs text-muted-foreground">
//                     This message will be visible to the teacher.
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setLeaveActionDialog(false)}>
//               Cancel
//             </Button>
//             <Button 
//               onClick={handleSubmitLeaveAction}
//               className={leaveAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-rose-600 hover:bg-rose-700'}
//               disabled={leaveAction === 'reject' && !leaveRemarks.trim()}
//             >
//               {leaveAction === 'approve' ? 'Approve Leave' : 'Reject Leave'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }

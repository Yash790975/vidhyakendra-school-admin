import { apiClient } from './client'
import { ENDPOINTS } from './config'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface InstitutePopulated {
  _id: string
  institute_code: string
  institute_name: string 
  institute_type: 'school' | 'coaching' | 'both'
}
  
export interface TeacherPopulated {
  _id: string
  teacher_code: string
  full_name: string
}

export interface ClassMaster {
  _id: string
  institute_id: string | InstitutePopulated
  class_name: string
  class_type: 'school' | 'coaching'
  class_teacher_id?: TeacherPopulated | string | null
  class_capacity?: number | null
  class_level?: string | null
  academic_year: string
  status?: 'active' | 'inactive' | 'archived'
  archived_at?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ClassSection {
  _id?: string
  class_id: string
  section_name: string
  class_teacher_id?: string | null
  class_capacity?: number | null
  status?: 'active' | 'inactive' | 'archived'
  archived_at?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateClassPayload {
  institute_id: string
  class_name: string
  class_type: 'school' | 'coaching'
  class_capacity?: number | null
  class_level?: string | null
  academic_year: string
}

export interface CreateSectionPayload {
  class_id: string
  section_name: string
  class_capacity?: number | null
}


// FIX: removed section_id and batch_id — these fields do not exist in the backend classSubjects model
export interface ClassSubject {
  _id?: string
  class_id: string
  subject_id: string
  is_compulsory?: boolean
}

export interface ClassSubjectSchedule {
  _id?: string
  class_id: string
  subject_id: string | { _id: string; subject_name: string }
  teacher_id: string | TeacherPopulated | null
  section_id?: string | null
  batch_id?: null
  day_of_week: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
  start_time: string
  end_time: string
  room_number?: string | null
  academic_year: string
  status?: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

// School schedule — section_id required, batch_id must NOT be sent
export interface CreateSchedulePayload {
  class_id: string
  section_id: string
  subject_id: string
  teacher_id: string
  academic_year: string
  day_of_week: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
  start_time: string
  end_time: string
  room_number?: string | null
}

// FIX: removed is_active (not in backend model), added missing archived_at
export interface ClassTeacherAssignment {
  is_active?: boolean
  _id?: string
  class_id: string
  teacher_id: string | TeacherPopulated
  role: 'class_teacher' | 'subject_teacher' | 'principal' | 'vice_principal' | 'lab_assistant'
  subject_id?: string
  section_id?: string | null
  academic_year: string
  assigned_from?: string
  assigned_to?: string | null
  status?: 'active' | 'inactive' | 'archived'
  archived_at?: string | null
  createdAt?: string
  updatedAt?: string
}

// FIX: proper typed wrapper matching backend response shape for getClassTeacher
// backend returns: { type: 'class' | 'section' | 'sections', data: assignment | assignment[] }
export interface ClassTeacherResponse {
  type: 'class' | 'section' | 'sections'
  data: ClassTeacherAssignment | ClassTeacherAssignment[]
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const classesApi = {
  // ─── Classes Master ─────────────────────────────────────────────────────────

  create: (data: CreateClassPayload) =>
    apiClient.post<ClassMaster>(ENDPOINTS.CLASSES.BASE, data),

  getAll: (query?: {
    instituteId?: string
    status?: string
    class_type?: string
    academic_year?: string
    class_level?: string
  }) => {
    const params = new URLSearchParams()
    if (query?.instituteId) params.append('institute_id', query.instituteId)
    if (query?.status) params.append('status', query.status)
    if (query?.class_type) params.append('class_type', query.class_type)
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    if (query?.class_level) params.append('class_level', query.class_level)
    const qs = params.toString()
    return apiClient.get<ClassMaster[]>(`${ENDPOINTS.CLASSES.BASE}${qs ? `?${qs}` : ''}`)
  },

  getById: (id: string) =>
    apiClient.get<ClassMaster>(ENDPOINTS.CLASSES.GET_BY_ID(id)),

  getByTeacher: (teacherId: string) =>
    apiClient.get<ClassMaster[]>(ENDPOINTS.CLASSES.GET_BY_TEACHER(teacherId)),

  getByInstituteAndYear: (instituteId: string, year: string) =>
    apiClient.get<ClassMaster[]>(ENDPOINTS.CLASSES.GET_BY_INSTITUTE_AND_YEAR(instituteId, year)),

  update: (id: string, data: Partial<CreateClassPayload> & { status?: 'active' | 'inactive' | 'archived' }) =>
    apiClient.put<ClassMaster>(ENDPOINTS.CLASSES.UPDATE(id), data),

  delete: (id: string) =>
    apiClient.delete<void>(ENDPOINTS.CLASSES.DELETE(id)),

  // ─── Sections ───────────────────────────────────────────────────────────────

  createSection: (data: CreateSectionPayload) =>
    apiClient.post<ClassSection>(ENDPOINTS.CLASS_SECTIONS.BASE, data),

  getAllSections: (query?: { class_id?: string; status?: string }) => {
    const params = new URLSearchParams()
    if (query?.class_id) params.append('class_id', query.class_id)
    if (query?.status) params.append('status', query.status)
    const qs = params.toString()
    return apiClient.get<ClassSection[]>(`${ENDPOINTS.CLASS_SECTIONS.BASE}${qs ? `?${qs}` : ''}`)
  },

  getSectionById: (id: string) =>
    apiClient.get<ClassSection>(ENDPOINTS.CLASS_SECTIONS.GET_BY_ID(id)),

  getSectionsByClass: (classId: string) =>
    apiClient.get<ClassSection[]>(ENDPOINTS.CLASS_SECTIONS.GET_BY_CLASS(classId)),

  updateSection: (id: string, data: Partial<ClassSection>) =>
    apiClient.put<ClassSection>(ENDPOINTS.CLASS_SECTIONS.UPDATE(id), data),

  deleteSection: (id: string) =>
    apiClient.delete<void>(ENDPOINTS.CLASS_SECTIONS.DELETE(id)),

  

  // ─── Class Subjects ──────────────────────────────────────────────────────────

  createClassSubject: (data: ClassSubject) =>
    apiClient.post<ClassSubject>(ENDPOINTS.CLASS_SUBJECTS.BASE, data),

  getAllClassSubjects: (query?: { class_id?: string; subject_id?: string; is_compulsory?: boolean }) => {
    const params = new URLSearchParams()
    if (query?.class_id) params.append('class_id', query.class_id)
    if (query?.subject_id) params.append('subject_id', query.subject_id)
    if (query?.is_compulsory !== undefined) params.append('is_compulsory', String(query.is_compulsory))
    const qs = params.toString()
    return apiClient.get<ClassSubject[]>(`${ENDPOINTS.CLASS_SUBJECTS.BASE}${qs ? `?${qs}` : ''}`)
  },

  getClassSubjectById: (id: string) =>
    apiClient.get<ClassSubject>(ENDPOINTS.CLASS_SUBJECTS.GET_BY_ID(id)),

  getClassSubjectsByClass: (classId: string) =>
    apiClient.get<ClassSubject[]>(ENDPOINTS.CLASS_SUBJECTS.GET_BY_CLASS(classId)),

  updateClassSubject: (id: string, data: Partial<ClassSubject>) =>
    apiClient.put<ClassSubject>(ENDPOINTS.CLASS_SUBJECTS.UPDATE(id), data),

  deleteClassSubject: (id: string) =>
    apiClient.delete<void>(ENDPOINTS.CLASS_SUBJECTS.DELETE(id)),

  // ─── Schedule (Timetable) ────────────────────────────────────────────────────

  createSchedule: (data: ClassSubjectSchedule) =>
    apiClient.post<ClassSubjectSchedule>(ENDPOINTS.CLASS_SUBJECT_SCHEDULE.BASE, data),

  getAllSchedules: (query?: {
    class_id?: string
    section_id?: string
    subject_id?: string
    teacher_id?: string
    day_of_week?: string
    status?: string
    academic_year?: string
  }) => {
    const params = new URLSearchParams()
    if (query?.class_id) params.append('class_id', query.class_id)
    if (query?.section_id) params.append('section_id', query.section_id)
    if (query?.subject_id) params.append('subject_id', query.subject_id)
    if (query?.teacher_id) params.append('teacher_id', query.teacher_id)
    if (query?.day_of_week) params.append('day_of_week', query.day_of_week)
    if (query?.status) params.append('status', query.status)
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassSubjectSchedule[]>(`${ENDPOINTS.CLASS_SUBJECT_SCHEDULE.BASE}${qs ? `?${qs}` : ''}`)
  },

  getScheduleById: (id: string) =>
    apiClient.get<ClassSubjectSchedule>(ENDPOINTS.CLASS_SUBJECT_SCHEDULE.GET_BY_ID(id)),

  // section_id and academic_year passed as query params — backend reads req.query.section_id
  getScheduleByClass: (classId: string, query?: { section_id?: string; academic_year?: string }) => {
    const params = new URLSearchParams()
    if (query?.section_id) params.append('section_id', query.section_id)
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassSubjectSchedule[]>(
      `${ENDPOINTS.CLASS_SUBJECT_SCHEDULE.GET_BY_CLASS(classId)}${qs ? `?${qs}` : ''}`
    )
  },

  getScheduleByTeacher: (teacherId: string, query?: { academic_year?: string }) => {
    const params = new URLSearchParams()
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassSubjectSchedule[]>(
      `${ENDPOINTS.CLASS_SUBJECT_SCHEDULE.GET_BY_TEACHER(teacherId)}${qs ? `?${qs}` : ''}`
    )
  },

  // section_id and academic_year passed as query params — backend reads req.query
  getScheduleByDay: (
    classId: string,
    day: string,
    query?: { section_id?: string; academic_year?: string }
  ) => {
    const params = new URLSearchParams()
    if (query?.section_id) params.append('section_id', query.section_id)
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassSubjectSchedule[]>(
      `${ENDPOINTS.CLASS_SUBJECT_SCHEDULE.GET_BY_DAY(classId, day)}${qs ? `?${qs}` : ''}`
    )
  },

  updateSchedule: (id: string, data: Partial<ClassSubjectSchedule>) =>
    apiClient.put<ClassSubjectSchedule>(ENDPOINTS.CLASS_SUBJECT_SCHEDULE.UPDATE(id), data),

  deleteSchedule: (id: string) =>
    apiClient.delete<void>(ENDPOINTS.CLASS_SUBJECT_SCHEDULE.DELETE(id)),

  // ─── Teacher Assignments ─────────────────────────────────────────────────────

  createTeacherAssignment: (data: ClassTeacherAssignment) =>
    apiClient.post<ClassTeacherAssignment>(ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.BASE, data),

  getAllAssignments: (query?: {
    teacher_id?: string
    class_id?: string
    section_id?: string
    subject_id?: string
    role?: string
    academic_year?: string
    status?: string
  }) => {
    const params = new URLSearchParams()
    if (query?.teacher_id) params.append('teacher_id', query.teacher_id)
    if (query?.class_id) params.append('class_id', query.class_id)
    if (query?.section_id) params.append('section_id', query.section_id)
    if (query?.subject_id) params.append('subject_id', query.subject_id)
    if (query?.role) params.append('role', query.role)
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    if (query?.status) params.append('status', query.status)
    const qs = params.toString()
    return apiClient.get<ClassTeacherAssignment[]>(
      `${ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.BASE}${qs ? `?${qs}` : ''}`
    )
  },

  getTeacherAssignmentById: (id: string) =>
    apiClient.get<ClassTeacherAssignment>(ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.GET_BY_ID(id)),

  getTeacherAssignmentsByTeacher: (teacherId: string, query?: { academic_year?: string }) => {
    const params = new URLSearchParams()
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassTeacherAssignment[]>(
      `${ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.GET_BY_TEACHER(teacherId)}${qs ? `?${qs}` : ''}`
    )
  },

  getTeacherAssignmentsByClass: (classId: string, query?: { academic_year?: string }) => {
    const params = new URLSearchParams()
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassTeacherAssignment[]>(
      `${ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.GET_BY_CLASS(classId)}${qs ? `?${qs}` : ''}`
    )
  },

  // FIX: return type updated to ClassTeacherResponse to match backend's
  // { type: 'class' | 'section' | 'sections', data: assignment | assignment[] } shape
  getClassTeacher: (
    classId: string,
    query?: { section_id?: string; academic_year?: string }
  ) => {
    const params = new URLSearchParams()
    if (query?.section_id) params.append('section_id', query.section_id)
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassTeacherResponse>(
      `${ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.GET_CLASS_TEACHER(classId)}${qs ? `?${qs}` : ''}`
    )
  },

  getTeacherAssignmentsByRole: (role: string, query?: { academic_year?: string }) => {
    const params = new URLSearchParams()
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassTeacherAssignment[]>(
      `${ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.GET_BY_ROLE(role)}${qs ? `?${qs}` : ''}`
    )
  },

  getSubjectTeachers: (subjectId: string, query?: { academic_year?: string }) => {
    const params = new URLSearchParams()
    if (query?.academic_year) params.append('academic_year', query.academic_year)
    const qs = params.toString()
    return apiClient.get<ClassTeacherAssignment[]>(
      `${ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.GET_BY_SUBJECT(subjectId)}${qs ? `?${qs}` : ''}`
    )
  },

  updateTeacherAssignment: (id: string, data: Partial<ClassTeacherAssignment>) =>
    apiClient.put<ClassTeacherAssignment>(ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.UPDATE(id), data),

  // end_date is optional — omit to use current date (backend defaults to new Date())
  endTeacherAssignment: (id: string, end_date?: string) =>
    apiClient.patch<ClassTeacherAssignment>(
      ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.END(id),
      end_date ? { end_date } : {}
    ),

  deleteTeacherAssignment: (id: string) =>
    apiClient.delete<void>(ENDPOINTS.CLASS_TEACHER_ASSIGNMENTS.DELETE(id)),
}
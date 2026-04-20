import { apiClient } from './client'
import { ENDPOINTS } from './config'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface InstituteRef {
  _id: string
  institute_code: string
  institute_name: string
  institute_type: 'school' | 'coaching' | 'both'
  status: string
}

export interface Admin {
  _id: string
  institute_id: InstituteRef | string
  name: string
  email: string
  mobile: string
  admin_type: 'school' | 'coaching' | null
  is_first_login: boolean
  last_login_at: string | null
  status: 'active' | 'blocked' | 'disabled'
  created_at?: string
  updated_at?: string
}

export interface LoginResponse {
  admin: Admin
  token: string
  is_first_login: boolean
  institute_type: 'school' | 'coaching' | 'both'
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const adminApi = {
  // ── CRUD ──────────────────────────────────────────────────────────────────
  create: (data: {
    institute_id: string
    name: string
    email: string
    mobile: string
    admin_type?: 'school' | 'coaching'
    status?: 'active' | 'blocked' | 'disabled'
  }) => apiClient.post<Admin>(ENDPOINTS.INSTITUTE_ADMIN.CREATE, data),

  getAll: () =>
    apiClient.get<Admin[]>(ENDPOINTS.INSTITUTE_ADMIN.GET_ALL),

  getById: (id: string) =>
    apiClient.get<Admin>(ENDPOINTS.INSTITUTE_ADMIN.GET_BY_ID(id)),

  getByInstitute: (instituteId: string) =>
    apiClient.get<Admin>(ENDPOINTS.INSTITUTE_ADMIN.GET_BY_INSTITUTE(instituteId)),

  update: (id: string, data: {
    name?: string
    email?: string
    mobile?: string
    status?: string
    admin_type?: 'school' | 'coaching'
  }) => apiClient.put<Admin>(ENDPOINTS.INSTITUTE_ADMIN.UPDATE(id), data),

  delete: (id: string) =>
    apiClient.delete<void>(ENDPOINTS.INSTITUTE_ADMIN.DELETE(id)),

  // ── Auth ──────────────────────────────────────────────────────────────────

  /** Always sends login_type: 'school' — this is the school admin portal */
  login: (data: { email: string; password: string }) =>
    apiClient.post<LoginResponse>(ENDPOINTS.INSTITUTE_ADMIN.VERIFY_LOGIN, {
      ...data,
      login_type: 'school',
    }),

  /** Always sends portal_type: 'school' — backend rejects non-school admins */
  requestOtp: (data: { email: string }) =>
    apiClient.post<{ message: string }>(ENDPOINTS.INSTITUTE_ADMIN.REQUEST_OTP, {
      ...data,
      portal_type: 'school',
    }),

  verifyOtp: (data: { email: string; otp: string }) =>
    apiClient.post<{ message: string; verified: boolean }>(ENDPOINTS.INSTITUTE_ADMIN.VERIFY_OTP, data),

  changePassword: (data: { email: string; old_password: string; new_password: string }) =>
    apiClient.post<{ message: string }>(ENDPOINTS.INSTITUTE_ADMIN.CHANGE_PASSWORD, data),

  resetPassword: (data: { email: string; otp: string; new_password: string }) =>
    apiClient.post<{ message: string }>(ENDPOINTS.INSTITUTE_ADMIN.RESET_PASSWORD, data),

  // ── localStorage helpers ───────────────────────────────────────────────────
  setToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('authToken', token)
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      // localStorage.removeItem('adminId')
      // localStorage.removeItem('adminName')
      // localStorage.removeItem('adminEmail')
      // localStorage.removeItem('instituteId')
      // localStorage.removeItem('instituteName')
      // localStorage.removeItem('instituteCode')
      // localStorage.removeItem('instituteType')
      // localStorage.removeItem('instituteLogo')
      // localStorage.removeItem('role')
      // localStorage.removeItem('portalType')
      document.cookie = 'authToken=; path=/; max-age=0'
    }
  },


  isLoggedIn: () => {
    if (typeof window !== 'undefined') return !!localStorage.getItem('authToken')
    return false
  },
}
































































// import { apiClient } from './client'
// import { ENDPOINTS } from './config'

// // ─── Interfaces ───────────────────────────────────────────────────────────────

// export interface InstituteRef {
//   _id: string
//   institute_code: string
//   institute_name: string
//   institute_type: string  
//   status: string 
// }

// export interface Admin {
//   _id: string
//   institute_id: InstituteRef | string
//   name: string
//   email: string
//   mobile: string
//   is_first_login: boolean
//   last_login_at: string | null
//   status: 'active' | 'blocked' | 'disabled'
//   created_at?: string
//   updated_at?: string
// }

// export interface LoginResponse {
//   admin: Admin
//   token: string
//   is_first_login: boolean
//   institute_type: string
// }

// // ─── API Functions ────────────────────────────────────────────────────────────

// export const adminApi = {
//   // ── CRUD ──────────────────────────────────────────────────────────────────
//   create: (data: {
//     institute_id: string
//     name: string
//     email: string
//     mobile: string
//     status?: 'active' | 'blocked' | 'disabled'
//   }) => apiClient.post<Admin>(ENDPOINTS.INSTITUTE_ADMIN.CREATE, data),

//   getAll: () =>
//     apiClient.get<Admin[]>(ENDPOINTS.INSTITUTE_ADMIN.GET_ALL),

//   getById: (id: string) =>
//     apiClient.get<Admin>(ENDPOINTS.INSTITUTE_ADMIN.GET_BY_ID(id)),

//   getByInstitute: (instituteId: string) =>
//     apiClient.get<Admin>(ENDPOINTS.INSTITUTE_ADMIN.GET_BY_INSTITUTE(instituteId)),

//   update: (id: string, data: { name?: string; email?: string; mobile?: string; status?: string }) =>
//     apiClient.put<Admin>(ENDPOINTS.INSTITUTE_ADMIN.UPDATE(id), data),

//   delete: (id: string) =>
//     apiClient.delete<void>(ENDPOINTS.INSTITUTE_ADMIN.DELETE(id)),

//   // ── Auth ──────────────────────────────────────────────────────────────────
//   login: (data: { email: string; password: string }) =>
//     apiClient.post<LoginResponse>(ENDPOINTS.INSTITUTE_ADMIN.VERIFY_LOGIN, data),

//   requestOtp: (data: { email: string }) =>
//     apiClient.post<{ message: string }>(ENDPOINTS.INSTITUTE_ADMIN.REQUEST_OTP, data),

//   verifyOtp: (data: { email: string; otp: string }) =>
//     apiClient.post<{ message: string; verified: boolean }>(ENDPOINTS.INSTITUTE_ADMIN.VERIFY_OTP, data),

//   changePassword: (data: { email: string; old_password: string; new_password: string }) =>
//     apiClient.post<{ message: string }>(ENDPOINTS.INSTITUTE_ADMIN.CHANGE_PASSWORD, data),

//   resetPassword: (data: { email: string; otp: string; new_password: string }) =>
//     apiClient.post<{ message: string }>(ENDPOINTS.INSTITUTE_ADMIN.RESET_PASSWORD, data),

//   // ── localStorage helpers ───────────────────────────────────────────────────
//   setToken: (token: string) => {
//     if (typeof window !== 'undefined') localStorage.setItem('authToken', token)
//   },

// logout: () => {
//   if (typeof window !== 'undefined') {
//     localStorage.removeItem('authToken')
//     localStorage.removeItem('adminId')
//     localStorage.removeItem('adminName')
//     localStorage.removeItem('adminEmail')
//     localStorage.removeItem('instituteId')
//     localStorage.removeItem('instituteName')
//     localStorage.removeItem('instituteCode')
//     localStorage.removeItem('instituteType')
//     localStorage.removeItem('instituteLogo')
//     localStorage.removeItem('role')
//   }
// },

//   isLoggedIn: () => {
//     if (typeof window !== 'undefined') return !!localStorage.getItem('authToken')
//     return false
//   },
// }
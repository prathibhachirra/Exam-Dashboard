import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL

export const http = axios.create({
  baseURL: API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('exam_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function getApiError(error) {
  return error.response?.data?.message || error.message || 'Something went wrong'
}

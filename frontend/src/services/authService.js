import { http } from './http'

export const authService = {
  register: (payload) => http.post('/auth-api/register', payload).then((res) => res.data),
  login: (payload) => http.post('/auth-api/login', payload).then((res) => res.data),
  me: () => http.get('/auth-api/me').then((res) => res.data),
}

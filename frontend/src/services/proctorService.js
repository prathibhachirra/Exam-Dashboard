import { http } from './http'

export const proctorService = {
  logs: () => http.get('/proctor-api/logs').then((res) => res.data),
  tabSwitch: (payload) => http.post('/proctor-api/tab-switch', payload).then((res) => res.data),
  focusLoss: (payload) => http.post('/proctor-api/focus-loss', payload).then((res) => res.data),
  webcamViolation: (payload) => http.post('/proctor-api/webcam-violation', payload).then((res) => res.data),
  suspiciousActivity: (payload) => http.post('/proctor-api/suspicious-activity', payload).then((res) => res.data),
}

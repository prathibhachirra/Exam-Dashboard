import { http } from './http'

export const resultService = {
  submit: (payload) => http.post('/submission-api/submit', payload).then((res) => res.data),
  myResults: () => http.get('/submission-api/my-results').then((res) => res.data),
  teacherResults: () => http.get('/submission-api/teacher-results').then((res) => res.data),
  examAttempts: (examId) => http.get(`/submission-api/exam/${examId}/attempts`).then((res) => res.data),
}

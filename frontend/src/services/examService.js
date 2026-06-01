import { http } from './http'

export const examService = {
  create: (payload) => http.post('/exam-api', payload).then((res) => res.data),
  teacherExams: () => http.get('/exam-api/teacher').then((res) => res.data),
  activeExams: () => http.get('/exam-api/student/active').then((res) => res.data),
  details: (id) => http.get(`/exam-api/${id}`).then((res) => res.data),
  update: (id, payload) => http.put(`/exam-api/${id}`, payload).then((res) => res.data),
  remove: (id) => http.delete(`/exam-api/${id}`).then((res) => res.data),
  addQuestion: (examId, payload) => http.post(`/exam-api/${examId}/questions`, payload).then((res) => res.data),
  updateQuestion: (questionId, payload) => http.put(`/exam-api/questions/${questionId}`, payload).then((res) => res.data),
  deleteQuestion: (questionId) => http.delete(`/exam-api/questions/${questionId}`).then((res) => res.data),
}

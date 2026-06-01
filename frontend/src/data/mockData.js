export const questions = [
  {
    title: 'Which data structure uses FIFO ordering?',
    options: ['Stack', 'Queue', 'Graph', 'Tree'],
    answer: 'Queue',
  },
  {
    title: 'What does the Page Visibility API help detect?',
    options: ['Tab focus changes', 'Network speed', 'Battery health', 'Screen size'],
    answer: 'Tab focus changes',
  },
  {
    title: 'Which HTTP method is commonly used to submit answers?',
    options: ['GET', 'POST', 'TRACE', 'HEAD'],
    answer: 'POST',
  },
]

export const students = [
  { name: 'Aarav Mehta', score: 88, risk: 12, violations: 0, status: 'Clean', time: '42m' },
  { name: 'Diya Rao', score: 76, risk: 34, violations: 1, status: 'Warning', time: '35m' },
  { name: 'Kabir Singh', score: 59, risk: 78, violations: 4, status: 'Submitted', time: 'Auto' },
  { name: 'Nisha Patel', score: 91, risk: 18, violations: 0, status: 'Clean', time: '39m' },
]

export const riskBuckets = [
  { label: 'Low', value: 58, color: 'var(--ok)' },
  { label: 'Medium', value: 28, color: 'var(--warn)' },
  { label: 'High', value: 14, color: 'var(--danger)' },
]

export const initialAuditEvents = [
  'Identity check completed',
  'Camera permission pending',
  'Exam loaded successfully',
]

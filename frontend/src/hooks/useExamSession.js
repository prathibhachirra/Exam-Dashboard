import { useCallback, useEffect, useRef, useState } from 'react'
import { createAuditLogEntry, createInitialAuditLog } from '../utils/auditLog'

export function useExamSession({ initialAuditEvents, questionCount }) {
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [violations, setViolations] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [tabStatus, setTabStatus] = useState(() => document.visibilityState)
  const [activityLog, setActivityLog] = useState(() => createInitialAuditLog(initialAuditEvents))
  const videoRef = useRef(null)

  const prependActivity = useCallback((message) => {
    setActivityLog((log) => {
      if (log[0]?.text === message) {
        return log
      }

      return [createAuditLogEntry(message), ...log]
    })
  }, [])

  const registerViolation = useCallback(
    (reason) => {
      if (submitted) {
        return
      }

      setViolations((count) => {
        const nextCount = count + 1
        const violationEntry = createAuditLogEntry(`${reason} - violation ${nextCount}/3`)

        setActivityLog((log) => {
          if (nextCount >= 3) {
            return [createAuditLogEntry('Exam auto-submitted after repeated violations'), violationEntry, ...log]
          }

          return [violationEntry, ...log]
        })

        if (nextCount >= 3) {
          setSubmitted(true)
        }

        return nextCount
      })
    },
    [submitted],
  )

  useEffect(() => {
    let stream
    let mounted = true

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        setCameraReady(true)
        prependActivity('Webcam feed connected')
      } catch {
        if (mounted) {
          setCameraReady(false)
          prependActivity('Webcam access unavailable - showing secure fallback')
        }
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      startCamera()
    } else {
      queueMicrotask(() => prependActivity('Webcam API not supported in this browser'))
    }

    return () => {
      mounted = false
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [prependActivity])

  useEffect(() => {
    function handleVisibilityChange() {
      setTabStatus(document.visibilityState)

      if (document.hidden) {
        registerViolation('Tab switch detected')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [registerViolation])

  const answeredCount = Object.keys(selectedAnswers).length
  const progress = Math.round((answeredCount / questionCount) * 100)

  return {
    activeQuestion,
    activityLog,
    answeredCount,
    cameraReady,
    progress,
    registerViolation,
    selectedAnswers,
    setActiveQuestion,
    setSelectedAnswers,
    setSubmitted,
    submitted,
    tabStatus,
    videoRef,
    violations,
  }
}

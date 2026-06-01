export function createAuditLogEntry(text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
  }
}

export function createInitialAuditLog(events) {
  return events.map(createAuditLogEntry)
}

// Shared in-memory session store (module-level, survives across requests in same process)
export interface QRSession {
  timetableSlotId: string
  teacherId: string
  expiresAt: number
  scannedStudents: string[] // studentProfile IDs
}

// Global map persisted across Next.js API route calls in dev
const globalForSessions = global as unknown as { qrSessions: Map<string, QRSession> }

export const sessions: Map<string, QRSession> =
  globalForSessions.qrSessions || (globalForSessions.qrSessions = new Map())

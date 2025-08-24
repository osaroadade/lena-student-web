import { describe, it, expect, vi } from 'vitest'
import { SessionModel } from '~/features/auth/models/session-model'
import * as session from '~/lib/session'
import * as tempSession from '~/lib/temp-session'

vi.mock('~/lib/session')
vi.mock('~/lib/temp-session')

describe('SessionModel', () => {
  describe('Session Management', () => {
    it('should call setSessionCookie when creating a session', async () => {
      const mockProfile = { id: '1', fullname: 'Test User', token: 'test-token' } as any
      const setSessionCookieSpy = vi.spyOn(session, 'setSessionCookie')

      await SessionModel.createSession(mockProfile)

      expect(setSessionCookieSpy).toHaveBeenCalledWith(mockProfile)
    })

    it('should call clearSessionCookie when clearing a session', async () => {
      const clearSessionCookieSpy = vi.spyOn(session, 'clearSessionCookie')

      await SessionModel.clearSession()

      expect(clearSessionCookieSpy).toHaveBeenCalled()
    })

    it('should return true for a valid session', async () => {
      vi.spyOn(session, 'getToken').mockResolvedValue('valid-token')
      vi.spyOn(session, 'isValidToken').mockReturnValue(true)

      const result = await SessionModel.hasValidSession({} as any)

      expect(result).toBe(true)
    })

    it('should return false for an invalid session', async () => {
      vi.spyOn(session, 'getToken').mockResolvedValue(null)

      const result = await SessionModel.hasValidSession({} as any)

      expect(result).toBe(false)
    })
  })

  describe('Temp Session Management', () => {
    it('should call setTempEmail when storing a temp email', async () => {
      const setTempEmailSpy = vi.spyOn(tempSession, 'setTempEmail')

      await SessionModel.storeTempEmail('test@example.com')

      expect(setTempEmailSpy).toHaveBeenCalledWith('test@example.com')
    })

    it('should call getTempEmail when getting a temp email', async () => {
      const getTempEmailSpy = vi.spyOn(tempSession, 'getTempEmail')

      await SessionModel.getTempEmail({} as any)

      expect(getTempEmailSpy).toHaveBeenCalled()
    })

    it('should call clearTempEmail when clearing a temp email', async () => {
      const clearTempEmailSpy = vi.spyOn(tempSession, 'clearTempEmail')

      await SessionModel.clearTempEmail()

      expect(clearTempEmailSpy).toHaveBeenCalled()
    })
  })
})

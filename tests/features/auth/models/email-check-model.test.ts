import { describe, it, expect, vi } from 'vitest'
import { EmailCheckModel } from '~/features/auth/models/email-check-model'
import * as api from '~/lib/api'

vi.mock('~/lib/api')

describe('EmailCheckModel', () => {
  describe('checkEmailExists', () => {
    it('should return exists: true for an existing email', async () => {
      vi.spyOn(api, 'checkEmail').mockResolvedValue({ exist: true })

      const result = await EmailCheckModel.checkEmailExists({ email: 'exists@example.com' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.exists).toBe(true)
      }
    })

    it('should return exists: false for a non-existent email', async () => {
      vi.spyOn(api, 'checkEmail').mockResolvedValue({ exist: false })

      const result = await EmailCheckModel.checkEmailExists({ email: 'new@example.com' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.exists).toBe(false)
      }
    })

    it('should return an error on API failure', async () => {
      vi.spyOn(api, 'checkEmail').mockRejectedValue(new Error('API Error'))

      const result = await EmailCheckModel.checkEmailExists({ email: 'error@example.com' })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })
})

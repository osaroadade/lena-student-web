import { describe, it, expect, vi } from 'vitest'
import { LoginModel } from '~/features/auth/models/login-model'
import * as api from '~/lib/api'

vi.mock('~/lib/api')

describe('LoginModel', () => {
  describe('validateLoginData', () => {
    it('should return success for valid data', () => {
      const result = LoginModel.validateLoginData({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should return failure for an invalid email', () => {
      const result = LoginModel.validateLoginData({
        email: 'invalid-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should return failure for an empty password', () => {
        const result = LoginModel.validateLoginData({
            email: 'test@example.com',
            password: '',
        })
        expect(result.success).toBe(false)
    })
  })

  describe('loginUser', () => {
    it('should return a profile on successful login', async () => {
      const mockProfile = {
        id: '1',
        fullname: 'Test User',
        phone: '1234567890',
        gender: 'male',
        email: 'test@example.com',
        username: 'testuser',
        is_teacher: false,
        title: null,
        token: 'test-token',
        image: null,
      }
      vi.spyOn(api, 'login').mockResolvedValue(mockProfile)

      const result = await LoginModel.loginUser({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.profile).toEqual(mockProfile)
    })

    it('should return an error on failed login', async () => {
      vi.spyOn(api, 'login').mockRejectedValue(new Error('Invalid credentials'))

      const result = await LoginModel.loginUser({
        email: 'test@example.com',
        password: 'wrong-password',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })
})

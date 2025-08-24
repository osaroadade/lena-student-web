import { describe, it, expect } from 'vitest'
import { ValidationModel } from '~/features/auth/models/validation-model'
import { AuthErrorCodes } from '~/features/auth/models/types'

describe('ValidationModel', () => {
  describe('Email Validation', () => {
    describe('isValidEmail', () => {
      it('should return true for valid email addresses', () => {
        expect(ValidationModel.isValidEmail('test@example.com')).toBe(true)
        expect(ValidationModel.isValidEmail('user.name@domain.co.uk')).toBe(true)
        expect(ValidationModel.isValidEmail('user+tag@example.org')).toBe(true)
      })

      it('should return false for invalid email addresses', () => {
        expect(ValidationModel.isValidEmail('invalid-email')).toBe(false)
        expect(ValidationModel.isValidEmail('test@')).toBe(false)
        expect(ValidationModel.isValidEmail('@example.com')).toBe(false)
        expect(ValidationModel.isValidEmail('')).toBe(false)
        expect(ValidationModel.isValidEmail('test.example.com')).toBe(false)
      })
    })

    describe('validateEmail', () => {
      it('should return null for valid email addresses', () => {
        expect(ValidationModel.validateEmail('test@example.com')).toBeNull()
        expect(ValidationModel.validateEmail('user.name@domain.co.uk')).toBeNull()
      })

      it('should return error message for empty email', () => {
        expect(ValidationModel.validateEmail('')).toBe('Email address is required')
        expect(ValidationModel.validateEmail('   ')).toBe('Email address is required')
      })

      it('should return error message for invalid email format', () => {
        expect(ValidationModel.validateEmail('invalid-email')).toBe('Please enter a valid email address')
        expect(ValidationModel.validateEmail('test@')).toBe('Please enter a valid email address')
      })
    })
  })

  describe('Password Validation', () => {
    describe('isValidPassword', () => {
      it('should return true for valid passwords', () => {
        expect(ValidationModel.isValidPassword('password')).toBe(true)
        expect(ValidationModel.isValidPassword('a')).toBe(true)
        expect(ValidationModel.isValidPassword('password123')).toBe(true)
        expect(ValidationModel.isValidPassword('complex!Password123')).toBe(true)
      })

      it('should return false for invalid passwords', () => {
        expect(ValidationModel.isValidPassword('')).toBe(false)
      })
    })

    describe('validatePassword', () => {
      it('should return null for valid passwords', () => {
        expect(ValidationModel.validatePassword('password')).toBeNull()
        expect(ValidationModel.validatePassword('a')).toBeNull()
        expect(ValidationModel.validatePassword('password123')).toBeNull()
      })

      it('should return error message for empty password', () => {
        expect(ValidationModel.validatePassword('')).toBe('Password is required')
        expect(ValidationModel.validatePassword('   ')).toBe('Password is required')
      })
    })
  })

  describe('Form Validation', () => {
    describe('validateLoginForm', () => {
      it('should return empty errors for valid login form data', () => {
        const result = ValidationModel.validateLoginForm({
          email: 'test@example.com',
          password: 'password123'
        })
        expect(result).toEqual({})
      })

      it('should return email error for invalid email', () => {
        const result = ValidationModel.validateLoginForm({
          email: 'invalid-email',
          password: 'password123'
        })
        expect(result.email).toBe('Please enter a valid email address')
        expect(result.password).toBeUndefined()
      })

      it('should return password error for empty password', () => {
        const result = ValidationModel.validateLoginForm({
          email: 'test@example.com',
          password: ''
        })
        expect(result.password).toBe('Password is required')
        expect(result.email).toBeUndefined()
      })

      it('should return both email and password errors when both are invalid', () => {
        const result = ValidationModel.validateLoginForm({
          email: 'invalid-email',
          password: ''
        })
        expect(result.email).toBe('Please enter a valid email address')
        expect(result.password).toBe('Password is required')
      })
    })

    describe('validateEmailCheckForm', () => {
      it('should return empty errors for valid email check form data', () => {
        const result = ValidationModel.validateEmailCheckForm({
          email: 'test@example.com'
        })
        expect(result).toEqual({})
      })

      it('should return email error for invalid email', () => {
        const result = ValidationModel.validateEmailCheckForm({
          email: 'invalid-email'
        })
        expect(result.email).toBe('Please enter a valid email address')
      })

      it('should return email error for empty email', () => {
        const result = ValidationModel.validateEmailCheckForm({
          email: ''
        })
        expect(result.email).toBe('Email address is required')
      })
    })
  })

  describe('Error Helpers', () => {
    describe('createAuthError', () => {
      it('should create auth error object with code and message', () => {
        const error = ValidationModel.createAuthError(AuthErrorCodes.VALIDATION_ERROR, 'Test error message')
        expect(error).toEqual({
          code: AuthErrorCodes.VALIDATION_ERROR,
          message: 'Test error message'
        })
      })

      it('should create auth error object with field', () => {
        const error = ValidationModel.createAuthError(AuthErrorCodes.VALIDATION_ERROR, 'Email is invalid', 'email')
        expect(error).toEqual({
          code: AuthErrorCodes.VALIDATION_ERROR,
          message: 'Email is invalid',
          field: 'email'
        })
      })
    })

    describe('hasErrors', () => {
      it('should return false for empty error object', () => {
        expect(ValidationModel.hasErrors({})).toBe(false)
      })

      it('should return true for error object with errors', () => {
        expect(ValidationModel.hasErrors({ email: 'Email is required' })).toBe(true)
        expect(ValidationModel.hasErrors({ 
          email: 'Email is invalid', 
          password: 'Password is required' 
        })).toBe(true)
      })
    })
  })
})

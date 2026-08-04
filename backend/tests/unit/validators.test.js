const { validateEmail, validatePassword, validateImobiliariaData } = require('../../src/utils/validators');

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@email.com')).toBe(true);
      expect(validateEmail('test.name@company.co')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords (6+ chars)', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('strongpass')).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('123')).toBe(false);
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
    });
  });

  describe('validateImobiliariaData', () => {
    it('should accept valid data', () => {
      const result = validateImobiliariaData({ nome: 'Imob X', cnpj: '12345678000190', email: 'x@x.com', telefone: '11999' });
      expect(result.ok).toBe(true);
    });

    it('should reject missing nome', () => {
      const result = validateImobiliariaData({ cnpj: '123', email: 'x@x.com', telefone: '11999' });
      expect(result.ok).toBe(false);
    });

    it('should reject missing cnpj', () => {
      const result = validateImobiliariaData({ nome: 'Test', email: 'x@x.com', telefone: '11999' });
      expect(result.ok).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = validateImobiliariaData({ nome: 'Test', cnpj: '123', email: 'invalid', telefone: '11999' });
      expect(result.ok).toBe(false);
    });
  });
});

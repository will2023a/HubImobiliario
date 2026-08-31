const { validateEmail, validatePassword, validateImobiliariaData, validateCpf } = require('../../src/utils/validators');

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

  describe('validateCpf', () => {
    it('accepts valid CPFs with or without mask', () => {
      expect(validateCpf('529.982.247-25')).toBe(true);
      expect(validateCpf('52998224725')).toBe(true);
    });

    it('rejects wrong check digits, repeated digits and bad length', () => {
      expect(validateCpf('529.982.247-24')).toBe(false);
      expect(validateCpf('111.111.111-11')).toBe(false);
      expect(validateCpf('123')).toBe(false);
      expect(validateCpf('')).toBe(false);
      expect(validateCpf(null)).toBe(false);
    });
  });
});

// Test the mask logic (same functions used in frontend)
// Replicating here for backend validation consistency

function maskCNPJ(value) {
  return value.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskCPF(value) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function unmask(value) {
  return value ? value.replace(/\D/g, '') : '';
}

describe('Masks', () => {
  describe('maskCNPJ', () => {
    it('should format CNPJ correctly', () => {
      expect(maskCNPJ('12345678000190')).toBe('12.345.678/0001-90');
    });

    it('should handle partial input', () => {
      expect(maskCNPJ('1234')).toBe('12.34');
    });

    it('should strip non-digits', () => {
      expect(maskCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
    });
  });

  describe('maskCPF', () => {
    it('should format CPF correctly', () => {
      expect(maskCPF('12345678901')).toBe('123.456.789-01');
    });

    it('should handle partial input', () => {
      expect(maskCPF('123')).toBe('123');
      expect(maskCPF('1234')).toBe('123.4');
    });
  });

  describe('maskPhone', () => {
    it('should format mobile (11 digits)', () => {
      expect(maskPhone('11999887766')).toBe('(11) 99988-7766');
    });

    it('should format landline (10 digits)', () => {
      expect(maskPhone('1133445566')).toBe('(11) 3344-5566');
    });
  });

  describe('unmask', () => {
    it('should remove all non-digit characters', () => {
      expect(unmask('12.345.678/0001-90')).toBe('12345678000190');
      expect(unmask('(11) 99988-7766')).toBe('11999887766');
      expect(unmask('123.456.789-01')).toBe('12345678901');
    });

    it('should handle empty/null', () => {
      expect(unmask('')).toBe('');
      expect(unmask(null)).toBe('');
    });
  });
});

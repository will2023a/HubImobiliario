const assert = require('assert');
const { validateEmail, validatePassword, validateImobiliariaData } = require('../src/utils/validators');

console.log('Running validators tests...');

assert.strictEqual(validateEmail('x@y.com'), true, 'valid email');
assert.strictEqual(validateEmail('invalid-email'), false, 'invalid email');

assert.strictEqual(validatePassword('123456'), true, 'valid password');
assert.strictEqual(validatePassword('123'), false, 'short password');

const v1 = validateImobiliariaData({ nome: 'A', cnpj: '123', email: 'a@b.com' });
assert.strictEqual(v1.ok, true);
const v2 = validateImobiliariaData({ nome: '', cnpj: '', email: 'bad' });
assert.strictEqual(v2.ok, false);

console.log('All validator tests passed');

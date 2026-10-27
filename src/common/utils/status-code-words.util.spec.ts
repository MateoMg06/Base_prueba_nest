import { statusCodeToWords } from './status-code-words.util.js';

describe('statusCodeToWords', () => {
  it('escribe el código dígito a dígito', () => {
    expect(statusCodeToWords(404)).toBe('cuatro cero cuatro');
    expect(statusCodeToWords(201)).toBe('dos cero uno');
  });
});

const DIGIT_WORDS = [
  'cero',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
];

/** 404 -> "cuatro cero cuatro". Se usa en el interceptor y en el filtro. */
export const statusCodeToWords = (statusCode: number): string =>
  String(statusCode)
    .split('')
    .map((digit) => DIGIT_WORDS[Number(digit)])
    .join(' ');

/** Forma de TODAS las respuestas exitosas (generada por ResponseInterceptor). */
export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

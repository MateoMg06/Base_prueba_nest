/** Forma de los listados paginados (va dentro de `data` del sobre de respuesta). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

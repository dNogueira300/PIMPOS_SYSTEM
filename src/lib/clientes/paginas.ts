type Pagina<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Lee una consulta entera, de `tamano` en `tamano` filas. PostgREST no devuelve
 * más de `max_rows` (1000, `config.toml` y el alojado) por petición, y sin
 * paginar la descarga de «Todas las zonas» se cortaba en 1000 sin avisar
 * (revisión de F6, T6). Se para cuando una página vuelve más corta que el
 * tamaño pedido; si alguna falla, devuelve el error y no una lista a medias.
 */
export async function leerTodas<T>(
  pedir: (desde: number, hasta: number) => PromiseLike<Pagina<T>>,
  tamano = 1000,
): Promise<Pagina<T>> {
  const todas: T[] = [];
  for (let desde = 0; ; desde += tamano) {
    const { data, error } = await pedir(desde, desde + tamano - 1);
    if (error || !data) return { data: null, error: error ?? { message: "sin datos" } };
    todas.push(...data);
    if (data.length < tamano) return { data: todas, error: null };
  }
}

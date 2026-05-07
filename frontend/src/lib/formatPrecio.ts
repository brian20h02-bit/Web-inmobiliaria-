/**
 * Formatea un precio con el símbolo de moneda correspondiente.
 * moneda: 'USD' → "US$ 150.000"
 * moneda: 'ARS' → "$ 150.000 ARS"
 */
export function formatPrecio(
  precio: number | string | undefined,
  moneda: string = 'USD'
): string {
  if (!precio && precio !== 0) return ''
  const num = typeof precio === 'string' ? parseFloat(precio) : precio
  if (isNaN(num)) return ''
  const formatted = num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return moneda === 'ARS' ? `$ ${formatted} ARS` : `US$ ${formatted}`
}

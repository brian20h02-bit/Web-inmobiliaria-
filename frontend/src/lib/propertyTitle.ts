function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function compactWords(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 10 ? cut.slice(0, lastSpace) : cut).trim()
}

export function buildPropertyCardTitle(tipo: string, titulo: string, ubicacion?: string | null): string {
  const typeToken = /depart|depto|dpto|apart|apto/i.test(titulo)
    ? 'Departamento'
    : /residencia/i.test(titulo)
      ? 'Residencia'
      : /campo|quinta/i.test(titulo)
        ? 'Casa de Campo'
        : /duplex|d[úu]plex/i.test(titulo)
          ? 'Dúplex'
          : /local/i.test(titulo)
            ? 'Local'
            : 'Casa'

  let trait = titulo
    .replace(/\ben\s+[\p{L}\s]+$/iu, '')
    .replace(/\b(casa|departamento|depto|dpto|residencia|duplex|d[úu]plex|local|quinta|campo)\b/giu, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!trait) {
    trait = /piscina/i.test(titulo)
      ? 'con Piscina'
      : /campo|quinta/i.test(titulo)
        ? 'de Campo'
        : 'Moderna'
  }

  if (!/^(con|de)\s+/i.test(trait)) {
    trait = compactWords(toTitleCase(trait), 24)
  } else {
    trait = compactWords(trait, 24)
  }

  const place = (ubicacion || 'Salta').trim()
  return `${typeToken} ${trait} en ${place}`.replace(/\s+/g, ' ').trim()
}

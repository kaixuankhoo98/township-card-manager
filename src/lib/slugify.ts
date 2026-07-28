export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function categoryId(catalogVersion: string, categoryName: string): string {
  return `${catalogVersion}-${slugify(categoryName)}`
}

export function cardId(catalogVersion: string, categoryName: string, cardName: string): string {
  return `${categoryId(catalogVersion, categoryName)}-${slugify(cardName)}`
}

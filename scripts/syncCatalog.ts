import { createClient } from '@supabase/supabase-js'
import { CATALOG, ROSTER } from '../src/lib/catalog'

try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local is optional if the vars are already in the environment (e.g. CI)
}

const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (check .env.local)')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)

async function main() {
  console.log(`Syncing catalog version "${CATALOG.version}" (${CATALOG.label})...`)

  const { error: versionError } = await supabase
    .from('catalog_versions')
    .upsert({ id: CATALOG.version, label: CATALOG.label, is_active: true }, { onConflict: 'id' })
  if (versionError) throw versionError

  const { error: deactivateError } = await supabase
    .from('catalog_versions')
    .update({ is_active: false })
    .neq('id', CATALOG.version)
  if (deactivateError) throw deactivateError

  const categoryRows = CATALOG.categories.map((category, index) => ({
    id: category.id,
    catalog_version_id: CATALOG.version,
    name: category.name,
    sort_order: index,
  }))
  const { error: categoriesError } = await supabase
    .from('categories')
    .upsert(categoryRows, { onConflict: 'id' })
  if (categoriesError) throw categoriesError

  const cardRows = CATALOG.categories.flatMap((category) =>
    category.cards.map((card, index) => ({
      id: card.id,
      category_id: category.id,
      catalog_version_id: CATALOG.version,
      name: card.name,
      rarity: card.rarity,
      sort_order: index,
    })),
  )
  const { error: cardsError } = await supabase.from('cards').upsert(cardRows, { onConflict: 'id' })
  if (cardsError) throw cardsError

  const rosterRows = ROSTER.map((name) => ({ name }))
  const { error: rosterError } = await supabase
    .from('roster')
    .upsert(rosterRows, { onConflict: 'name', ignoreDuplicates: true })
  if (rosterError) throw rosterError

  console.log(
    `Done: 1 catalog version, ${categoryRows.length} categories, ${cardRows.length} cards, ${rosterRows.length} roster entries.`,
  )
}

main().catch((error) => {
  console.error('Sync failed:', error)
  process.exit(1)
})

import type { PostgrestError } from '@supabase/supabase-js'

// Supabase/PostgREST caps a single response at 1000 rows by default. Tables
// like `ownership` and `send_log` grow past that as members play, so any
// unranged select silently drops rows past the cutoff. Page through with
// `.range()` until a page comes back short.
const PAGE_SIZE = 1000

export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break

    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

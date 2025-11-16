import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export type GenericPostgrestQuery = PostgrestFilterBuilder<
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export function withGroupBy<T extends GenericPostgrestQuery>(query: T, columns: string): T {
  const builder = query as unknown as { url: URL };
  builder.url.searchParams.append('group', columns);
  return query;
}

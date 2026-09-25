const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const runtimeConfig = {
  mode: 'production',
  hasSupabaseConfig,
} as const satisfies {
  mode: 'production';
  hasSupabaseConfig: boolean;
};

export function isProductionMode(): boolean {
  return runtimeConfig.mode === 'production';
}

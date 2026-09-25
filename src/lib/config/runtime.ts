export type AppMode = 'demo' | 'production';

const isProductionBuild = process.env.NODE_ENV === 'production';
const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const runtimeConfig = {
  mode: (process.env.NEXT_PUBLIC_APP_MODE === 'production' || (isProductionBuild && hasSupabaseConfig))
    ? 'production'
    : 'demo',
  hasSupabaseConfig,
} as const satisfies {
  mode: AppMode;
  hasSupabaseConfig: boolean;
};

export function isProductionMode(): boolean {
  return runtimeConfig.mode === 'production';
}

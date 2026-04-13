import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlags {
  [key: string]: boolean;
}

const FLAGS_KEY = 'feature_flags';
const CACHE_KEY = 'geoteach-feature-flags';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
    return {};
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFlags() {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', FLAGS_KEY)
        .single();

      if (data?.value && typeof data.value === 'object') {
        const flagData = data.value as FeatureFlags;
        setFlags(flagData);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: flagData, timestamp: Date.now() }));
      }
      setLoading(false);
    }

    fetchFlags();
  }, []);

  const isEnabled = (flag: string): boolean => {
    return flags[flag] === true;
  };

  return { flags, isEnabled, loading };
}

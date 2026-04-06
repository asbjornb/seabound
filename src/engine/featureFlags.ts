const STORAGE_KEY = "seabound_featureFlags";

export interface FeatureFlags {
  mainland: boolean;
}

const DEFAULTS: FeatureFlags = {
  mainland: false,
};

function load(): FeatureFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(flags: FeatureFlags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

let cached: FeatureFlags | null = null;

export function getFeatureFlags(): FeatureFlags {
  if (!cached) cached = load();
  return cached;
}

export function setFeatureFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) {
  const flags = getFeatureFlags();
  flags[key] = value;
  cached = flags;
  save(flags);
}

export function isMainlandEnabled(): boolean {
  return getFeatureFlags().mainland;
}

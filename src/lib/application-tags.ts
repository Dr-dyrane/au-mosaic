export const APPLICATION_TAGS = [
  "Kitchen",
  "Sink",
  "Bathroom",
  "Sitting room",
  "Office",
  "Exterior",
  "Swimming pool",
  "Pool floor art",
  "Logo art",
  "Wall art",
] as const;

const TAGS = new Set<string>(APPLICATION_TAGS);

export function cleanApplicationTags(values: FormDataEntryValue[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const tag = String(value ?? "").trim();
    if (TAGS.has(tag)) seen.add(tag);
  }
  return APPLICATION_TAGS.filter((tag) => seen.has(tag));
}

export function knownApplicationTag(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return TAGS.has(value) ? value : undefined;
}

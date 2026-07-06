export type CustomerFilters = {
  q?: string;
  sort?: string;
};

export function cleanCustomerSort(sort?: string) {
  return sort === "name" ? "name" : "newest";
}

export function customerFilterHref(
  current: CustomerFilters,
  patch: Partial<CustomerFilters>
) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  const q = next.q?.trim();

  if (q) params.set("q", q);
  if (cleanCustomerSort(next.sort) === "name") params.set("sort", "name");

  const query = params.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

export function activeCustomerFilterLabels(current: CustomerFilters) {
  const labels: string[] = [];
  const q = current.q?.trim();

  if (q) labels.push(`Search ${q}`);
  if (cleanCustomerSort(current.sort) === "name") labels.push("A to Z");

  return labels;
}

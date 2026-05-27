export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatUiValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return "Not available";
  return String(value).replace(/[_-]/g, " ");
}

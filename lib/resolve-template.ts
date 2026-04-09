const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

export function resolveTemplate(
  template: string,
  data: Record<string, unknown>
): string | null {
  let hasEmpty = false;
  const result = template.replace(PLACEHOLDER_RE, (_, key: string) => {
    const value = data[key];
    if (value === undefined || value === null || value === "") {
      hasEmpty = true;
      return "";
    }
    return String(value);
  });
  return hasEmpty ? null : result;
}

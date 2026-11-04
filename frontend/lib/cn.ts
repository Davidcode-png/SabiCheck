/**
 * Small class-name joiner. Keeps the component APIs dependency-free while
 * still allowing conditional classes.
 */
export function cn(...classes: unknown[]) {
  return classes
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");
}

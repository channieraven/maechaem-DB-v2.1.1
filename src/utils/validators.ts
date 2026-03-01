const TREE_CODE_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateTreeCode(value: string): boolean {
  return TREE_CODE_PATTERN.test(value.trim());
}

export function validateEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

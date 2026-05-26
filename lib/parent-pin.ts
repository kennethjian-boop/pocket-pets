export const PARENT_PIN_KEY = 'pocket-pets-parent-pin';
export const PARENT_PIN_DEFAULT = '1234';

export function readParentPin(): string {
  if (typeof window === 'undefined') return PARENT_PIN_DEFAULT;
  return localStorage.getItem(PARENT_PIN_KEY) ?? PARENT_PIN_DEFAULT;
}

export function writeParentPin(pin: string): void {
  localStorage.setItem(PARENT_PIN_KEY, pin);
}

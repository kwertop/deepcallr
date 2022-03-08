export const generateRandomCode = (): string => {
  return Math.random().toString(36).slice(2).toUpperCase();
}
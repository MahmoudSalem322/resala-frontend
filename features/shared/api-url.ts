const apiOrigin = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://resala-32d7.onrender.com');

export function apiUrl(path: string): string {
  return new URL(path, apiOrigin).href;
}

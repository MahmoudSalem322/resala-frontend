const apiOrigin = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://resala-backend-u54x.onrender.com');

export function apiUrl(path: string): string {
  return new URL(path, apiOrigin).href;
}

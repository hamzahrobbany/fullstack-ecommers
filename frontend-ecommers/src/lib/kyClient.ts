import ky from 'ky';

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  hooks: {
    beforeError: [
      (error) => {
        const { response } = error;
        error.message = `HTTP ${response.status}: ${response.statusText}`;
        return error;
      },
    ],
  },
});

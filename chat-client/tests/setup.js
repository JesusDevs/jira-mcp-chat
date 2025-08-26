/**
 * @file Configuración global para tests
 * @description Setup inicial para todos los tests del chat-client
 */

import { vi } from 'vitest';

// Mock de variables de entorno para tests
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
process.env.JIRA_EMAIL = 'test@example.com';
process.env.JIRA_API_TOKEN = 'test-jira-token';

// Mock global de fetch
global.fetch = vi.fn();

// Mock de Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock de Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));

// Cleanup después de cada test
afterEach(() => {
  vi.clearAllMocks();
});

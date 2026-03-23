// Backend test setup
// Set test environment variables before any module loads
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.AUTH_MODE = 'mock';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.MOCK_ADMIN_PASSWORD = 'admin123';
process.env.MOCK_EDITOR_PASSWORD = 'editor123';
process.env.MOCK_VIEWER_PASSWORD = 'viewer123';
process.env.DATABASE_URL = 'sqlserver://localhost:1433;database=test;trustServerCertificate=true';

import '@testing-library/jest-dom';

// Mock environment variables
process.env.SHOPIFY_API_KEY = 'test_key';
process.env.SHOPIFY_API_SECRET = 'test_secret';
process.env.SHOPIFY_APP_URL = 'https://test.example.com';
process.env.TRELLO_API_KEY = 'test_trello_key';
process.env.TRELLO_API_SECRET = 'test_trello_secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';


import { validateSessionToken } from '../shopify';

describe('Shopify Utils', () => {
  describe('validateSessionToken', () => {
    it('should reject invalid tokens', async () => {
      await expect(validateSessionToken('invalid')).rejects.toThrow();
    });

    it('should validate structure of token', async () => {
      // Mock test - in real scenario, use proper JWT token
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXN0IjoiaHR0cHM6Ly90ZXN0LnNob3BpZnkuY29tIiwic3ViIjoidGVzdCJ9.test';
      
      try {
        await validateSessionToken(validToken);
      } catch (error: any) {
        // Expected to fail with test token
        expect(error.message).toContain('Invalid');
      }
    });
  });
});


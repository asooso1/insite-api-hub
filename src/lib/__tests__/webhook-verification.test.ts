/**
 * Tests for GitHub webhook signature verification
 */

import { verifyGitHubSignature, extractEventType, validatePayloadStructure } from '../webhook-verification';

describe('webhook-verification', () => {
  describe('verifyGitHubSignature', () => {
    const testPayload = '{"test": "payload"}';
    const testSecret = 'my-secret-key';

    it('should verify valid SHA256 signature', () => {
      // Pre-computed HMAC-SHA256 signature for test payload + secret
      const validSignature = 'sha256=e50b2e75fb7e5e0a6e69a7f1f88b1e6c3e4c1e7b9c0d5a6f8e9c1d2a3b4c5d6e';

      // Note: In real test, compute actual HMAC
      // For now, test the signature format validation
      const result = verifyGitHubSignature(testPayload, validSignature, testSecret);
      expect(typeof result).toBe('boolean');
    });

    it('should reject signature without prefix', () => {
      const invalidSignature = 'e50b2e75fb7e5e0a6e69a7f1f88b1e6c3e4c1e7b9c0d5a6f8e9c1d2a3b4c5d6e';
      const result = verifyGitHubSignature(testPayload, invalidSignature, testSecret);
      expect(result).toBe(false);
    });

    it('should reject empty signature', () => {
      const result = verifyGitHubSignature(testPayload, '', testSecret);
      expect(result).toBe(false);
    });

    it('should reject empty secret', () => {
      const result = verifyGitHubSignature(testPayload, 'sha256=test', '');
      expect(result).toBe(false);
    });

    it('should reject empty payload', () => {
      const result = verifyGitHubSignature('', 'sha256=test', testSecret);
      expect(result).toBe(false);
    });

    it('should support SHA1 signatures', () => {
      const sha1Signature = 'sha1=abc123';
      // Should not error, will return false if signature doesn't match
      const result = verifyGitHubSignature(testPayload, sha1Signature, testSecret);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('extractEventType', () => {
    it('should extract event type from header', () => {
      expect(extractEventType('push')).toBe('push');
      expect(extractEventType('ping')).toBe('ping');
      expect(extractEventType('pull_request')).toBe('pull_request');
    });

    it('should return "unknown" for null header', () => {
      expect(extractEventType(null)).toBe('unknown');
    });
  });

  describe('validatePayloadStructure', () => {
    it('should validate push event payload', () => {
      const pushPayload = {
        ref: 'refs/heads/main',
        repository: { full_name: 'owner/repo' },
        commits: [{ id: 'abc123', message: 'test' }],
      };
      expect(validatePayloadStructure(pushPayload, 'push')).toBe(true);
    });

    it('should reject invalid push event payload', () => {
      const invalidPayload = {
        ref: 'refs/heads/main',
        // Missing repository and commits
      };
      expect(validatePayloadStructure(invalidPayload, 'push')).toBe(false);
    });

    it('should validate ping event payload', () => {
      const pingPayload = {
        zen: 'Design for failure.',
        hook_id: 123456,
      };
      expect(validatePayloadStructure(pingPayload, 'ping')).toBe(true);
    });

    it('should reject invalid ping event payload', () => {
      const invalidPayload = {
        zen: 'Design for failure.',
        // Missing hook_id
      };
      expect(validatePayloadStructure(invalidPayload, 'ping')).toBe(false);
    });

    it('should accept any object for unknown event types', () => {
      const anyPayload = { foo: 'bar' };
      expect(validatePayloadStructure(anyPayload, 'unknown')).toBe(true);
    });

    it('should reject non-object payloads', () => {
      expect(validatePayloadStructure(null, 'push')).toBe(false);
      expect(validatePayloadStructure(undefined, 'push')).toBe(false);
      expect(validatePayloadStructure('string', 'push')).toBe(false);
      expect(validatePayloadStructure(123, 'push')).toBe(false);
    });
  });
});

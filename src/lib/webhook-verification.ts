import * as crypto from 'crypto';

/**
 * Verifies GitHub webhook signature using HMAC-SHA256
 *
 * @param payload - Raw request body as string
 * @param signature - Signature from X-Hub-Signature-256 header
 * @param secret - Webhook secret configured in GitHub
 * @returns true if signature is valid, false otherwise
 */
export function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret || !payload) {
    return false;
  }

  // GitHub sends signatures with prefix "sha256=" or "sha1="
  const signaturePrefix = signature.substring(0, 7);
  const signatureHash = signature.substring(7);

  let algorithm: string;
  if (signaturePrefix === 'sha256=') {
    algorithm = 'sha256';
  } else if (signaturePrefix.startsWith('sha1=')) {
    algorithm = 'sha1';
  } else {
    console.error('[Webhook] Unknown signature algorithm:', signaturePrefix);
    return false;
  }

  // Compute HMAC hash
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload, 'utf8');
  const expectedHash = hmac.digest('hex');

  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(expectedHash, signatureHash);
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extract event type from GitHub webhook headers
 *
 * @param eventHeader - Value from X-GitHub-Event header
 * @returns Event type string
 */
export function extractEventType(eventHeader: string | null): string {
  return eventHeader || 'unknown';
}

/**
 * Validates webhook payload structure
 *
 * @param payload - Parsed JSON payload
 * @param eventType - GitHub event type
 * @returns true if payload is valid for the event type
 */
export function validatePayloadStructure(payload: any, eventType: string): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  switch (eventType) {
    case 'push':
      return !!(payload.ref && payload.repository && payload.commits);
    case 'ping':
      return !!(payload.zen && payload.hook_id);
    default:
      // For unknown events, just check if it's an object
      return true;
  }
}

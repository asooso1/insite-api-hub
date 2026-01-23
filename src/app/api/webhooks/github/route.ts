import { NextRequest, NextResponse } from 'next/server';
import {
  verifyGitHubSignature,
  extractEventType,
  validatePayloadStructure,
} from '@/lib/webhook-verification';
import { GitHubPushEvent, GitHubPingEvent } from '@/lib/webhook-types';
import { processWebhookEvent } from '@/app/actions/webhook';

/**
 * GitHub Webhook Handler
 * Receives and processes webhook events from GitHub
 *
 * Supported events:
 * - push: Triggered when code is pushed to a repository
 * - ping: Test event sent when webhook is created or updated
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Extract headers
    const signature = request.headers.get('x-hub-signature-256') || request.headers.get('x-hub-signature');
    const eventType = extractEventType(request.headers.get('x-github-event'));
    const deliveryId = request.headers.get('x-github-delivery');

    console.log('[Webhook] Received GitHub webhook', {
      eventType,
      deliveryId,
      hasSignature: !!signature,
    });

    // 2. Read raw body
    const rawBody = await request.text();

    // 3. Verify signature
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] GITHUB_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error('[Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    const isValidSignature = verifyGitHubSignature(rawBody, signature, webhookSecret);
    if (!isValidSignature) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('[Webhook] Signature verified successfully');

    // 4. Parse payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('[Webhook] Failed to parse JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // 5. Validate payload structure
    const isValidPayload = validatePayloadStructure(payload, eventType);
    if (!isValidPayload) {
      console.error('[Webhook] Invalid payload structure for event type:', eventType);
      return NextResponse.json(
        { error: `Invalid payload structure for event type: ${eventType}` },
        { status: 400 }
      );
    }

    // 6. Handle different event types
    switch (eventType) {
      case 'ping':
        return handlePingEvent(payload as GitHubPingEvent);

      case 'push':
        return await handlePushEvent(payload as GitHubPushEvent, startTime);

      default:
        console.log('[Webhook] Unsupported event type:', eventType);
        return NextResponse.json(
          {
            message: `Event type '${eventType}' received but not processed`,
            eventType,
          },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GitHub ping event
 * This is sent when a webhook is first created or updated
 */
function handlePingEvent(payload: GitHubPingEvent): NextResponse {
  console.log('[Webhook] Ping event received', {
    zen: payload.zen,
    hookId: payload.hook_id,
    repository: payload.repository.full_name,
  });

  return NextResponse.json({
    message: 'Pong! Webhook is configured correctly.',
    zen: payload.zen,
    repository: payload.repository.full_name,
    hookId: payload.hook_id,
  });
}

/**
 * Handle GitHub push event
 * Processes code changes and triggers project rescan if needed
 */
async function handlePushEvent(
  payload: GitHubPushEvent,
  startTime: number
): Promise<NextResponse> {
  const branch = payload.ref.replace('refs/heads/', '');
  const repositoryUrl = payload.repository.clone_url;
  const commitCount = payload.commits.length;

  console.log('[Webhook] Push event received', {
    repository: payload.repository.full_name,
    branch,
    commitCount,
    before: payload.before.substring(0, 7),
    after: payload.after.substring(0, 7),
  });

  // Log changed files
  const allChangedFiles = new Set<string>();
  payload.commits.forEach((commit) => {
    commit.added.forEach((file) => allChangedFiles.add(file));
    commit.modified.forEach((file) => allChangedFiles.add(file));
    commit.removed.forEach((file) => allChangedFiles.add(file));
  });

  console.log('[Webhook] Files changed:', {
    totalFiles: allChangedFiles.size,
    files: Array.from(allChangedFiles).slice(0, 10),
  });

  try {
    // Process the webhook event
    const result = await processWebhookEvent(payload, repositoryUrl, branch);

    const processingTime = Date.now() - startTime;

    if (result.success) {
      console.log('[Webhook] Push event processed successfully', {
        projectId: result.projectId,
        rescanTriggered: result.rescanTriggered,
        versionCreated: result.versionCreated,
        processingTime: `${processingTime}ms`,
      });

      return NextResponse.json({
        message: result.message,
        projectId: result.projectId,
        repository: payload.repository.full_name,
        branch,
        commitCount,
        rescanTriggered: result.rescanTriggered,
        versionCreated: result.versionCreated,
        changesDetected: result.changesDetected,
        processingTime: `${processingTime}ms`,
      });
    } else {
      console.warn('[Webhook] Push event processing failed:', result.message);

      return NextResponse.json({
        message: result.message,
        repository: payload.repository.full_name,
        branch,
        commitCount,
        processingTime: `${processingTime}ms`,
      });
    }
  } catch (error) {
    console.error('[Webhook] Error processing push event:', error);
    return NextResponse.json(
      {
        error: 'Failed to process push event',
        message: error instanceof Error ? error.message : 'Unknown error',
        repository: payload.repository.full_name,
        branch,
      },
      { status: 500 }
    );
  }
}

/**
 * Prevent GET requests
 */
export async function GET() {
  return NextResponse.json(
    {
      message: 'GitHub Webhook endpoint. Use POST to send webhook events.',
      supportedEvents: ['push', 'ping'],
    },
    { status: 405 }
  );
}

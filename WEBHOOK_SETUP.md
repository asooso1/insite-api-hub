# GitHub Webhook Integration Setup

This guide explains how to configure GitHub webhooks to automatically rescan your API projects when code is pushed.

## Overview

The webhook integration automatically:
- Detects when code is pushed to your GitHub repository
- Analyzes changes to identify API-related files (Controllers, DTOs, etc.)
- Creates a version snapshot before rescanning
- Triggers a full project rescan to update endpoints and models
- Sends Dooray notifications when API changes are detected

## Files Created

### 1. **src/lib/webhook-verification.ts**
HMAC-SHA256 signature verification for security:
- `verifyGitHubSignature()` - Validates webhook authenticity
- `extractEventType()` - Parses GitHub event headers
- `validatePayloadStructure()` - Ensures payload is valid
- Uses constant-time comparison to prevent timing attacks

### 2. **src/lib/webhook-types.ts**
TypeScript type definitions for:
- `GitHubPushEvent` - Push event payload structure
- `GitHubPingEvent` - Ping event structure
- `GitHubRepository`, `GitHubCommit`, `GitHubUser` - Common GitHub types
- `WebhookProcessingResult` - Processing result types
- `FileChangeAnalysis` - File change analysis result

### 3. **src/app/api/webhooks/github/route.ts**
Next.js API route handler:
- POST endpoint at `/api/webhooks/github`
- Verifies webhook signature using `GITHUB_WEBHOOK_SECRET`
- Handles `push` and `ping` events
- Logs all webhook deliveries
- Returns appropriate HTTP status codes

### 4. **src/app/actions/webhook.ts**
Server actions for webhook processing:
- `processWebhookEvent()` - Main webhook processor
- `triggerProjectRescan()` - Triggers repository import
- `createVersionSnapshot()` - Creates version before rescan
- `analyzeFileChanges()` - Detects relevant file changes
- `notifyApiChanges()` - Sends Dooray notifications

## Setup Instructions

### 1. Configure Environment Variable

Add the webhook secret to your `.env` file:

```bash
GITHUB_WEBHOOK_SECRET=your-super-secret-webhook-key-here
```

**Generate a secure secret:**
```bash
# macOS/Linux
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure GitHub Webhook

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure the webhook:
   - **Payload URL**: `https://your-domain.com/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: The same value as `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select "Just the push event"
   - **Active**: Check this box
4. Click **Add webhook**

### 3. Test the Webhook

#### Test with Ping Event
GitHub automatically sends a ping event when you create the webhook. Check the webhook delivery in GitHub:
- Go to **Settings** → **Webhooks** → Click your webhook
- View recent deliveries
- You should see a successful ping with response:
```json
{
  "message": "Pong! Webhook is configured correctly.",
  "zen": "...",
  "repository": "owner/repo",
  "hookId": 123456
}
```

#### Test with Push Event
1. Make a small code change (e.g., add a comment to a Controller file)
2. Commit and push to GitHub
3. Check the webhook delivery in GitHub
4. Expected response:
```json
{
  "message": "Webhook processed successfully",
  "projectId": "xxx",
  "repository": "owner/repo",
  "branch": "main",
  "commitCount": 1,
  "rescanTriggered": true,
  "versionCreated": true,
  "changesDetected": true,
  "processingTime": "1234ms"
}
```

### 4. Update Project with Repository URL

Ensure your project has the `git_url` field set to match the repository:

```sql
UPDATE projects
SET git_url = 'https://github.com/owner/repo'
WHERE id = 'your-project-id';
```

The webhook will find the project by matching the repository URL.

## How It Works

### Event Flow

1. **GitHub Push** → Code is pushed to repository
2. **Webhook Delivery** → GitHub sends POST request to `/api/webhooks/github`
3. **Signature Verification** → Server validates HMAC-SHA256 signature
4. **Payload Parsing** → Event type and data are extracted
5. **Project Lookup** → Find project by repository URL
6. **File Analysis** → Analyze changed files for API relevance
7. **Version Snapshot** → Create version before changes
8. **Rescan Trigger** → Import repository and update endpoints/models
9. **Notification** → Send Dooray message if changes detected

### File Change Detection

The webhook considers changes relevant if:
- Any `*Controller.java` or `*Controller.kt` file changed
- Any `*DTO.java`, `*VO.java`, `*DTO.kt`, or `*VO.kt` file changed
- 3+ Java files changed (possible refactoring)
- 3+ Kotlin files changed (possible refactoring)

If no relevant changes are detected, the rescan is skipped to save resources.

### Security Features

- **HMAC-SHA256 Verification**: Ensures webhook is from GitHub
- **Constant-time Comparison**: Prevents timing attacks
- **Signature Header Validation**: Rejects unsigned requests
- **Event Type Filtering**: Only processes known event types
- **Payload Structure Validation**: Validates JSON structure

## Monitoring and Debugging

### Check Server Logs

All webhook events are logged with the `[Webhook]` prefix:

```bash
# View webhook logs
npm run dev | grep "\[Webhook\]"
```

### Common Log Messages

```
[Webhook] Received GitHub webhook
[Webhook] Signature verified successfully
[Webhook] Found project: { id, name, repository }
[Webhook] File change analysis: { hasRelevantChanges, ... }
[Webhook] Triggering project rescan
[Webhook] Version snapshot created: webhook_abc1234_1234567890
[Webhook] Push event processed successfully
```

### GitHub Webhook Dashboard

Monitor webhook deliveries in GitHub:
1. Go to **Settings** → **Webhooks** → Your webhook
2. View **Recent Deliveries**
3. Check response status, headers, and payload

### Troubleshooting

#### Webhook Returns 401 Unauthorized
- **Cause**: Invalid signature
- **Fix**: Ensure `GITHUB_WEBHOOK_SECRET` matches GitHub webhook secret

#### Webhook Returns "No project found"
- **Cause**: Repository URL doesn't match any project
- **Fix**: Update project's `git_url` to match repository clone URL

#### Rescan Not Triggered
- **Cause**: No relevant files changed
- **Check**: View logs for "File change analysis"
- **Expected**: Changes to Controller/DTO files trigger rescan

#### Version Not Created
- **Cause**: No existing endpoints in project
- **Fix**: Run initial import first, then webhooks will create versions

## Advanced Configuration

### Custom File Patterns

To change which files trigger rescans, edit `analyzeFileChanges()` in `src/app/actions/webhook.ts`:

```typescript
// Add custom patterns
if (file.includes('/service/') || file.endsWith('Service.java')) {
  // Your logic here
}
```

### Webhook Logging to Database

To store webhook deliveries in database, create a table:

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  signature VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  delivered_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

Then uncomment the database logging code in `logWebhookDelivery()`.

### Multiple Branches

To handle different branches, modify the webhook route to check `event.ref`:

```typescript
const branch = event.ref.replace('refs/heads/', '');
if (branch !== 'main' && branch !== 'develop') {
  // Skip non-production branches
  return NextResponse.json({ message: 'Branch ignored' });
}
```

## API Reference

### POST /api/webhooks/github

**Headers:**
- `X-Hub-Signature-256`: HMAC-SHA256 signature (required)
- `X-GitHub-Event`: Event type (e.g., "push", "ping")
- `X-GitHub-Delivery`: Unique delivery ID

**Body:** GitHub webhook payload (JSON)

**Response:**
- `200` - Success
- `401` - Invalid signature
- `400` - Invalid payload
- `500` - Server error

### Server Actions

#### processWebhookEvent(event, repositoryUrl, branch)
Process a GitHub push event and trigger rescan if needed.

#### triggerProjectRescan(projectId, repositoryUrl, branch)
Import repository and update project endpoints/models.

#### createVersionSnapshot(projectId, commitSha, commitMessage)
Create a version snapshot before rescanning.

## Support

For issues or questions:
1. Check server logs with `grep "[Webhook]"`
2. Verify webhook secret matches
3. Check GitHub webhook delivery status
4. Ensure project `git_url` is correct
5. Test with ping event first

## License

Part of the API Hub application.

# GitHub Webhook Examples

## Example Webhook Payloads

### 1. Push Event (Java Controller Change)

**GitHub Webhook Payload:**
```json
{
  "ref": "refs/heads/main",
  "before": "abc123def456",
  "after": "def456ghi789",
  "repository": {
    "id": 123456789,
    "full_name": "mycompany/api-backend",
    "clone_url": "https://github.com/mycompany/api-backend.git",
    "html_url": "https://github.com/mycompany/api-backend"
  },
  "pusher": {
    "name": "johndoe",
    "email": "john@example.com"
  },
  "commits": [
    {
      "id": "def456ghi789",
      "message": "feat: add new user registration endpoint",
      "timestamp": "2026-01-23T10:30:00Z",
      "author": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "added": [
        "src/main/java/com/example/dto/UserRegistrationRequest.java"
      ],
      "modified": [
        "src/main/java/com/example/controller/UserController.java"
      ],
      "removed": []
    }
  ]
}
```

**Expected Response:**
```json
{
  "message": "Webhook processed successfully",
  "projectId": "uuid-here",
  "repository": "mycompany/api-backend",
  "branch": "main",
  "commitCount": 1,
  "rescanTriggered": true,
  "versionCreated": true,
  "changesDetected": true,
  "processingTime": "2345ms"
}
```

**Console Logs:**
```
[Webhook] Received GitHub webhook { eventType: 'push', deliveryId: 'abc123...', hasSignature: true }
[Webhook] Signature verified successfully
[Webhook] Push event received { repository: 'mycompany/api-backend', branch: 'main', commitCount: 1, before: 'abc123d', after: 'def456g' }
[Webhook] Files changed: { totalFiles: 2, files: ['src/main/java/com/example/dto/UserRegistrationRequest.java', 'src/main/java/com/example/controller/UserController.java'] }
[Webhook] Found project: { id: 'uuid-here', name: 'My API Backend', repository: 'https://github.com/mycompany/api-backend.git' }
[Webhook] File change analysis: { hasRelevantChanges: true, javaFilesChanged: 2, kotlinFilesChanged: 0, controllerFilesChanged: 1, dtoFilesChanged: 1, changedFiles: [...] }
[Webhook] Version snapshot created: webhook_def456g_1737622200000
[Webhook] Triggering project rescan { projectId: 'uuid-here', repositoryUrl: 'https://github.com/mycompany/api-backend.git', branch: 'main' }
[Webhook] Project rescan completed successfully
[Webhook] Dooray notification sent
[Webhook] Push event processed successfully { projectId: 'uuid-here', rescanTriggered: true, versionCreated: true, processingTime: '2345ms' }
```

**Dooray Message:**
```
🔄 **API 변경 감지 - My API Backend**

**Repository:** mycompany/api-backend
**Branch:** main
**Commit:** def456g by johndoe
**Message:** feat: add new user registration endpoint

**변경 사항:**
• Java 파일: 2개
• Kotlin 파일: 0개
• Controller 파일: 1개
• DTO/VO 파일: 1개
• 총 파일: 2개

**주요 변경 파일:**
• src/main/java/com/example/dto/UserRegistrationRequest.java
• src/main/java/com/example/controller/UserController.java

프로젝트가 자동으로 재스캔되었습니다.
[API HUB에서 확인하기](http://localhost:3000)
```

---

### 2. Push Event (Non-API Files - No Rescan)

**GitHub Webhook Payload:**
```json
{
  "ref": "refs/heads/main",
  "before": "ghi789jkl012",
  "after": "jkl012mno345",
  "repository": {
    "full_name": "mycompany/api-backend",
    "clone_url": "https://github.com/mycompany/api-backend.git"
  },
  "commits": [
    {
      "id": "jkl012mno345",
      "message": "docs: update README",
      "added": [],
      "modified": [
        "README.md",
        "docs/SETUP.md"
      ],
      "removed": []
    }
  ]
}
```

**Expected Response:**
```json
{
  "message": "No relevant API changes detected",
  "projectId": "uuid-here",
  "repository": "mycompany/api-backend",
  "branch": "main",
  "commitCount": 1,
  "rescanTriggered": false,
  "changesDetected": false,
  "processingTime": "123ms"
}
```

**Console Logs:**
```
[Webhook] Received GitHub webhook { eventType: 'push', ... }
[Webhook] Signature verified successfully
[Webhook] Push event received { repository: 'mycompany/api-backend', branch: 'main', commitCount: 1 }
[Webhook] Files changed: { totalFiles: 2, files: ['README.md', 'docs/SETUP.md'] }
[Webhook] Found project: { id: 'uuid-here', name: 'My API Backend', ... }
[Webhook] File change analysis: { hasRelevantChanges: false, javaFilesChanged: 0, kotlinFilesChanged: 0, controllerFilesChanged: 0, dtoFilesChanged: 0 }
[Webhook] No relevant changes detected, skipping rescan
```

---

### 3. Ping Event (Webhook Setup Test)

**GitHub Webhook Payload:**
```json
{
  "zen": "Design for failure.",
  "hook_id": 123456789,
  "hook": {
    "type": "Repository",
    "id": 123456789,
    "name": "web",
    "active": true,
    "events": ["push"],
    "config": {
      "content_type": "json",
      "insecure_ssl": "0",
      "url": "https://api-hub.example.com/api/webhooks/github"
    },
    "updated_at": "2026-01-23T10:00:00Z",
    "created_at": "2026-01-23T10:00:00Z"
  },
  "repository": {
    "id": 123456789,
    "full_name": "mycompany/api-backend",
    "clone_url": "https://github.com/mycompany/api-backend.git"
  }
}
```

**Expected Response:**
```json
{
  "message": "Pong! Webhook is configured correctly.",
  "zen": "Design for failure.",
  "repository": "mycompany/api-backend",
  "hookId": 123456789
}
```

**Console Logs:**
```
[Webhook] Received GitHub webhook { eventType: 'ping', deliveryId: 'xyz789...', hasSignature: true }
[Webhook] Signature verified successfully
[Webhook] Ping event received { zen: 'Design for failure.', hookId: 123456789, repository: 'mycompany/api-backend' }
```

---

### 4. Kotlin Controller Change

**GitHub Webhook Payload:**
```json
{
  "ref": "refs/heads/develop",
  "commits": [
    {
      "id": "mno345pqr678",
      "message": "feat: add product search API",
      "added": [
        "src/main/kotlin/com/example/dto/ProductSearchRequest.kt"
      ],
      "modified": [
        "src/main/kotlin/com/example/controller/ProductController.kt",
        "src/main/kotlin/com/example/service/ProductService.kt"
      ],
      "removed": []
    }
  ]
}
```

**File Change Analysis:**
```
hasRelevantChanges: true
javaFilesChanged: 0
kotlinFilesChanged: 3
controllerFilesChanged: 1
dtoFilesChanged: 1
```

**Result:** Rescan triggered

---

### 5. Multiple Commits in One Push

**GitHub Webhook Payload:**
```json
{
  "ref": "refs/heads/main",
  "commits": [
    {
      "id": "commit1",
      "message": "feat: add order endpoint",
      "modified": ["src/main/java/com/example/controller/OrderController.java"]
    },
    {
      "id": "commit2",
      "message": "feat: add order DTOs",
      "added": [
        "src/main/java/com/example/dto/OrderRequest.java",
        "src/main/java/com/example/dto/OrderResponse.java"
      ]
    },
    {
      "id": "commit3",
      "message": "test: add order tests",
      "added": ["src/test/java/com/example/OrderControllerTest.java"]
    }
  ]
}
```

**File Change Analysis:**
```
hasRelevantChanges: true
javaFilesChanged: 4
kotlinFilesChanged: 0
controllerFilesChanged: 1
dtoFilesChanged: 2
changedFiles: [
  'src/main/java/com/example/controller/OrderController.java',
  'src/main/java/com/example/dto/OrderRequest.java',
  'src/main/java/com/example/dto/OrderResponse.java',
  'src/test/java/com/example/OrderControllerTest.java'
]
```

**Result:** Rescan triggered, version created

---

## Testing with curl

### 1. Generate Test Signature

```bash
# Test payload
PAYLOAD='{"test":"payload"}'

# Your webhook secret
SECRET="your-webhook-secret"

# Generate SHA256 signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

echo "sha256=$SIGNATURE"
```

### 2. Send Test Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-delivery-id" \
  -d "$PAYLOAD"
```

### 3. Test Ping Event

```bash
PAYLOAD='{
  "zen": "Design for failure.",
  "hook_id": 123456,
  "repository": {
    "full_name": "test/repo",
    "clone_url": "https://github.com/test/repo.git"
  }
}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -H "X-GitHub-Event: ping" \
  -d "$PAYLOAD"
```

### 4. Test Invalid Signature (Should Fail)

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalid-signature" \
  -H "X-GitHub-Event: push" \
  -d '{"test":"payload"}'
```

**Expected:** `401 Unauthorized` with error message

---

## Database Queries

### Check Version Snapshots Created by Webhooks

```sql
SELECT
  version_tag,
  description,
  created_at
FROM api_versions
WHERE version_tag LIKE 'webhook_%'
ORDER BY created_at DESC
LIMIT 10;
```

### Find Projects by Repository

```sql
SELECT
  id,
  name,
  git_url
FROM projects
WHERE git_url ILIKE '%mycompany/api-backend%';
```

### Update Project Repository URL

```sql
UPDATE projects
SET git_url = 'https://github.com/mycompany/api-backend.git'
WHERE id = 'your-project-id';
```

---

## Error Scenarios

### Error 1: Missing Signature

**Request:**
```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{"test":"payload"}'
```

**Response:** `401 Unauthorized`
```json
{
  "error": "Missing signature header"
}
```

### Error 2: Invalid Signature

**Request:** Valid payload but wrong signature

**Response:** `401 Unauthorized`
```json
{
  "error": "Invalid signature"
}
```

### Error 3: Invalid JSON

**Request:** Malformed JSON payload

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid JSON payload"
}
```

### Error 4: Missing Webhook Secret

**Environment:** `GITHUB_WEBHOOK_SECRET` not set

**Response:** `500 Internal Server Error`
```json
{
  "error": "Webhook secret not configured"
}
```

### Error 5: Project Not Found

**Scenario:** Repository URL doesn't match any project

**Response:** `200 OK` (webhook accepted, but not processed)
```json
{
  "message": "No project found for repository: https://github.com/unknown/repo.git",
  "projectId": null,
  "eventType": "push"
}
```

---

## Integration Examples

### GitHub Actions Workflow

Automatically test your webhook after deployment:

```yaml
name: Test Webhook
on:
  deployment_status:
    types: [success]

jobs:
  test-webhook:
    runs-on: ubuntu-latest
    steps:
      - name: Send test ping
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }} \
            -H "Content-Type: application/json" \
            -H "X-Hub-Signature-256: sha256=${{ secrets.TEST_SIGNATURE }}" \
            -H "X-GitHub-Event: ping" \
            -d '{"zen":"Test","hook_id":1,"repository":{"full_name":"test/repo"}}'
```

### Local Development with ngrok

For local testing with GitHub:

```bash
# Start your Next.js app
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL in GitHub webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/github
```

---

## Monitoring and Analytics

### Track Webhook Success Rate

```sql
-- Would require webhook_logs table
SELECT
  DATE(delivered_at) as date,
  COUNT(*) as total_deliveries,
  COUNT(*) FILTER (WHERE verified = true) as verified,
  COUNT(*) FILTER (WHERE processed = true) as processed,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as errors
FROM webhook_logs
GROUP BY DATE(delivered_at)
ORDER BY date DESC;
```

### Most Active Repositories

```sql
SELECT
  p.name,
  p.git_url,
  COUNT(v.id) as webhook_versions
FROM projects p
LEFT JOIN api_versions v ON p.id = v.project_id
WHERE v.version_tag LIKE 'webhook_%'
GROUP BY p.id, p.name, p.git_url
ORDER BY webhook_versions DESC;
```

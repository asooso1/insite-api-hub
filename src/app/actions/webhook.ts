'use server';

import 'server-only';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  GitHubPushEvent,
  WebhookProcessingResult,
  FileChangeAnalysis,
} from '@/lib/webhook-types';
import { importRepository } from './import-repo';
import { sendDoorayMessage } from './notification';

/**
 * Process a GitHub webhook push event
 *
 * @param event - GitHub push event payload
 * @param repositoryUrl - Repository clone URL
 * @param branch - Branch that was pushed to
 * @returns Processing result
 */
export async function processWebhookEvent(
  event: GitHubPushEvent,
  repositoryUrl: string,
  branch: string
): Promise<WebhookProcessingResult> {
  try {
    // 1. Find project by repository URL
    const project = await findProjectByRepository(repositoryUrl);

    if (!project) {
      console.log('[Webhook] No project found for repository:', repositoryUrl);
      return {
        success: false,
        message: `No project found for repository: ${repositoryUrl}`,
        eventType: 'push',
      };
    }

    console.log('[Webhook] Found project:', {
      id: project.id,
      name: project.name,
      repository: repositoryUrl,
    });

    // 2. Analyze file changes
    const changeAnalysis = analyzeFileChanges(event);

    console.log('[Webhook] File change analysis:', changeAnalysis);

    // 3. Decide whether to trigger rescan
    const shouldRescan = changeAnalysis.hasRelevantChanges;

    if (!shouldRescan) {
      console.log('[Webhook] No relevant changes detected, skipping rescan');
      return {
        success: true,
        message: 'No relevant API changes detected',
        projectId: project.id,
        eventType: 'push',
        rescanTriggered: false,
        changesDetected: false,
      };
    }

    // 4. Create version snapshot before rescan
    const commitMessage = event.head_commit?.message || event.commits[0]?.message || 'Unknown';
    const commitSha = event.after;
    const versionCreated = await createVersionSnapshot(
      project.id,
      commitSha,
      commitMessage
    );

    // 5. Trigger project rescan
    const rescanSuccess = await triggerProjectRescan(project.id, repositoryUrl, branch);

    if (!rescanSuccess) {
      return {
        success: false,
        message: 'Failed to rescan project',
        projectId: project.id,
        eventType: 'push',
        rescanTriggered: false,
        versionCreated,
        changesDetected: true,
      };
    }

    // 6. Send notification
    await notifyApiChanges(project.id, project.name, event, changeAnalysis);

    return {
      success: true,
      message: 'Webhook processed successfully',
      projectId: project.id,
      eventType: 'push',
      rescanTriggered: true,
      versionCreated,
      changesDetected: true,
    };
  } catch (error) {
    console.error('[Webhook] Error processing webhook event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      eventType: 'push',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find project by repository URL
 *
 * @param repositoryUrl - Repository clone URL or HTML URL
 * @returns Project data or null
 */
async function findProjectByRepository(repositoryUrl: string): Promise<any | null> {
  try {
    // Normalize URL (remove .git suffix, convert to lowercase)
    const normalizedUrl = repositoryUrl.replace(/\.git$/, '').toLowerCase();

    const result = await db.query(
      `SELECT id, name, git_url, dooray_webhook_url
       FROM projects
       WHERE LOWER(REPLACE(git_url, '.git', '')) = $1
       LIMIT 1`,
      [normalizedUrl]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[Webhook] Error finding project by repository:', error);
    return null;
  }
}

/**
 * Analyze file changes to determine if rescan is needed
 *
 * @param event - GitHub push event
 * @returns File change analysis
 */
function analyzeFileChanges(event: GitHubPushEvent): FileChangeAnalysis {
  const changedFiles = new Set<string>();
  let javaFilesChanged = 0;
  let kotlinFilesChanged = 0;
  let controllerFilesChanged = 0;
  let dtoFilesChanged = 0;

  // Collect all changed files from all commits
  event.commits.forEach((commit) => {
    [...commit.added, ...commit.modified, ...commit.removed].forEach((file) => {
      changedFiles.add(file);

      // Count Java files
      if (file.endsWith('.java')) {
        javaFilesChanged++;

        // Check for Controller files
        if (file.includes('Controller.java') || file.includes('controller/')) {
          controllerFilesChanged++;
        }

        // Check for DTO/VO files
        if (
          file.endsWith('DTO.java') ||
          file.endsWith('VO.java') ||
          file.includes('/dto/') ||
          file.includes('/vo/')
        ) {
          dtoFilesChanged++;
        }
      }

      // Count Kotlin files
      if (file.endsWith('.kt')) {
        kotlinFilesChanged++;

        // Check for Controller files
        if (file.includes('Controller.kt') || file.includes('controller/')) {
          controllerFilesChanged++;
        }

        // Check for DTO/VO files
        if (
          file.endsWith('DTO.kt') ||
          file.endsWith('VO.kt') ||
          file.includes('/dto/') ||
          file.includes('/vo/')
        ) {
          dtoFilesChanged++;
        }
      }
    });
  });

  // Consider changes relevant if:
  // - Any Controller file changed
  // - Any DTO/VO file changed
  // - Multiple Java/Kotlin files changed (might be refactoring)
  const hasRelevantChanges =
    controllerFilesChanged > 0 ||
    dtoFilesChanged > 0 ||
    javaFilesChanged >= 3 ||
    kotlinFilesChanged >= 3;

  return {
    hasRelevantChanges,
    javaFilesChanged,
    kotlinFilesChanged,
    controllerFilesChanged,
    dtoFilesChanged,
    changedFiles: Array.from(changedFiles),
  };
}

/**
 * Trigger project rescan by importing repository
 *
 * @param projectId - Project ID
 * @param repositoryUrl - Repository URL
 * @param branch - Branch to scan
 * @returns true if rescan succeeded
 */
export async function triggerProjectRescan(
  projectId: string,
  repositoryUrl: string,
  branch: string = 'main'
): Promise<boolean> {
  try {
    console.log('[Webhook] Triggering project rescan', {
      projectId,
      repositoryUrl,
      branch,
    });

    // Get git token if stored
    const projectResult = await db.query(
      'SELECT git_token FROM projects WHERE id = $1',
      [projectId]
    );
    const gitToken = projectResult.rows[0]?.git_token;

    // Use existing importRepository function
    const result = await importRepository(projectId, repositoryUrl, branch, gitToken);

    if (result.success) {
      console.log('[Webhook] Project rescan completed successfully');
      revalidatePath('/');
      return true;
    } else {
      console.error('[Webhook] Project rescan failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('[Webhook] Error triggering project rescan:', error);
    return false;
  }
}

/**
 * Create a version snapshot for the commit
 *
 * @param projectId - Project ID
 * @param commitSha - Git commit SHA
 * @param commitMessage - Commit message
 * @returns true if snapshot was created
 */
export async function createVersionSnapshot(
  projectId: string,
  commitSha: string,
  commitMessage: string
): Promise<boolean> {
  try {
    // Get current endpoints and models
    const endpointsResult = await db.query(
      'SELECT * FROM endpoints WHERE project_id = $1',
      [projectId]
    );

    const modelsResult = await db.query(
      'SELECT * FROM api_models WHERE project_id = $1',
      [projectId]
    );

    if (endpointsResult.rows.length === 0) {
      console.log('[Webhook] No endpoints to snapshot, skipping version creation');
      return false;
    }

    // Create version snapshot
    const versionTag = `webhook_${commitSha.substring(0, 7)}_${Date.now()}`;
    const description = `Auto-created from webhook: ${commitMessage.substring(0, 100)}`;

    await db.query(
      `INSERT INTO api_versions (project_id, version_tag, description, endpoints_snapshot, models_snapshot)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        projectId,
        versionTag,
        description,
        JSON.stringify(endpointsResult.rows),
        JSON.stringify(modelsResult.rows),
      ]
    );

    console.log('[Webhook] Version snapshot created:', versionTag);
    return true;
  } catch (error) {
    console.error('[Webhook] Error creating version snapshot:', error);
    return false;
  }
}

/**
 * Send notification about API changes
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param event - GitHub push event
 * @param analysis - File change analysis
 */
async function notifyApiChanges(
  projectId: string,
  projectName: string,
  event: GitHubPushEvent,
  analysis: FileChangeAnalysis
): Promise<void> {
  try {
    const branch = event.ref.replace('refs/heads/', '');
    const commitCount = event.commits.length;
    const commitSha = event.after.substring(0, 7);
    const commitMessage = event.head_commit?.message || event.commits[0]?.message || 'No message';
    const author = event.pusher.name || event.pusher.email || 'Unknown';

    const message = `
🔄 **API 변경 감지 - ${projectName}**

**Repository:** ${event.repository.full_name}
**Branch:** ${branch}
**Commit:** ${commitSha} by ${author}
**Message:** ${commitMessage.split('\n')[0]}

**변경 사항:**
• Java 파일: ${analysis.javaFilesChanged}개
• Kotlin 파일: ${analysis.kotlinFilesChanged}개
• Controller 파일: ${analysis.controllerFilesChanged}개
• DTO/VO 파일: ${analysis.dtoFilesChanged}개
• 총 파일: ${analysis.changedFiles.length}개

**주요 변경 파일:**
${analysis.changedFiles
  .filter((f) => f.endsWith('.java') || f.endsWith('.kt'))
  .slice(0, 5)
  .map((f) => `• ${f}`)
  .join('\n')}
${analysis.changedFiles.length > 5 ? `\n...외 ${analysis.changedFiles.length - 5}개 더` : ''}

프로젝트가 자동으로 재스캔되었습니다.
[API HUB에서 확인하기](http://localhost:3000)
    `.trim();

    await sendDoorayMessage(projectId, message);
    console.log('[Webhook] Dooray notification sent');
  } catch (error) {
    console.error('[Webhook] Error sending notification:', error);
    // Don't throw error - notification failure shouldn't fail the webhook
  }
}

/**
 * Log webhook delivery for debugging and auditing
 *
 * @param projectId - Project ID (optional)
 * @param eventType - GitHub event type
 * @param payload - Event payload
 * @param verified - Whether signature was verified
 * @param processed - Whether event was processed successfully
 * @param errorMessage - Error message if processing failed
 */
export async function logWebhookDelivery(
  projectId: string | null,
  eventType: string,
  payload: any,
  verified: boolean,
  processed: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    // Note: This would require a webhook_logs table in the database
    // For now, just log to console
    console.log('[Webhook] Delivery log:', {
      projectId,
      eventType,
      verified,
      processed,
      errorMessage,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store in database when webhook_logs table is created
    // await db.query(
    //   `INSERT INTO webhook_logs (project_id, event_type, payload, verified, processed, error_message)
    //    VALUES ($1, $2, $3, $4, $5, $6)`,
    //   [projectId, eventType, JSON.stringify(payload), verified, processed, errorMessage]
    // );
  } catch (error) {
    console.error('[Webhook] Error logging webhook delivery:', error);
    // Don't throw - logging failure shouldn't affect webhook processing
  }
}

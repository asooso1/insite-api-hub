/**
 * GitHub Push Event payload structure
 * https://docs.github.com/en/webhooks/webhook-events-and-payloads#push
 */
export interface GitHubPushEvent {
  ref: string; // e.g., "refs/heads/main"
  before: string; // Previous commit SHA
  after: string; // New commit SHA
  created: boolean;
  deleted: boolean;
  forced: boolean;
  base_ref: string | null;
  compare: string;
  repository: GitHubRepository;
  pusher: GitHubUser;
  sender: GitHubUser;
  commits: GitHubCommit[];
  head_commit: GitHubCommit | null;
}

/**
 * GitHub Ping Event payload structure
 * https://docs.github.com/en/webhooks/webhook-events-and-payloads#ping
 */
export interface GitHubPingEvent {
  zen: string;
  hook_id: number;
  hook: {
    type: string;
    id: number;
    name: string;
    active: boolean;
    events: string[];
    config: {
      content_type: string;
      insecure_ssl: string;
      url: string;
    };
    updated_at: string;
    created_at: string;
    url: string;
    test_url: string;
    ping_url: string;
    deliveries_url: string;
    last_response: {
      code: number | null;
      status: string;
      message: string | null;
    };
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

/**
 * GitHub Repository information
 */
export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string; // "owner/repo"
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  clone_url: string;
  git_url: string;
  ssh_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  archived: boolean;
  disabled: boolean;
}

/**
 * GitHub User information
 */
export interface GitHubUser {
  name?: string;
  email?: string;
  login?: string;
  id?: number;
  node_id?: string;
  avatar_url?: string;
  gravatar_id?: string;
  url?: string;
  html_url?: string;
  type?: string;
  site_admin?: boolean;
}

/**
 * GitHub Commit information
 */
export interface GitHubCommit {
  id: string; // Commit SHA
  tree_id: string;
  distinct: boolean;
  message: string;
  timestamp: string;
  url: string;
  author: GitHubUser;
  committer: GitHubUser;
  added: string[];
  removed: string[];
  modified: string[];
}

/**
 * Webhook configuration for a project
 */
export interface WebhookConfig {
  id: string;
  projectId: string;
  webhookUrl: string;
  secret: string;
  events: string[]; // e.g., ["push", "pull_request"]
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Webhook delivery log
 */
export interface WebhookLog {
  id: string;
  projectId: string;
  eventType: string;
  payload: any;
  signature: string;
  verified: boolean;
  processed: boolean;
  errorMessage?: string;
  deliveredAt: string;
  processedAt?: string;
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  projectId?: string;
  eventType: string;
  rescanTriggered?: boolean;
  versionCreated?: boolean;
  changesDetected?: boolean;
  error?: string;
}

/**
 * File change analysis result
 */
export interface FileChangeAnalysis {
  hasRelevantChanges: boolean;
  javaFilesChanged: number;
  kotlinFilesChanged: number;
  controllerFilesChanged: number;
  dtoFilesChanged: number;
  changedFiles: string[];
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Webhook,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Github,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  cardVariants,
  listContainerVariants,
  listItemVariants,
} from '@/lib/design-system';
import { GlassCard, GlassButton, GlassBadge } from '@/components/ui/LinearUI';

interface WebhookDelivery {
  id: string;
  event: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  statusCode?: number;
  duration?: number;
}

interface Project {
  id: string;
  name: string;
  webhookEnabled: boolean;
}

export default function WebhookSettings() {
  const [copied, setCopied] = useState<'url' | 'secret' | null>(null);
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'API Hub Core', webhookEnabled: true },
    { id: '2', name: 'Mobile App', webhookEnabled: false },
    { id: '3', name: 'Admin Dashboard', webhookEnabled: true },
  ]);

  // Mock recent webhook deliveries
  const [deliveries] = useState<WebhookDelivery[]>([
    {
      id: '1',
      event: 'push',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      statusCode: 200,
      duration: 142,
    },
    {
      id: '2',
      event: 'pull_request',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      statusCode: 200,
      duration: 238,
    },
    {
      id: '3',
      event: 'issues',
      status: 'error',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      statusCode: 500,
      duration: 1520,
    },
    {
      id: '4',
      event: 'push',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      statusCode: 200,
      duration: 95,
    },
  ]);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/github`
    : '/api/webhooks/github';

  const webhookSecret = 'Managed on server (not exposed to client)';

  const handleCopy = async (text: string, type: 'url' | 'secret') => {
    if (type === 'secret') {
      // Secret is not exposed to client, cannot copy
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleProjectWebhook = (projectId: string) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId ? { ...p, webhookEnabled: !p.webhookEnabled } : p
      )
    );
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Webhook className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Webhook Settings
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure GitHub webhooks to automatically sync repository events
        </p>
      </div>

      {/* Webhook URL */}
      <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Webhook URL
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Use this URL in your GitHub repository webhook settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <code className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                {webhookUrl}
              </code>
            </div>
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => handleCopy(webhookUrl, 'url')}
              icon={copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied === 'url' ? 'Copied!' : 'Copy'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Webhook Secret */}
      <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Webhook Secret
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Secret key for validating webhook payloads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <code className="text-sm font-mono text-slate-600 dark:text-slate-400 italic">
                {webhookSecret}
              </code>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              The webhook secret is managed securely on the server. Contact your administrator to retrieve it for GitHub configuration.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* GitHub Setup Instructions */}
      <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-slate-900 dark:text-white" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              GitHub Configuration
            </h3>
          </div>

          <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                1
              </span>
              <span>
                Go to your GitHub repository <strong>Settings</strong> → <strong>Webhooks</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                2
              </span>
              <span>
                Click <strong>Add webhook</strong> and paste the webhook URL above
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                3
              </span>
              <span>
                Set <strong>Content type</strong> to <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono">application/json</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                4
              </span>
              <span>
                Paste the webhook secret into the <strong>Secret</strong> field
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                5
              </span>
              <span>
                Select <strong>individual events</strong> and choose: Push, Pull requests, Issues
              </span>
            </li>
          </ol>

          <a
            href="https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            View GitHub documentation
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </GlassCard>

      {/* Project-specific Webhook Settings */}
      <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Project Settings
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enable or disable webhook processing per project
            </p>
          </div>

          <motion.div
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={listItemVariants}
                className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-200/30 dark:border-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    project.webhookEnabled
                      ? "bg-emerald-500"
                      : "bg-slate-300 dark:bg-slate-600"
                  )} />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {project.name}
                  </span>
                </div>

                <button
                  onClick={() => toggleProjectWebhook(project.id)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    project.webhookEnabled
                      ? "bg-indigo-500"
                      : "bg-slate-300 dark:bg-slate-600"
                  )}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      x: project.webhookEnabled ? 20 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </GlassCard>

      {/* Recent Deliveries */}
      <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Recent Deliveries
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Latest webhook delivery attempts
              </p>
            </div>
            <GlassBadge variant="info">
              {deliveries.length} total
            </GlassBadge>
          </div>

          <motion.div
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {deliveries.map((delivery) => (
              <motion.div
                key={delivery.id}
                variants={listItemVariants}
                className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-200/30 dark:border-slate-700/30 hover:border-slate-300/50 dark:hover:border-slate-600/50 transition-colors"
              >
                {/* Status Icon */}
                <div className="shrink-0">
                  {delivery.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {delivery.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {delivery.status === 'pending' && (
                    <Clock className="w-5 h-5 text-amber-500 animate-spin" />
                  )}
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                      {delivery.event}
                    </code>
                    {delivery.statusCode && (
                      <GlassBadge
                        variant={delivery.status === 'success' ? 'success' : 'error'}
                        size="sm"
                      >
                        {delivery.statusCode}
                      </GlassBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(delivery.timestamp)}
                    </span>
                    {delivery.duration && (
                      <span>{delivery.duration}ms</span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <GlassBadge
                  variant={
                    delivery.status === 'success' ? 'success' :
                    delivery.status === 'error' ? 'error' : 'warning'
                  }
                >
                  {delivery.status}
                </GlassBadge>
              </motion.div>
            ))}
          </motion.div>

          {deliveries.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No webhook deliveries yet
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

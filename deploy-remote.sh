#!/bin/bash

# ==========================================
# API Hub Remote Deployment Script
# ==========================================

# SSH Command using local config
SSH_CMD="ssh -F .deploy_ssh_config insite-develop"

# ⚠️ [IMPORTANT] Set your remote project directory path here
PROJECT_DIR="~/insite-api-hub" 

echo "🚀 Starting remote deployment to 'insite-develop'..."

# 0. Run E2E Tests (Local)
echo "🧪 [Local] Running E2E Tests..."
# npx playwright install chromium --with-deps # Ensure cached
if npx playwright test; then
    echo "✅ Tests passed. Proceeding..."
else
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

# 1. Check for .deploy_ssh_config
if [ ! -f .deploy_ssh_config ]; then
    echo "❌ Error: .deploy_ssh_config file not found."
    exit 1
fi

# 2. Check connection and directory
echo "📡 Checking remote server connection and directory..."
if ! $SSH_CMD "test -d $PROJECT_DIR"; then
    echo ""
    echo "❌ Error: Remote directory '$PROJECT_DIR' not found."
    echo "👉 Please open 'deploy-remote.sh' and update PROJECT_DIR to the correct path."
    exit 1
fi

# 3. Execute Remote Commands
echo "✅ Connection established. Proceeding with deployment..."
echo "------------------------------------------------------"

$SSH_CMD "set -e; \
    cd $PROJECT_DIR; \
    echo '📥 [Remote] Git Pull...'; \
    git pull; \
    echo '🐳 [Remote] Running deploy.sh...'; \
    if [ -f deploy.sh ]; then \
        bash deploy.sh; \
    else \
        echo '❌ deploy.sh not found in remote directory.'; \
        exit 1; \
    fi"

echo "------------------------------------------------------"
echo "🎉 Remote deployment finished."

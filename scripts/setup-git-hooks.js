import fs from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const gitHooksDir = path.join(ROOT_DIR, '.git', 'hooks');
const postCommitHookPath = path.join(gitHooksDir, 'post-commit');

const hookContent = `#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Prevent infinite recursion when amending
if (process.env.AMENDING_CHANGELOG === 'true') {
  process.exit(0);
}

try {
  // Get the last commit message
  const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();

  // Ignore release and auto-generated commits
  if (
    commitMsg.startsWith('chore(release):') || 
    commitMsg.startsWith('chore: auto-update') ||
    commitMsg.includes('chore: auto-update unreleased changelog')
  ) {
    process.exit(0);
  }

  const rootDir = process.cwd();
  const unreleasedPath = path.join(rootDir, 'changelogs', 'unreleased.md');

  // Ensure file exists
  if (!fs.existsSync(unreleasedPath)) {
    fs.mkdirSync(path.dirname(unreleasedPath), { recursive: true });
    fs.writeFileSync(unreleasedPath, '### ✨ Features\\n- \\n\\n### 🐞 Bug Fixes\\n- \\n');
  }

  let content = fs.readFileSync(unreleasedPath, 'utf-8');
  const firstLine = commitMsg.split('\\n')[0].trim();

  if (firstLine.match(/^feat(\\(.*\\))?:/)) {
    const desc = firstLine.replace(/^feat(\\(.*\\))?:\\s*/, '');
    content = content.replace('### ✨ Features\\n', \`### ✨ Features\\n- \${desc}\\n\`);
  } else if (firstLine.match(/^fix(\\(.*\\))?:/)) {
    const desc = firstLine.replace(/^fix(\\(.*\\))?:\\s*/, '');
    content = content.replace('### 🐞 Bug Fixes\\n', \`### 🐞 Bug Fixes\\n- \${desc}\\n\`);
  } else {
    // Default to bug fixes for general/other commits
    content = content.replace('### 🐞 Bug Fixes\\n', \`### 🐞 Bug Fixes\\n- \${firstLine}\\n\`);
  }

  fs.writeFileSync(unreleasedPath, content, 'utf-8');

  // Stage and amend commit
  execSync(\`git add "\${unreleasedPath}"\`, { stdio: 'inherit' });
  execSync('git commit --amend --no-edit', {
    env: { ...process.env, AMENDING_CHANGELOG: 'true' },
    stdio: 'inherit',
  });
  console.log('✔ Automatically updated changelogs/unreleased.md and amended commit.');
} catch (error) {
  console.error('Failed to update unreleased changelog:', error.message);
}
`;

function install() {
  if (!fs.existsSync(gitHooksDir)) {
    console.log('ℹ .git/hooks directory not found. Skipping hook installation.');
    return;
  }

  fs.writeFileSync(postCommitHookPath, hookContent, { encoding: 'utf-8', mode: 0o755 });
  
  // Explicitly ensure permissions are set to executable on non-Windows
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(postCommitHookPath, '755');
    } catch (err) {
      console.warn('⚠️ Warning: Could not make post-commit hook executable via chmod:', err.message);
    }
  }

  console.log('✔ Git post-commit hook successfully installed at .git/hooks/post-commit');
}

install();

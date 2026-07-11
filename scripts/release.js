import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CHANGELOG_DIR = path.join(ROOT_DIR, 'changelogs');
const UNRELEASED_FILE = path.join(CHANGELOG_DIR, 'unreleased.md');

async function run() {
  console.log('\n🚢  BigO Lens Release Helper\n');

  // 0. Check if we are on the main branch
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    if (branch !== 'main') {
      console.warn(`⚠️  Warning: You are on branch '${branch}'. Releases should normally be done on 'main'.`);
      const res = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: 'Are you sure you want to proceed with release on this branch?',
        initial: false
      });
      if (!res.proceed) process.exit(0);
    }
  } catch (e) {}

  // 0.5 Sync package.json with latest git tag to prevent release desyncs
  try {
    const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (latestTag.startsWith('v')) {
      const tagVersion = latestTag.slice(1);
      const pkgPath = path.join(ROOT_DIR, 'package.json');
      const currentPkgVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version;
      
      const compareSemver = (a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if (pa[i] > pb[i]) return 1;
          if (pb[i] > pa[i]) return -1;
        }
        return 0;
      };

      if (compareSemver(tagVersion, currentPkgVersion) === 1) {
        console.log(`\n🔄 Syncing package.json (${currentPkgVersion}) -> latest git tag (${latestTag})...`);
        execSync(`npm version ${tagVersion} --no-git-tag-version --allow-same-version`, { stdio: 'ignore' });
        console.log(`✔ Synchronized successfully!`);
      }
    }
  } catch (e) {
    // If there are no tags, git describe throws, which is fine to ignore
  }

  // 1. Check if git is clean
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim().length > 0) {
      console.warn('⚠️  Warning: You have uncommitted changes.');
      const res = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: 'Are you sure you want to proceed with release anyway?',
        initial: false
      });
      if (!res.proceed) process.exit(0);
    }
  } catch (e) {
    console.error('Failed to check git status. Make sure you are in a git repository.');
    process.exit(1);
  }

  // 2. Unreleased notes check
  let unreleasedNotes = '';
  if (fs.existsSync(UNRELEASED_FILE)) {
    unreleasedNotes = fs.readFileSync(UNRELEASED_FILE, 'utf-8').trim();
  }

  if (unreleasedNotes.length === 0) {
    console.warn('⚠️  Warning: changelogs/unreleased.md is empty.');
    const res = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: 'Do you want to release an empty changelog?',
        initial: false
    });
    if (!res.proceed) process.exit(0);
  }

  // 3. Select version bump
  const currentVersion = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8')).version;
  console.log(`Current version: v${currentVersion}`);

  const { bump } = await prompts({
    type: 'select',
    name: 'bump',
    message: 'Select release type (SemVer):',
    choices: [
      { title: 'Patch (Bug fixes)', value: 'patch' },
      { title: 'Minor (New features)', value: 'minor' },
      { title: 'Major (Breaking changes)', value: 'major' },
      { title: 'Cancel', value: 'cancel' }
    ]
  });

  if (bump === 'cancel' || !bump) {
    console.log('Cancelled.');
    process.exit(0);
  }

  // 4. Bump version via npm
  console.log(`\n📦 Bumping version...`);
  // using --no-git-tag-version so we can commit the changelog files simultaneously
  const newVersionString = execSync(`npm version ${bump} --no-git-tag-version`, { encoding: 'utf-8' }).trim();
  
  // Guard: Check if tag already exists to prevent desync failures
  try {
    const existingTags = execSync('git tag', { encoding: 'utf-8' }).split('\n');
    if (existingTags.includes(newVersionString)) {
      console.error(`\n❌ Error: The tag '${newVersionString}' already exists in this repository!`);
      console.error(`This usually means your package.json version is out of sync with your Git tags.`);
      console.error(`Undoing package.json bump...`);
      execSync('git checkout package.json package-lock.json', { stdio: 'ignore' });
      process.exit(1);
    }
  } catch (e) {}

  console.log(`✔ Version bumped to ${newVersionString}`);

  // 5. Structure changelog
  const today = new Date().toISOString().split('T')[0];
  const newChangelogName = `${newVersionString}_${today}.md`;
  const newChangelogPath = path.join(CHANGELOG_DIR, newChangelogName);

  const formattedNotes = `## [${newVersionString.replace('v', '')}] - ${today}\n\n${unreleasedNotes}\n\n`;
  
  // Prepend to array
  const rootChangelogPath = path.join(ROOT_DIR, 'CHANGELOG.md');
  if (fs.existsSync(rootChangelogPath)) {
    let rc = fs.readFileSync(rootChangelogPath, 'utf-8');
    const splitIndex = rc.indexOf('## [');
    if (splitIndex !== -1) {
      rc = rc.slice(0, splitIndex) + formattedNotes + rc.slice(splitIndex);
    } else {
      rc += '\n' + formattedNotes;
    }
    fs.writeFileSync(rootChangelogPath, rc);
    console.log(`✔ Prepended unreleased notes to root CHANGELOG.md`);
  }

  const snapshotNotes = `# ${newVersionString} — ${today}\n\n${unreleasedNotes}\n`;
  if (!fs.existsSync(CHANGELOG_DIR)) fs.mkdirSync(CHANGELOG_DIR);
  fs.writeFileSync(newChangelogPath, snapshotNotes);
  
  // Wipe unreleased scratchpad
  fs.writeFileSync(UNRELEASED_FILE, '### ✨ Features\n- \n\n### 🐞 Bug Fixes\n- \n');
  console.log(`✔ Migrated changelog snapshot to: changelogs/${newChangelogName}`);

  // 6. Commit, Tag, Push
  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'What should we do with the new version?',
    choices: [
      { title: `Commit, tag (${newVersionString}), and push to GitHub`, value: 'push' },
      { title: `Commit and tag (${newVersionString}) only`, value: 'commit' },
      { title: 'Do not commit automatically (leave files staged)', value: 'skip' }
    ]
  });

  if (action === 'skip' || !action) {
    console.log(`\nFiles are modified. You can now commit them manually.`);
    process.exit(0);
  }

  try {
    execSync('git add package.json package-lock.json CHANGELOG.md changelogs/*', { stdio: 'inherit' });
    execSync(`git commit -m "chore(release): ${newVersionString}"`, { stdio: 'inherit' });
    execSync(`git tag ${newVersionString}`, { stdio: 'inherit' });
    console.log(`✔ Committed and tagged as ${newVersionString}`);

    if (action === 'push') {
      console.log('Pushing to GitHub...');
      execSync('git push origin HEAD --tags', { stdio: 'inherit' });
      console.log(`✔ Pushed ${newVersionString} to GitHub!`);
      console.log(`\n🚀 NOW: Go to GitHub and "Draft a new release" using the tag ${newVersionString}.`);
      console.log('   The GitHub Action will automatically publish this to the VS Code Marketplace!');
    } else {
      console.log(`\n🚀 Release is tagged locally. Don't forget to push: git push origin HEAD --tags`);
    }
  } catch (error) {
    console.error(`\n❌ Error performing git operations:`, error.message);
  }
}

run();

import { execSync } from 'child_process';

// Get commit message from CLI arguments or use default
const args = process.argv.slice(2);
const commitMessage = args.length > 0 ? args.join(' ') : 'Update content and deploy';

function run(command, description) {
  console.log(`\n========================================`);
  console.log(`▶ ${description}...`);
  console.log(`Command: ${command}`);
  console.log(`========================================\n`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Error during: ${description}`);
    process.exit(1);
  }
}

console.log(`\n🚀 Starting build, git push, and Firebase deploy workflow...`);
console.log(`📝 Commit message: "${commitMessage}"\n`);

// 1. Build project (Vite build + prerender)
run('npm run build', '1. Building project & prerendering pages');

// 2. Git stage
run('git add -A', '2. Staging changes to git');

// 3. Git commit (if changes exist)
try {
  // Check if there are staged changes
  execSync('git diff --cached --quiet');
  console.log('\nℹ️ No new changes to commit to git.');
} catch {
  // execSync throws exit code 1 if differences exist
  run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, '3. Committing changes to local git');
}

// 4. Git push
run('git push origin main', '4. Pushing commits to remote (GitHub)');

// 5. Firebase deploy
run('npx firebase deploy --only hosting', '5. Deploying to Firebase Hosting');

console.log(`\n✨ ========================================`);
console.log(`🎉 All done successfully!`);
console.log(`🌐 Live Site: https://sameeravani-books.web.app`);
console.log(`✨ ========================================\n`);

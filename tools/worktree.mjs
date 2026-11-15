import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Normalize an absolute path for native Git; platform is injectable for pure tests. */
export function normalizePath(value, platform = process.platform) {
  if (typeof value !== 'string' || !value || value.includes('\0')) {
    throw new Error('Expected an absolute path');
  }
  if (platform === 'win32') {
    const native = value.replace(/^\/([a-z])(?=\/|$)/i, (_, drive) => `${drive.toUpperCase()}:`);
    if (!/^[a-z]:[/\\]/i.test(native) && !/^[/\\]{2}[^/\\]+[/\\][^/\\]+/.test(native)) {
      throw new Error('Expected an absolute Windows drive or UNC path');
    }
    return path.win32.normalize(native).replaceAll('\\', '/').replace(/^[a-z]:/i, drive => drive.toUpperCase());
  }
  if (!path.posix.isAbsolute(value)) throw new Error('Expected an absolute path');
  return path.posix.normalize(value);
}

function git(repo, ...args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function canonical(value) {
  return normalizePath(fs.realpathSync.native(normalizePath(value)));
}

function commonDir(repo) {
  return canonical(git(repo, 'rev-parse', '--path-format=absolute', '--git-common-dir'));
}

/** Verify real Git identity, not merely that the target directory exists. */
export function verifyWorktree(repo, target, expectedCommon = commonDir(repo)) {
  const requested = canonical(target);
  const actual = canonical(git(normalizePath(target), 'rev-parse', '--show-toplevel'));
  if (actual !== requested) throw new Error(`Git toplevel mismatch: requested ${requested}, actual ${actual}`);
  const actualCommon = commonDir(normalizePath(target));
  if (actualCommon !== expectedCommon) {
    throw new Error(`Git common directory mismatch: expected ${expectedCommon}, actual ${actualCommon}`);
  }
  return { path: actual, commonDir: actualCommon };
}

function main(args) {
  const usage = 'Usage: node tools/worktree.mjs --repo PATH create --path PATH --branch NAME --base REF';
  const [repoFlag, repoInput, command, pathFlag, pathInput, branchFlag, branch, baseFlag, base] = args;
  if (args.length !== 9 || repoFlag !== '--repo' || command !== 'create' || pathFlag !== '--path' ||
      branchFlag !== '--branch' || baseFlag !== '--base' || !branch || !base ||
      branch.startsWith('-') || base.startsWith('-')) throw new Error(usage);
  const repo = normalizePath(repoInput);
  const target = normalizePath(pathInput);
  try {
    fs.lstatSync(target);
    throw new Error('Target path already exists; refusing to overwrite it');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  git(repo, 'check-ref-format', '--branch', branch);
  git(repo, 'rev-parse', '--verify', '--end-of-options', `${base}^{commit}`);
  const expectedCommon = commonDir(repo);
  git(repo, 'worktree', 'add', '-b', branch, '--', target, base);
  return { ...verifyWorktree(repo, target, expectedCommon), branch };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(main(process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(`worktree: ${error.message}`);
    process.exitCode = 1;
  }
}

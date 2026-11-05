#!/usr/bin/env node
// 从 GitHub 公开 API 重算 Repos / Stars / Forks / Followers，写入 scripts/stats.json，
// 并把 README 项目表格里的 ★ 数字同步成最新值。
// 用法: GITHUB_TOKEN=xxx node scripts/fetch-stats.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const USER = process.env.GH_USER || 'yannicksong0106';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

// POST 日志里要显示的三块模块（顺序即显示顺序）
const FEATURED = ['dsh-550c-boot', 'dsh-550c-skin', 'qq-email-skill'];

const headers = {
  accept: 'application/vnd.github+json',
  'user-agent': '550c-profile-stats',
  ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
};

async function get(urlPath) {
  const res = await fetch(`https://api.github.com${urlPath}`, { headers });
  if (!res.ok) throw new Error(`${urlPath} -> ${res.status} ${res.statusText}`);
  return res.json();
}

const user = await get(`/users/${USER}`);
const repos = await get(`/users/${USER}/repos?per_page=100&type=owner&sort=pushed`);

const publicRepos = repos.filter(r => !r.fork);
const stars = repos.reduce((n, r) => n + (r.stargazers_count || 0), 0);
const forks = repos.reduce((n, r) => n + (r.forks_count || 0), 0);

const byName = new Map(repos.map(r => [r.name.toLowerCase(), r]));
const modules = FEATURED
  .map(n => byName.get(n.toLowerCase()))
  .filter(Boolean)
  .map(r => ({ name: r.name, stars: r.stargazers_count || 0 }));

const stats = {
  updated: new Date().toISOString().slice(0, 10),
  repos: publicRepos.length,
  stars,
  forks,
  followers: user.followers || 0,
  modules,
};

const statsPath = path.join(ROOT, 'scripts/stats.json');
fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2) + '\n');
console.log('stats.json', JSON.stringify(stats));

// 同步 README 表格里的 ★ 列（每行一个仓库，最后一格是星数）
const readmePath = path.join(ROOT, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
let patched = 0;

readme = readme.split('\n').map(line => {
  const m = line.match(/\*\*\[([^\]]+)\]\(/);
  if (!m) return line;
  const repo = byName.get(m[1].toLowerCase());
  if (!repo) return line;
  const value = repo.stargazers_count ? String(repo.stargazers_count) : '—';
  const next = line.replace(/\|\s*(\d+|—)\s*\|\s*$/, `| ${value} |`);
  if (next !== line) patched++;
  return next;
}).join('\n');

fs.writeFileSync(readmePath, readme);
console.log(`README star cells patched: ${patched}`);

#!/usr/bin/env node
/** Explicitly opt-in, single-flight, foreground GitHub→Paseo issue intake. */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, openSync, closeSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { chooseIssue, parseDuration, modeIsBroad } from './intake-lib.mjs';

const cwd = process.cwd();
const root = join(cwd, '.local', 'agentic-issue');
const configFile = join(root, 'config.json');
const activeFile = join(root, 'active.json');
const lockFile = join(root, 'owner.lock');
const [subcommand='help', ...args] = process.argv.slice(2);
let running = true;
process.on('SIGINT', () => { running = false; });
process.on('SIGTERM', () => { running = false; });

function fail(message, code=1) { console.error(`ERROR: ${message}`); process.exitCode=code; }
function option(name, otherwise) { const ix = args.indexOf(name); return ix < 0 ? otherwise : args[ix+1]; }
function has(name) { return args.includes(name); }
function call(bin, argv, timeout=20000) {
  const env = { ...process.env }; delete env.PASEO_HOST; delete env.PASEO_AGENT_ID; delete env.PASEO_WORKSPACE_ID;
  const r = spawnSync(bin, argv, { cwd, env, encoding:'utf8', timeout, maxBuffer: 2_000_000, windowsHide:true });
  if (r.error || r.status !== 0) throw new Error(`${bin} command failed (${r.error?.code || r.status || 'unknown'}); examine authentication and installation. No stderr stored.`);
  return String(r.stdout || '').trim();
}
function requireCheckout() {
  const projectRoot = call('git', ['rev-parse','--show-toplevel']);
  if (resolve(projectRoot) !== resolve(cwd)) throw new Error('Run from the stable Git repository root, not a subdirectory/worktree child');
}
function requireIgnored() {
  const r=spawnSync('git', ['check-ignore','--no-index','-q','.local/agentic-issue/config.json'],{cwd,encoding:'utf8'});
  if (r.status !== 0) throw new Error('Add /.local/agentic-issue/ to .gitignore or .git/info/exclude BEFORE initializing');
}
function writeAtomic(path, value) { const tmp=`${path}.tmp`; writeFileSync(tmp, JSON.stringify(value,null,2)+'\n',{mode:0o600}); renameSync(tmp,path); }
function load(path) { return JSON.parse(readFileSync(path,'utf8')); }
function githubRepo() { return call('gh',['repo','view','--json','nameWithOwner','--jq','.nameWithOwner']); }
function githubLogin() { return call('gh',['api','user','--jq','.login']); }
function repoHighwater(repo) {
  const items=JSON.parse(call('gh',['api',`repos/${repo}/issues?state=all&sort=created&direction=desc&per_page=1`]));
  return Number(items?.[0]?.number || 0);
}
function readConfig() { if (!existsSync(configFile)) throw new Error('Not initialized; run init first'); return load(configFile); }
function assertRepo(config) {
  requireCheckout(); requireIgnored();
  const repo=githubRepo(); if (repo !== config.repo) throw new Error('Configured repository differs from current origin; refusing dispatch');
}
function jsonOut(value) { console.log(JSON.stringify(value,null,2)); }
function summarizeActive() {
  if (!existsSync(activeFile)) return null;
  const a=load(activeFile);
  return {issue:a.issue, state:a.state, agentId:a.agentId || null, createdAt:a.createdAt};
}
function fetchIssues(config) {
  return JSON.parse(call('gh',['issue','list','--repo',config.repo,'--state','open','--limit','1000','--json','number,url,state,author,labels']));
}
function dispatchOnce(config) {
  assertRepo(config);
  const selection=chooseIssue({issues:fetchIssues(config),boundary:config.boundary,author:config.author,active:summarizeActive()});
  if (selection.kind !== 'dispatch') return selection;
  if (!config.workspace || !config.provider || !config.mode) throw new Error('Missing workspace, provider or mode');
  const intent={issue:selection.issue,issueUrl:selection.url,state:'dispatch-unknown',createdAt:new Date().toISOString()};
  writeAtomic(activeFile,intent); // Intent before remote side effect; do not blindly retry.
  const prompt=[
    `Execute ONE GitHub Issue: ${selection.url}.`,
    'Use the installed agentic-issue-delivery skill if available, and first confirm repository/issue authority.',
    'Follow plan → build → pinned verify → independent review → unmerged Draft PR.',
    'Keep durable gitignored progress. Never auto-merge. Do not spawn a second coordinator.',
    'Follow current project instructions. Report progress path and verifiable receipts.'
  ].join('\n');
  try {
    const raw=call('paseo',['run','--workspace',config.workspace,'--title',`issue-${selection.issue}-coord`,'--provider',config.provider,'--mode',config.mode,'--no-wait','--json',prompt],120000);
    let obj; try { obj=JSON.parse(raw); } catch { obj=null; }
    const id=obj?.id || obj?.agent?.id || obj?.session?.id || obj?.agentId || obj?.sessionId;
    if (typeof id !== 'string' || !id.trim()) return {kind:'dispatch-unknown',issue:selection.issue,reason:'No reliably parsed agent ID; reconcile with Paseo before retry'};
    writeAtomic(activeFile,{...intent,state:'dispatched',agentId:id});
    return {kind:'dispatched',issue:selection.issue,agentId:id};
  } catch (e) {
    return {kind:'dispatch-unknown',issue:selection.issue,reason:String(e.message).slice(0,160)};
  }
}
function withLock(fn) {
  mkdirSync(root,{recursive:true,mode:0o700});
  let fd;
  try { fd=openSync(lockFile,'wx',0o600); } catch { throw new Error('Another intake owner or stale owner.lock exists; check process ownership before removing it'); }
  try { writeFileSync(fd,`${process.pid}\n`); return fn(); } finally { closeSync(fd); rmSync(lockFile,{force:true}); }
}
function cmdInit() {
  requireCheckout(); requireIgnored();
  if (existsSync(configFile) && !has('--replace')) throw new Error('Config already exists. Do not overwrite boundary/state without reviewing it; use --replace explicitly');
  const workspace=option('--workspace'); const provider=option('--provider'); const mode=option('--mode','auto-review');
  if (!workspace || !provider || !mode) throw new Error('Required: --workspace <existing Paseo workspace ID> --provider <discovered provider/model>');
  if (modeIsBroad(mode) && !has('--allow-unrestricted')) throw new Error('Broad permission modes require explicit --allow-unrestricted acknowledgment');
  const repo=githubRepo(); const author=option('--author',githubLogin());
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(author)) throw new Error('Invalid GitHub author login');
  const old=existsSync(configFile)?load(configFile):null;
  if (old && existsSync(activeFile)) throw new Error('Outstanding dispatch; reconcile before replacing config');
  const boundary=old?.boundary ?? repoHighwater(repo);
  const config={version:1,repo,author,boundary,workspace,provider,mode,every:option('--every','10m')};
  parseDuration(config.every);
  mkdirSync(root,{recursive:true,mode:0o700}); writeAtomic(configFile,config);
  jsonOut({configured:true,repo,boundary,author,workspace,provider,mode,every:config.every,dispatchStarted:false});
}
function cmdStatus() {
  const config=readConfig(); assertRepo(config);
  jsonOut({repo:config.repo,boundary:config.boundary,author:config.author,workspace:config.workspace,provider:config.provider,mode:config.mode,every:config.every,active:summarizeActive(),runningLock:existsSync(lockFile)});
}
function cmdReconcile() {
  const active=summarizeActive(); if (!active) throw new Error('No active dispatch record');
  const issue=Number(option('--issue')); if (active.issue !== issue) throw new Error('Issue number does not match active record');
  if (!has('--confirmed')) throw new Error('Verify GitHub PR and Paseo session externally, then specify --confirmed');
  if (has('--agent')) {
    const id=option('--agent'); if (!id) throw new Error('Expected --agent <verified existing session id>');
    writeAtomic(activeFile,{...load(activeFile),state:'dispatched',agentId:id});
    jsonOut({updated:true,issue,agentId:id,notice:'Only session ID was reconciled. This does not complete the job.'});
  } else if (has('--done')) {
    rmSync(activeFile,{force:true});jsonOut({acknowledged:true,issue,notice:'Local single-flight gate cleared based on operator confirmation; no PR was merged or edited.'});
  } else throw new Error('Use --agent <id> to record verified dispatch or --done to clear after verified completion');
}
async function main() {
  switch(subcommand) {
    case 'init': cmdInit(); break;
    case 'status': cmdStatus(); break;
    case 'tick': withLock(()=>jsonOut(dispatchOnce(readConfig())));break;
    case 'start': {
      const config=readConfig(); const ms=parseDuration(option('--every',config.every));
      await withAsyncLock(async () => {
        while(running) {
          jsonOut({at:new Date().toISOString(),...dispatchOnce(config)});
          if (!running) break;
          await new Promise(resolve=>{const step=1000;let waited=0;const next=()=>{if(!running||waited>=ms)return resolve();waited+=step;setTimeout(next,step);};next();});
        }
      }); break;
    }
    default: console.log('Usage: issue-intake.mjs init --workspace ID --provider PROVIDER/MODEL [--mode auto-review] [--author LOGIN]\nCommands: init, status, tick, start [--every 10m], reconcile --issue N --confirmed (--agent ID | --done)');
  }
}
async function withAsyncLock(fn) {
  mkdirSync(root,{recursive:true,mode:0o700}); let fd;
  try { fd=openSync(lockFile,'wx',0o600); } catch { throw new Error('Another foreground owner or stale lock exists; do not delete until owner exits'); }
  try { writeFileSync(fd,`${process.pid}\n`);await fn(); } finally { closeSync(fd);rmSync(lockFile,{force:true}); }
}
main().catch(e=>fail(e.message));

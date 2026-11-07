const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const path = require('node:path');
const { tool, serve } = require('./pathway-tool.cjs');

function command(engine) {
  return engine === 'claude' ? process.env.TM_CLAUDE_PATH || 'claude' : process.env.TM_CODEX_PATH || 'codex';
}

function start(engine, args, cwd) {
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (/^TM_GOOGLE_|^ELECTRON_RUN_AS_NODE$/.test(name) || (engine === 'codex' && /^ANTHROPIC_/.test(name)) || (engine === 'claude' && /^OPENAI_/.test(name))) delete env[name];
  }
  return spawn(command(engine), args, { cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
}

async function detect(engine, cwd) {
  const child = start(engine, ['--version'], cwd);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Error('The CLI did not respond.')); }, 10000);
    let output = '';
    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.on('error', () => { clearTimeout(timer); reject(new Error(`Install ${engine === 'claude' ? 'Claude Code' : 'Codex'} or set its TM_*_PATH variable.`)); });
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(output.trim()) : reject(new Error('The CLI version check failed.')); });
  });
}

async function codex(cwd, { prompt, session, signal = new AbortController().signal, onDelta, onSession, lookup, model, effort, catalog = false }) {
  const child = start('codex', ['app-server', '--disable', 'shell_tool', '--disable', 'apps', '--disable', 'plugins', '--disable', 'hooks', '-c', 'web_search="disabled"'], cwd);
  const pending = new Map();
  const lines = createInterface({ input: child.stdout });
  let sequence = 0;
  let text = '';
  let active = true;
  let finish;
  let fail;
  const turnDone = new Promise((resolve, reject) => { finish = resolve; fail = reject; });
  turnDone.catch(() => {});
  const send = message => { if (active) child.stdin.write(`${JSON.stringify(message)}\n`); };
  function request(method, params) {
    if (!active) return Promise.reject(new Error('Codex is unavailable. Check its CLI installation.'));
    const id = ++sequence;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); send({ id, method, params }); });
  }
  function abort(error) {
    if (!active) return;
    active = false;
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
    fail(error);
    child.kill();
  }
  const stopped = () => abort(new Error('Request stopped.'));
  signal.addEventListener('abort', stopped, { once: true });
  const timeout = setTimeout(() => abort(new Error(catalog ? 'Codex model discovery timed out.' : 'Codex did not finish within three minutes.')), catalog ? 15000 : 180000);
  child.stdin.on('error', () => {});
  child.stderr.resume();
  child.on('error', () => abort(new Error('Could not launch Codex CLI. Check Settings.')));
  child.on('close', () => abort(new Error('Codex disconnected. Check its sign-in and CLI version.')));
  lines.on('line', line => {
    let event;
    try { event = JSON.parse(line); } catch { return; }
    if (event.id !== undefined && event.method) {
      if (event.method === 'item/tool/call' && event.params.tool === tool.name) {
        const result = (success, text) => send({ id: event.id, result: { success, contentItems: [{ type: 'inputText', text }] } });
        if (!lookup || signal.aborted) result(false, 'The member must enable Pathways lookup for this message.');
        else Promise.resolve().then(() => lookup(event.params.arguments)).then(value => result(true, JSON.stringify(value)), error => result(false, error.message));
        return;
      }
      send({ id: event.id, error: { code: -32601, message: 'This drafting session does not grant tool approvals.' } });
      return;
    }
    const reply = pending.get(event.id);
    if (reply) {
      pending.delete(event.id);
      event.error ? reply.reject(new Error(event.error.message)) : reply.resolve(event.result);
    }
    if (event.method === 'item/agentMessage/delta') {
      text += event.params.delta;
      onDelta(event.params.delta);
    }
    if (event.method === 'turn/completed') {
      const turn = event.params.turn;
      if (turn.status === 'completed') finish(text);
      else fail(new Error(turn.error?.message || `Codex turn ${turn.status}.`));
    }
  });
  try {
    if (signal.aborted) stopped();
    await request('initialize', { clientInfo: { name: 'toastmasters_club_manager', title: 'Toastmasters Club Manager', version: '0.1.0' }, capabilities: { experimentalApi: true } });
    send({ method: 'initialized' });
    if (catalog) {
      const models = [];
      let cursor;
      do {
        const page = await request('model/list', { cursor, includeHidden: false });
        models.push(...page.data.filter(entry => !entry.hidden));
        cursor = page.nextCursor;
      } while (cursor);
      return models;
    }
    const { config } = await request('config/read', { includeLayers: false, cwd });
    let turnModel = model || config.model || undefined;
    if (model === '' && session && !turnModel) {
      const { data } = await request('model/list', { includeHidden: false });
      turnModel = data.find(entry => entry.isDefault)?.model;
    }
    const mcpServers = Object.fromEntries(Object.keys(config.mcp_servers || {}).map(name => [name, { enabled: false }]));
    const params = { cwd, approvalPolicy: 'never', sandbox: 'read-only', config: { mcp_servers: mcpServers } };
    const { thread } = await request(session ? 'thread/resume' : 'thread/start', session ? { ...params, threadId: session } : { ...params, dynamicTools: [{ ...tool, type: 'function' }] });
    const servers = await request('mcpServerStatus/list', { threadId: thread.id });
    if (servers.data.some(server => server.runtimeStatus !== 'disabled' || Object.keys(server.tools || {}).length)) throw new Error('Codex has additional MCP servers enabled. Use a drafting profile without those servers.');
    onSession(thread.id);
    await request('turn/start', { threadId: thread.id, model: turnModel, effort: effort || (!model ? config.model_reasoning_effort : undefined) || undefined, input: [{ type: 'text', text: prompt, text_elements: [] }] });
    return await turnDone;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', stopped);
    active = false;
    child.stdin.end();
    child.kill();
  }
}

async function claude(cwd, { prompt, session, signal, onDelta, onSession, lookup, model }) {
  if (!process.env.ANTHROPIC_API_KEY && !['CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY'].some(name => process.env[name] === '1')) throw new Error('Configure an Anthropic API key or supported provider before launching the app.');
  const bridge = lookup ? await serve(lookup) : null;
  const mcpServers = bridge ? { pathways: { command: process.execPath, args: [path.join(__dirname, 'pathway-tool.cjs')], env: { ELECTRON_RUN_AS_NODE: '1', TM_PATHWAYS_ENDPOINT: bridge.endpoint, TM_PATHWAYS_SECRET: bridge.secret } } } : {};
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--tools', '', '--setting-sources', '', '--settings', '{"disableAllHooks":true}', '--strict-mcp-config', '--mcp-config', JSON.stringify({ mcpServers })];
  if (bridge) args.push('--allowedTools', `mcp__pathways__${tool.name}`);
  if (model) args.push('--model', model);
  if (session) args.push('--resume', session);
  const child = start('claude', args, cwd);
  child.stdin.on('error', () => {});
  child.stdin.end(prompt);
  child.stderr.resume();
  try { return await new Promise((resolve, reject) => {
    const abort = () => { child.kill(); reject(new Error('Request stopped.')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    let result;
    let streamed = false;
    const timeout = setTimeout(() => { child.kill(); reject(new Error('Claude did not finish within three minutes.')); }, 180000);
    createInterface({ input: child.stdout }).on('line', line => {
      let event;
      try { event = JSON.parse(line); } catch { return; }
      if (event.type === 'system' && event.subtype === 'init' && event.session_id) onSession(event.session_id);
      const delta = event.event?.delta;
      if (event.type === 'stream_event' && delta?.type === 'text_delta') { streamed = true; onDelta(delta.text); }
      if (event.type === 'result') result = event;
    });
    child.on('error', () => reject(new Error('Could not launch Claude Code CLI. Check Settings.')));
    child.on('close', code => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      if (code !== 0 || !result || result.is_error) reject(new Error(result?.result || 'Claude Code failed. Check the configured credential.'));
      else { if (!streamed) onDelta(result.result); resolve(result.result); }
    });
  }); } finally { bridge?.close(); }
}

module.exports = { detect, models: cwd => codex(cwd, { catalog: true }), run: (engine, cwd, options) => engine === 'claude' ? claude(cwd, options) : codex(cwd, options) };

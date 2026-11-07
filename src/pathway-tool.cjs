const { createServer } = require('node:http');
const { randomBytes } = require('node:crypto');
const { createInterface } = require('node:readline');

const tool = {
  name: 'read_toastmasters_pathways',
  description: 'Read the signed-in member’s Base Camp paths, project progress labels, or links to project and evaluation resources using the club app browser. Start with list_paths if the path name is unknown.',
  inputSchema: { type: 'object', properties: { operation: { type: 'string', enum: ['list_paths', 'read_progress', 'find_resources'] }, path: { type: 'string' }, project: { type: 'string' } }, required: ['operation'], additionalProperties: false },
};

async function serve(run) {
  const secret = randomBytes(32).toString('base64url');
  const server = createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/lookup' || request.headers.authorization !== `Bearer ${secret}`) {
      response.writeHead(404).end();
      return;
    }
    try {
      let input = '';
      for await (const chunk of request) {
        input += chunk.toString();
        if (input.length > 6000) throw new Error('Pathways request is too large.');
      }
      const result = await run(JSON.parse(input));
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ result }));
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message }));
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { endpoint: `http://127.0.0.1:${server.address().port}/lookup`, secret, close: () => { server.close(); server.closeAllConnections(); } };
}

function mcp() {
  const endpoint = process.env.TM_PATHWAYS_ENDPOINT;
  const secret = process.env.TM_PATHWAYS_SECRET;
  const lines = createInterface({ input: process.stdin });
  const respond = (id, result) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
  lines.on('line', async line => {
    let request;
    try { request = JSON.parse(line); } catch { return; }
    if (request.id === undefined) return;
    if (request.method === 'initialize') return respond(request.id, { protocolVersion: request.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'toastmasters-pathways', version: '0.1.0' } });
    if (request.method === 'tools/list') return respond(request.id, { tools: [{ ...tool, annotations: { readOnlyHint: true } }] });
    if (request.method === 'ping') return respond(request.id, {});
    if (request.method !== 'tools/call' || request.params?.name !== tool.name) {
      process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Unknown method or tool.' } })}\n`);
      return;
    }
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify(request.params.arguments), signal: AbortSignal.timeout(120000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      respond(request.id, { content: [{ type: 'text', text: JSON.stringify(result.result) }] });
    } catch (error) { respond(request.id, { isError: true, content: [{ type: 'text', text: error.message }] }); }
  });
}

if (require.main === module) mcp();
module.exports = { tool, serve };

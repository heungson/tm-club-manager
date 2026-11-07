const { createServer } = require('node:http');
const { randomBytes, createHash } = require('node:crypto');
const { shell } = require('electron');
const { standingRows, labels, fromRoleGrid, fromAuthorityGrid } = require('./data.cjs');

const sheets = 'https://sheets.googleapis.com/v4/spreadsheets';
const drive = 'https://www.googleapis.com/drive/v3';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const agendaColumns = ['meeting_id', 'item_id', 'position', 'type', 'included', 'title', 'owner', 'owner_id', 'evaluator', 'evaluator_id', 'project', 'duration', 'notes'];
const memberColumns = ['member_id', 'display_name', 'membership_type', 'status', 'joined_on'];
const assignmentColumns = ['meeting_id', 'role', 'member_id', 'display_name'];
const imageColumns = ['meeting_id', 'item_id', 'drive_file_id', 'fit', 'alt_text'];
const agendaSignature = rows => JSON.stringify(rows.map(row => agendaColumns.map((_, index) => String(row[index] ?? ''))).sort((a, b) => a[1].localeCompare(b[1])));
const agendaRow = (id, item, index) => [id, item.id, index + 1, item.type, item.included ? 'TRUE' : 'FALSE', item.title, item.owner, item.ownerId, item.evaluator, item.evaluatorId, item.project, item.duration, item.notes];

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
  if (!response.ok) {
    const error = new Error(`Google returned HTTP ${response.status}. Check the connected file and account permissions.`);
    error.status = response.status;
    throw error;
  }
  return response;
}

function tokenRequest(values) {
  const client_id = process.env.TM_GOOGLE_CLIENT_ID;
  const client_secret = process.env.TM_GOOGLE_CLIENT_SECRET;
  if (!client_id || !client_secret) throw new Error('Set TM_GOOGLE_CLIENT_ID and TM_GOOGLE_CLIENT_SECRET in .env, then restart.');
  return request(tokenUrl, { method: 'POST', body: new URLSearchParams({ client_id, client_secret, ...values }) }).then(response => response.json());
}

function createGoogle(vault) {
  let access = null;
  let pickerOpen = false;

  async function pick(kind) {
    if (!process.env.TM_GOOGLE_CLIENT_ID || !process.env.TM_GOOGLE_CLIENT_SECRET) throw new Error('Configure desktop Google OAuth credentials in .env and restart the app.');
    if (pickerOpen) throw new Error('Finish the current Google selection in the browser.');
    pickerOpen = true;
    const state = randomBytes(24).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    let settle;
    const callback = new Promise(resolve => { settle = resolve; });
    const server = createServer((incoming, response) => {
      const url = new URL(incoming.url, 'http://127.0.0.1');
      if (url.pathname !== '/callback' || url.searchParams.get('state') !== state) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Return to Toastmasters Club Manager.');
      settle(url.searchParams);
    });
    const timeout = setTimeout(() => settle(null), 180000);
    try {
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      const redirect_uri = `http://127.0.0.1:${server.address().port}/callback`;
      const mime = { meeting: 'application/vnd.google-apps.spreadsheet', roster: 'application/vnd.google-apps.spreadsheet', folder: 'application/vnd.google-apps.folder', image: 'image/jpeg,image/png' }[kind];
      const query = new URLSearchParams({ client_id: process.env.TM_GOOGLE_CLIENT_ID, redirect_uri, response_type: 'code', scope: 'https://www.googleapis.com/auth/drive.file', access_type: 'offline', prompt: 'consent', trigger_onepick: 'true', mimetypes: mime, code_challenge: challenge, code_challenge_method: 'S256', state });
      if (kind === 'folder') query.set('allow_folder_selection', 'true');
      await shell.openExternal(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
      const result = await callback;
      const id = result?.get('picked_file_ids')?.split(',')[0];
      const code = result?.get('code');
      if (!id || !code) throw new Error('Google selection was cancelled or timed out.');
      const token = await tokenRequest({ code, redirect_uri, code_verifier: verifier, grant_type: 'authorization_code' });
      if (!token.refresh_token) throw new Error('Google did not return a refresh token. Reconnect and grant offline access.');
      vault.write(token.refresh_token);
      access = { token: token.access_token, until: Date.now() + token.expires_in * 1000 };
      const file = await json(`${drive}/files/${encodeURIComponent(id)}?fields=id,name,mimeType&supportsAllDrives=true`);
      if (!mime.split(',').includes(file.mimeType)) throw new Error('Choose a file of the requested type.');
      return file;
    } finally {
      clearTimeout(timeout);
      server.close();
      pickerOpen = false;
    }
  }

  async function authorized(url, options = {}) {
    if (!access || access.until < Date.now() + 60000) {
      const refresh_token = vault.read();
      if (!refresh_token) throw new Error('Connect Google from Settings first.');
      const token = await tokenRequest({ refresh_token, grant_type: 'refresh_token' });
      access = { token: token.access_token, until: Date.now() + token.expires_in * 1000 };
    }
    return request(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${access.token}` } });
  }

  async function json(url, options) { return (await authorized(url, options)).json(); }
  const body = (method, value) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
  const quote = tab => `'${tab.replaceAll("'", "''")}'`;
  const base = id => `${sheets}/${encodeURIComponent(id)}`;
  const titles = async id => (await json(`${base(id)}?fields=sheets(properties(title))`)).sheets.map(sheet => sheet.properties.title);

  async function values(id, range, options = '') {
    return (await json(`${base(id)}/values/${encodeURIComponent(range)}${options}`)).values ?? [];
  }

  async function write(id, data) {
    if (data.length) await json(`${base(id)}/values:batchUpdate`, body('POST', { valueInputOption: 'RAW', data }));
  }

  async function table(id, tab, headers, create = false) {
    if (!(await titles(id)).includes(tab)) {
      if (!create) return [];
      await json(`${base(id)}:batchUpdate`, body('POST', { requests: [{ addSheet: { properties: { title: tab } } }] }));
    }
    const rows = await values(id, `${quote(tab)}!A:${String.fromCharCode(64 + headers.length)}`);
    if (rows.length && headers.some((header, index) => rows[0][index] !== header)) throw new Error(`${tab} has unexpected column headers.`);
    if (!rows.length && create) await write(id, [{ range: `${quote(tab)}!A1`, values: [headers] }]);
    return rows.slice(1);
  }

  async function meetings(file) {
    const tabs = (await titles(file.id)).filter(name => /^\d{2}_Roles$/.test(name));
    if (!tabs.length) throw new Error('The selected workbook has no yearly roles tab such as 26_Roles.');
    const results = await Promise.all(tabs.map(async tab => fromRoleGrid(await values(file.id, `${quote(tab)}!1:52`, '?valueRenderOption=UNFORMATTED_VALUE'), tab, file.id)));
    const [agenda, assignments, images] = await Promise.all([table(file.id, 'Agenda Items', agendaColumns), table(file.id, 'Assignment IDs', assignmentColumns), table(file.id, 'Slide Images', imageColumns)]);
    return results.flat().map(meeting => {
      const saved = agenda.filter(row => row[0] === meeting.id && row[1]);
      if (saved.length) meeting.agenda = saved.filter(row => labels[row[3]]).sort((a, b) => Number(a[2]) - Number(b[2])).map(row => ({ id: row[1], type: row[3], included: row[4] === 'TRUE', title: row[5] || '', owner: row[6] || '', ownerId: row[7] || '', evaluator: row[8] || '', evaluatorId: row[9] || '', project: row[10] || '', duration: row[11] || '', notes: row[12] || '' }));
      for (const item of meeting.agenda) {
        const image = images.find(row => row[0] === meeting.id && row[1] === item.id && row[2]);
        if (image) item.image = { driveId: image[2], fit: image[3] || 'cover', alt: image[4] || '' };
      }
      meeting.agendaSignature = agendaSignature(saved);
      meeting.roleIds = Object.fromEntries(assignments.filter(row => row[0] === meeting.id && row[2] && row[3] === meeting.roles[row[1]]).map(row => [row[1], row[2]]));
      return meeting;
    });
  }

  async function saveMeeting(file, before, next) {
    const id = file.id;
    const grid = await values(id, `${quote(before.tab)}!${before.column}1:${before.column}13`, '?valueRenderOption=UNFORMATTED_VALUE');
    if (String(grid[1]?.[0]) !== before.number) throw new Error('The meeting moved in Google Sheets. Refresh it before saving.');
    const rows = await table(id, 'Agenda Items', agendaColumns, true);
    const data = [];
    const meetingRows = rows.map((row, index) => ({ row, index: index + 2 })).filter(entry => entry.row[0] === before.id);
    if (before.agendaSignature && before.agendaSignature !== agendaSignature(meetingRows.map(entry => entry.row))) throw new Error('The agenda changed in Sheets. Refresh the meeting before saving.');
    const currentIds = new Set(next.agenda.map(item => item.id));
    let appendRow = rows.length + 2;
    for (const entry of meetingRows.filter(entry => !currentIds.has(entry.row[1]))) data.push({ range: `'Agenda Items'!A${entry.index}`, values: [Array(agendaColumns.length).fill('')] });
    const planned = next.agenda.length ? next.agenda.map((item, index) => agendaRow(before.id, item, index)) : [[before.id, 'empty-agenda']];
    if (!next.agenda.length) data.push({ range: `'Agenda Items'!A${appendRow++}`, values: planned });
    next.agenda.forEach((item, index) => {
      const rowNumber = meetingRows.find(entry => entry.row[1] === item.id)?.index ?? appendRow++;
      data.push({ range: `'Agenda Items'!A${rowNumber}`, values: [planned[index]] });
    });
    if ([...before.agenda, ...next.agenda].some(item => item.image?.driveId)) {
      const imageRows = await table(id, 'Slide Images', imageColumns, true);
      let nextImageRow = imageRows.length + 2;
      const assets = new Map(next.agenda.filter(item => item.image?.driveId).map(item => [item.id, item.image]));
      imageRows.forEach((row, index) => {
        if (row[0] !== before.id || assets.has(row[1])) return;
        data.push({ range: `'Slide Images'!A${index + 2}`, values: [Array(imageColumns.length).fill('')] });
      });
      for (const [itemId, image] of assets) {
        const index = imageRows.findIndex(row => row[0] === before.id && row[1] === itemId);
        data.push({ range: `'Slide Images'!A${index < 0 ? nextImageRow++ : index + 2}`, values: [[before.id, itemId, image.driveId, image.fit || 'cover', image.alt || '']] });
      }
    }
    const changedRoles = Object.keys(standingRows).filter(role => (before.roles[role] || '') !== (next.roles[role] || '') || (before.roleIds[role] || '') !== (next.roleIds[role] || ''));
    if (changedRoles.length) {
      const roleRows = await table(id, 'Assignment IDs', assignmentColumns, true);
      let nextRow = roleRows.length + 2;
      for (const role of changedRoles) {
        const gridRow = standingRows[role];
        if (String(grid[gridRow - 1]?.[0] ?? '').trim() !== (before.roles[role] || '')) throw new Error(`${role} changed in Sheets. Refresh the meeting before saving.`);
        const existing = roleRows.findIndex(row => row[0] === before.id && row[1] === role);
        data.push({ range: `${quote(before.tab)}!${before.column}${gridRow}`, values: [[next.roles[role] || '']] });
        data.push({ range: `'Assignment IDs'!A${existing < 0 ? nextRow++ : existing + 2}`, values: [[before.id, role, next.roleIds[role] || '', next.roles[role] || '']] });
      }
    }
    await write(id, data);
    return agendaSignature(planned);
  }

  async function roster(file) {
    return (await table(file.id, 'Members', memberColumns)).filter(row => row[0]).map(row => ({ id: row[0], name: row[1], type: row[2], status: row[3], joined: row[4] || '' }));
  }

  async function authority(file) {
    const name = (await titles(file.id)).filter(tab => /^\d{2}_Authority$/.test(tab)).sort().at(-1);
    return name ? fromAuthorityGrid(await values(file.id, `${quote(name)}!A2:D30`)) : {};
  }

  async function saveMember(file, member) {
    const rows = await table(file.id, 'Members', memberColumns, true);
    const index = rows.findIndex(row => row[0] === member.id);
    await write(file.id, [{ range: `'Members'!A${index < 0 ? rows.length + 2 : index + 2}`, values: [[member.id, member.name, member.type, member.status, member.joined]] }]);
  }

  async function upload(folder, name, mimeType, buffer) {
    const boundary = randomBytes(16).toString('hex');
    const metadata = JSON.stringify({ name, parents: [folder.id], mimeType });
    const contents = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`), buffer, Buffer.from(`\r\n--${boundary}--\r\n`)]);
    return json('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: contents });
  }

  async function image(fileId) {
    const response = await authorized(`${drive}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
    const mime = response.headers.get('content-type')?.split(';')[0];
    if (!['image/png', 'image/jpeg'].includes(mime)) throw new Error('Slide images must be PNG or JPEG.');
    if (Number(response.headers.get('content-length')) > 12000000) throw new Error('Slide images must be under 12 MB.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 12000000) throw new Error('Slide images must be under 12 MB.');
    return { mime, bytes };
  }

  return { pick, meetings, saveMeeting, roster, saveMember, authority, upload, image, disconnect() { access = null; vault.clear(); } };
}

module.exports = { createGoogle };

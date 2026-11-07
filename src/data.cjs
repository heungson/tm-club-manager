const { randomUUID } = require('node:crypto');

const standingRows = { Chairperson: 4, Toastmaster: 5, 'General Evaluator': 6, Topicsmaster: 7, Timer: 8, 'Ah-Counter': 9, Grammarian: 10, 'Word & Quote Master': 11, 'Debate Master': 12, 'Quiz Master': 13 };
const labels = { welcome: 'Welcome', roles: 'Meeting roles', word: 'Word and quote', speech: 'Prepared speech', break: 'Break', topics: 'Table Topics', debate: 'Debate', evaluations: 'Evaluations and reports', awards: 'Awards', closing: 'Closing', custom: 'Custom segment' };
const types = ['Paid member', 'Guest', 'Honorary member'];
const roleAliases = { 'Table Topic Master': 'Topicsmaster', 'Speech Evaluator': 'Evaluator', 'Debate Master': 'Debate moderator', 'Ah Counter': 'Ah-Counter', 'W & Q Master': 'Word & Quote Master' };

function fromAuthorityGrid(rows) {
  return Object.fromEntries(rows.filter(row => row[0] && row.slice(1, 4).some(value => /^[OX]$/i.test(value))).map(row => [roleAliases[row[0]] || row[0], types.filter((_, index) => /^O$/i.test(row[index + 1]))]));
}

function eligible(roster, authority, role, id) {
  const member = roster.find(item => item.id === id);
  return !!member && member.status === 'Active' && (!authority?.[role] || authority[role].includes(member.type));
}

function newItem(type) {
  return { id: randomUUID(), type, included: true, title: '', owner: '', ownerId: '', evaluator: '', evaluatorId: '', project: '', duration: '', notes: '' };
}

function makeFormat(name) {
  const middle = name === 'Speech marathon' ? ['speech', 'speech', 'speech', 'speech']
    : name === 'Debate meeting' ? ['speech', 'speech', 'debate'] : ['speech', 'speech', 'break', 'topics'];
  return ['welcome', 'roles', 'word', ...middle, 'evaluations', 'awards', 'closing'].map(newItem);
}

function seed() {
  const roster = ['Jamie Lee', 'Mina Park', 'Robin Han', 'Daniel Cho', 'Alex Kim'].map((name, index) => ({ id: `demo-${index + 1}`, name, type: 'Paid member', status: 'Active', joined: '' }));
  const agenda = makeFormat('Regular meeting');
  const [first, second] = agenda.filter(item => item.type === 'speech');
  Object.assign(first, { title: 'The first five minutes', owner: roster[1].name, ownerId: roster[1].id, evaluator: roster[2].name, evaluatorId: roster[2].id, project: 'Ice Breaker', duration: '4–6 min' });
  Object.assign(second, { title: 'A lesson from the trail', owner: roster[3].name, ownerId: roster[3].id, project: 'Prepared speech', duration: '5–7 min' });
  return {
    source: 'Sample club', roster, chats: [], scripts: [], assets: {}, google: {}, authority: Object.fromEntries(['Chairperson', 'Toastmaster', 'General Evaluator', 'Topicsmaster', 'Speaker', 'Evaluator', 'Debate moderator'].map(role => [role, ['Paid member']])),
    meetings: [{ id: 'demo-44', date: '2026-11-09', number: '44', theme: 'Small beginnings', question: 'What small step changed your direction?', word: 'Momentum', quote: 'A little progress each day adds up.', event: '', roles: { Chairperson: roster[0].name, Toastmaster: roster[0].name, Topicsmaster: roster[4].name, 'General Evaluator': roster[2].name }, roleIds: { Chairperson: roster[0].id, Toastmaster: roster[0].id, Topicsmaster: roster[4].id, 'General Evaluator': roster[2].id }, agenda }],
  };
}

function dateValue(value) {
  if (value instanceof Date && Number.isFinite(+value)) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 20000 && value < 100000) return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0, 10);
  return /^\d{4}-\d\d-\d\d$/.test(value) ? value : '';
}

function columnName(index) {
  let name = '';
  for (let next = index + 1; next > 0; next = Math.floor((next - 1) / 26)) name = String.fromCharCode(65 + (next - 1) % 26) + name;
  return name;
}

function fromRoleGrid(rows, tab, prefix) {
  const read = (row, col) => rows[row - 1]?.[col];
  const asText = (row, col) => String(read(row, col) ?? '').trim();
  const meetings = [];
  for (let col = 1; col < (rows[0]?.length ?? 0); col++) {
    const date = dateValue(read(1, col));
    const number = asText(2, col);
    if (!date || !number) continue;
    const id = `${prefix}:${tab}:${date}:${number}`;
    const agenda = makeFormat('Regular meeting').filter(item => item.type !== 'speech');
    agenda.forEach((item, index) => { item.id = `${id}:${item.type}:${index}`; });
    const speeches = [14, 18, 22, 26].map((row, index) => ({ ...newItem('speech'), id: `${id}:speech:${index}`, owner: asText(row, col), project: asText(row + 1, col), title: asText(row + 2, col), duration: asText(row + 3, col), evaluator: asText(30 + index, col) })).filter(item => item.owner || item.title || item.project || item.evaluator);
    agenda.splice(3, 0, ...speeches);
    const roles = Object.fromEntries(Object.entries(standingRows).map(([role, row]) => [role, asText(row, col)]));
    if (roles['Debate Master']) agenda.splice(agenda.findIndex(item => item.type === 'evaluations'), 0, { ...newItem('debate'), id: `${id}:debate`, owner: roles['Debate Master'] });
    meetings.push({ id, date, number, tab, column: columnName(col), roles, roleIds: {}, agenda, event: asText(3, col), theme: asText(42, col), question: asText(43, col), word: asText(44, col), quote: asText(45, col), winners: [asText(46, col), asText(47, col), asText(48, col)] });
  }
  return meetings;
}

function buildDeck(meeting) {
  if (!meeting || /no\s+meeting|^holiday$/i.test(meeting.event)) return [];
  const included = meeting.agenda.filter(item => item.included);
  const speeches = included.filter(item => item.type === 'speech');
  return included.map(item => {
    const { type } = item;
    const name = labels[type];
    let title = item.title || name;
    let lines = [item.owner, item.duration].filter(Boolean);
    let cue = item.notes || 'Advance when this segment ends.';
    switch (type) {
      case 'welcome': title = item.title || meeting.theme || 'Welcome'; lines = [`Meeting #${meeting.number}`, meeting.date]; cue = 'Welcome guests and hand over to the Toastmaster.'; break;
      case 'roles': lines = Object.entries(meeting.roles).filter(([role, member]) => member && role !== 'Debate Master').map(([role, member]) => `${role} · ${member}`); cue = 'Invite the role takers to explain their duties.'; break;
      case 'word': title = item.title || meeting.word || name; lines = [meeting.quote, meeting.question].filter(Boolean); cue = 'Invite the Grammarian or Word and Quote Master to speak.'; break;
      case 'speech': lines = [item.owner || 'Speaker to be assigned', item.project, item.duration].filter(Boolean); cue = 'Introduce the speaker. Hold the slide through the speech while the Timer signals, then allow written feedback.'; break;
      case 'topics': lines = [item.owner || meeting.roles.Topicsmaster, item.duration].filter(Boolean); cue = 'Hand over to the Topicsmaster and hold this slide during the impromptu speeches.'; break;
      case 'debate': lines = [item.owner && `Moderator · ${item.owner}`, item.duration].filter(Boolean); cue = 'Hand over to the moderator. Keep the motion visible.'; break;
      case 'evaluations': lines = speeches.map(speech => `${speech.owner || speech.title || 'Speaker'} → ${speech.evaluator || 'Evaluator open'}`); cue = 'Invite the General Evaluator to lead the reports and speech evaluations.'; break;
      case 'awards': lines = ['Best Speaker', 'Best Evaluator', 'Best Table Topics Speaker'].map((award, index) => meeting.winners?.[index] ? `${award} · ${meeting.winners[index]}` : award); cue = 'Announce the winners once voting is complete.'; break;
      case 'closing': lines = ['Role sign-up · Guest feedback · Group photo']; cue = 'Invite sign-ups and guest feedback, then close the meeting.'; break;
    }
    return { id: item.id, name, title, lines, cue: item.notes || cue, image: item.image || null };
  });
}

module.exports = { standingRows, labels, newItem, makeFormat, seed, fromRoleGrid, fromAuthorityGrid, eligible, buildDeck };

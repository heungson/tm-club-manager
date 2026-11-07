'use strict';

const root = document.querySelector('#app');
const dock = document.querySelector('#assistant-dock');
const dialog = document.querySelector('#dialog');
const notice = document.querySelector('#notice');
const invoke = (name, value) => window.club.call(name, value);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const labels = { welcome: 'Welcome', roles: 'Meeting roles', word: 'Word and quote', speech: 'Prepared speech', break: 'Break', topics: 'Table Topics', debate: 'Debate', evaluations: 'Evaluations and reports', awards: 'Awards', closing: 'Closing', custom: 'Custom segment' };
const standing = ['Chairperson', 'Toastmaster', 'General Evaluator', 'Topicsmaster', 'Timer', 'Ah-Counter', 'Grammarian', 'Word & Quote Master', 'Quiz Master'];
const hostCues = {
  welcome: 'After the Chairperson hands over, welcome members and guests, introduce the theme, and preview the program.',
  roles: 'Invite the role takers to explain their duties. Ask the Timer to explain the signals before anyone speaks.',
  word: 'Invite the person covering the word and quote to introduce them.',
  speech: 'Introduce the speaker by name, speech title, project, objective, and time limit. Lead the applause and allow time for written feedback afterward.',
  break: 'Tell the room when to return and what comes next.',
  topics: 'Introduce the Topicsmaster. Ask them to invite guests who have volunteered and explain how the segment works.',
  debate: 'Introduce the moderator, display the motion, and let them explain the format and timing.',
  evaluations: 'Hand over to the General Evaluator to lead speech evaluations and the meeting reports.',
  awards: 'Follow the club’s voting procedure and announce the results once they are available.',
  closing: 'Thank participants and guests, then hand back to the Chairperson for announcements and closing.',
  custom: 'Introduce the activity and its facilitator. Confirm who takes the floor afterward.',
};
const navigation = [['Meetings', 'calendar'], ['Role Guide', 'book'], ['Members', 'people'], ['My speeches', 'document'], ['Pathways', 'route'], ['Settings', 'gear']];
const roleGuide = [
  ['Running the meeting', [
    ['Chairperson', 'Opens the meeting, welcomes guests, and hands over to the Toastmaster.', 'Check the opening order and any club announcements.', 'Call the meeting to order. Return for announcements and closing when scheduled.'],
    ['Toastmaster', 'Hosts the program and keeps the agenda moving.', 'Confirm the agenda, role holders, and speaker introductions.', 'Introduce speakers and role holders, guide transitions, and adjust the pace as needed.'],
    ['Topicsmaster', 'Runs the impromptu speaking segment.', 'Prepare short, open-ended prompts and check who is willing to take part.', 'Explain the format, give one prompt at a time, and invite participants to respond.'],
    ['General Evaluator', 'Leads the evaluation segment and gives feedback on how the meeting ran.', 'Confirm who will evaluate each speech and who will give the other reports.', 'Call for evaluations and reports. Close with specific observations and suggestions about the meeting.'],
  ]],
  ['Speaking and feedback', [
    ['Prepared Speaker', 'Delivers a rehearsed speech within the assigned time.', 'Share your title, timing, and project goals with the host or evaluator as appropriate.', 'Deliver the speech, watch the Timer’s signals, and listen to the evaluation.'],
    ['Table Topics Speaker', 'Responds to a prompt with a short, impromptu talk.', 'Check the speaking time. Guests can tell the host whether they’d like to volunteer.', 'Listen to the prompt, organize a brief response, and watch the Timer’s signals.'],
    ['Speech Evaluator', 'Gives specific feedback on one prepared speech.', 'Review the project criteria and ask the speaker what feedback they want.', 'Take notes, give an oral evaluation, and share written feedback with the speaker.'],
  ]],
  ['Meeting reports', [
    ['Timer', 'Tracks the time for prepared speeches, Table Topics, and evaluations.', 'Confirm the timing limits for each segment and check your timer and signals.', 'Explain the signals, show them at the agreed times, and report the recorded times when called on.'],
    ['Ah-Counter', 'Tracks filler sounds and repeated words such as “um” and “you know.”', 'Set up a simple tally so you can record each speaker separately.', 'Listen, tally fillers, and share a brief report when called on.'],
    ['Grammarian', 'Listens for effective phrasing and language that could be clearer.', 'Prepare a way to record examples. Check who is introducing the Word of the Day.', 'Share memorable examples and constructive suggestions. Report use of the word if assigned.'],
  ]],
  ['Club roles and optional segments', [
    ['Word & Quote Master', 'Introduces the Word and Quote of the Day.', 'Choose a word, an example sentence, and a quote that fits the meeting.', 'Explain the word, share the quote, and invite participants to use the word.'],
    ['Quiz Master', 'Leads a short quiz on details from the meeting.', 'Check when the quiz is scheduled and how much time it has.', 'Listen for memorable details, ask a few questions, and reveal the answers.'],
    ['Debate Moderator', 'Keeps the debate fair, on topic, and on time.', 'Confirm the motion, speaking order, and time limits with both sides.', 'Explain the rules, give each side its turns, and close the exchange on time.'],
    ['Photographer', 'Coordinates any planned meeting or group photos.', 'Confirm the photo plan and check who is comfortable being included.', 'Take the agreed photos at suitable moments. Keep the speaking area clear.'],
    ['Special Session Facilitator', 'Guides an activity scheduled for this meeting.', 'Agree on the purpose, materials, and time with the Toastmaster.', 'Explain how to participate, lead the activity, and hand back when time is up.'],
  ]],
];
const meetingTabs = ['Slides', 'Agenda', 'Roles', 'Meeting details'];
const engines = { codex: 'Codex CLI', claude: 'Claude Code CLI' };
const claudeModels = [['default', 'Claude default'], ['sonnet', 'Claude Sonnet'], ['opus', 'Claude Opus'], ['haiku', 'Claude Haiku']];
const effortNames = { none: 'None', minimal: 'Minimal', low: 'Low', medium: 'Medium', high: 'High', xhigh: 'Extra High', max: 'Max', ultra: 'Ultra' };
const formatDate = date => date ? new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)) : '';
const selected = (value, current) => value === current ? ' selected' : '';
const options = (items, current) => items.map(([value, label]) => `<option value="${escape(value)}"${selected(value, current)}>${escape(label)}</option>`).join('');
const iconPaths = {
  close: 'M6 6l12 12M18 6 6 18',
  compose: 'M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M11 13l1-4 6-6 3 3-6 6-4 1Z',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3 10h18M8 3v4M16 3v4',
  book: 'M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14',
  people: 'M13 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 19v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1m1-14a3 3 0 0 1 0 6m2 3a4 4 0 0 1 2 4v1',
  document: 'M6 3h8l5 5v13H5V3Zm8 0v5h5M8 12h8m-8 4h8',
  route: 'M8 18h8a4 4 0 0 0 0-8h-4a2 2 0 0 1 0-4h4M14 4l2 2-2 2M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  gear: 'M10 3h4l.5 2.5 2 .9 2.3-1.2 2 3.5-1.8 1.7v2.2l1.8 1.7-2 3.5-2.3-1.2-2 .9-.5 2.5h-4l-.5-2.5-2-.9-2.3 1.2-2-3.5 1.8-1.7v-2.2L3.2 8.7l2-3.5 2.3 1.2 2-.9L10 3Zm5 8.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  chat: 'M20 12a8 8 0 0 1-8 8 9 9 0 0 1-3.5-.7L4 20l.7-4.5A9 9 0 0 1 4 12a8 8 0 0 1 16 0ZM8 10h8m-8 4h5',
  up: 'M12 19V5m-6 6 6-6 6 6',
  down: 'M12 5v14m-6-6 6 6 6-6',
  previous: 'm15 18-6-6 6-6',
  next: 'm9 6 6 6-6 6',
  chevron: 'm6 9 6 6 6-6',
  check: 'm5 12 4 4L19 6',
  external: 'M13 5h6v6m0-6-8 8m7 0v6H5V6h6',
};
const iconMarkup = icon => `<svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[icon]}"/></svg>`;
const buttons = (action, label, value = '', className = '', icon = '') => `<button type="button" class="${className}${icon ? ' has-icon' : ''}" data-action="${action}" data-value="${escape(value)}">${icon ? iconMarkup(icon) : ''}${escape(label)}</button>`;
const iconButton = (action, label, icon, value = '') => `<button type="button" class="icon-button" data-action="${action}" data-value="${escape(value)}" aria-label="${escape(label)}" title="${escape(label)}">${iconMarkup(icon)}</button>`;
const contextChip = (action, label) => `<button type="button" class="chip has-icon" data-action="${action}" aria-label="Remove ${escape(label)} attachment" title="Remove attachment">${escape(label)}${iconMarkup('close')}</button>`;
const input = (label, name, value = '', type = 'text') => `<label>${escape(label)}<input type="${type}" name="${name}" aria-label="${escape(label)}" value="${escape(value)}"></label>`;
const select = (label, name, values, current) => `<label>${escape(label)}<select name="${name}" aria-label="${escape(label)}">${options(values, current)}</select></label>`;
const arrayOptions = values => values.map(value => [value, value]);

let profile;
let view = 'Meetings';
let guideRole = 'Toastmaster';
let guideQuery = '';
let guideFromMeeting = false;
let tab = 'Slides';
let meetingId;
let draft;
let draftChanged = false;
let activeItem;
let deck;
let slideIndex = 0;
let showing;
let rehearsal = false;
let renderVersion = 0;
let noticeTimer;
let filter = '';
let memberStatus = '';
let memberType = '';
let openOnly = false;
let scriptId;
let activeChat;
let engine = 'codex';
let chatModel = '';
let chatEffort = '';
let codexModels = [];
let catalogStatus = '';
let catalogLoaded = false;
let streaming;
let attachMeeting = false;
let attachScript;
let attachPathways = '';
let allowPathways = false;
let chatOpen = false;
let sendText = '';
let pathwayBrowser = 'Chrome';
let pathways = [];
let activePath = '';
let progress = [];
let resources = [];
let project = '';
let pathStatus = 'Open TMI in your browser to sign in.';
let working = '';
const cliStatus = {};

function message(text, error = false) {
  clearTimeout(noticeTimer);
  notice.textContent = text;
  notice.classList.toggle('error', error);
  notice.hidden = false;
  noticeTimer = setTimeout(() => { notice.hidden = true; }, error ? 9000 : 4200);
}

function errorText(error) {
  return String(error.message || error).replace(/^Error invoking remote method '[^']+': Error: /, '');
}

function showDialog(title, body, confirm = 'Save', submit) {
  dialog.innerHTML = `<form><header class="dialog-head"><h2>${escape(title)}</h2>${iconButton('dismiss', 'Close dialog', 'close')}</header><div class="dialog-body">${body}</div><footer>${buttons('dismiss', 'Cancel')}<button class="primary" type="submit">${escape(confirm)}</button></footer></form>`;
  if (!dialog.open) dialog.showModal();
  const form = dialog.querySelector('form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = form.querySelector('[type=submit]');
    submitButton.disabled = true;
    try {
      await submit(Object.fromEntries(new FormData(form)));
      if (dialog.contains(form)) dialog.close();
    } catch (error) { message(errorText(error), true); }
    finally { submitButton.disabled = false; }
  });
}

function header(kicker, title, description, actions = '') {
  return `<header class="page-head"><div><div class="eyebrow">${escape(kicker)}</div><h1>${escape(title)}</h1><p>${escape(description)}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</header>`;
}

function currentMeeting() { return profile.meetings.find(item => item.id === meetingId); }

async function refreshDeck() {
  const version = ++renderVersion;
  const id = meetingId;
  const next = id ? await invoke('meeting:preview', id) : null;
  if (version !== renderVersion) return;
  deck = next;
  slideIndex = Math.max(0, Math.min(slideIndex, (deck?.slides.length || 1) - 1));
}

async function chooseMeeting(id) {
  if (draftChanged && !window.confirm('Discard unsaved agenda changes?')) { render(); return; }
  meetingId = id;
  draft = currentMeeting() ? structuredClone(currentMeeting()) : null;
  draftChanged = false;
  activeItem = draft?.agenda[0]?.id;
  slideIndex = 0;
  deck = null;
  render();
  await refreshDeck();
  render();
}

function nextMeeting() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const ordered = [...profile.meetings].sort((a, b) => a.date.localeCompare(b.date));
  return ordered.find(item => item.date >= today && !/no meeting|^holiday$/i.test(item.event))?.id || ordered.at(-1)?.id;
}

async function installProfile(next) {
  profile = next;
  draftChanged = false;
  await chooseMeeting(currentMeeting()?.id || nextMeeting());
}

function slideMarkup(slide, number, blank = false) {
  if (blank) return '<div class="slide blackout" aria-label="Audience screen blank"></div>';
  if (!slide) return '<div class="slide blank-slide"><span>No slides in this agenda</span></div>';
  const maroon = ['Welcome', 'Debate', 'Closing'].includes(slide.name);
  return `<article class="slide${maroon ? ' maroon' : ''}${slide.media ? ' with-image' : ''}${slide.lines.length > 5 ? ' dense' : ''}${slide.title.length > 52 ? ' long-title' : ''}">
    <div class="slide-brand"><span>Dongtan Toastmasters</span><span>#${escape(number)}</span></div>
    <div class="slide-body"><div class="slide-copy"><div class="slide-kicker">${escape(slide.name)}</div><h2>${escape(slide.title)}</h2>${slide.lines.map(line => `<p>${escape(line)}</p>`).join('')}</div>${slide.media ? `<img class="${slide.image?.fit === 'contain' ? 'contain' : ''}" src="${escape(slide.media)}" alt="${escape(slide.image?.alt || '')}">` : '<span class="slide-mark" aria-hidden="true"></span>'}</div>
    </article>`;
}

function meetingPage() {
  const item = currentMeeting();
  const files = `<div class="meeting-source"><span class="status-dot"></span>${escape(profile.source)}${profile.syncedAt ? ' · ' + escape(new Date(profile.syncedAt).toLocaleString()) : ''}</div>`;
  const picker = profile.meetings.length ? `<select aria-label="Select meeting" id="meeting-select">${options([...profile.meetings].sort((a, b) => b.date.localeCompare(a.date)).map(value => [value.id, `#${value.number} · ${formatDate(value.date)}${value.event ? ' · ' + value.event : ''}`]), meetingId)}</select>` : '';
  const manage = profile.google.meeting ? buttons('refresh', 'Refresh sheet') : buttons('new-meeting', 'New meeting');
  const navigation = `<nav class="tabs" aria-label="Meeting workspace">${meetingTabs.map(name => `<button type="button" data-action="tab" data-value="${name}"${tab === name ? ' class="selected" aria-current="page"' : ''}>${name}</button>`).join('')}</nav>`;
  const page = { Slides: slidesPage, Agenda: agendaPage, Roles: rolesPage, 'Meeting details': detailsPage }[tab];
  return `<header class="page-head meeting-head"><h1>Meetings</h1><div class="actions">${manage}</div></header>
    <section class="meeting-banner" aria-label="Selected meeting">
      <div>
        <div class="eyebrow">${item ? `Meeting #${escape(item.number)}` : 'Club calendar'}</div>
        <h2>${escape(item?.theme || item?.event || (item ? 'Club meeting' : 'No meeting selected'))}</h2>
        ${item ? `<p>${escape(formatDate(item.date))}${item.event && item.theme ? ` · ${escape(item.event)}` : ''}</p>` : ''}
      </div>
      <div class="meeting-picker">${picker}${files}</div>
    </section>
    ${navigation}${item ? page(item) : '<div class="panel empty">Add a meeting or connect a spreadsheet in Settings.</div>'}`;
}

function slidesPage() {
  const slides = deck?.slides || [];
  const slide = slides[slideIndex];
  const actions = slide ? `<div class="actions">${buttons('rehearse', 'Rehearse')}${buttons('present', 'Present…', '', 'primary')}${buttons('export', 'Export PowerPoint…')}</div>` : '';
  return `<div class="section-head"><div><h2>Slide deck</h2><p>${slides.length} slides from the saved agenda</p></div>${actions}</div>
    <div class="slide-layout">
      <section class="deck-preview" aria-labelledby="preview-title">
        <div class="deck-panel-head"><h3 id="preview-title">Audience preview</h3>${slide ? `<span>${slideIndex + 1} / ${slides.length}</span>` : ''}</div>
        <div class="deck-stage">${slideMarkup(slide, deck?.number)}</div>
        ${slide ? `<div class="preview-actions deck-cue"><div><strong>Presenter cue</strong><p>${slide.imageUnavailable ? 'The selected image could not be loaded.' : escape(slide.cue)}</p></div>${buttons('image', 'Choose image…')}</div>` : ''}
      </section>
      ${slides.length ? `<section class="deck-order" aria-labelledby="deck-order-title">
        <div class="deck-panel-head"><h3 id="deck-order-title">Slide order</h3></div>
        <div class="deck-list">${slides.map((entry, index) => `<button type="button" data-action="slide" data-value="${index}" class="row-button${index === slideIndex ? ' current' : ''}"${index === slideIndex ? ' aria-current="true"' : ''}><span class="row-count">${String(index + 1).padStart(2, '0')}</span><span><strong>${escape(entry.title || entry.name)}</strong>${entry.name !== entry.title && entry.title ? `<small>${escape(entry.name)}</small>` : ''}</span></button>`).join('')}</div>
      </section>` : ''}
    </div>`;
}

function memberOptions(currentId, currentName = '', role = '') {
  const eligibleTypes = profile.authority?.[role];
  const active = profile.roster.filter(member => member.id === currentId || (member.status === 'Active' && (!eligibleTypes || eligibleTypes.includes(member.type)))).map(member => [member.id, member.name + (member.status === 'Inactive' ? ' (inactive)' : '')]);
  return [['', 'Open'], ...(currentName && !active.some(row => row[0] === currentId) ? [['legacy', currentName + ' (imported)']] : []), ...active];
}

function agendaPage() {
  const item = draft?.agenda.find(entry => entry.id === activeItem);
  const tools = `${buttons('format', 'Start from format…')}${buttons('add-item', 'Add speech', 'speech', 'primary')}${buttons('segments', 'Add segment…')}`;
  let edit = '<div class="empty">Select an agenda item to edit it.</div>';
  if (item) {
    const isSpeech = item.type === 'speech';
    const showsOwner = ['speech', 'debate', 'topics', 'custom'].includes(item.type);
    const ownerRole = isSpeech ? 'Speaker' : item.type === 'debate' ? 'Debate moderator' : labels[item.type];
    edit = `<div class="panel item-panel" data-item="${escape(item.id)}"><h3>${escape(labels[item.type])}</h3>${input(item.type === 'debate' ? 'Motion' : 'Title', 'title', item.title)}${showsOwner ? select(ownerRole, 'ownerId', memberOptions(item.ownerId, item.owner, ownerRole), item.ownerId || (item.owner ? 'legacy' : '')) : ''}${isSpeech ? select('Evaluator', 'evaluatorId', memberOptions(item.evaluatorId, item.evaluator, 'Evaluator'), item.evaluatorId || (item.evaluator ? 'legacy' : '')) + input('Pathways project', 'project', item.project) : ''}${input('Duration', 'duration', item.duration)}<label>Presenter cue<textarea name="notes" rows="2">${escape(item.notes)}</textarea></label><div class="actions"><div class="actions" role="group" aria-label="Reorder agenda item">${iconButton('move-item', 'Move up', 'up', '-1')}${iconButton('move-item', 'Move down', 'down', '1')}</div>${buttons('skip-item', item.included ? 'Skip segment' : 'Include segment')}${buttons('remove-item', 'Remove…', '', 'danger')}</div></div>`;
  }
  return `<div class="section-head"><div><h2>Meeting agenda</h2><p>${draft.agenda.filter(entry => entry.included).length} included items${draftChanged ? ' · Unsaved changes' : ''}</p></div><div class="actions">${tools}</div></div><div class="split"><div class="list-panel">${draft.agenda.map((entry, index) => `<button type="button" class="row-button${entry.id === activeItem ? ' current' : ''}" data-action="select-item" data-value="${escape(entry.id)}"><span class="row-count">${String(index + 1).padStart(2, '0')}</span><span><strong>${escape(entry.title || labels[entry.type])}</strong><small>${escape([labels[entry.type], entry.owner, entry.duration, entry.included ? '' : 'Skipped'].filter(Boolean).join(' · '))}</small></span></button>`).join('') || '<div class="empty">Add your first agenda item.</div>'}</div>${edit}</div><div class="form-actions">${buttons('reset-agenda', 'Discard changes')}${buttons('save-meeting', 'Save agenda', '', 'primary')}</div>`;
}

function rolesPage() {
  const list = standing.map(role => ({ role, name: draft.roles[role], id: `role:${role}` }));
  let speechNumber = 0;
  for (const item of draft.agenda.filter(entry => entry.included)) {
    if (item.type === 'speech') {
      speechNumber += 1;
      list.push({ role: `Speaker ${speechNumber}`, name: item.owner, id: `owner:${item.id}` }, { role: `Evaluator ${speechNumber}`, name: item.evaluator, id: `evaluator:${item.id}` });
    }
    if (item.type === 'debate') list.push({ role: 'Debate moderator', name: item.owner, id: `owner:${item.id}` });
  }
  const actions = `<div class="actions">${buttons('meeting-role-guide', 'Prepare to host', 'Toastmaster')}${buttons('open-only', openOnly ? 'Show all roles' : 'Show open only')}</div>`;
  const rows = list.filter(entry => !openOnly || !entry.name).map(entry => {
    const guideName = entry.role.replace(/^Speaker \d+$/, 'Prepared Speaker').replace(/^Evaluator \d+$/, 'Speech Evaluator').replace(/^Debate moderator$/, 'Debate Moderator');
    return `<tr><td>${buttons('meeting-role-guide', entry.role, guideName, 'role-guide-link')}</td><td>${entry.name ? escape(entry.name) : '<span class="tag">Open</span>'}</td><td>${buttons('assign', entry.name ? 'Change' : 'Assign', entry.id)}</td></tr>`;
  }).join('');
  return `<div class="section-head"><div><h2>Meeting roles</h2><p>${list.filter(entry => !entry.name).length} open role slots</p></div>${actions}</div><div class="table-wrap"><table><thead><tr><th>Role</th><th>Assigned to</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function hostPreparation() {
  const meeting = draft;
  const scheduled = meeting && !/no\s+meeting|^holiday$/i.test(meeting.event);
  const items = scheduled ? meeting.agenda.filter(item => item.included) : [];
  const types = new Set(items.map(item => item.type));
  const people = meeting?.roles || {};
  const assignments = { welcome: people.Chairperson, word: people['Word & Quote Master']?.trim() || people.Grammarian,
    topics: people.Topicsmaster, evaluations: people['General Evaluator'], closing: people.Chairperson };
  const missing = [];
  if (items.length) {
    const needed = ['Toastmaster'];
    if (types.has('welcome') || types.has('closing')) needed.push('Chairperson');
    if (types.has('evaluations')) needed.push('General Evaluator');
    if (['speech', 'topics', 'debate', 'evaluations'].some(type => types.has(type))) needed.push('Timer');
    for (const role of needed) if (!people[role]?.trim()) missing.push(role);
    if (types.has('word') && !assignments.word?.trim()) missing.push('Word and quote lead');
  }
  const runOfShow = items.map((item, index) => {
    const title = item.title?.trim() || (item.type === 'welcome' && meeting.theme) || labels[item.type];
    const owner = item.owner?.trim() || assignments[item.type]?.trim();
    const duration = item.duration?.trim();
    if (item.type === 'topics' && !owner) missing.push('Topicsmaster');
    if (item.type === 'debate' && !owner) missing.push(`Debate moderator for item ${index + 1}`);
    if (item.type === 'speech') {
      const fields = [['speaker', owner], ['evaluator', item.evaluator], ['speech title', item.title], ['project', item.project], ['time limit', duration]];
      const gaps = fields.filter(([, value]) => !value?.trim()).map(([label]) => label);
      if (gaps.length) missing.push(`Item ${index + 1} · ${title}: ${gaps.join(', ')}`);
    }
    const details = item.type === 'speech'
      ? [`Speaker: ${owner || 'Open'}`, `Evaluator: ${item.evaluator?.trim() || 'Open'}`, `Project: ${item.project?.trim() || 'To confirm'}`]
      : [owner];
    return `<li><div class="host-step"><strong>${escape(title)}</strong>${duration ? `<span class="host-time">${escape(duration)}</span>` : ''}</div>
      ${details.filter(Boolean).length ? `<p class="muted">${escape(details.filter(Boolean).join(' · '))}</p>` : ''}
      <p>${escape(item.notes?.trim() || hostCues[item.type] || hostCues.custom)}</p></li>`;
  }).join('');
  const context = meeting
    ? [`Meeting #${meeting.number}`, formatDate(meeting.date), meeting.theme].filter(Boolean).join(' · ')
    : 'No meeting selected';
  const status = !scheduled ? 'Select a scheduled meeting in Meetings to see its run of show.'
    : !items.length ? 'This meeting has no included agenda items. Build the agenda to see its run of show.'
      : draftChanged ? 'Showing unsaved agenda changes. Save the agenda before rehearsing the slides.' : '';
  return `<section class="host-context" aria-label="Selected meeting">
    <div><h3>${escape(context)}</h3>${people.Toastmaster ? `<p>Host on the roster · ${escape(people.Toastmaster)}</p>` : ''}${status ? `<p>${escape(status)}</p>` : ''}</div>
    <div class="actions">${meeting ? buttons('guide-meeting', 'Open agenda', 'Agenda', 'primary') + buttons('guide-meeting', 'Review roles', 'Roles') + buttons('guide-meeting', 'Open slides', 'Slides') : buttons('nav', 'Open Meetings', 'Meetings', 'primary')}</div>
  </section>
  <div class="host-prep">
    <section class="panel"><h3>What needs attention</h3>
      ${items.length ? `<p>${missing.length ? 'Fill these gaps in Roles or Agenda, then confirm assignments directly with each person.' : 'The tracked roles and speech fields are filled. Confirm availability and details directly with each person.'}</p>
        ${missing.length ? `<ul>${missing.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : ''}`
        : '<p>Open a meeting with an agenda to check assignments and speech details.</p>'}
    </section>
    <section class="panel"><h3>Before you host</h3><ol>
      <li>Agree on the theme, start and finish times, and agenda with the Vice President Education. Share the order with role takers and agree on backups with the General Evaluator.</li>
      <li>Ask each speaker for their name pronunciation, introduction, speech title, project objective, time limit, and any tech needs. Check that each evaluator has the project form and has spoken with their speaker.</li>
      <li>Write your opening and handoffs. Rehearse the saved deck, check the clicker and Timer signals, and agree on what can be shortened if you run late.</li>
      <li>Before the start, check who has arrived, confirm changes with the Chairperson and Timer, and tell the Topicsmaster which guests have volunteered.</li>
    </ol></section>
  </div>
  ${runOfShow ? `<section class="host-run"><h3>Run of show</h3><p class="muted">Use the selected meeting’s order and recorded time limits. A presenter cue in the agenda replaces the suggested cue for that item.</p><ol>${runOfShow}</ol></section>` : ''}
  <section><h3>Sample handoffs</h3>
    <p><strong>Opening.</strong> “Thank you, [Chairperson]. Welcome, everyone. Our theme is [theme]. We’ll start with [first segment], and I’ll explain each part as we go.”</p>
    <p><strong>Introducing a speech.</strong> “[Speaker] is working on [project] and will focus on [objective]. They have [time]. Please welcome [speaker] with ‘[title].’”</p>
    <p><strong>Handing over for evaluations.</strong> “Please take a moment to finish your written feedback. [Name], our General Evaluator, will lead the next part.”</p>
  </section>
  <section><h3>If the plan changes</h3><p>If someone is absent, confirm the backup with the General Evaluator and tell the Timer and the people affected. If the meeting runs long, shorten an optional segment before cutting into an announced speech or evaluation.</p></section>
  <section class="host-follow-up"><h3>After the meeting</h3><p>Ask the General Evaluator for one improvement to your hosting and pass any follow-up items to the Vice President Education.</p>
    ${buttons('host-script', 'Open Toastmasters script and log…', '', '', 'external')}</section>`;
}

function guideResults() {
  const terms = guideQuery.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const groups = roleGuide.map(([group, roles]) => [group, roles.filter(role => {
    const searchable = [group, ...role, role[0] === 'Toastmaster' ? 'host of the day run of show speaker introductions' : ''].join(' ').toLowerCase();
    return terms.every(term => searchable.includes(term));
  })]);
  const role = groups.flatMap(([, roles]) => roles).find(([name]) => name === guideRole)
    || groups.find(([, roles]) => roles.length)?.[1][0];
  if (!role) return { choices: '', detail: '<h2>No matching roles</h2><p class="role-summary muted">Try a role name or a duty such as timing.</p>' };
  const [name, summary, preparation, duties] = role;
  const group = groups.find(([, roles]) => roles.includes(role))[0];
  const choices = groups.filter(([, roles]) => roles.length).map(([label, roles]) => `<optgroup label="${escape(label)}">
    ${options(roles.map(([roleName]) => [roleName, roleName]), name)}
  </optgroup>`).join('');
  return { choices, detail: `<div class="eyebrow">${escape(group)}</div>
    <h2 id="role-title" tabindex="-1">${escape(name === 'Toastmaster' ? 'Toastmaster of the Day' : name)}</h2>
    <p class="role-summary">${escape(summary)}</p>
    ${name === 'Toastmaster' ? hostPreparation() : `<section><h3>Before the meeting</h3><p>${escape(preparation)}</p></section>
    <section><h3>During the meeting</h3><p>${escape(duties)}</p></section>`}` };
}

function roleGuidePage() {
  const { choices, detail } = guideResults();
  const back = guideFromMeeting ? buttons('nav', 'Back to meeting roles', 'Meetings') : '';
  return `${header('Meeting preparation', 'Role Guide', 'Find your role and see what to prepare for the meeting.', back)}
    <div class="role-guide">
      <div class="role-picker">
        <label>Find a role
          <input id="role-search" type="search" placeholder="Search by role or duty" value="${escape(guideQuery)}">
        </label>
        <label>Meeting role
          <select id="role-select"${choices ? '' : ' disabled'}>${choices || '<option>No matching roles</option>'}</select>
        </label>
      </div>
      <article id="role-detail" class="role-detail" aria-live="polite">${detail}</article>
    </div>`;
}

function updateGuide() {
  const { choices, detail } = guideResults();
  const picker = document.querySelector('#role-select');
  picker.innerHTML = choices || '<option>No matching roles</option>';
  picker.disabled = !choices;
  document.querySelector('#role-detail').innerHTML = detail;
}

function detailsPage(item) {
  return `<div class="panel"><h2>Meeting details</h2><dl class="details">${[['Date', formatDate(item.date)], ['Theme', item.theme], ['Theme question', item.question], ['Word of the day', item.word], ['Quote of the day', item.quote], ['Special event', item.event]].map(([label, value]) => `<dt>${label}</dt><dd>${escape(value || '—')}</dd>`).join('')}</dl></div>`;
}

function presenterPage(presentation) {
  const { deck: current, index, blank } = presentation;
  const slide = current?.slides[index];
  return `${header('Meeting #' + current.number, rehearsal ? 'Rehearsal' : 'Presenter view', rehearsal ? 'Preview the audience slide and rehearse each handoff.' : 'Audience display is live.', buttons('end-show', rehearsal ? 'End rehearsal' : 'End show…'))}<div class="presenter-grid"><div>${slideMarkup(slide, current.number, blank)}</div><aside class="panel cue"><div class="eyebrow">Private presenter cue</div><h2>${escape(slide?.name)}</h2><p>${escape(slide?.cue)}</p><hr><div class="eyebrow">Up next</div><p>${escape(current.slides[index + 1]?.title || 'End of meeting')}</p></aside></div><div class="preview-actions"><select id="jump-slide" aria-label="Go to slide">${options(current.slides.map((item, index) => [index, `${index + 1} · ${item.title}`]), index)}</select><div class="actions">${buttons('show-blank', blank ? 'Resume screen' : 'Blank screen')}${buttons('show-prev', 'Previous', '', '', 'previous')}${buttons('show-next', 'Next', '', 'primary', 'next')}</div></div>`;
}

function membersPage() {
  const roster = profile.roster.filter(member => member.name.toLowerCase().includes(filter.toLowerCase()) && (!memberStatus || member.status === memberStatus) && (!memberType || member.type === memberType)).sort((a, b) => a.name.localeCompare(b.name));
  return `${header('Club directory', 'Members', profile.google.roster ? `Roster · ${profile.google.roster.name}` : 'Roster stored on this desktop.', buttons('add-member', 'Add member', '', 'primary'))}<div class="filters"><input id="filter" aria-label="Search members" placeholder="Search members…" value="${escape(filter)}"><select id="member-status" aria-label="Member status">${options([['', 'All statuses'], ...arrayOptions(['Active', 'Inactive'])], memberStatus)}</select><select id="member-type" aria-label="Membership type">${options([['', 'All membership types'], ...arrayOptions(['Paid member', 'Guest', 'Honorary member'])], memberType)}</select></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Membership</th><th>Status</th><th>Actions</th></tr></thead><tbody>${roster.map(member => `<tr><td><strong>${escape(member.name)}</strong></td><td>${escape(member.type)}</td><td><span class="tag${member.status === 'Active' ? ' active-tag' : ''}">${escape(member.status)}</span></td><td><div class="actions">${buttons('edit-member', 'Edit', member.id)}${buttons('history', 'Role history', member.id)}${buttons('toggle-member', member.status === 'Active' ? 'Mark inactive' : 'Reactivate', member.id)}</div></td></tr>`).join('') || '<tr><td colspan="4">No matching members.</td></tr>'}</tbody></table></div>`;
}

function speechesPage() {
  const script = profile.scripts.find(entry => entry.id === scriptId);
  const list = profile.scripts.filter(entry => entry.title.toLowerCase().includes(filter.toLowerCase()));
  return `${header('Personal workspace', 'My speeches', 'Draft and revisit scripts in your desktop profile.', buttons('new-script', 'New script', '', 'primary'))}<div class="split"><div class="list-panel"><div class="list-filter"><input id="filter" aria-label="Search speeches" placeholder="Search speeches…" value="${escape(filter)}"></div>${list.map(entry => `<button class="row-button${entry.id === scriptId ? ' current' : ''}" data-action="script" data-value="${escape(entry.id)}"><span><strong>${escape(entry.title)}</strong><small>${escape(entry.status)}</small></span></button>`).join('') || '<div class="empty">No saved speeches.</div>'}</div><form id="speech-form" class="panel item-panel"><h2>${script ? escape(script.title) : 'New script'}</h2>${input('Title', 'title', script?.title)}${input('Pathways project', 'project', script?.project)}${input('Target time', 'duration', script?.duration)}${select('Status', 'status', arrayOptions(['Draft', 'Delivered']), script?.status || 'Draft')}<label>Script<textarea name="text" aria-label="Script" rows="10" placeholder="Start writing your speech…">${escape(script?.text)}</textarea></label><div class="actions">${script ? buttons('script-chat', 'Ask Assistant', script.id) : ''}<button class="primary" type="submit">Save script</button></div></form></div>`;
}

function modelMenu() {
  const codexChoices = [['', 'Codex default'], ...codexModels.map(entry => [entry.model, entry.displayName || entry.model])];
  const providers = [['codex', codexChoices], ['claude', claudeModels]];
  return providers.map(([provider, choices]) => `<div class="model-group">
    <h3>${engines[provider]}</h3>
    ${choices.map(([id, label]) => {
      const current = provider === engine && id === (chatModel || (engine === 'claude' ? 'default' : ''));
      return `<button type="button" data-action="choose-model" data-value="${escape(`${provider}:${id}`)}" aria-pressed="${current}">
        <span>${escape(label)}</span>${current ? iconMarkup('check') : ''}
      </button>`;
    }).join('')}
    ${provider === 'codex' && catalogStatus ? `<p class="model-status" role="status">${escape(catalogStatus)}</p>` : ''}
  </div>`).join('');
}

function modelPicker() {
  const entry = engine === 'codex' ? codexModels.find(item => item.model === chatModel) : null;
  const label = entry?.displayName || (engine === 'claude' ? claudeModels.find(([id]) => id === chatModel)?.[1] || 'Claude default' : chatModel || 'Codex default');
  const efforts = entry?.supportedReasoningEfforts || [];
  return `<div class="model-controls">
    <button id="model-trigger" class="has-icon" type="button" popovertarget="model-menu" aria-label="Choose model, ${escape(label)}"${streaming ? ' disabled' : ''}>${escape(label)}${iconMarkup('chevron')}</button>
    <div id="model-menu" popover aria-label="Language models">${modelMenu()}</div>
    ${efforts.length ? `<select id="model-effort" aria-label="Reasoning effort"${streaming ? ' disabled' : ''}>${options(efforts.map(({ reasoningEffort }) => [reasoningEffort, effortNames[reasoningEffort] || reasoningEffort]), chatEffort || entry.defaultReasoningEffort)}</select>` : ''}
  </div>`;
}

async function loadModelCatalog() {
  if (catalogLoaded || catalogStatus === 'Loading Codex models…') return;
  catalogStatus = 'Loading Codex models…';
  document.querySelector('#model-menu').innerHTML = modelMenu();
  try {
    codexModels = await invoke('chat:models');
    catalogLoaded = true;
    catalogStatus = codexModels.length ? '' : 'Codex returned no models.';
  } catch {
    catalogStatus = 'Model list unavailable. Check Codex in Settings.';
  }
  const menu = document.querySelector('#model-menu');
  if (menu) menu.innerHTML = modelMenu();
}

function assistantWorkspace() {
  const chat = profile.chats.find(entry => entry.id === activeChat);
  const context = [
    attachMeeting ? contextChip('attach-meeting', `Meeting #${currentMeeting()?.number || ''}`) : buttons('attach-meeting', 'Attach meeting'),
    attachScript ? contextChip('detach-script', 'Speech script') : '',
    attachPathways ? contextChip('detach-pathways', 'Pathways findings') : buttons('pathways-link', 'Open My Pathways'),
    buttons('allow-pathways', allowPathways ? `Pathways lookup on · ${pathwayBrowser}` : 'Allow Pathways lookup', '', allowPathways ? 'chip' : ''),
  ].join('');
  const conversations = profile.chats.map(entry => `
    <button class="row-button${entry.id === activeChat ? ' current' : ''}" data-action="chat" data-value="${escape(entry.id)}">
      <span><strong>${escape(entry.title)}</strong><small>${engines[entry.engine]}</small></span>
    </button>`).join('');
  const transcript = (chat?.messages || []).map((entry, index) => {
    const speaker = { user: 'You', error: 'Connection issue', assistant: engines[chat.engine] }[entry.role];
    const review = entry.role === 'assistant' && currentMeeting() ? buttons('review-draft', 'Review for slide…', index) : '';
    return `<article class="message ${entry.role}"><strong>${speaker}</strong><p>${escape(entry.text)}</p>${review}</article>`;
  }).join('');
  const reply = streaming && streaming.id === chat?.id ? `
    <article class="message assistant"><strong>${engines[chat.engine]}</strong>
      <p id="streamed-text">${escape(streaming.text || 'Waiting for reply…')}</p>
    </article>` : '';
  return `<div class="split assistant-workspace">
    <div class="list-panel">${conversations || '<div class="empty">Start a conversation.</div>'}</div>
    <section class="panel chat">
      <div class="preview-actions">
        <div class="actions">${context}</div>
      </div>
      <div class="messages" aria-live="polite">${transcript}${reply}</div>
      <form id="chat-form">
        <textarea name="message" aria-label="Message" placeholder="Ask about a meeting, draft a slide, or review your speech…" rows="3">${escape(sendText)}</textarea>
        <div class="composer-controls">${modelPicker()}${streaming ? buttons('stop-chat', 'Stop') : '<button type="submit" class="primary">Send</button>'}</div>
      </form>
    </section>
  </div>`;
}

function pathwaysPage() {
  return `${header('Member learning', 'My Pathways', 'Read your Base Camp progress and find project resources in your browser.')}<div class="filters"><select id="pathways-browser" aria-label="Pathways browser">${options(arrayOptions(['Chrome', 'Edge']), pathwayBrowser)}</select>${buttons('tmi-open', 'Open TMI / Sign in…', '', '', 'external')}${buttons('tmi-list', 'Load paths', '', 'primary')}</div><p class="status-line" aria-live="polite">${escape(working || pathStatus)}</p><div class="split"><div class="list-panel">${pathways.map(entry => `<button type="button" class="row-button${entry.name === activePath ? ' current' : ''}" data-action="tmi-path" data-value="${escape(entry.name)}"><span><strong>${escape(entry.name)}</strong><small>${escape(entry.status)}</small></span></button>`).join('') || '<div class="empty">No paths loaded.</div>'}</div><div class="panel item-panel"><h2>${escape(activePath || 'Path details')}</h2>${activePath ? `<div class="actions">${buttons('tmi-progress', 'Read progress')}${progress.length || resources.length ? buttons('attach-findings', 'Attach findings to Assistant') : ''}</div><ul class="progress-list">${progress.map(entry => `<li>${escape(entry)}</li>`).join('')}</ul><div class="filters"><input id="project-name" aria-label="Exact project title" value="${escape(project)}" placeholder="Exact project title…">${buttons('tmi-resources', 'Find project resources', '', 'primary')}</div>${resources.map(entry => `<div class="resource"><strong>${escape(entry.title)}</strong><div class="actions">${buttons('tmi-resource', 'Open in browser', entry.url, '', 'external')}${buttons('tmi-save', 'Save PDF…', entry.url)}</div></div>`).join('')}` : '<p class="muted">Choose a path to read its progress or look up a project.</p>'}</div></div>`;
}

function settingsPage() {
  return `${header('Desktop preferences', 'Settings', 'Set the appearance, connect club files, and configure the Assistant.')}<div class="settings-stack"><section class="panel"><div class="resource"><div><h2>Appearance</h2><p>System follows your desktop setting. Slides keep the club palette.</p></div><select id="appearance-theme" aria-label="Color theme">${options([['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], profile.theme || 'system')}</select></div></section><section class="panel"><div class="section-head"><div><h2>Google Drive &amp; Sheets</h2><p>${profile.googleConfigured ? 'Google desktop OAuth is configured.' : 'Set TM_GOOGLE_CLIENT_ID and TM_GOOGLE_CLIENT_SECRET in .env, then restart.'}</p></div>${Object.keys(profile.google).length ? buttons('disconnect', 'Disconnect Google') : ''}</div>${[['meeting', 'Meeting spreadsheet', 'Choose spreadsheet…'], ['roster', 'Member roster', 'Choose roster…'], ['folder', 'Slide images', 'Choose folder…']].map(([key, label, action]) => `<div class="resource"><div><strong>${label}</strong><p>${escape(profile.google[key]?.name || 'Not connected')}</p></div>${buttons('google-pick', action, key)}</div>`).join('')}<div class="resource"><div><strong>Excel import</strong><p>Load a local .xlsx copy for offline meeting setup.</p></div>${buttons('import', 'Import workbook…')}</div></section><section class="panel"><h2>Assistant engines</h2>${Object.entries(engines).map(([key, label]) => `<div class="resource"><div><strong>${label}</strong><p>${escape(cliStatus[key] || (key === 'claude' && !profile.claudeConfigured ? 'Provider credential needed' : 'Detect the installed CLI'))}</p></div>${buttons('detect', 'Detect CLI', key)}</div>`).join('')}</section></div>`;
}

function render() {
  if (!profile) return;
  document.documentElement.dataset.theme = profile.theme || 'system';
  const main = rehearsal && deck ? presenterPage({ deck, index: slideIndex, blank: rehearsal === 'blank' }) : showing ? presenterPage(showing) : { Meetings: meetingPage, 'Role Guide': roleGuidePage, Members: membersPage, 'My speeches': speechesPage, Pathways: pathwaysPage, Settings: settingsPage }[view]();
  root.innerHTML = `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-emblem" aria-hidden="true">D</span><div><strong>Dongtan</strong><small>TOASTMASTERS</small></div></div>
      <div class="sidebar-label">WORKSPACE</div>
      <nav aria-label="Workspace">${navigation.map(([name, icon]) => `<button type="button" data-action="nav" data-value="${name}" class="${view === name ? 'active-nav' : ''}"${view === name ? ' aria-current="page"' : ''}>${iconMarkup(icon)}${name}</button>`).join('')}</nav>
      <div class="sidebar-footer"><span class="status-dot"></span> Club Manager</div>
    </aside>
    <div class="workspace"><header class="workspace-bar"><span>${rehearsal || showing ? 'Presentation controls' : 'Club workspace'}</span></header><main>${main}</main></div>
  </div>`;
  root.querySelector('.workspace-bar').append(dock);
  renderChat();
}

function renderChat() {
  dock.hidden = false;
  const drawer = () => `<aside id="assistant-panel" class="assistant-drawer" aria-label="Assistant panel">
    <header><h2>Assistant</h2><div class="actions">${iconButton('new-chat', 'New conversation', 'compose')}${iconButton('close-dock', 'Close Assistant', 'close')}</div></header>
    ${assistantWorkspace()}
  </aside>`;
  dock.innerHTML = `<button type="button" class="has-icon assistant-launch" data-action="${chatOpen ? 'close-dock' : 'open-dock'}" aria-expanded="${chatOpen}"${chatOpen ? ' aria-controls="assistant-panel"' : ''}>${iconMarkup('chat')}${chatOpen ? 'Hide Assistant' : 'Open Assistant'}</button>${chatOpen ? drawer() : ''}`;
}

function switchView(name) { view = name; filter = ''; render(); }
function openChat() { chatOpen = true; renderChat(); document.querySelector('#chat-form textarea')?.focus(); }
function editItem() { return draft.agenda.find(entry => entry.id === activeItem); }
function replaceChat(item) { profile.chats = profile.chats.map(entry => entry.id === item.id ? item : entry); }

async function saveMeeting() {
  profile = await invoke('meeting:save', draft);
  draft = structuredClone(currentMeeting());
  draftChanged = false;
  await refreshDeck();
  render();
}

function guardChanges() {
  return !draftChanged || window.confirm('Discard unsaved agenda changes?');
}

async function newChat() {
  const chat = await invoke('chat:new', engine);
  profile.chats.unshift(chat);
  activeChat = chat.id;
  renderChat();
  return chat;
}

function memberDialog(id) {
  const member = profile.roster.find(entry => entry.id === id);
  showDialog(member ? 'Edit member' : 'Add member', input('Display name', 'name', member?.name) + select('Membership type', 'type', arrayOptions(['Paid member', 'Guest', 'Honorary member']), member?.type) + select('Status', 'status', arrayOptions(['Active', 'Inactive']), member?.status) + input('Join date', 'joined', member?.joined, 'date'), 'Save member', async data => {
    profile = await invoke('member:save', { id, ...data });
    render();
    message('Member saved.');
  });
}

function assignmentDialog(value) {
  const divider = value.indexOf(':');
  const kind = value.slice(0, divider);
  const id = value.slice(divider + 1);
  const item = kind === 'role' ? null : draft.agenda.find(entry => entry.id === id);
  const name = item ? item[kind] : draft.roles[id];
  const memberId = item ? item[`${kind}Id`] : draft.roleIds[id];
  const title = item ? (kind === 'evaluator' ? 'Evaluator' : item.type === 'debate' ? 'Debate moderator' : 'Speaker') : id;
  showDialog(`Assign ${title}`, select('Member', 'memberId', memberOptions(memberId, name, title), memberId || (name ? 'legacy' : '')), 'Save assignment', async form => {
    if (form.memberId !== 'legacy') {
      const member = profile.roster.find(entry => entry.id === form.memberId);
      if (item) { item[kind] = member?.name || ''; item[`${kind}Id`] = member?.id || ''; }
      else { draft.roles[id] = member?.name || ''; draft.roleIds[id] = member?.id || ''; }
    }
    await saveMeeting();
    message('Assignment saved.');
  });
}

async function chooseImage(action) {
  const slide = deck?.slides[slideIndex];
  const item = draft.agenda.find(entry => entry.id === slide?.id);
  if (!item) return;
  const chosen = action === 'clear-image' ? null : await invoke(action === 'drive-image' ? 'google:pick' : 'image:choose', action === 'drive-image' ? 'image' : undefined);
  if (action !== 'clear-image' && !chosen) return;
  if (!chosen) { item.image = null; await saveMeeting(); dialog.close(); return; }
  showDialog('Apply image to slide', `<p>${escape(chosen.name)}</p>${select('Image fit', 'fit', [['cover', 'Fill'], ['contain', 'Fit']], 'cover')}${input('Alt text', 'alt')}`, 'Apply to slide', async fields => {
    item.image = { ...chosen, ...fields };
    await saveMeeting();
  });
}

async function showControl(action) {
  if (!rehearsal) { showing = await invoke('show:control', action); render(); return; }
  if (action === 'end') rehearsal = false;
  if (action === 'blank') rehearsal = rehearsal === 'blank' ? true : 'blank';
  const index = action === 'next' ? slideIndex + 1 : action === 'previous' ? slideIndex - 1 : action;
  if (Number.isInteger(index)) slideIndex = Math.min(Math.max(0, index), deck.slides.length - 1);
  render();
}

async function pathwaysAction(action, value) {
  if (action === 'tmi-path') { activePath = value; progress = []; resources = []; project = ''; render(); return; }
  if (action === 'tmi-save') {
    const entry = resources.find(item => item.url === value);
    if (entry && await invoke('pathways:save', { browser: pathwayBrowser, ...entry })) message('PDF saved.');
    return;
  }
  if (action === 'tmi-resource') { await invoke('pathways:show', { browser: pathwayBrowser, url: value }); return; }
  if (working) return;
  working = 'Reading Toastmasters in the selected browser…';
  render();
  try {
    const args = { browser: pathwayBrowser, name: activePath, project: project.trim() };
    if (action === 'tmi-open') { await invoke('pathways:open', pathwayBrowser); pathStatus = 'Sign in in the browser, then return here and load your paths.'; }
    if (action === 'tmi-list') { pathways = await invoke('pathways:list', pathwayBrowser); activePath = pathways[0]?.name || ''; progress = []; resources = []; pathStatus = pathways.length ? 'Choose a path.' : 'No paths found in this account.'; }
    if (action === 'tmi-progress') { progress = await invoke('pathways:progress', args); pathStatus = progress.length ? 'Showing the project labels displayed by Base Camp.' : 'No progress labels were found for this path.'; }
    if (action === 'tmi-resources') { if (!args.project) throw new Error('Enter the exact project title.'); resources = await invoke('pathways:resources', args); pathStatus = resources.length ? 'Open a resource in your signed-in browser.' : 'No matching resource links were found.'; }
  } catch (error) { pathStatus = errorText(error); }
  finally { working = ''; render(); }
}

async function action(name, value) {
  switch (name) {
    case 'dismiss': dialog.close(); break;
    case 'open-dock': openChat(); break;
    case 'close-dock': chatOpen = false; renderChat(); dock.querySelector('button')?.focus(); break;
    case 'nav':
      if (!showing && !rehearsal) {
        if (value === 'Role Guide') guideFromMeeting = false;
        switchView(value);
      }
      break;
    case 'meeting-role-guide':
      guideRole = value || guideRole;
      guideQuery = '';
      guideFromMeeting = true;
      switchView('Role Guide');
      document.querySelector('#role-title')?.focus();
      break;
    case 'guide-meeting':
      tab = value;
      if (value === 'Roles') openOnly = false;
      switchView('Meetings');
      root.querySelector('.tabs button.selected')?.focus();
      break;
    case 'host-script': await invoke('guide:host-script'); break;
    case 'tab': tab = value; render(); break;
    case 'new-meeting': showDialog('New meeting', input('Date', 'date', '', 'date') + input('Meeting number', 'number') + input('Theme', 'theme'), 'Create meeting', async form => { const created = await invoke('meeting:new', form); profile = await invoke('profile'); await chooseMeeting(created.id); }); break;
    case 'refresh': if (guardChanges()) { await installProfile(await invoke('google:refresh')); message('Spreadsheet refreshed.'); } break;
    case 'slide': {
      const scrollTop = root.querySelector('.deck-list').scrollTop;
      slideIndex = Number(value);
      render();
      root.querySelector('.deck-list').scrollTop = scrollTop;
      root.querySelector('.deck-list [aria-current="true"]')?.focus({ preventScroll: true });
      break;
    }
    case 'format': showDialog('Start from format', select('Meeting format', 'format', arrayOptions(['Regular meeting', 'Speech marathon', 'Debate meeting']), 'Regular meeting') + '<p>This replaces the agenda draft for this meeting.</p>', 'Use format', async form => { draft.agenda = await invoke('agenda:format', form.format); activeItem = draft.agenda[0]?.id; draftChanged = true; render(); }); break;
    case 'segments': showDialog('Add agenda segment', select('Segment', 'segment', Object.entries(labels).filter(([key]) => key !== 'speech'), 'debate'), 'Add segment', form => action('add-item', form.segment)); break;
    case 'add-item': { const item = await invoke('agenda:item', value); draft.agenda.push(item); activeItem = item.id; draftChanged = true; render(); break; }
    case 'select-item': activeItem = value; render(); break;
    case 'skip-item': editItem().included = !editItem().included; draftChanged = true; render(); break;
    case 'move-item': {
      const index = draft.agenda.findIndex(item => item.id === activeItem);
      const next = index + Number(value);
      if (next < 0 || next >= draft.agenda.length) break;
      const [item] = draft.agenda.splice(index, 1);
      draft.agenda.splice(next, 0, item);
      draftChanged = true;
      render();
      root.querySelector(`[data-action="move-item"][data-value="${CSS.escape(value)}"]`)?.focus();
      break;
    }
    case 'remove-item': if (window.confirm('Remove this agenda item?')) { draft.agenda = draft.agenda.filter(item => item.id !== activeItem); activeItem = draft.agenda[0]?.id; draftChanged = true; render(); } break;
    case 'reset-agenda': await chooseMeeting(meetingId); break;
    case 'save-meeting': await saveMeeting(); message('Agenda saved.'); break;
    case 'open-only': openOnly = !openOnly; render(); break;
    case 'assign': assignmentDialog(value); break;
    case 'image': showDialog('Choose slide image', `<div class="actions">${buttons('upload-image', 'Choose from device…')}${buttons('drive-image', 'Choose from Google Drive…')}${buttons('clear-image', 'Use template image')}</div>`, 'Done', () => {}); break;
    case 'upload-image': case 'drive-image': case 'clear-image': await chooseImage(name); break;
    case 'rehearse': rehearsal = true; render(); break;
    case 'present': {
      const displays = await invoke('show:displays');
      showDialog('Present meeting', select('Audience display', 'display', displays.map((entry, index) => [String(entry.id), `${index + 1} · ${entry.label || (entry.primary ? 'Primary display' : 'External display')}`]), String(displays.find(entry => !entry.primary)?.id ?? displays[0]?.id)) + '<p>Use the arrow keys or a clicker to advance. Press Esc to end the show.</p>', 'Start presentation', async fields => { showing = await invoke('show:start', { id: meetingId, display: Number(fields.display), index: slideIndex }); render(); });
      break;
    }
    case 'export': { const saved = await invoke('meeting:export', meetingId); if (saved) message('PowerPoint saved.'); break; }
    case 'end-show': if (rehearsal || window.confirm('End the presentation?')) await showControl('end'); break;
    case 'show-prev': await showControl('previous'); break;
    case 'show-next': await showControl('next'); break;
    case 'show-blank': await showControl('blank'); break;
    case 'add-member': case 'edit-member': memberDialog(value || undefined); break;
    case 'toggle-member': { const member = profile.roster.find(entry => entry.id === value); const status = member.status === 'Active' ? 'Inactive' : 'Active'; if (window.confirm(`${status === 'Active' ? 'Reactivate' : 'Mark inactive'} ${member.name}?`)) { profile = await invoke('member:save', { ...member, status }); render(); message('Membership status updated.'); } break; }
    case 'history': {
      const member = profile.roster.find(entry => entry.id === value);
      const sameName = profile.roster.filter(entry => entry.name === member.name).length === 1;
      const matches = (id, label) => id === value || (!id && sameName && label === member.name);
      const records = profile.meetings.flatMap(entry => [...Object.keys(entry.roles).filter(role => matches(entry.roleIds[role], entry.roles[role])), ...entry.agenda.filter(item => item.included).flatMap(item => [matches(item.ownerId, item.owner) && labels[item.type], matches(item.evaluatorId, item.evaluator) && 'Evaluator'].filter(Boolean))].map(role => ({ role, meeting: entry })));
      showDialog(`${member.name} · Role history`, records.length ? records.map(record => `<div class="resource"><span>${escape(record.meeting.date)} · ${escape(record.role)}${record.meeting.date >= new Date().toISOString().slice(0, 10) && member.status === 'Inactive' ? ' · Review upcoming assignment' : ''}</span>${buttons('history-meeting', 'Open meeting', record.meeting.id)}</div>`).join('') : '<p>No linked roles found.</p>', 'Done', () => {});
      break;
    }
    case 'history-meeting': dialog.close(); tab = 'Roles'; switchView('Meetings'); await chooseMeeting(value); break;
    case 'new-script': case 'script': scriptId = value || undefined; render(); break;
    case 'script-chat': attachScript = value; openChat(); break;
    case 'new-chat': await newChat(); dock.querySelector('#chat-form textarea')?.focus(); break;
    case 'chat': {
      const chat = profile.chats.find(entry => entry.id === value);
      activeChat = chat.id;
      engine = chat.engine;
      chatModel = chat.model || '';
      chatEffort = chat.effort || '';
      renderChat();
      break;
    }
    case 'choose-model': {
      const separator = value.indexOf(':');
      const provider = value.slice(0, separator);
      const model = value.slice(separator + 1);
      if (engine !== provider) activeChat = undefined;
      if (engine !== provider || chatModel !== model) {
        chatEffort = provider === 'codex' ? codexModels.find(entry => entry.model === model)?.defaultReasoningEffort || '' : '';
      }
      engine = provider;
      chatModel = model;
      renderChat();
      document.querySelector('#model-trigger').focus();
      break;
    }
    case 'attach-meeting':
      attachMeeting = !attachMeeting;
      renderChat();
      dock.querySelector('[data-action="attach-meeting"]')?.focus();
      break;
    case 'detach-script':
      attachScript = undefined;
      renderChat();
      dock.querySelector('#chat-form textarea')?.focus();
      break;
    case 'detach-pathways':
      attachPathways = '';
      renderChat();
      dock.querySelector('[data-action="pathways-link"]')?.focus();
      break;
    case 'pathways-link': switchView('Pathways'); break;
    case 'allow-pathways':
      if (allowPathways) { allowPathways = false; renderChat(); break; }
      showDialog('Allow Pathways lookup', `<p>The selected assistant can read project progress and resource links from your signed-in ${escape(pathwayBrowser)} profile for the next message. These findings are sent to the selected model provider.</p>`, 'Allow for next message', () => { allowPathways = true; renderChat(); });
      break;
    case 'stop-chat': await invoke('chat:stop'); break;
    case 'review-draft': {
      const response = profile.chats.find(entry => entry.id === activeChat)?.messages[Number(value)];
      if (!response || !deck?.slides.length) return;
      showDialog('Review a slide draft', select('Slide', 'itemId', deck.slides.map(item => [item.id, item.title]), deck.slides[slideIndex]?.id) + `<label>Proposed slide title<textarea name="title" rows="4" maxlength="180">${escape(response.text.slice(0, 180))}</textarea></label>`, 'Apply to slide', async fields => { const item = draft.agenda.find(entry => entry.id === fields.itemId); item.title = fields.title.trim(); await saveMeeting(); message('Slide draft applied.'); });
      break;
    }
    case 'attach-findings': attachPathways = [activePath, ...progress, ...resources.map(entry => `${entry.title}: ${entry.url}`)].join('\n'); openChat(); break;
    case 'google-pick': if (guardChanges()) { message('Complete Google selection in your browser.'); await installProfile(await invoke('google:pick', value)); message('Google file connected.'); } break;
    case 'disconnect': if (guardChanges() && window.confirm('Disconnect Google from this desktop?')) await installProfile(await invoke('google:disconnect')); break;
    case 'import': if (guardChanges()) { const next = await invoke('workbook:import'); if (next) { await installProfile(next); message('Workbook imported.'); } } break;
    case 'detect': cliStatus[value] = await invoke('cli:detect', value); render(); break;
    default: if (name.startsWith('tmi-')) await pathwaysAction(name, value);
  }
}

if (new URLSearchParams(location.search).has('projection')) {
  document.body.classList.add('projection');
  const projectView = current => { root.innerHTML = current ? slideMarkup(current.deck.slides[current.index], current.deck.number, current.blank) : ''; };
  window.club.subscribe('show:update', projectView);
  invoke('show:current').then(projectView);
  window.addEventListener('keydown', event => {
    const command = { ArrowRight: 'next', PageDown: 'next', ' ': 'next', ArrowLeft: 'previous', PageUp: 'previous', Escape: 'end', b: 'blank' }[event.key];
    if (command) { event.preventDefault(); invoke('show:control', command); }
  });
} else {
  document.addEventListener('beforetoggle', event => {
    if (event.target.id === 'model-menu' && event.newState === 'open') void loadModelCatalog();
  }, true);
  document.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    button.disabled = true;
    try { await action(button.dataset.action, button.dataset.value); }
    catch (error) { message(errorText(error), true); }
    finally { button.disabled = false; }
  });
  document.addEventListener('input', event => {
    const target = event.target;
    if (target.closest('[data-item]') && target.name) {
      const item = editItem();
      if (target.name === 'ownerId' || target.name === 'evaluatorId') {
        if (target.value === 'legacy') return;
        item[target.name.slice(0, -2)] = profile.roster.find(entry => entry.id === target.value)?.name || '';
      }
      item[target.name] = target.value;
      draftChanged = true;
    }
    if (target.name === 'message') sendText = target.value;
    if (target.id === 'project-name') project = target.value;
    if (target.id === 'role-search') {
      guideQuery = target.value;
      updateGuide();
    }
    if (target.id === 'filter') {
      const position = target.selectionStart;
      filter = target.value;
      render();
      const replacement = document.querySelector('#filter');
      replacement.focus();
      replacement.setSelectionRange(position, position);
    }
  });
  document.addEventListener('change', async event => {
    const { id, value } = event.target;
    try {
      if (id === 'meeting-select') await chooseMeeting(value);
      if (id === 'jump-slide') await showControl(Number(value));
      if (id === 'pathways-browser') { pathwayBrowser = value; pathways = []; activePath = ''; progress = []; resources = []; pathStatus = 'Open TMI in your browser to sign in.'; render(); }
      if (id === 'member-status') { memberStatus = value; render(); }
      if (id === 'member-type') { memberType = value; render(); }
      if (id === 'role-select') { guideRole = value; updateGuide(); }
      if (id === 'model-effort') chatEffort = value;
      if (id === 'appearance-theme') { profile.theme = await invoke('appearance:theme', value); render(); document.querySelector('#appearance-theme').focus(); }
    } catch (error) { message(errorText(error), true); }
  });
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!['speech-form', 'chat-form'].includes(form.id)) return;
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form));
    try {
      if (form.id === 'speech-form') {
        const script = await invoke('script:save', { id: scriptId, ...fields });
        profile.scripts = [script, ...profile.scripts.filter(entry => entry.id !== script.id)];
        scriptId = script.id;
        render(); message('Speech saved.'); return;
      }
      if (streaming || !fields.message.trim()) return;
      const model = chatModel;
      const effort = chatEffort;
      const chat = profile.chats.find(entry => entry.id === activeChat) || await newChat();
      chat.messages.push({ role: 'user', text: fields.message });
      streaming = { id: chat.id, text: '' };
      const lookupBrowser = allowPathways ? pathwayBrowser : undefined;
      allowPathways = false;
      sendText = '';
      renderChat();
      try { replaceChat(await invoke('chat:send', { id: chat.id, message: fields.message, meetingId: attachMeeting ? meetingId : null, scriptId: attachScript, pathways: attachPathways, lookupBrowser, model, effort })); }
      catch (error) { chat.messages.push({ role: 'error', text: errorText(error) }); }
      finally { streaming = null; renderChat(); document.querySelector('.messages')?.lastElementChild?.scrollIntoView({ block: 'nearest' }); }
    } catch (error) { message(errorText(error), true); }
  });
  window.club.subscribe('show:update', current => { showing = current; render(); });
  window.club.subscribe('chat:delta', ({ id, delta }) => {
    if (streaming?.id !== id) return;
    streaming.text += delta;
    const output = document.querySelector('#streamed-text');
    if (output) { output.textContent = streaming.text; output.scrollIntoView({ block: 'nearest' }); }
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.querySelector('#model-menu:popover-open')) return;
    if (chatOpen && !dialog.open && event.key === 'Escape') { event.preventDefault(); action('close-dock'); return; }
    if (chatOpen && dock.contains(event.target)) return;
    if ((!rehearsal && !showing) || dialog.open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    const command = { ArrowRight: 'next', PageDown: 'next', ArrowLeft: 'previous', PageUp: 'previous', Escape: 'end', b: 'blank' }[event.key];
    if (command) { event.preventDefault(); showControl(command).catch(error => message(errorText(error), true)); }
  });
  invoke('profile').then(next => installProfile(next)).catch(error => message(errorText(error), true));
}

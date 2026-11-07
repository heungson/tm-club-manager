const { contextBridge, ipcRenderer } = require('electron');

const allowed = new Set([
  'profile', 'appearance:theme', 'agenda:format', 'agenda:item', 'meeting:new', 'meeting:save', 'meeting:preview', 'meeting:export',
  'workbook:import', 'google:pick', 'google:refresh', 'google:disconnect', 'image:choose', 'member:save', 'script:save',
  'cli:detect', 'chat:models', 'chat:new', 'chat:send', 'chat:stop', 'guide:host-script', 'pathways:open', 'pathways:list', 'pathways:progress',
  'pathways:resources', 'pathways:show', 'pathways:save', 'show:displays', 'show:start', 'show:current', 'show:control',
]);

contextBridge.exposeInMainWorld('club', {
  call(name, payload) {
    if (!allowed.has(name)) throw new Error('Unknown application action.');
    return ipcRenderer.invoke(name, payload);
  },
  subscribe(name, callback) {
    if (name !== 'show:update' && name !== 'chat:delta') throw new Error('Unknown application event.');
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on(name, listener);
    return () => ipcRenderer.removeListener(name, listener);
  },
});

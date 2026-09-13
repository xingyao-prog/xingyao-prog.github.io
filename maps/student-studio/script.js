const tools = [
  { id:'step-free', category:'access', icon:'♿', name:'Step-free route', prompt:'Connect arrival and destination without a separate detour.' },
  { id:'wayfinding', category:'access', icon:'🧭', name:'Predictable route', prompt:'Place clear cues at the exact point of decision.' },
  { id:'seating', category:'access', icon:'🪑', name:'Choice-based seating', prompt:'Support different bodies, companions, and ways of resting.' },
  { id:'quiet', category:'sensory', icon:'🔇', name:'Quiet recovery zone', prompt:'Make it possible to pause without leaving the experience.' },
  { id:'lighting', category:'sensory', icon:'◐', name:'Low-glare lighting', prompt:'Improve legibility without adding harsh sensory load.' },
  { id:'sound', category:'sensory', icon:'◒', name:'Sound-managed zone', prompt:'Reduce spill and support conversation or concentration.' },
  { id:'multisensory', category:'communication', icon:'◉', name:'Multi-sensory cue', prompt:'Pair visual information with audible or tactile information.' },
  { id:'plain-language', category:'communication', icon:'Aa', name:'Plain-language sign', prompt:'Make the next action understandable without insider knowledge.' },
  { id:'multilingual', category:'communication', icon:'文', name:'Multilingual information', prompt:'Extend welcome into essential, usable information.' },
  { id:'help', category:'service', icon:'?', name:'Low-barrier help point', prompt:'Make assistance visible without requiring identity disclosure.' },
  { id:'flexible-entry', category:'service', icon:'↔', name:'Flexible participation', prompt:'Offer equivalent ways to enter, wait, pause, or return.' },
  { id:'response', category:'service', icon:'✓', name:'Response protocol', prompt:'Clarify who responds, with what authority and resources.' }
];

const state = {
  stage:'evidence',
  category:'access',
  selectedTool:null,
  evidence:{},
  retest:{},
  markers:[],
  background:'sample'
};

const canvas = document.querySelector('[data-site-canvas]');
const markerLayer = document.querySelector('[data-placed-markers]');
const toolList = document.querySelector('[data-tool-list]');
const image = document.querySelector('[data-site-image]');
const sample = document.querySelector('[data-sample-plan]');
const imageInput = document.querySelector('#siteImageInput');

function setStage(stage) {
  state.stage = stage;
  document.querySelectorAll('[data-stage]').forEach((panel) => {
    const active = panel.dataset.stage === stage;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  document.querySelectorAll('[data-progress]').forEach((item) => item.classList.toggle('active', item.dataset.progress === stage));
  canvas.classList.toggle('ready', stage !== 'evidence');
  canvas.classList.toggle('tool-armed', stage === 'intervention' && Boolean(state.selectedTool));
}

function renderTools() {
  toolList.innerHTML = '';
  tools.filter((tool) => tool.category === state.category).forEach((tool) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `design-tool${state.selectedTool === tool.id ? ' active' : ''}`;
    button.dataset.tool = tool.id;
    button.setAttribute('aria-pressed', String(state.selectedTool === tool.id));
    button.innerHTML = `<i>${tool.icon}</i><span><b>${tool.name}</b><small>${tool.prompt}</small></span>`;
    toolList.append(button);
  });
}

function renderMarkers() {
  markerLayer.innerHTML = '';
  state.markers.forEach((marker, index) => {
    const tool = tools.find((item) => item.id === marker.toolId);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-marker';
    button.style.left = `${marker.x}%`;
    button.style.top = `${marker.y}%`;
    button.dataset.markerId = marker.id;
    button.dataset.category = tool.category;
    button.dataset.number = index + 1;
    button.title = `${tool.name} — click to remove`;
    button.setAttribute('aria-label', `${tool.name}. Click to remove.`);
    button.textContent = tool.icon;
    markerLayer.append(button);
  });
  document.querySelector('[data-marker-count]').textContent = state.markers.length;
  document.querySelector('[data-undo]').disabled = state.markers.length === 0;
  document.querySelector('[data-to-retest]').disabled = state.markers.length === 0;
  renderPlacedList();
}

function renderPlacedList() {
  const list = document.querySelector('[data-placed-list]');
  if (!state.markers.length) {
    list.innerHTML = '<p>Choose at least one intervention.</p>';
    return;
  }
  list.innerHTML = state.markers.map((marker, index) => {
    const tool = tools.find((item) => item.id === marker.toolId);
    return `<div class="placed-row"><span><b>${index + 1}</b> · ${tool.icon} ${tool.name}</span><button type="button" data-remove-marker="${marker.id}">Remove</button></div>`;
  }).join('');
}

function chooseTool(toolId) {
  state.selectedTool = toolId;
  const tool = tools.find((item) => item.id === toolId);
  renderTools();
  canvas.classList.add('tool-armed');
  document.querySelector('[data-canvas-status]').innerHTML = `<b class="change-tool">${tool.icon} ${tool.name}</b> selected — click the site, or focus it and press Enter.`;
}

function placeMarker(x, y) {
  if (state.stage !== 'intervention' || !state.selectedTool) return;
  state.markers.push({ id:String(Date.now() + Math.random()), toolId:state.selectedTool, x, y });
  const tool = tools.find((item) => item.id === state.selectedTool);
  document.querySelector('[data-canvas-status]').textContent = `${tool.name} placed. Add another intervention or plan the retest.`;
  renderMarkers();
}

document.querySelector('[data-stage="evidence"]').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.evidence = Object.fromEntries(data.entries());
  document.querySelector('[data-site-title]').textContent = state.evidence.place;
  document.querySelector('[data-question-summary]').textContent = state.evidence.question;
  document.querySelector('[data-canvas-status]').textContent = 'Choose an intervention, then click the site to place it.';
  setStage('intervention');
  renderTools();
});

document.querySelectorAll('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    state.category = button.dataset.category;
    state.selectedTool = null;
    document.querySelectorAll('[data-category]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    canvas.classList.remove('tool-armed');
    document.querySelector('[data-canvas-status]').textContent = 'Choose an intervention, then click the site to place it.';
    renderTools();
  });
});

toolList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-tool]');
  if (button) chooseTool(button.dataset.tool);
});

canvas.addEventListener('click', (event) => {
  if (event.target.closest('[data-marker-id]') || state.stage !== 'intervention' || !state.selectedTool) return;
  const bounds = canvas.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;
  placeMarker(x, y);
});

canvas.addEventListener('keydown', (event) => {
  if ((event.key !== 'Enter' && event.key !== ' ') || state.stage !== 'intervention' || !state.selectedTool) return;
  event.preventDefault();
  const slots = [[32,30],[52,30],[68,46],[38,62],[60,68],[78,64]];
  const [x,y] = slots[state.markers.length % slots.length];
  placeMarker(x, y);
});

markerLayer.addEventListener('click', (event) => {
  const marker = event.target.closest('[data-marker-id]');
  if (!marker || state.stage !== 'intervention') return;
  state.markers = state.markers.filter((item) => item.id !== marker.dataset.markerId);
  renderMarkers();
});

document.querySelector('[data-placed-list]').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-marker]');
  if (!button) return;
  state.markers = state.markers.filter((item) => item.id !== button.dataset.removeMarker);
  renderMarkers();
});

document.querySelector('[data-undo]').addEventListener('click', () => {
  state.markers.pop();
  renderMarkers();
});

document.querySelector('[data-to-retest]').addEventListener('click', () => {
  if (!state.markers.length) return;
  state.selectedTool = null;
  canvas.classList.remove('tool-armed');
  document.querySelector('[data-canvas-status]').textContent = 'Interventions mapped. Now define how the change will be tested.';
  setStage('retest');
});

document.querySelector('[data-edit-evidence]').addEventListener('click', () => setStage('evidence'));
document.querySelector('[data-back-design]').addEventListener('click', () => setStage('intervention'));
document.querySelector('[data-edit-retest]').addEventListener('click', () => setStage('retest'));

document.querySelector('[data-stage="retest"]').addEventListener('submit', (event) => {
  event.preventDefault();
  state.retest = Object.fromEntries(new FormData(event.currentTarget).entries());
  buildBrief();
  document.querySelector('[data-canvas-status]').textContent = 'Design brief ready to submit, discuss, or refine.';
  setStage('brief');
});

function interventionNames() {
  return state.markers.map((marker, index) => `${index + 1}. ${tools.find((item) => item.id === marker.toolId).name}`).join('; ');
}

function evidenceText() {
  return [state.evidence.voice ? `User voice: “${state.evidence.voice}”` : '', `Observation: ${state.evidence.observation}`].filter(Boolean).join(' ');
}

function retestText() {
  return `${state.retest.measure}; evaluated with ${state.retest.reviewer}. Improvement: ${state.retest.success}`;
}

function buildBrief() {
  document.querySelector('[data-brief-place]').textContent = state.evidence.place;
  document.querySelector('[data-brief-evidence]').textContent = evidenceText();
  document.querySelector('[data-brief-question]').textContent = state.evidence.question;
  document.querySelector('[data-brief-interventions]').textContent = interventionNames();
  document.querySelector('[data-brief-rationale]').textContent = state.retest.rationale;
  document.querySelector('[data-brief-retest]').textContent = retestText();
}

function briefText() {
  return [
    'INCLUMAP — ACCESSIBLE DESIGN BRIEF',
    `Place: ${state.evidence.place}`,
    `Evidence: ${evidenceText()}`,
    `Design question: ${state.evidence.question}`,
    `Interventions: ${interventionNames()}`,
    `Rationale: ${state.retest.rationale}`,
    `Retest: ${retestText()}`
  ].join('\n\n');
}

document.querySelector('[data-copy-brief]').addEventListener('click', async () => {
  const status = document.querySelector('[data-action-status]');
  try {
    await navigator.clipboard.writeText(briefText());
    status.textContent = 'Design brief copied.';
  } catch {
    status.textContent = 'Copy is unavailable here; use Print / Save PDF.';
  }
});

document.querySelector('[data-print-brief]').addEventListener('click', () => window.print());

imageInput.addEventListener('change', () => {
  const [file] = imageInput.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    image.src = reader.result;
    image.hidden = false;
    sample.hidden = true;
    state.background = 'upload';
  });
  reader.readAsDataURL(file);
});

document.querySelector('[data-use-sample]').addEventListener('click', () => {
  image.hidden = true;
  image.removeAttribute('src');
  imageInput.value = '';
  sample.hidden = false;
  state.background = 'sample';
});

document.querySelector('[data-new-project]').addEventListener('click', () => {
  if (!window.confirm('Start a new project? Current entries and markers will be cleared.')) return;
  state.stage = 'evidence';
  state.category = 'access';
  state.selectedTool = null;
  state.evidence = {};
  state.retest = {};
  state.markers = [];
  document.querySelectorAll('form').forEach((form) => form.reset());
  document.querySelector('[data-site-title]').textContent = 'Untitled place';
  document.querySelector('[data-action-status]').textContent = '';
  document.querySelectorAll('[data-category]').forEach((button) => {
    const active = button.dataset.category === 'access';
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelector('[data-use-sample]').click();
  document.querySelector('[data-canvas-status]').textContent = 'Evidence first. Design second.';
  renderMarkers();
  renderTools();
  setStage('evidence');
});

renderTools();
renderMarkers();
setStage('evidence');

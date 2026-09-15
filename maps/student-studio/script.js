const categories = [
  { id: 'access', label: 'Access', tools: [
    ['♿', 'Step-free route'], ['🛗', 'Elevator'], ['◢', 'Ramp / curb cut'], ['🦯', 'Tactile guidance'], ['🪑', 'Choice-based seating'], ['🧭', 'Predictable route'], ['🌐', 'Multilingual information'], ['🔔', 'Multi-sensory cue']
  ]},
  { id: 'care', label: 'Care', tools: [
    ['🚻', 'All-gender restroom'], ['👶', 'Changing facility'], ['🍼', 'Family / lactation room'], ['🎟️', 'Flexible participation'], ['🚰', 'Accessible water point']
  ]},
  { id: 'sensory', label: 'Sensory', tools: [
    ['🔇', 'Quiet recovery zone'], ['🎧', 'Sound-managed zone'], ['☀️', 'Low-glare zone']
  ]},
  { id: 'night', label: 'Night + Safety', tools: [
    ['💡', 'Night comfort route'], ['👁️', 'Clear sightlines'], ['📹', 'Safety camera'], ['🆘', 'Help point']
  ]},
  { id: 'service', label: 'Identity + Service', tools: [
    ['🌈', 'Visible allyship cue'], ['🪪', 'Optional pronoun cue'], ['🫶', 'Inclusive representation'], ['🎨', 'Community-created marker'], ['🗣️', 'Inclusive service practice'], ['📜', 'Code of conduct'], ['🤝', 'Response protocol']
  ]}
].map(category => ({
  ...category,
  tools: category.tools.map((tool, index) => ({ id: `${category.id}-${index}`, category: category.id, icon: tool[0], name: tool[1] }))
}));

const state = { category: 'access', selectedTool: null, selectedMarker: null, markers: [], imageUrl: null };
const allTools = categories.flatMap(category => category.tools);
const mapCanvas = document.getElementById('mapCanvas');
const mapImage = document.getElementById('mapImage');
const emptyMap = document.getElementById('emptyMap');
const markerLayer = document.getElementById('markerLayer');
const categoryTabs = document.getElementById('categoryTabs');
const toolList = document.getElementById('toolList');
const reasonEditor = document.getElementById('reasonEditor');
const markerReason = document.getElementById('markerReason');

function toolById(id) { return allTools.find(tool => tool.id === id); }
function markerById(id) { return state.markers.find(marker => marker.id === id); }
function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function renderCategories() {
  categoryTabs.innerHTML = '';
  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category.label;
    button.className = category.id === state.category ? 'active' : '';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(category.id === state.category));
    button.onclick = () => {
      state.category = category.id;
      state.selectedTool = null;
      renderCategories();
      renderTools();
      mapCanvas.classList.remove('tool-selected');
      updateStatus('Choose an intervention.');
    };
    categoryTabs.appendChild(button);
  });
}

function renderTools() {
  toolList.innerHTML = '';
  const category = categories.find(item => item.id === state.category);
  category.tools.forEach(tool => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `design-tool${state.selectedTool === tool.id ? ' active' : ''}`;
    button.setAttribute('aria-pressed', String(state.selectedTool === tool.id));
    button.innerHTML = `<i>${tool.icon}</i><b>${tool.name}</b>`;
    button.onclick = () => {
      state.selectedTool = state.selectedTool === tool.id ? null : tool.id;
      renderTools();
      mapCanvas.classList.toggle('tool-selected', Boolean(state.selectedTool));
      updateStatus(state.selectedTool ? `${tool.name} selected — click the map to place it.` : 'Choose an intervention.');
    };
    toolList.appendChild(button);
  });
}

function renderMarkers() {
  markerLayer.innerHTML = '';
  state.markers.forEach((marker, index) => {
    const tool = toolById(marker.toolId);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `map-marker${marker.id === state.selectedMarker ? ' active' : ''}`;
    button.style.left = `${marker.x}%`;
    button.style.top = `${marker.y}%`;
    button.dataset.number = String(index + 1);
    button.textContent = tool.icon;
    button.title = `${tool.name} — edit reason`;
    button.setAttribute('aria-label', `${tool.name}. Edit reason.`);
    button.onclick = event => { event.stopPropagation(); selectMarker(marker.id); };
    markerLayer.appendChild(button);
  });
  document.getElementById('markerCount').textContent = String(state.markers.length);
  document.getElementById('undo').disabled = state.markers.length === 0;
  document.getElementById('clearAll').disabled = state.markers.length === 0;
  renderPrintSummary();
  updateSubmissionState();
}

function selectMarker(id) {
  const marker = markerById(id);
  if (!marker) return;
  state.selectedMarker = id;
  const tool = toolById(marker.toolId);
  document.getElementById('selectedMarkerTitle').textContent = `${tool.icon} ${tool.name}`;
  markerReason.value = marker.reason;
  document.getElementById('saveStatus').textContent = marker.reason.trim() ? 'Saved automatically' : 'Reason required';
  reasonEditor.hidden = false;
  renderMarkers();
  markerReason.focus();
}

function placeMarker(event) {
  if (!state.imageUrl) { updateStatus('Upload a map or floor plan first.'); return; }
  if (!state.selectedTool) { updateStatus('Choose an intervention first.'); return; }
  if (event.target.closest('.map-marker')) return;
  const bounds = mapCanvas.getBoundingClientRect();
  const marker = {
    id: String(Date.now() + Math.random()),
    toolId: state.selectedTool,
    x: ((event.clientX - bounds.left) / bounds.width) * 100,
    y: ((event.clientY - bounds.top) / bounds.height) * 100,
    reason: ''
  };
  state.markers.push(marker);
  state.selectedTool = null;
  mapCanvas.classList.remove('tool-selected');
  renderTools();
  renderMarkers();
  selectMarker(marker.id);
  updateStatus('Intervention placed — add a brief reason.');
}

function updateStatus(message) { document.getElementById('mapStatus').textContent = message; }

function updateSubmissionState() {
  const complete = state.markers.length > 0 && state.markers.every(marker => marker.reason.trim());
  document.getElementById('printProject').disabled = !complete;
  document.getElementById('submissionHint').textContent = complete
    ? 'Ready to print or choose Save as PDF.'
    : 'Place an intervention and add a reason for each one.';
}

function renderPrintSummary() {
  const projectName = document.getElementById('projectName').value.trim() || 'Untitled experience';
  document.getElementById('printTitle').textContent = projectName;
  document.getElementById('printList').innerHTML = state.markers.map(marker => {
    const tool = toolById(marker.toolId);
    return `<li><b>${escapeHTML(tool.icon)} ${escapeHTML(tool.name)}</b><span>${escapeHTML(marker.reason.trim() || 'Reason not added.')}</span></li>`;
  }).join('');
}

document.getElementById('mapUpload').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = URL.createObjectURL(file);
  mapImage.src = state.imageUrl;
  mapImage.hidden = false;
  emptyMap.hidden = true;
  mapCanvas.classList.add('ready');
  document.getElementById('removeMap').hidden = false;
  if (!document.getElementById('projectName').value) document.getElementById('projectName').value = file.name.replace(/\.[^.]+$/, '');
  updateStatus('Choose an intervention, then click the map.');
  renderPrintSummary();
});

document.getElementById('removeMap').onclick = () => {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = null;
  mapImage.removeAttribute('src');
  mapImage.hidden = true;
  emptyMap.hidden = false;
  mapCanvas.classList.remove('ready', 'tool-selected');
  document.getElementById('mapUpload').value = '';
  document.getElementById('removeMap').hidden = true;
  state.markers = [];
  state.selectedMarker = null;
  state.selectedTool = null;
  reasonEditor.hidden = true;
  renderTools();
  renderMarkers();
  updateStatus('Upload an image to begin.');
};

mapCanvas.addEventListener('click', placeMarker);
mapCanvas.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && state.selectedTool && state.imageUrl) {
    event.preventDefault();
    const bounds = mapCanvas.getBoundingClientRect();
    placeMarker({ clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2, target: mapCanvas });
  }
});

markerReason.addEventListener('input', () => {
  const marker = markerById(state.selectedMarker);
  if (!marker) return;
  marker.reason = markerReason.value;
  document.getElementById('saveStatus').textContent = marker.reason.trim() ? 'Saved automatically' : 'Reason required';
  renderPrintSummary();
  updateSubmissionState();
});

document.getElementById('deleteMarker').onclick = () => {
  state.markers = state.markers.filter(marker => marker.id !== state.selectedMarker);
  state.selectedMarker = null;
  reasonEditor.hidden = true;
  renderMarkers();
  updateStatus('Intervention removed.');
};

document.getElementById('undo').onclick = () => {
  const removed = state.markers.pop();
  if (removed && removed.id === state.selectedMarker) {
    state.selectedMarker = null;
    reasonEditor.hidden = true;
  }
  renderMarkers();
  updateStatus('Last intervention removed.');
};

document.getElementById('clearAll').onclick = () => {
  state.markers = [];
  state.selectedMarker = null;
  reasonEditor.hidden = true;
  renderMarkers();
  updateStatus('All interventions cleared.');
};

document.getElementById('projectName').addEventListener('input', renderPrintSummary);
document.getElementById('printProject').onclick = () => { renderPrintSummary(); window.print(); };

renderCategories();
renderTools();
renderMarkers();

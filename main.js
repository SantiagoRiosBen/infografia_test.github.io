// main.js: carga de datos, filtros, navegación y tarjetas.
const state = {
  allData: [],
  filteredData: [],
  filters: { zona: '', tipo: '', rango_precio: '', query: '' }
};

const elements = {
  zona: document.getElementById('zona-filter'),
  tipo: document.getElementById('tipo-filter'),
  precio: document.getElementById('precio-filter'),
  search: document.getElementById('search-input'),
  clear: document.getElementById('clear-filters'),
  cards: document.getElementById('restaurant-cards'),
  count: document.getElementById('results-count'),
  empty: document.getElementById('no-results'),
  kpis: document.getElementById('kpi-grid')
};

const formatCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function cleanRow(row) {
  const precio = Number(row.precio_promedio);
  const cal = Number(row.calificacion);
  if (!row.nombre || !row.zona || !Number.isFinite(precio) || !Number.isFinite(cal)) return null;
  return {
    ...row,
    precio_promedio: precio,
    calificacion: cal,
    searchable: `${row.nombre} ${row.barrio}`.toLowerCase()
  };
}

function populateSelect(selectEl, values) {
  values.forEach(value => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
}

function buildFilters(data) {
  const zonas = [...new Set(data.map(d => d.zona))].sort(d3.ascending);
  const tipos = [...new Set(data.map(d => d.tipo))].sort(d3.ascending);
  const precios = [...new Set(data.map(d => d.rango_precio))].sort((a, b) => a.length - b.length);
  populateSelect(elements.zona, zonas);
  populateSelect(elements.tipo, tipos);
  populateSelect(elements.precio, precios);
}

function applyFilters() {
  const { zona, tipo, rango_precio, query } = state.filters;
  state.filteredData = state.allData.filter(d => {
    const zoneOk = !zona || d.zona === zona;
    const typeOk = !tipo || d.tipo === tipo;
    const priceOk = !rango_precio || d.rango_precio === rango_precio;
    const searchOk = !query || d.searchable.includes(query);
    return zoneOk && typeOk && priceOk && searchOk;
  });
  renderAll();
}

function renderKPIs(data) {
  const avgPrice = d3.mean(data, d => d.precio_promedio) || 0;
  const avgRating = d3.mean(data, d => d.calificacion) || 0;
  const zones = new Set(data.map(d => d.zona)).size;
  const cuisines = new Set(data.map(d => d.tipo)).size;
  const metrics = [
    { label: 'Restaurantes', value: data.length },
    { label: 'Precio promedio', value: formatCOP.format(avgPrice) },
    { label: 'Calificación media', value: avgRating.toFixed(2) },
    { label: 'Zonas representadas', value: zones },
    { label: 'Tipos de cocina', value: cuisines }
  ];
  elements.kpis.innerHTML = metrics.map(m => `<article class="kpi"><div class="kpi-value">${m.value}</div><div class="kpi-label">${m.label}</div></article>`).join('');
}

function renderCards(data) {
  elements.cards.innerHTML = data.map(d => `
    <article class="card">
      <h3>${d.nombre}</h3>
      <p><span class="badge">${d.zona}</span><span class="badge">${d.tipo}</span><span class="badge">${d.rango_precio}</span></p>
      <p class="meta">📍 ${d.barrio}</p>
      <p class="meta">💰 ${formatCOP.format(d.precio_promedio)} · ⭐ ${d.calificacion.toFixed(1)}</p>
      <p class="meta">${d.direccion}</p>
    </article>
  `).join('');
}

function renderAll() {
  const d = state.filteredData;
  elements.count.textContent = `${d.length} resultado(s) de ${state.allData.length} restaurantes.`;
  elements.empty.hidden = d.length !== 0;
  renderCards(d);
  renderKPIs(d.length ? d : state.allData);
  updateCharts(d.length ? d : state.allData);
}

function bindEvents() {
  elements.zona.addEventListener('change', e => { state.filters.zona = e.target.value; applyFilters(); });
  elements.tipo.addEventListener('change', e => { state.filters.tipo = e.target.value; applyFilters(); });
  elements.precio.addEventListener('change', e => { state.filters.rango_precio = e.target.value; applyFilters(); });
  elements.search.addEventListener('input', e => { state.filters.query = e.target.value.trim().toLowerCase(); applyFilters(); });
  elements.clear.addEventListener('click', () => {
    state.filters = { zona: '', tipo: '', rango_precio: '', query: '' };
    elements.zona.value = '';
    elements.tipo.value = '';
    elements.precio.value = '';
    elements.search.value = '';
    applyFilters();
  });

  const links = Array.from(document.querySelectorAll('.topbar nav a'));
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  }, { threshold: 0.45 });
  sections.forEach(s => observer.observe(s));

  window.addEventListener('resize', () => updateCharts(state.filteredData.length ? state.filteredData : state.allData));
}

async function init() {
  const rows = await d3.csv('data/restaurantes.csv');
  state.allData = rows.map(cleanRow).filter(Boolean);
  state.filteredData = [...state.allData];
  buildFilters(state.allData);
  bindEvents();
  renderAll();
}

init();

// charts.js: funciones exclusivas de visualización D3 reutilizables.
(function () {
  const colorByZone = d3.scaleOrdinal(d3.schemeTableau10);

  function formatCOP(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }

  function ensureTooltip(containerSelector) {
    const host = d3.select(containerSelector);
    let tooltip = host.select('.tooltip');
    if (tooltip.empty()) tooltip = host.append('div').attr('class', 'tooltip');
    return tooltip;
  }

  function baseSvg(selector, height = 380) {
    const container = d3.select(selector);
    container.select('svg').remove();
    const width = container.node().clientWidth || 720;
    const svg = container.append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
    return { svg, width, height };
  }

  function renderBarChart(data, selector) {
    const counts = Array.from(d3.rollup(data, v => v.length, d => d.tipo), ([tipo, total]) => ({ tipo, total }))
      .sort((a, b) => d3.descending(a.total, b.total)).slice(0, 10);

    const { svg, width, height } = baseSvg(selector);
    const margin = { top: 18, right: 15, bottom: 85, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(counts.map(d => d.tipo)).range([0, innerW]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(counts, d => d.total) || 1]).nice().range([innerH, 0]);
    const tooltip = ensureTooltip(selector);

    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x)).selectAll('text')
      .attr('transform', 'rotate(-28)').style('text-anchor', 'end').style('font-size', '11px');
    g.append('g').call(d3.axisLeft(y).ticks(5));

    g.selectAll('rect').data(counts, d => d.tipo).join('rect')
      .attr('x', d => x(d.tipo)).attr('width', x.bandwidth())
      .attr('y', innerH).attr('height', 0)
      .attr('fill', '#f97316')
      .on('mousemove', (event, d) => {
        tooltip.style('opacity', 1).style('left', `${event.offsetX}px`).style('top', `${event.offsetY}px`)
          .html(`<strong>${d.tipo}</strong><br>${d.total} restaurantes`);
      })
      .on('mouseleave', () => tooltip.style('opacity', 0))
      .transition().duration(700)
      .attr('y', d => y(d.total)).attr('height', d => innerH - y(d.total));
  }

  function renderZoneChart(data, selector) {
    const counts = Array.from(d3.rollup(data, v => v.length, d => d.zona), ([zona, total]) => ({ zona, total }))
      .sort((a, b) => d3.descending(a.total, b.total));
    const { svg, width, height } = baseSvg(selector);
    const radius = Math.min(width, height) / 2 - 26;
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);
    const pie = d3.pie().sort(null).value(d => d.total);
    const arc = d3.arc().innerRadius(radius * 0.52).outerRadius(radius);
    const tooltip = ensureTooltip(selector);

    g.selectAll('path').data(pie(counts)).join('path')
      .attr('fill', d => colorByZone(d.data.zona))
      .attr('stroke', '#fff').attr('stroke-width', 1.5)
      .on('mousemove', (event, d) => {
        tooltip.style('opacity', 1).style('left', `${event.offsetX}px`).style('top', `${event.offsetY}px`)
          .html(`<strong>${d.data.zona}</strong><br>${d.data.total} restaurantes`);
      })
      .on('mouseleave', () => tooltip.style('opacity', 0))
      .transition().duration(700)
      .attrTween('d', function (d) {
        const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
        return t => arc(i(t));
      });

    const legend = svg.append('g').attr('transform', 'translate(18,16)');
    counts.slice(0, 7).forEach((d, i) => {
      const row = legend.append('g').attr('transform', `translate(0,${i * 20})`);
      row.append('rect').attr('width', 11).attr('height', 11).attr('fill', colorByZone(d.zona));
      row.append('text').attr('x', 16).attr('y', 10).style('font-size', '12px').text(`${d.zona} (${d.total})`);
    });
  }

  function renderScatterPlot(data, selector) {
    const { svg, width, height } = baseSvg(selector, 400);
    const margin = { top: 20, right: 20, bottom: 45, left: 65 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain(d3.extent(data, d => d.precio_promedio)).nice().range([0, innerW]);
    const y = d3.scaleLinear().domain([3.6, d3.max(data, d => d.calificacion) || 5]).nice().range([innerH, 0]);
    const tooltip = ensureTooltip(selector);

    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(6).tickFormat(d => `$${(d / 1000).toFixed(0)}k`));
    g.append('g').call(d3.axisLeft(y).ticks(6));
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 38).attr('text-anchor', 'middle').text('Precio promedio');
    g.append('text').attr('x', -innerH / 2).attr('y', -45).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').text('Calificación');

    g.selectAll('circle').data(data, d => d.nombre).join('circle')
      .attr('cx', d => x(d.precio_promedio)).attr('cy', d => y(d.calificacion)).attr('r', 0)
      .attr('fill', d => colorByZone(d.zona)).attr('opacity', 0.85)
      .on('mousemove', (event, d) => {
        tooltip.style('opacity', 1).style('left', `${event.offsetX}px`).style('top', `${event.offsetY}px`)
          .html(`<strong>${d.nombre}</strong><br>${d.zona} · ${d.tipo}<br>${formatCOP(d.precio_promedio)} · ⭐ ${d.calificacion.toFixed(1)}`);
      })
      .on('mouseleave', () => tooltip.style('opacity', 0))
      .on('mouseenter', function () { d3.select(this).attr('stroke', '#111827').attr('stroke-width', 1.5); })
      .on('mouseout', function () { d3.select(this).attr('stroke', 'none'); })
      .transition().duration(550).attr('r', 6.5);
  }

  function updateCharts(filteredData) {
    renderZoneChart(filteredData, '#zone-chart');
    renderBarChart(filteredData, '#type-chart');
    renderScatterPlot(filteredData, '#scatter-chart');
  }

  window.renderBarChart = renderBarChart;
  window.renderScatterPlot = renderScatterPlot;
  window.renderZoneChart = renderZoneChart;
  window.updateCharts = updateCharts;
})();

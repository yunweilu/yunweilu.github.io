const layers = {
  academic_theory: {
    label: "Academic Theory",
    className: "academic-theory",
    swatchClass: "swatch-academic-theory",
  },
  academic_experiments: {
    label: "Academic Experiments",
    className: "academic-experiments",
    swatchClass: "swatch-academic-experiments",
  },
  industry: {
    label: "Industry",
    className: "industry",
    swatchClass: "swatch-industry",
  },
};

const layerOrder = Object.keys(layers);
let activeLayer = "academic_experiments";
let researchEntries = [];
let landFeature = null;
let selectedEntryId = null;
let currentZoomTransform = d3.zoomIdentity;

function activeEntries() {
  return researchEntries.filter((entry) => entry.layer === activeLayer);
}

function markerTooltip(entry) {
  return entry.marker_tooltip || {
    organization_name: entry.institution || entry.name,
    pi_name: entry.lead || "",
  };
}

function tooltipHtml(entry) {
  const tooltip = markerTooltip(entry);
  return [
    `<strong>${tooltip.organization_name}</strong>`,
    tooltip.pi_name ? `<div class="tooltip-pi">${tooltip.pi_name}</div>` : "",
  ].join("");
}

function renderFilters() {
  const container = document.getElementById("mapFilters");
  container.innerHTML = "";

  layerOrder.forEach((layer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-toggle";
    button.setAttribute("aria-pressed", String(activeLayer === layer));
    button.innerHTML = `<span class="filter-swatch ${layers[layer].swatchClass}"></span>${layers[layer].label}`;
    button.addEventListener("click", () => {
      activeLayer = layer;

      if (selectedEntryId && !activeEntries().some((entry) => entry.id === selectedEntryId)) {
        selectedEntryId = null;
      }

      render();
    });
    container.appendChild(button);
  });
}

function markerClass(entry) {
  return [
    "map-marker",
    `marker-${layers[entry.layer].className}`,
    selectedEntryId === entry.id ? "selected" : "",
  ].filter(Boolean).join(" ");
}

function markerRadius(entry) {
  if (entry.weight >= 3) {
    return 6.8;
  }

  if (entry.weight === 2) {
    return 5.8;
  }

  return 4.8;
}

function applyZoomTransform(viewport, transform) {
  viewport.attr("transform", transform);
  viewport.select(".continent-outline")
    .attr("stroke-width", 1.1 / transform.k);
  viewport.selectAll(".map-marker")
    .attr("r", (d) => markerRadius(d.entry) / transform.k)
    .attr("stroke-width", 1.8 / transform.k);
}

function bindZoomControls(svg, zoom) {
  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");
  const zoomReset = document.getElementById("zoomReset");

  zoomIn.onclick = () => {
    svg.transition().duration(180).call(zoom.scaleBy, 1.8);
  };
  zoomOut.onclick = () => {
    svg.transition().duration(180).call(zoom.scaleBy, 1 / 1.8);
  };
  zoomReset.onclick = () => {
    svg.transition().duration(180).call(zoom.transform, d3.zoomIdentity);
  };
}

function entriesWithOffsets(entries) {
  const buckets = new Map();

  entries.forEach((entry) => {
    const key = `${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}`;
    const bucket = buckets.get(key) || [];
    bucket.push(entry);
    buckets.set(key, bucket);
  });

  return entries.map((entry) => {
    const key = `${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}`;
    const bucket = buckets.get(key);
    const index = bucket.indexOf(entry);

    if (bucket.length === 1) {
      return { entry, offsetX: 0, offsetY: 0 };
    }

    const angle = (Math.PI * 2 * index) / bucket.length;
    const radius = 9;
    return {
      entry,
      offsetX: Math.cos(angle) * radius,
      offsetY: Math.sin(angle) * radius,
    };
  });
}

function renderMap() {
  const tooltip = document.getElementById("mapTooltip");
  const svg = d3.select("#worldMap");
  const width = 1200;
  const height = 650;
  svg.selectAll("*").remove();

  const projection = d3.geoNaturalEarth1();
  projection.fitExtent([[28, 36], [1172, 604]], landFeature);
  const path = d3.geoPath(projection);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent");

  const viewport = svg.append("g")
    .attr("class", "map-viewport");

  viewport.append("path")
    .datum(landFeature)
    .attr("class", "continent-land")
    .attr("d", path);

  viewport.append("path")
    .datum(landFeature)
    .attr("class", "continent-outline")
    .attr("d", path);

  const markerData = entriesWithOffsets(activeEntries())
    .map(({ entry, offsetX, offsetY }) => {
      const projected = projection([entry.longitude, entry.latitude]);
      return {
        entry,
        x: projected[0] + offsetX,
        y: projected[1] + offsetY,
      };
    });

  viewport.append("g")
    .selectAll("circle")
    .data(markerData)
    .join("circle")
    .attr("class", (d) => markerClass(d.entry))
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => markerRadius(d.entry))
    .attr("aria-label", (d) => {
      const tooltip = markerTooltip(d.entry);
      return tooltip.pi_name
        ? `${tooltip.organization_name}, ${tooltip.pi_name}`
        : tooltip.organization_name;
    })
    .attr("role", "button")
    .attr("tabindex", "0")
    .on("click", (event, d) => {
      selectedEntryId = d.entry.id;
      render();
    })
    .on("keydown", (event, d) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      selectedEntryId = d.entry.id;
      render();
    })
    .on("mousemove", (event, d) => {
      tooltip.hidden = false;
      tooltip.style.left = `${event.clientX + 14}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
      tooltip.innerHTML = tooltipHtml(d.entry);
    })
    .on("mouseleave", () => {
      tooltip.hidden = true;
    });

  const zoom = d3.zoom()
    .scaleExtent([1, 14])
    .extent([[0, 0], [width, height]])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", (event) => {
      currentZoomTransform = event.transform;
      applyZoomTransform(viewport, currentZoomTransform);
    });

  svg.call(zoom)
    .on("dblclick.zoom", null)
    .call(zoom.transform, currentZoomTransform);
  bindZoomControls(svg, zoom);
}

function renderPanel() {
  const panel = document.getElementById("detailsPanel");
  const entry = selectedEntryId
    ? researchEntries.find((candidate) => candidate.id === selectedEntryId)
    : null;

  if (!entry) {
    panel.innerHTML = '<div class="details-empty"><h2>Select a marker</h2><p>Hover over a marker to see the institution or company and PI name.</p></div>';
    return;
  }

  const tooltip = markerTooltip(entry);

  panel.innerHTML = `
    <div class="details-content">
      <div class="panel-heading">
        <div>
          <p class="tagline">${layers[entry.layer].label}</p>
          <h2>${tooltip.organization_name}</h2>
        </div>
        <button aria-label="Close marker details" class="panel-close" id="closePanel" type="button">x</button>
      </div>
      ${tooltip.pi_name ? `<p class="group-meta">${tooltip.pi_name}</p>` : ""}
    </div>
  `;

  document.getElementById("closePanel").addEventListener("click", () => {
    selectedEntryId = null;
    render();
  });
}

function renderSummary() {
  const entries = activeEntries();
  const uniqueLocations = new Set(
    entries.map((entry) => `${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}`),
  );
  document.getElementById("locationCount").textContent = String(uniqueLocations.size);
  document.getElementById("visibleEntryCount").textContent = String(entries.length);
}

function render() {
  renderFilters();
  renderMap();
  renderPanel();
  renderSummary();
}

Promise.all([
  fetch("../data/research_groups.json").then((response) => response.json()),
  fetch("../static/data/countries-50m.json").then((response) => response.json()),
])
  .then(([dataset, topology]) => {
    researchEntries = dataset.entries;
    const visibleGeometries = topology.objects.countries.geometries
      .filter((geometry) => geometry.properties.name !== "Antarctica");
    landFeature = {
      type: "Feature",
      properties: { name: "World land without Antarctica" },
      geometry: topojson.merge(topology, visibleGeometries),
    };
    document.getElementById("mapScope").textContent = dataset.metadata.scope;
    render();
  })
  .catch(() => {
    document.getElementById("mapScope").textContent = "Research map data could not be loaded.";
  });

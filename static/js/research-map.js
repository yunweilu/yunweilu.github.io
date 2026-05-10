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
const activeLayers = new Set(layerOrder);
let countries = {};
let topologyFeatures = [];
let selectedIso3 = null;

const iso3ToNumericId = {
  AUS: "036",
  AUT: "040",
  CAN: "124",
  CHE: "756",
  CHN: "156",
  DEU: "276",
  ESP: "724",
  FIN: "246",
  FRA: "250",
  GBR: "826",
  ISR: "376",
  ITA: "380",
  JPN: "392",
  KOR: "410",
  NLD: "528",
  SGP: "702",
  SWE: "752",
  USA: "840",
};

const numericIdToIso3 = Object.fromEntries(
  Object.entries(iso3ToNumericId).map(([iso3, id]) => [id, iso3]),
);

const labelOffsets = {
  AUT: [0, 7],
  CHE: [-10, 9],
  ESP: [-8, 8],
  FRA: [-8, -4],
  GBR: [-6, -10],
  ISR: [14, 2],
  ITA: [12, 12],
  JPN: [18, 8],
  KOR: [12, 0],
  NLD: [8, -10],
  SGP: [17, 8],
};

const smallLabelCountries = new Set(["AUT", "CHE", "ISR", "NLD", "SGP"]);

const atlasPalette = [
  "#9ce8f2",
  "#f7cfd2",
  "#f9e29d",
  "#cdeec4",
  "#ffd9a8",
  "#bde8ff",
  "#f5b8b0",
];

function emptyCounts() {
  return {
    academic_theory: 0,
    academic_experiments: 0,
    industry: 0,
  };
}

function aggregateByCountry(entries) {
  return entries.reduce((acc, group) => {
    if (!acc[group.iso3]) {
      acc[group.iso3] = {
        country: group.country,
        iso3: group.iso3,
        region: group.region,
        counts: emptyCounts(),
        groups: [],
        total: 0,
      };
    }

    acc[group.iso3].counts[group.layer] += 1;
    acc[group.iso3].groups.push(group);
    acc[group.iso3].total += 1;
    return acc;
  }, {});
}

function dominantLayer(country) {
  return layerOrder.reduce((dominant, layer) => {
    if (!activeLayers.has(layer) || country.counts[layer] === 0) {
      return dominant;
    }

    if (!dominant || country.counts[layer] > country.counts[dominant]) {
      return layer;
    }

    return dominant;
  }, null);
}

function maxForLayer(layer) {
  return Object.values(countries).reduce((max, country) => Math.max(max, country.counts[layer]), 0);
}

function intensity(count, maxCount) {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil((count / maxCount) * 5));
}

function activeTotal(country) {
  return layerOrder.reduce((sum, layer) => activeLayers.has(layer) ? sum + country.counts[layer] : sum, 0);
}

function renderFilters() {
  const container = document.getElementById("mapFilters");
  container.innerHTML = "";

  layerOrder.forEach((layer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-toggle";
    button.setAttribute("aria-pressed", String(activeLayers.has(layer)));
    button.innerHTML = `<span class="filter-swatch ${layers[layer].swatchClass}"></span>${layers[layer].label}`;
    button.addEventListener("click", () => {
      if (activeLayers.has(layer)) {
        activeLayers.delete(layer);
      } else {
        activeLayers.add(layer);
      }

      render();
    });
    container.appendChild(button);
  });
}

function countryClass(country) {
  if (!country) {
    return "map-country-base";
  }

  const layer = dominantLayer(country);
  if (!layer) {
    return "map-country has-data empty";
  }

  return [
    "map-country",
    "has-data",
    `layer-${layers[layer].className}`,
    `intensity-${intensity(country.counts[layer], maxForLayer(layer))}`,
    selectedIso3 === country.iso3 ? "selected" : "",
  ].filter(Boolean).join(" ");
}

function countryFill(feature, country) {
  if (country) {
    return null;
  }

  const index = Number(feature.id || 0) % atlasPalette.length;
  return atlasPalette[index];
}

function tooltipHtml(country) {
  return [
    `<strong>${country.country}</strong>`,
    ...layerOrder.map((layer) => `<div class="tooltip-row"><span>${layers[layer].label}</span><span>${country.counts[layer]}</span></div>`),
  ].join("");
}

function renderMap() {
  const tooltip = document.getElementById("mapTooltip");
  const svg = d3.select("#worldMap");
  const width = 1200;
  const height = 650;
  svg.selectAll("*").remove();

  const projection = d3.geoNaturalEarth1();
  projection.fitExtent([[28, 36], [1172, 604]], { type: "FeatureCollection", features: topologyFeatures });
  const path = d3.geoPath(projection);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent");

  svg.append("path")
    .datum(d3.geoGraticule10())
    .attr("class", "map-graticule")
    .attr("d", path);

  const oceanLabels = [
    { text: "ARCTIC OCEAN", coordinates: [-42, 76] },
    { text: "NORTH PACIFIC OCEAN", coordinates: [-151, 17] },
    { text: "NORTH PACIFIC OCEAN", coordinates: [160, 14] },
    { text: "SOUTH ATLANTIC OCEAN", coordinates: [-24, -38] },
    { text: "INDIAN OCEAN", coordinates: [78, -27] },
  ];

  svg.selectAll(".ocean-label")
    .data(oceanLabels)
    .join("text")
    .attr("class", "ocean-label")
    .attr("x", (d) => projection(d.coordinates)[0])
    .attr("y", (d) => projection(d.coordinates)[1])
    .selectAll("tspan")
    .data((d) => d.text.split(" "))
    .join("tspan")
    .attr("x", function () {
      return d3.select(this.parentNode).attr("x");
    })
    .attr("dy", (d, index) => index === 0 ? 0 : 19)
    .text((d) => d);

  svg.append("g")
    .selectAll("path")
    .data(topologyFeatures)
    .join("path")
    .attr("class", (feature) => {
      const iso3 = numericIdToIso3[feature.id];
      return countryClass(iso3 ? countries[iso3] : null);
    })
    .attr("fill", (feature) => {
      const iso3 = numericIdToIso3[feature.id];
      return countryFill(feature, iso3 ? countries[iso3] : null);
    })
    .attr("d", path)
    .attr("aria-label", (feature) => {
      const iso3 = numericIdToIso3[feature.id];
      const country = iso3 ? countries[iso3] : null;
      return `${country ? country.country : feature.properties.name} ${country ? `${country.total} entries` : "no entries"}`;
    })
    .attr("role", (feature) => numericIdToIso3[feature.id] ? "button" : "img")
    .attr("tabindex", (feature) => numericIdToIso3[feature.id] ? "0" : "-1")
    .on("click", (event, feature) => {
      const iso3 = numericIdToIso3[feature.id];
      if (!iso3 || !countries[iso3]) {
        return;
      }

      selectedIso3 = iso3;
      render();
    })
    .on("keydown", (event, feature) => {
      const iso3 = numericIdToIso3[feature.id];
      if (!iso3 || !countries[iso3] || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      event.preventDefault();
      selectedIso3 = iso3;
      render();
    })
    .on("mousemove", (event, feature) => {
      const iso3 = numericIdToIso3[feature.id];
      if (!iso3 || !countries[iso3]) {
        return;
      }

      tooltip.hidden = false;
      tooltip.style.left = `${event.clientX + 14}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
      tooltip.innerHTML = tooltipHtml(countries[iso3]);
    })
    .on("mouseleave", () => {
      tooltip.hidden = true;
    });

  const labeledFeatures = topologyFeatures
    .map((feature) => ({ feature, iso3: numericIdToIso3[feature.id] }))
    .filter((item) => item.iso3 && countries[item.iso3]);

  svg.append("g")
    .selectAll("text")
    .data(labeledFeatures)
    .join("text")
    .attr("class", (d) => `country-label${smallLabelCountries.has(d.iso3) ? " small-country" : ""}`)
    .attr("x", (d) => {
      const offset = labelOffsets[d.iso3] || [0, 0];
      return path.centroid(d.feature)[0] + offset[0];
    })
    .attr("y", (d) => {
      const offset = labelOffsets[d.iso3] || [0, 0];
      return path.centroid(d.feature)[1] + offset[1];
    })
    .text((d) => countries[d.iso3].country);
}

function renderPanel() {
  const panel = document.getElementById("detailsPanel");
  const country = selectedIso3 ? countries[selectedIso3] : null;

  if (!country) {
    panel.innerHTML = '<div class="details-empty"><h2>Select a country</h2><p>Hover over a highlighted country for counts, or click it to inspect the groups and companies represented in the dataset.</p></div>';
    return;
  }

  const visibleGroups = country.groups.filter((group) => activeLayers.has(group.layer));
  const groupItems = visibleGroups.map((group) => {
    const location = `${group.city}${group.state_province ? `, ${group.state_province}` : ""}`;
    const tags = [
      `<span class="group-tag">${layers[group.layer].label}</span>`,
      ...group.focus_tags.slice(0, 3).map((tag) => `<span class="group-tag">${tag}</span>`),
    ].join("");

    return `
      <li class="group-item">
        <h3>${group.name}</h3>
        <p class="group-meta">${group.institution}${group.lead ? ` - ${group.lead}` : ""}<br>${location}</p>
        <div class="group-tags">${tags}</div>
        ${group.source_url ? `<a class="group-link" href="${group.source_url}" rel="noreferrer" target="_blank">Source</a>` : ""}
      </li>
    `;
  }).join("");

  panel.innerHTML = `
    <div class="details-content">
      <div class="panel-heading">
        <div>
          <p class="tagline">${country.iso3}</p>
          <h2>${country.country}</h2>
        </div>
        <button aria-label="Close country details" class="panel-close" id="closePanel" type="button">x</button>
      </div>
      <div class="panel-counts">
        ${layerOrder.map((layer) => `<div class="panel-count"><strong>${country.counts[layer]}</strong><span>${layers[layer].label}</span></div>`).join("")}
      </div>
      <p>Showing ${visibleGroups.length} of ${country.groups.length} entries matching the active filters.</p>
      <ul class="group-list">${groupItems}</ul>
    </div>
  `;

  document.getElementById("closePanel").addEventListener("click", () => {
    selectedIso3 = null;
    render();
  });
}

function renderSummary() {
  const visibleEntries = Object.values(countries).reduce((sum, country) => sum + activeTotal(country), 0);
  document.getElementById("countryCount").textContent = String(Object.keys(countries).length);
  document.getElementById("visibleEntryCount").textContent = String(visibleEntries);
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
    countries = aggregateByCountry(dataset.entries);
    topologyFeatures = topojson.feature(topology, topology.objects.countries).features;
    document.getElementById("mapScope").textContent = dataset.metadata.scope;
    Object.values(countries).forEach((country) => {
      country.groups.sort((a, b) => a.name.localeCompare(b.name));
    });
    render();
  })
  .catch(() => {
    document.getElementById("mapScope").textContent = "Research map data could not be loaded.";
  });

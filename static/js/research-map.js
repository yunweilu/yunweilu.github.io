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
let selectedIso3 = null;

const continentBackdrops = [
  "M92 101 L344 72 L405 154 L351 246 L214 265 L102 205 Z",
  "M421 124 L579 111 L625 205 L559 307 L447 286 L390 206 Z",
  "M529 283 L614 318 L602 453 L517 485 L462 390 Z",
  "M621 143 L883 134 L949 254 L850 332 L670 292 Z",
  "M765 343 L904 362 L930 444 L850 484 L749 443 Z",
];

const countryShapes = [
  { iso3: "CAN", name: "Canada", path: "M111 98 L329 77 L365 143 L310 181 L158 183 L96 143 Z", label: [230, 130] },
  { iso3: "USA", name: "United States", path: "M153 190 L303 176 L337 224 L265 261 L176 240 Z", label: [245, 220] },
  { iso3: "GBR", name: "United Kingdom", path: "M443 164 L463 154 L477 177 L465 202 L443 193 Z", label: [460, 181] },
  { iso3: "NLD", name: "Netherlands", path: "M488 183 L502 179 L507 195 L493 200 Z", label: [498, 190] },
  { iso3: "DEU", name: "Germany", path: "M506 184 L532 184 L543 218 L520 232 L501 209 Z", label: [522, 207] },
  { iso3: "FRA", name: "France", path: "M470 209 L506 199 L526 232 L509 262 L471 250 L455 225 Z", label: [490, 233] },
  { iso3: "CHE", name: "Switzerland", path: "M513 239 L533 236 L541 250 L520 259 Z", label: [527, 249] },
  { iso3: "AUT", name: "Austria", path: "M538 230 L570 233 L573 249 L542 250 Z", label: [555, 242] },
  { iso3: "ESP", name: "Spain", path: "M428 254 L477 255 L493 292 L446 311 L415 285 Z", label: [456, 282] },
  { iso3: "ITA", name: "Italy", path: "M532 261 L555 268 L576 318 L558 331 L535 288 Z", label: [552, 298] },
  { iso3: "SWE", name: "Sweden", path: "M541 94 L575 106 L574 173 L548 194 L526 151 Z", label: [552, 142] },
  { iso3: "FIN", name: "Finland", path: "M582 96 L623 115 L618 173 L584 183 L575 124 Z", label: [600, 143] },
  { iso3: "ISR", name: "Israel", path: "M612 304 L624 309 L619 334 L608 326 Z", label: [616, 320] },
  { iso3: "CHN", name: "China", path: "M720 206 L834 188 L896 253 L858 315 L737 297 L693 244 Z", label: [795, 254] },
  { iso3: "KOR", name: "South Korea", path: "M886 251 L904 259 L902 283 L884 278 Z", label: [895, 269] },
  { iso3: "JPN", name: "Japan", path: "M918 214 L944 232 L934 288 L908 315 L895 303 L919 268 Z", label: [924, 264] },
  { iso3: "SGP", name: "Singapore", path: "M799 337 L815 337 L816 348 L800 349 Z", label: [808, 344] },
  { iso3: "AUS", name: "Australia", path: "M771 369 L899 361 L935 427 L884 478 L781 448 L744 404 Z", label: [842, 417] },
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
    return "map-country empty";
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

function tooltipHtml(country) {
  return [
    `<strong>${country.country}</strong>`,
    ...layerOrder.map((layer) => `<div class="tooltip-row"><span>${layers[layer].label}</span><span>${country.counts[layer]}</span></div>`),
  ].join("");
}

function renderMap() {
  const svg = document.getElementById("worldMap");
  const tooltip = document.getElementById("mapTooltip");
  svg.innerHTML = '<rect fill="#f8fbff" height="520" width="1000"></rect>';

  continentBackdrops.forEach((path) => {
    const backdrop = document.createElementNS("http://www.w3.org/2000/svg", "path");
    backdrop.setAttribute("class", "continent-backdrop");
    backdrop.setAttribute("d", path);
    svg.appendChild(backdrop);
  });

  countryShapes.forEach((shape) => {
    const country = countries[shape.iso3];
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", countryClass(country));
    path.setAttribute("d", shape.path);
    path.setAttribute("aria-label", `${shape.name} ${country ? `${country.total} entries` : "no entries"}`);

    if (country) {
      path.setAttribute("role", "button");
      path.setAttribute("tabindex", "0");
      path.addEventListener("click", () => {
        selectedIso3 = country.iso3;
        render();
      });
      path.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectedIso3 = country.iso3;
          render();
        }
      });
      path.addEventListener("mousemove", (event) => {
        tooltip.hidden = false;
        tooltip.style.left = `${event.clientX + 14}px`;
        tooltip.style.top = `${event.clientY + 14}px`;
        tooltip.innerHTML = tooltipHtml(country);
      });
      path.addEventListener("mouseleave", () => {
        tooltip.hidden = true;
      });
    }

    group.appendChild(path);

    if (country) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "country-label");
      label.setAttribute("x", shape.label[0]);
      label.setAttribute("y", shape.label[1]);
      label.textContent = shape.iso3;
      group.appendChild(label);
    }

    svg.appendChild(group);
  });
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

fetch("../data/research_groups.json")
  .then((response) => response.json())
  .then((dataset) => {
    countries = aggregateByCountry(dataset.entries);
    document.getElementById("mapScope").textContent = dataset.metadata.scope;
    Object.values(countries).forEach((country) => {
      country.groups.sort((a, b) => a.name.localeCompare(b.name));
    });
    render();
  })
  .catch(() => {
    document.getElementById("mapScope").textContent = "Research map data could not be loaded.";
  });

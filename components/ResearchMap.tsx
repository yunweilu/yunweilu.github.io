"use client";

import { useMemo, useState } from "react";
import CountryDetailsPanel from "./CountryDetailsPanel";
import MapFilters from "./MapFilters";

export const LAYERS = {
  academic_theory: {
    label: "Academic Theory",
    className: "academic-theory",
  },
  academic_experiments: {
    label: "Academic Experiments",
    className: "academic-experiments",
  },
  industry: {
    label: "Industry",
    className: "industry",
  },
} as const;

export type LayerKey = keyof typeof LAYERS;
export type LayerMeta = (typeof LAYERS)[LayerKey];

export type ResearchGroup = {
  id: string;
  name: string;
  lead: string;
  layer: LayerKey;
  category: string;
  subcategory: string;
  org_type: string;
  institution: string;
  city: string;
  state_province: string;
  country: string;
  iso3: string;
  region: string;
  latitude: number;
  longitude: number;
  focus_tags: string[];
  weight: number;
  source_url: string;
  notes: string;
};

export type ResearchDataset = {
  metadata: {
    title: string;
    generated_at: string;
    scope: string;
  };
  entries: ResearchGroup[];
};

export type CountryAggregate = {
  country: string;
  iso3: string;
  region: string;
  counts: Record<LayerKey, number>;
  groups: ResearchGroup[];
  total: number;
};

type ResearchMapProps = {
  dataset: ResearchDataset;
};

type CountryShape = {
  iso3: string;
  name: string;
  path: string;
  label: [number, number];
};

const layerOrder = Object.keys(LAYERS) as LayerKey[];

const continentBackdrops = [
  "M92 101 L344 72 L405 154 L351 246 L214 265 L102 205 Z",
  "M421 124 L579 111 L625 205 L559 307 L447 286 L390 206 Z",
  "M529 283 L614 318 L602 453 L517 485 L462 390 Z",
  "M621 143 L883 134 L949 254 L850 332 L670 292 Z",
  "M765 343 L904 362 L930 444 L850 484 L749 443 Z",
];

const countryShapes: CountryShape[] = [
  {
    iso3: "CAN",
    name: "Canada",
    path: "M111 98 L329 77 L365 143 L310 181 L158 183 L96 143 Z",
    label: [230, 130],
  },
  {
    iso3: "USA",
    name: "United States",
    path: "M153 190 L303 176 L337 224 L265 261 L176 240 Z",
    label: [245, 220],
  },
  {
    iso3: "GBR",
    name: "United Kingdom",
    path: "M443 164 L463 154 L477 177 L465 202 L443 193 Z",
    label: [460, 181],
  },
  {
    iso3: "NLD",
    name: "Netherlands",
    path: "M488 183 L502 179 L507 195 L493 200 Z",
    label: [498, 190],
  },
  {
    iso3: "DEU",
    name: "Germany",
    path: "M506 184 L532 184 L543 218 L520 232 L501 209 Z",
    label: [522, 207],
  },
  {
    iso3: "FRA",
    name: "France",
    path: "M470 209 L506 199 L526 232 L509 262 L471 250 L455 225 Z",
    label: [490, 233],
  },
  {
    iso3: "CHE",
    name: "Switzerland",
    path: "M513 239 L533 236 L541 250 L520 259 Z",
    label: [527, 249],
  },
  {
    iso3: "AUT",
    name: "Austria",
    path: "M538 230 L570 233 L573 249 L542 250 Z",
    label: [555, 242],
  },
  {
    iso3: "ESP",
    name: "Spain",
    path: "M428 254 L477 255 L493 292 L446 311 L415 285 Z",
    label: [456, 282],
  },
  {
    iso3: "ITA",
    name: "Italy",
    path: "M532 261 L555 268 L576 318 L558 331 L535 288 Z",
    label: [552, 298],
  },
  {
    iso3: "SWE",
    name: "Sweden",
    path: "M541 94 L575 106 L574 173 L548 194 L526 151 Z",
    label: [552, 142],
  },
  {
    iso3: "FIN",
    name: "Finland",
    path: "M582 96 L623 115 L618 173 L584 183 L575 124 Z",
    label: [600, 143],
  },
  {
    iso3: "ISR",
    name: "Israel",
    path: "M612 304 L624 309 L619 334 L608 326 Z",
    label: [616, 320],
  },
  {
    iso3: "CHN",
    name: "China",
    path: "M720 206 L834 188 L896 253 L858 315 L737 297 L693 244 Z",
    label: [795, 254],
  },
  {
    iso3: "KOR",
    name: "South Korea",
    path: "M886 251 L904 259 L902 283 L884 278 Z",
    label: [895, 269],
  },
  {
    iso3: "JPN",
    name: "Japan",
    path: "M918 214 L944 232 L934 288 L908 315 L895 303 L919 268 Z",
    label: [924, 264],
  },
  {
    iso3: "SGP",
    name: "Singapore",
    path: "M799 337 L815 337 L816 348 L800 349 Z",
    label: [808, 344],
  },
  {
    iso3: "AUS",
    name: "Australia",
    path: "M771 369 L899 361 L935 427 L884 478 L781 448 L744 404 Z",
    label: [842, 417],
  },
];

const emptyCounts = (): Record<LayerKey, number> => ({
  academic_theory: 0,
  academic_experiments: 0,
  industry: 0,
});

function aggregateByCountry(entries: ResearchGroup[]) {
  const aggregates: Record<string, CountryAggregate> = {};

  entries.forEach((group) => {
    if (!aggregates[group.iso3]) {
      aggregates[group.iso3] = {
        country: group.country,
        iso3: group.iso3,
        region: group.region,
        counts: emptyCounts(),
        groups: [],
        total: 0,
      };
    }

    aggregates[group.iso3].counts[group.layer] += 1;
    aggregates[group.iso3].groups.push(group);
    aggregates[group.iso3].total += 1;
  });

  Object.values(aggregates).forEach((country) => {
    country.groups.sort((a, b) => {
      if (a.layer !== b.layer) {
        return layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer);
      }

      return a.name.localeCompare(b.name);
    });
  });

  return aggregates;
}

function getDominantLayer(country: CountryAggregate, activeLayers: LayerKey[]) {
  return activeLayers.reduce<LayerKey | null>((dominant, layer) => {
    if (!dominant || country.counts[layer] > country.counts[dominant]) {
      return country.counts[layer] > 0 ? layer : dominant;
    }

    return dominant;
  }, null);
}

function getIntensity(count: number, maxCount: number) {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil((count / maxCount) * 5));
}

function getActiveTotal(country: CountryAggregate, activeLayers: LayerKey[]) {
  return activeLayers.reduce((sum, layer) => sum + country.counts[layer], 0);
}

export default function ResearchMap({ dataset }: ResearchMapProps) {
  const [activeLayers, setActiveLayers] = useState<LayerKey[]>(layerOrder);
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    country: CountryAggregate;
    x: number;
    y: number;
  } | null>(null);

  const countries = useMemo(() => aggregateByCountry(dataset.entries), [dataset.entries]);
  const selectedCountry = selectedIso3 ? countries[selectedIso3] ?? null : null;

  const maxByLayer = useMemo(() => {
    const maxCounts = emptyCounts();

    Object.values(countries).forEach((country) => {
      layerOrder.forEach((layer) => {
        maxCounts[layer] = Math.max(maxCounts[layer], country.counts[layer]);
      });
    });

    return maxCounts;
  }, [countries]);

  const totalVisibleEntries = Object.values(countries).reduce(
    (sum, country) => sum + getActiveTotal(country, activeLayers),
    0,
  );

  function toggleLayer(layer: LayerKey) {
    setActiveLayers((current) =>
      current.includes(layer) ? current.filter((item) => item !== layer) : [...current, layer],
    );
  }

  function getCountryClass(country: CountryAggregate | undefined) {
    if (!country) {
      return "map-country empty";
    }

    const dominantLayer = getDominantLayer(country, activeLayers);

    if (!dominantLayer) {
      return "map-country has-data empty";
    }

    const intensity = getIntensity(country.counts[dominantLayer], maxByLayer[dominantLayer]);

    return [
      "map-country",
      "has-data",
      `layer-${LAYERS[dominantLayer].className}`,
      `intensity-${intensity}`,
      selectedIso3 === country.iso3 ? "selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <section className="research-map-shell">
      <div className="map-workspace">
        <div className="map-header">
          <div>
            <p className="eyebrow">Superconducting Qubits</p>
            <h1>Research Map</h1>
            <p>{dataset.metadata.scope}</p>
          </div>
          <div className="map-summary" aria-label="Map summary">
            <div className="summary-pill">
              <strong>{Object.keys(countries).length}</strong>
              <span>Countries</span>
            </div>
            <div className="summary-pill">
              <strong>{totalVisibleEntries}</strong>
              <span>Visible Entries</span>
            </div>
          </div>
        </div>

        <div className="map-control-row">
          <MapFilters activeLayers={activeLayers} layers={LAYERS} onToggleLayer={toggleLayer} />
        </div>

        <div className="map-card">
          <svg
            aria-label="World choropleth map of superconducting-qubit research groups"
            className="world-map"
            role="img"
            viewBox="0 0 1000 520"
          >
            <rect fill="#f8fbff" height="520" width="1000" />
            {continentBackdrops.map((path) => (
              <path className="continent-backdrop" d={path} key={path} />
            ))}
            {countryShapes.map((shape) => {
              const country = countries[shape.iso3];

              return (
                <g key={shape.iso3}>
                  <path
                    aria-label={`${shape.name} ${country ? `${country.total} entries` : "no entries"}`}
                    className={getCountryClass(country)}
                    d={shape.path}
                    onClick={() => country && setSelectedIso3(country.iso3)}
                    onMouseLeave={() => setTooltip(null)}
                    onMouseMove={(event) => {
                      if (!country) {
                        return;
                      }

                      setTooltip({
                        country,
                        x: event.clientX + 14,
                        y: event.clientY + 14,
                      });
                    }}
                    role={country ? "button" : "img"}
                    tabIndex={country ? 0 : -1}
                    onKeyDown={(event) => {
                      if (country && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        setSelectedIso3(country.iso3);
                      }
                    }}
                  />
                  {country ? (
                    <text className="country-label" x={shape.label[0]} y={shape.label[1]}>
                      {shape.iso3}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

          {tooltip ? (
            <div className="map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
              <strong>{tooltip.country.country}</strong>
              {(Object.keys(LAYERS) as LayerKey[]).map((layer) => (
                <div className="tooltip-row" key={layer}>
                  <span>{LAYERS[layer].label}</span>
                  <span>{tooltip.country.counts[layer]}</span>
                </div>
              ))}
            </div>
          ) : null}

        </div>
      </div>

      <CountryDetailsPanel
        activeLayers={activeLayers}
        country={selectedCountry}
        layers={LAYERS}
        onClose={() => setSelectedIso3(null)}
      />
    </section>
  );
}

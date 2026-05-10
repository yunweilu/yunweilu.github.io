import type { CountryAggregate, LayerKey, LayerMeta } from "./ResearchMap";

type CountryDetailsPanelProps = {
  activeLayers: LayerKey[];
  country: CountryAggregate | null;
  layers: Record<LayerKey, LayerMeta>;
  onClose: () => void;
};

export default function CountryDetailsPanel({
  activeLayers,
  country,
  layers,
  onClose,
}: CountryDetailsPanelProps) {
  if (!country) {
    return (
      <aside className="details-panel" aria-label="Country details">
        <div className="details-empty">
          <h2>Select a country</h2>
          <p>
            Hover over a highlighted country for counts, or click it to inspect the
            groups and companies represented in the dataset.
          </p>
        </div>
      </aside>
    );
  }

  const visibleGroups = country.groups.filter((group) => activeLayers.includes(group.layer));

  return (
    <aside className="details-panel" aria-label={`${country.country} research groups`}>
      <div className="details-content">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{country.iso3}</p>
            <h2>{country.country}</h2>
          </div>
          <button aria-label="Close country details" className="panel-close" onClick={onClose} type="button">
            x
          </button>
        </div>

        <div className="panel-counts">
          {(Object.keys(layers) as LayerKey[]).map((layer) => (
            <div className="panel-count" key={layer}>
              <strong>{country.counts[layer]}</strong>
              <span>{layers[layer].label}</span>
            </div>
          ))}
        </div>

        <p>
          Showing {visibleGroups.length} of {country.groups.length} entries matching
          the active filters.
        </p>

        <ul className="group-list">
          {visibleGroups.map((group) => (
            <li className="group-item" key={group.id}>
              <h3>{group.name}</h3>
              <p className="group-meta">
                {group.institution}
                {group.lead ? ` - ${group.lead}` : ""}
                <br />
                {group.city}
                {group.state_province ? `, ${group.state_province}` : ""}
              </p>
              <div className="group-tags">
                <span className="group-tag">{layers[group.layer].label}</span>
                {group.focus_tags.slice(0, 3).map((tag) => (
                  <span className="group-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              {group.source_url ? (
                <a className="group-link" href={group.source_url} rel="noreferrer" target="_blank">
                  Source
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

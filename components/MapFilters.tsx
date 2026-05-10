import type { LayerKey, LayerMeta } from "./ResearchMap";

type MapFiltersProps = {
  activeLayers: LayerKey[];
  layers: Record<LayerKey, LayerMeta>;
  onToggleLayer: (layer: LayerKey) => void;
};

export default function MapFilters({ activeLayers, layers, onToggleLayer }: MapFiltersProps) {
  return (
    <div className="map-filters" aria-label="Research category filters">
      {(Object.keys(layers) as LayerKey[]).map((layer) => {
        const isActive = activeLayers.includes(layer);

        return (
          <button
            aria-pressed={isActive}
            className="filter-toggle"
            key={layer}
            onClick={() => onToggleLayer(layer)}
            type="button"
          >
            <span className={`filter-swatch swatch-${layers[layer].className}`} />
            {layers[layer].label}
          </button>
        );
      })}
    </div>
  );
}

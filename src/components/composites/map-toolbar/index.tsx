import { type ReactElement, useState } from "react";

import type {
  MapLayerVisibility,
  ToggleableMapLayer,
} from "@/components/adapters/map/map-layer-visibility";
import MapLayersSheet from "@/components/composites/map-toolbar/map-layers-sheet";
import MapToolbarActions from "@/components/composites/map-toolbar/map-toolbar-actions";

export interface MapToolbarProps {
  readonly onVisibilityChange: (
    layer: ToggleableMapLayer,
    visible: boolean,
  ) => void;
  readonly visibility: MapLayerVisibility;
}

export default function MapToolbar({
  onVisibilityChange,
  visibility,
}: MapToolbarProps): ReactElement {
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <>
      <MapToolbarActions
        layersOpen={layersOpen}
        onOpenLayers={() => {
          setLayersOpen(true);
        }}
      />
      <MapLayersSheet
        isOpen={layersOpen}
        onDismiss={() => {
          setLayersOpen(false);
        }}
        onVisibilityChange={onVisibilityChange}
        visibility={visibility}
      />
    </>
  );
}

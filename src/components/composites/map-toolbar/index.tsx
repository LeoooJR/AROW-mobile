import { type ReactElement, useState } from "react";

import type {
  MapLayerVisibility,
  ToggleableMapLayer,
} from "@/components/adapters/map/map-layer-visibility";
import MapLayersSheet from "@/components/composites/map-toolbar/map-layers-sheet";
import MapToolbarActions from "@/components/composites/map-toolbar/map-toolbar-actions";
import PointSearchSheet from "@/components/composites/map-toolbar/point-search-sheet";
import type { Milestone } from "@/features/milestones/milestone";
import type { MilestoneSearchModel } from "@/features/milestones/milestone-search";

export interface MapToolbarProps {
  readonly milestoneSearch: MilestoneSearchModel;
  readonly onMilestoneSelect: (milestone: Milestone) => void;
  readonly onVisibilityChange: (
    layer: ToggleableMapLayer,
    visible: boolean,
  ) => void;
  readonly visibility: MapLayerVisibility;
}

export default function MapToolbar({
  milestoneSearch,
  onMilestoneSelect,
  onVisibilityChange,
  visibility,
}: MapToolbarProps): ReactElement {
  const [openSheet, setOpenSheet] = useState<"layers" | "pointSearch">();

  return (
    <>
      <MapToolbarActions
        layersOpen={openSheet === "layers"}
        onOpenLayers={() => {
          setOpenSheet("layers");
        }}
        onOpenPointSearch={() => {
          setOpenSheet("pointSearch");
        }}
        pointSearchOpen={openSheet === "pointSearch"}
      />
      <PointSearchSheet
        isOpen={openSheet === "pointSearch"}
        onDismiss={() => {
          setOpenSheet(undefined);
        }}
        onMilestoneSelect={(milestone) => {
          onMilestoneSelect(milestone);
          setOpenSheet(undefined);
        }}
        search={milestoneSearch}
      />
      <MapLayersSheet
        isOpen={openSheet === "layers"}
        onDismiss={() => {
          setOpenSheet(undefined);
        }}
        onVisibilityChange={onVisibilityChange}
        visibility={visibility}
      />
    </>
  );
}

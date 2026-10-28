import { View } from "react-native";
import Divider from "@/components/primitives/divider";
import MapFeatureDetailsFact from "./map-feature-details-fact";

export interface MapFeatureDetailsFactsProps {
  readonly lineCode: string;
  readonly sectionRank: number;
  readonly milestone: string;
  readonly bottomPadding?: boolean;
}

export default function MapFeatureDetailsFacts({
  lineCode,
  sectionRank,
  milestone,
  bottomPadding = true,
}: MapFeatureDetailsFactsProps) {
  return (
    <>
      <Divider className="mt-[12px] bg-border-subtle dark:bg-[#4D4D4D]" />
      <View className="flex-row py-[10px]">
        <MapFeatureDetailsFact label="Code ligne" value={lineCode} />
      </View>
      <Divider className="bg-border-subtle dark:bg-[#4D4D4D]" />
      <View
        className={bottomPadding ? "flex-row py-[10px]" : "flex-row pt-[10px]"}
      >
        <MapFeatureDetailsFact label="Section" value={String(sectionRank)} />
        <Divider
          className="mx-[12px] h-auto self-stretch bg-border-subtle dark:bg-[#4D4D4D]"
          orientation="vertical"
        />
        <MapFeatureDetailsFact label="Repère" value={milestone} />
      </View>
    </>
  );
}

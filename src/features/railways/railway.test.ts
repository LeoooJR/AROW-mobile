import { AbstractMapFeature } from "@/features/map-features/abstract-map-feature";

import { Railway } from "./railway";

const INPUT = {
  endMilestone: "137+980",
  gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
  lineCode: "340311",
  name: "Raccordement de Rouen-Martainville",
  railwayType: "Raccordement",
  sectionRank: 1,
  startMilestone: "136+772",
} as const;

describe("Railway", () => {
  test("encapsulates railway identity and metadata", () => {
    const railway = new Railway(INPUT);

    expect(railway).toBeInstanceOf(AbstractMapFeature);
    expect(railway.kind).toBe("railway");
    expect(railway.id).toBe("340311:1");
    expect(railway.key.id).toBe("340311:1");
    expect(railway.lineCode).toBe("340311");
    expect(railway.sectionRank).toBe(1);
    expect(railway.gaiaId).toBe(INPUT.gaiaId);
    expect(railway.name).toBe(INPUT.name);
    expect(railway.railwayType).toBe(INPUT.railwayType);
    expect(railway.startMilestone).toBe(INPUT.startMilestone);
    expect(railway.endMilestone).toBe(INPUT.endMilestone);
  });

  test("rejects empty required metadata", () => {
    expect(() => new Railway({ ...INPUT, name: "" })).toThrow(
      "Railway name must not be empty",
    );
  });
});

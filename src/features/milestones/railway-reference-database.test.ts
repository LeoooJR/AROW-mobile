import { Milestone } from "./milestone";
import {
  findMilestone,
  loadMilestones,
  loadSearchableRailways,
} from "./railway-reference-database";
import {
  FIND_MILESTONE_QUERY,
  LOAD_MILESTONES_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "./railway-reference-queries";

const MILESTONE_RECORD = {
  code_ligne: "893000",
  label: "509+000",
  latitude: 45.74744,
  longitude: 4.85933,
  position_m: 509_000,
  rg_troncon: 1,
};

const SECTION_RECORD = {
  code_ligne: "893000",
  has_geometry: 1,
  idgaia: "gaia-id",
  lib_ligne: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
  maximum_label: "509+000",
  maximum_position_m: 509_000,
  minimum_label: "499+000",
  minimum_position_m: 499_000,
  pkd: "499+752",
  pkf: "511+605",
  rg_troncon: 1,
  type_ligne: "Ligne",
};

describe("railway reference database", () => {
  test("executes and converts complete milestone loading", async () => {
    const getAllAsync = jest.fn().mockResolvedValue([MILESTONE_RECORD]);
    const milestones = await loadMilestones({ getAllAsync });

    expect(milestones[0]).toBeInstanceOf(Milestone);
    expect(getAllAsync).toHaveBeenCalledWith(LOAD_MILESTONES_QUERY);
  });

  test("executes and converts searchable railway loading", async () => {
    const getAllAsync = jest.fn().mockResolvedValue([SECTION_RECORD]);
    const railways = await loadSearchableRailways({ getAllAsync });

    expect(railways[0]?.code).toBe("893000");
    expect(getAllAsync).toHaveBeenCalledWith(LOAD_SEARCHABLE_RAILWAYS_QUERY);
  });

  test("binds the exact composite milestone lookup", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue(MILESTONE_RECORD);
    const milestone = await findMilestone(
      { getFirstAsync },
      { lineCode: "893000", positionMeters: 509_000, sectionRank: 1 },
    );

    expect(milestone).toBeInstanceOf(Milestone);
    expect(getFirstAsync).toHaveBeenCalledWith(
      FIND_MILESTONE_QUERY,
      "893000",
      1,
      509_000,
    );
  });

  test("returns undefined for an unavailable exact point", async () => {
    await expect(
      findMilestone(
        { getFirstAsync: jest.fn().mockResolvedValue(null) },
        { lineCode: "893000", positionMeters: 508_500, sectionRank: 1 },
      ),
    ).resolves.toBeUndefined();
  });
});

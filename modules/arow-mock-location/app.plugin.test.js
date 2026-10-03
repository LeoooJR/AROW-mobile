/** @jest-environment node */

const withArowMockLocation = require("./app.plugin");

const SERVICE_NAME = "expo.modules.arowmocklocation.MockLocationService";
const REQUIRED_ATTRIBUTES = {
  "android:exported": "false",
  "android:foregroundServiceType": "location",
  "android:name": SERVICE_NAME,
};

async function applyManifestMod(manifest) {
  const config = withArowMockLocation({ name: "test", slug: "test" });
  const result = await config.mods.android.manifest({
    ...config,
    modResults: { manifest },
    modRequest: {
      projectRoot: process.cwd(),
      platformProjectRoot: `${process.cwd()}/android`,
      platform: "android",
      modName: "manifest",
      introspect: true,
    },
  });
  return result.modResults.manifest;
}

describe("mock-location service manifest", () => {
  test("creates a private location service when absent", async () => {
    const manifest = await applyManifestMod({ application: [{}] });
    expect(manifest.application[0].service).toEqual([
      { $: REQUIRED_ATTRIBUTES },
    ]);
  });

  test.each([
    { "android:exported": "true", "android:foregroundServiceType": "dataSync" },
    {},
    {
      "android:exported": "false",
      "android:foregroundServiceType": "location",
    },
  ])("enforces attributes on an existing service: %j", async (attributes) => {
    const service = { $: { "android:name": SERVICE_NAME, ...attributes } };
    const manifest = await applyManifestMod({
      application: [{ service: [service] }],
    });
    expect(manifest.application[0].service).toHaveLength(1);
    expect(service.$).toEqual(REQUIRED_ATTRIBUTES);
  });

  test("preserves unrelated attributes, children, services, and permissions", async () => {
    const children = {
      "meta-data": [{ $: { "android:name": "test", "android:value": "kept" } }],
    };
    const service = {
      $: {
        "android:name": SERVICE_NAME,
        "android:exported": "true",
        "android:enabled": "true",
      },
      ...children,
    };
    const unrelated = {
      $: { "android:name": "other.Service", "android:exported": "true" },
    };
    const permission = { $: { "android:name": "android.permission.INTERNET" } };
    const manifest = await applyManifestMod({
      application: [{ service: [unrelated, service] }],
      "uses-permission": [permission],
    });
    expect(manifest.application[0].service).toEqual([
      unrelated,
      { $: { ...REQUIRED_ATTRIBUTES, "android:enabled": "true" }, ...children },
    ]);
    expect(manifest.application[0].service[0]).toBe(unrelated);
    expect(manifest["uses-permission"][0]).toBe(permission);
  });

  test("enforces every matching entry without deleting duplicates", async () => {
    const services = [
      { $: { "android:name": SERVICE_NAME, "android:exported": "true" } },
      {
        $: {
          "android:name": SERVICE_NAME,
          "android:foregroundServiceType": "dataSync",
        },
      },
    ];
    const manifest = await applyManifestMod({
      application: [{ service: services }],
    });
    expect(manifest.application[0].service).toBe(services);
    expect(services).toEqual([
      { $: REQUIRED_ATTRIBUTES },
      { $: REQUIRED_ATTRIBUTES },
    ]);
  });

  test("repeated execution does not duplicate services or permissions", async () => {
    const manifest = await applyManifestMod({
      application: [{}],
      "uses-permission": [
        { $: { "android:name": "android.permission.FOREGROUND_SERVICE" } },
      ],
    });
    const firstResult = structuredClone(manifest);
    await applyManifestMod(manifest);
    expect(manifest).toEqual(firstResult);
    expect(manifest.application[0].service).toHaveLength(1);
    expect(
      manifest["uses-permission"].map(
        (permission) => permission.$["android:name"],
      ),
    ).toEqual([
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.ACCESS_MOCK_LOCATION",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
      "android.permission.POST_NOTIFICATIONS",
    ]);
  });

  test.each([{}, { application: [] }])(
    "retains the missing-application error: %j",
    async (manifest) => {
      await expect(applyManifestMod(manifest)).rejects.toThrow(
        "Android application manifest is missing",
      );
    },
  );
});

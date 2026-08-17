import { applyColorMode } from "./script";

const classListAdd = jest.fn();
const classListRemove = jest.fn();
const documentElement = {
  classList: {
    add: classListAdd,
    remove: classListRemove,
  },
  style: {
    colorScheme: "",
  },
};
let mockSystemDark = false;

describe("applyColorMode", () => {
  beforeEach(() => {
    classListAdd.mockReset();
    classListRemove.mockReset();
    documentElement.style.colorScheme = "";
    mockSystemDark = false;

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        matchMedia: () => ({ matches: mockSystemDark }),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "window");
  });

  test.each([
    ["light", "light", "dark"],
    ["dark", "dark", "light"],
  ] as const)("applies explicit %s mode", (mode, expectedMode, removedMode) => {
    applyColorMode(mode);

    expect(classListRemove).toHaveBeenCalledWith(removedMode);
    expect(classListAdd).toHaveBeenCalledWith(expectedMode);
    expect(documentElement.style.colorScheme).toBe(expectedMode);
  });

  test.each([
    [false, "light", "dark"],
    [true, "dark", "light"],
  ] as const)(
    "resolves system dark=%s",
    (systemDark, expectedMode, removedMode) => {
      mockSystemDark = systemDark;

      applyColorMode("system");

      expect(classListRemove).toHaveBeenCalledWith(removedMode);
      expect(classListAdd).toHaveBeenCalledWith(expectedMode);
      expect(documentElement.style.colorScheme).toBe(expectedMode);
    },
  );

  test("reports DOM failures without throwing", () => {
    const error = new Error("class list unavailable");
    classListAdd.mockImplementationOnce(() => {
      throw error;
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => applyColorMode("light")).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith(error);
  });
});

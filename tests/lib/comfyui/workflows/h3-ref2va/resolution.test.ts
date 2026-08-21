import { calculateResolution } from "@/lib/comfyui/workflows/h3-ref2va/resolution";

describe("calculateResolution", () => {
  it.each([
    {
      aspectWidth: 16,
      aspectHeight: 9,
      megapixels: 0.85,
      multipleOf: 32,
      width: 1216,
      height: 704,
    },
    {
      aspectWidth: 9,
      aspectHeight: 16,
      megapixels: 0.85,
      multipleOf: 32,
      width: 704,
      height: 1216,
    },
    {
      aspectWidth: 1,
      aspectHeight: 1,
      megapixels: 0.85,
      multipleOf: 32,
      width: 928,
      height: 928,
    },
    {
      aspectWidth: 4,
      aspectHeight: 3,
      megapixels: 0.85,
      multipleOf: 32,
      width: 1056,
      height: 800,
    },
    {
      aspectWidth: 3,
      aspectHeight: 4,
      megapixels: 0.85,
      multipleOf: 32,
      width: 800,
      height: 1056,
    },
    {
      aspectWidth: 16,
      aspectHeight: 9,
      megapixels: 0.37,
      multipleOf: 32,
      width: 800,
      height: 448,
    },
  ])(
    "$aspectWidth:$aspectHeight at $megapixels MP -> $width x $height",
    ({ aspectWidth, aspectHeight, megapixels, multipleOf, width, height }) => {
      expect(
        calculateResolution({
          aspectWidth,
          aspectHeight,
          megapixels,
          multipleOf,
        }),
      ).toEqual({ width, height });
    },
  );

  it("clamps to the multiple as a minimum", () => {
    const result = calculateResolution({
      aspectWidth: 1,
      aspectHeight: 100,
      megapixels: 0.1,
      multipleOf: 32,
    });
    expect(result.width).toBe(32);
    expect(result.height).toBe(3168);
  });
});

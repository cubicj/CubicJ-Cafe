export interface ResolutionInput {
  aspectWidth: number;
  aspectHeight: number;
  megapixels: number;
  multipleOf: number;
}

export function calculateResolution(input: ResolutionInput): {
  width: number;
  height: number;
} {
  const aspectRatio = input.aspectWidth / input.aspectHeight;
  const targetPixels = input.megapixels * 1_000_000;
  const rawHeight = Math.sqrt(targetPixels / aspectRatio);
  const rawWidth = rawHeight * aspectRatio;
  const snap = (value: number) =>
    Math.max(
      input.multipleOf,
      Math.round(value / input.multipleOf) * input.multipleOf,
    );
  return { width: snap(rawWidth), height: snap(rawHeight) };
}

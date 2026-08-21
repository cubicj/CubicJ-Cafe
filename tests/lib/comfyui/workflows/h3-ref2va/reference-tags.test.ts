import { computeReferenceTags } from "@/lib/comfyui/workflows/h3-ref2va/reference-tags";

describe("computeReferenceTags", () => {
  it("numbers pictures and videos 1-based by slot", () => {
    const tags = computeReferenceTags({
      imageCount: 2,
      videos: [{ includeSoundtrack: false }],
      audioCount: 0,
    });
    expect(tags.images).toEqual(["<Picture 1>", "<Picture 2>"]);
    expect(tags.videos).toEqual([{ video: "<Video 1>" }]);
    expect(tags.audios).toEqual([]);
  });

  it("gives a soundtrack-enabled video its audio number before standalone audios", () => {
    const tags = computeReferenceTags({
      imageCount: 2,
      videos: [{ includeSoundtrack: true }],
      audioCount: 1,
    });
    expect(tags.videos).toEqual([
      { video: "<Video 1>", soundtrack: "<Audio 1>" },
    ]);
    expect(tags.audios).toEqual(["<Audio 2>"]);
  });

  it("skips audio numbers for videos without soundtracks", () => {
    const tags = computeReferenceTags({
      imageCount: 0,
      videos: [{ includeSoundtrack: false }, { includeSoundtrack: true }],
      audioCount: 1,
    });
    expect(tags.videos).toEqual([
      { video: "<Video 1>" },
      { video: "<Video 2>", soundtrack: "<Audio 1>" },
    ]);
    expect(tags.audios).toEqual(["<Audio 2>"]);
  });

  it("handles the maxed set", () => {
    const tags = computeReferenceTags({
      imageCount: 9,
      videos: [
        { includeSoundtrack: true },
        { includeSoundtrack: true },
        { includeSoundtrack: true },
      ],
      audioCount: 3,
    });
    expect(tags.images[8]).toBe("<Picture 9>");
    expect(tags.videos[2]).toEqual({
      video: "<Video 3>",
      soundtrack: "<Audio 3>",
    });
    expect(tags.audios).toEqual(["<Audio 4>", "<Audio 5>", "<Audio 6>"]);
  });

  it("returns empty arrays for an empty set", () => {
    expect(
      computeReferenceTags({ imageCount: 0, videos: [], audioCount: 0 }),
    ).toEqual({ images: [], videos: [], audios: [] });
  });
});

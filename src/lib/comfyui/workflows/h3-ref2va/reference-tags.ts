export interface ReferenceTagInput {
  imageCount: number;
  videos: { includeSoundtrack: boolean }[];
  audioCount: number;
}

export interface ReferenceVideoTags {
  video: string;
  soundtrack?: string;
}

export interface ReferenceTags {
  images: string[];
  videos: ReferenceVideoTags[];
  audios: string[];
}

export function computeReferenceTags(input: ReferenceTagInput): ReferenceTags {
  const images = Array.from(
    { length: input.imageCount },
    (_, i) => `<Picture ${i + 1}>`,
  );
  let audioCounter = 0;
  const videos = input.videos.map((video, k) => {
    if (!video.includeSoundtrack) {
      return { video: `<Video ${k + 1}>` };
    }
    audioCounter += 1;
    return { video: `<Video ${k + 1}>`, soundtrack: `<Audio ${audioCounter}>` };
  });
  const audios = Array.from({ length: input.audioCount }, () => {
    audioCounter += 1;
    return `<Audio ${audioCounter}>`;
  });
  return { images, videos, audios };
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 0xFFFFFFFFFFFF)
}

export function extractBaseImageName(imagePath: string): string {
  return imagePath.replace(/\.(png|jpg|jpeg|webp)$/i, '')
}

export type ReadFileAsDataURL = (file: File) => Promise<string>

export const readFileAsDataURL: ReadFileAsDataURL = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file preview'))
    reader.readAsDataURL(file)
  })

export function createImagePreview(
  file: File,
  readAsDataURL: ReadFileAsDataURL = readFileAsDataURL
) {
  return readAsDataURL(file)
}

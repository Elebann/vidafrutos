const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) ?? ""

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic"])

export interface ImageUrlOptions {
  width?: number
  height?: number
  /** Quality, e.g. "auto" or a numeric string. */
  quality?: string
  /** Format, e.g. "auto" to let Cloudinary pick WebP/AVIF. */
  format?: string
}

export function isImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}

function buildTransformations(options: ImageUrlOptions = {}): string {
  const parts: string[] = []
  if (options.width) parts.push(`w_${options.width}`)
  if (options.height) parts.push(`h_${options.height}`)
  parts.push(`q_${options.quality ?? "auto"}`)
  parts.push(`f_${options.format ?? "auto"}`)
  return parts.join(",")
}

export function buildEvidenceImageUrl(publicId: string, extension: string, options: ImageUrlOptions = {}): string {
  if (!CLOUD_NAME) return ""
  const transformations = buildTransformations(options)
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}.${extension}`
}

export function buildEvidencePdfUrl(publicId: string, extension: string, forceDownload: boolean = true): string {
  if (!CLOUD_NAME) return ""
  const flag = forceDownload ? "fl_attachment/" : ""
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${flag}${publicId}.${extension}`
}

export function buildEvidencePreviewImageUrl(publicId: string, extension: string): string {
  return buildEvidenceImageUrl(publicId, extension, { width: 800, format: "auto", quality: "auto" })
}

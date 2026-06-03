const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) ?? ""
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) ?? ""

export interface CloudinaryUploadResult {
  publicId: string
  extension: string
  bytes: number
}

export function getExtensionFromFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".")
  if (dotIndex === -1) return ""
  return fileName.slice(dotIndex + 1).toLowerCase()
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME) {
    throw new Error("VITE_CLOUDINARY_CLOUD_NAME no está configurado.")
  }
  if (!UPLOAD_PRESET) {
    throw new Error("VITE_CLOUDINARY_UPLOAD_PRESET no está configurado.")
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", UPLOAD_PRESET)

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Error al subir a Cloudinary (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as {
    public_id?: string
    bytes?: number
    format?: string
  }

  if (!data.public_id) {
    throw new Error("La respuesta de Cloudinary no incluyó public_id.")
  }

  const extension =
    (data.format && data.format.toLowerCase()) || getExtensionFromFileName(file.name) || "jpg"

  return {
    publicId: data.public_id,
    extension,
    bytes: typeof data.bytes === "number" ? data.bytes : file.size,
  }
}

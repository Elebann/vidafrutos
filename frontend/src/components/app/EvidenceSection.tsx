import { useEffect, useState } from "react"
import { FileText, ImageIcon, Loader2 } from "lucide-react"

import { SectionCard } from "@/components/app/page-shell"
import apiClients from "@/lib/apiClients"
import {
  buildEvidenceImageUrl,
  buildEvidencePdfUrl,
  buildEvidencePreviewImageUrl,
  isImageExtension,
} from "@/lib/evidenceUrl"
import type { DeliveryEvidence } from "@/types/domain"
import { formatDateTime } from "@/lib/format"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EvidenceSection(
  { orderId,
    title,
    evidenceType }:
  { orderId: number,
    title: string,
    evidenceType: number
  }
  ) {
  const [evidence, setEvidence] = useState<DeliveryEvidence | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    apiClients
      .fetchOrderEvidence(orderId, evidenceType)
      .then((data) => {
        if (active) {
          setEvidence(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setEvidence(null)
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [orderId, evidenceType])

  if (isLoading) {
    return (
      <SectionCard title={title}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando evidencia...
        </div>
      </SectionCard>
    )
  }

  if (!evidence) {
    return (
      <SectionCard title={title}>
        <p className="text-sm text-muted-foreground">
          No hay ningún documento adjunto.
        </p>
      </SectionCard>
    )
  }

  const isImage = isImageExtension(evidence.extension)
  const previewUrl = isImage
    ? buildEvidencePreviewImageUrl(evidence.publicId, evidence.extension)
    : ""
  const fullUrl = isImage
    ? buildEvidenceImageUrl(evidence.publicId, evidence.extension, { format: "jpg" })
    : buildEvidencePdfUrl(evidence.publicId, evidence.extension, true)

  return (
    <SectionCard title={title}>
      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
        {isImage ? (
          <button
            type="button"
            onClick={() => setLightboxUrl(previewUrl)}
            className="group relative h-32 w-32 overflow-hidden rounded-md border bg-neutral-100"
            aria-label="Ver imagen en grande"
          >
            <img
              src={previewUrl}
              alt="Evidencia"
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-md border bg-neutral-100 text-neutral-500">
            <FileText className="size-10" />
          </div>
        )}

        <div className="grid gap-1 text-sm">
          <div className="flex items-center gap-2 font-medium">
            {isImage ? (
              <ImageIcon className="size-4" />
            ) : (
              <FileText className="size-4" />
            )}
            <span className="uppercase">{evidence.extension}</span>
            <span className="text-muted-foreground">
              · {formatBytes(evidence.bytes)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Subido por {evidence.uploadedBy.username || "usuario"} el{" "}
            {formatDateTime(evidence.uploadedAt)}
          </p>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-sm font-medium text-[#804f17] underline-offset-2 hover:underline"
          >
            {isImage ? "Abrir en nueva pestaña" : "Descargar"}
          </a>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
        >
          <img
            src={lightboxUrl}
            alt="Evidencia ampliada"
            className="max-h-full max-w-full rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </SectionCard>
  )
}

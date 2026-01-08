'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import imageCompression from 'browser-image-compression'
import Image from "next/image"

interface ImageUploaderProps {
  onUploadComplete: (urls: string[]) => void
}

export function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setUploading(true)

    const files = Array.from(e.target.files)
    const newUrls: string[] = []
    const newPreviews: string[] = []

    for (const file of files) {
      try {
        // 1. Compress Image (Max 600KB)
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        })

        // 2. Get Signed URL from our API
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: compressedFile.name,
            contentType: compressedFile.type
          })
        })
        
        if (!res.ok) throw new Error('Failed to get signed URL')
        
        const { uploadUrl, publicUrl } = await res.json()

        // 3. Upload directly to R2
        await fetch(uploadUrl, {
          method: 'PUT',
          body: compressedFile,
          headers: { 'Content-Type': compressedFile.type }
        })

        newUrls.push(publicUrl)
        newPreviews.push(URL.createObjectURL(compressedFile))
      } catch (err) {
        console.error("Upload failed", err)
        alert("Upload failed. Check console for details.")
      }
    }

    const finalUrls = [...uploadedUrls, ...newUrls]
    setUploadedUrls(finalUrls)
    setPreviewUrls(prev => [...prev, ...newPreviews])
    
    // Pass the final R2 URLs back to the parent form
    onUploadComplete(finalUrls) 
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      {/* Image Previews */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previewUrls.map((url, idx) => (
            <div key={idx} className="relative h-20 w-20 rounded-md overflow-hidden border">
              <Image src={url} alt="Preview" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('file-upload')?.click()}
            className="w-full border-dashed"
        >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Compressing & Uploading..." : "Upload Style Images"}
        </Button>
        <input 
            id="file-upload" 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileSelect}
        />
      </div>
    </div>
  )
}
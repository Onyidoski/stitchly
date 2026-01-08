import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  // 1. Check Authentication (Only logged in users can upload)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { filename, contentType } = await request.json()
    
    // 2. Generate a unique file path: user_id/random_id-filename
    const uniqueId = crypto.randomUUID()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "")
    const key = `${user.id}/${uniqueId}-${sanitizedFilename}`

    // 3. Generate Signed URL
    const signedUrl = await getSignedUrl(
      R2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 60 } // URL valid for 60 seconds
    )

    // 4. Return the Upload URL and the final Public URL
    return NextResponse.json({
      uploadUrl: signedUrl,
      publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`,
    })

  } catch (error) {
    console.error("R2 Error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
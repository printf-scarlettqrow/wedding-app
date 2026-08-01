import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const {
      photoId,
      originalStoragePath, // si es imagen: path en wedding-originals
      publicUrl,           // si es video: URL pública en wedding-photos
      mimeType,
      fileName,
    } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Obtener configuración de Drive
    const { data: config } = await supabase
      .from('drive_config')
      .select('refresh_token, folder_id')
      .eq('id', 1)
      .single()

    if (!config) {
      return new Response(
        JSON.stringify({ success: false, error: 'Drive not connected' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Refrescar access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: config.refresh_token,
        client_id:     Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        grant_type:    'refresh_token',
      }),
    })
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      throw new Error('Failed to refresh token: ' + JSON.stringify(tokenData))
    }

    // 3. Descargar el archivo original desde Supabase Storage
    let fileBytes: ArrayBuffer

    if (originalStoragePath) {
      // Imagen: descargar desde bucket privado wedding-originals
      const { data: fileBlob, error: dlError } = await supabase.storage
        .from('wedding-originals')
        .download(originalStoragePath)

      if (dlError || !fileBlob) {
        throw new Error('Failed to download original: ' + dlError?.message)
      }
      fileBytes = await fileBlob.arrayBuffer()
    } else {
      // Video: descargar desde URL pública (wedding-photos)
      const fileRes = await fetch(publicUrl)
      if (!fileRes.ok) throw new Error('Failed to fetch public file: ' + fileRes.status)
      fileBytes = await fileRes.arrayBuffer()
    }

    // 4. Subir a Google Drive con multipart upload
    const boundary = 'WeddingGallery_' + Date.now()
    const metadata = JSON.stringify({
      name:    fileName,
      parents: [config.folder_id],
    })

    const metaPart = new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
    )
    const filePart = new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    )
    const fileContent  = new Uint8Array(fileBytes)
    const closingPart  = new TextEncoder().encode(`\r\n--${boundary}--`)

    const totalLen = metaPart.length + filePart.length + fileContent.length + closingPart.length
    const body     = new Uint8Array(totalLen)
    let offset = 0
    body.set(metaPart,   offset); offset += metaPart.length
    body.set(filePart,   offset); offset += filePart.length
    body.set(fileContent, offset); offset += fileContent.length
    body.set(closingPart, offset)

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${tokenData.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    )

    const driveFile = await uploadRes.json()

    if (!driveFile.id) {
      throw new Error('Drive upload failed: ' + JSON.stringify(driveFile))
    }

    // 5. Actualizar photos con el ID de Drive
    if (photoId) {
      await supabase
        .from('photos')
        .update({ drive_file_id: driveFile.id })
        .eq('id', photoId)
    }

    // 6. Limpiar original del bucket privado (ya no necesario)
    if (originalStoragePath) {
      await supabase.storage
        .from('wedding-originals')
        .remove([originalStoragePath])
    }

    return new Response(
      JSON.stringify({ success: true, driveFileId: driveFile.id }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('drive-upload error:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})

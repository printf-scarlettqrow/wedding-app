import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url = new URL(req.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')   // contiene la URL de retorno al admin
  const error = url.searchParams.get('error')

  // state viene codificado como la URL del admin (e.g. https://myapp.vercel.app/admin)
  const redirectBase = state
    ? decodeURIComponent(state)
    : (Deno.env.get('PUBLIC_APP_URL') ?? '') + '/admin'

  if (error || !code) {
    return Response.redirect(`${redirectBase}?drive=error`, 302)
  }

  try {
    // 1. Intercambiar code por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        redirect_uri:  Deno.env.get('GOOGLE_REDIRECT_URI')!,
        grant_type:    'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()

    if (!tokens.refresh_token) {
      console.error('No refresh_token. Response:', JSON.stringify(tokens))
      return Response.redirect(`${redirectBase}?drive=no_refresh_token`, 302)
    }

    // 2. Obtener email del usuario
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const userInfo = await userRes.json()

    // 3. Crear (o encontrar) carpeta en Drive
    const folderId = await ensureDriveFolder(tokens.access_token)

    // 4. Guardar en Supabase con service_role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase.from('drive_config').upsert({
      id:            1,
      refresh_token: tokens.refresh_token,
      folder_id:     folderId,
      drive_email:   userInfo.email,
      connected_at:  new Date().toISOString(),
    })

    if (dbError) {
      console.error('DB error:', dbError)
      return Response.redirect(`${redirectBase}?drive=error`, 302)
    }

    return Response.redirect(`${redirectBase}?drive=connected`, 302)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return Response.redirect(`${redirectBase}?drive=error`, 302)
  }
})

async function ensureDriveFolder(accessToken: string): Promise<string> {
  const folderName = 'Boda Josué & Ahinoam'
  const query = encodeURIComponent(
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  )

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const searchData = await searchRes.json()

  if (searchData.files?.length > 0) {
    return searchData.files[0].id
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:     folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  const folder = await createRes.json()
  return folder.id
}

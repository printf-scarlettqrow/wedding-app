import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data } = await supabase
    .from('drive_config')
    .select('folder_id, drive_email, connected_at')
    .eq('id', 1)
    .single()

  const response = data
    ? {
        connected:    true,
        folder_url:   `https://drive.google.com/drive/folders/${data.folder_id}`,
        email:        data.drive_email,
        connected_at: data.connected_at,
      }
    : { connected: false }

  return new Response(JSON.stringify(response), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})

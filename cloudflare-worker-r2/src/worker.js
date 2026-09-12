/**
 * Cloudflare Worker for Cloudflare R2 Storage (Kanbann ม.2/3)
 * Handles uploading, downloading, and managing all file types (PDF, Documents, Archives, Media)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading slash

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Auth, X-File-Name',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const publicBaseUrl = env.PUBLIC_URL || url.origin;

    // Optional Auth Secret check for write operations
    if (env.AUTH_SECRET && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('X-Custom-Auth');
      if (authHeader !== `Bearer ${env.AUTH_SECRET}` && authHeader !== env.AUTH_SECRET) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Invalid Auth Secret' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    switch (request.method) {
      // 1. Direct Streaming PUT Upload: PUT /:filename
      case 'PUT': {
        if (!key) {
          return new Response(
            JSON.stringify({ success: false, error: 'File name / key is required in URL path' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
        
        try {
          await env.MY_BUCKET.put(key, request.body, {
            httpMetadata: {
              contentType: contentType,
            },
          });

          const fileUrl = `${publicBaseUrl}/${key}`;
          return new Response(
            JSON.stringify({
              success: true,
              filename: key,
              url: fileUrl,
              contentType: contentType,
              size: request.headers.get('Content-Length') || undefined,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message || 'Upload to R2 failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 2. Multipart FormData Upload: POST /upload or POST /
      case 'POST': {
        try {
          const contentType = request.headers.get('Content-Type') || '';
          if (!contentType.includes('multipart/form-data')) {
            // Fallback if binary is posted directly with X-File-Name header
            const customFileName = request.headers.get('X-File-Name') || `file_${Date.now()}`;
            await env.MY_BUCKET.put(customFileName, request.body, {
              httpMetadata: { contentType: contentType || 'application/octet-stream' },
            });
            return new Response(
              JSON.stringify({
                success: true,
                filename: customFileName,
                url: `${publicBaseUrl}/${customFileName}`,
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const formData = await request.formData();
          const file = formData.get('file') || formData.get('document');

          if (!file || !(file instanceof File)) {
            return new Response(
              JSON.stringify({ success: false, error: 'No valid file found in FormData (key: file)' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileKey = `${Date.now()}_${cleanName}`;

          await env.MY_BUCKET.put(fileKey, file.stream(), {
            httpMetadata: {
              contentType: file.type || 'application/octet-stream',
            },
          });

          const fileUrl = `${publicBaseUrl}/${fileKey}`;
          return new Response(
            JSON.stringify({
              success: true,
              filename: fileKey,
              originalName: file.name,
              url: fileUrl,
              contentType: file.type,
              size: file.size,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message || 'POST upload failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 3. GET /:filename - Serve file from Cloudflare R2
      case 'GET':
      case 'HEAD': {
        if (!key) {
          return new Response(
            JSON.stringify({
              service: 'Kanbann Cloudflare R2 Storage Worker',
              status: 'healthy',
              time: new Date().toISOString(),
              methods: ['GET /:filename', 'PUT /:filename', 'POST / (FormData: file)'],
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const object = await env.MY_BUCKET.get(key);
        if (!object) {
          return new Response(
            JSON.stringify({ success: false, error: `File '${key}' not found in R2 bucket` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new Response(object.body, { headers });
      }

      // 4. DELETE /:filename - Delete file from R2
      case 'DELETE': {
        if (!key) {
          return new Response(
            JSON.stringify({ success: false, error: 'File key required for deletion' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await env.MY_BUCKET.delete(key);
        return new Response(
          JSON.stringify({ success: true, message: `File '${key}' deleted successfully` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response('Method Not Allowed', {
          status: 405,
          headers: corsHeaders,
        });
    }
  },
};

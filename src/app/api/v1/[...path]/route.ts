type RouteContext = { params: Promise<{ path: string[] }> };

const blockedRequestHeaders = new Set([
  'connection', 'content-length', 'expect', 'host', 'keep-alive', 'proxy-authenticate',
  'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade',
]);
const blockedResponseHeaders = new Set([
  'connection', 'content-length', 'expect', 'keep-alive', 'proxy-authenticate',
  'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade',
]);

async function forward(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  if (path.length === 0 || path.some((segment) => !/^[a-z0-9_-]+$/i.test(segment))) {
    return Response.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' },
      timestamp: new Date().toISOString(),
    }, { status: 404 });
  }
  const backendBase = process.env.YATRASETU_BACKEND_URL ?? 'http://localhost:5000';
  const url = new URL(`/api/v1/${path.map(encodeURIComponent).join('/')}`, backendBase);
  url.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  const connectionTokens = headers.get('connection')?.split(',').map((token) => token.trim().toLowerCase()) ?? [];
  for (const token of connectionTokens) headers.delete(token);
  for (const name of blockedRequestHeaders) headers.delete(name);

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });

    const responseHeaders = new Headers(upstream.headers);
    for (const name of blockedResponseHeaders) responseHeaders.delete(name);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const cause = error instanceof Error ? (error as Error & { cause?: { code?: string; message?: string } }).cause : undefined;
    console.error('[api:v1:proxy]', {
      message: error instanceof Error ? error.message : 'unknown fetch error',
      causeCode: cause?.code,
      causeMessage: cause?.message,
      targetHost: url.host,
    });
    return Response.json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The YatraSetu API service is currently unavailable.',
        retryable: true,
      },
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;

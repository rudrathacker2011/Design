export function GET() {
  return Response.json({
    success: true,
    data: { status: 'ok', service: 'YatraSetu API facade' },
    timestamp: new Date().toISOString(),
  });
}

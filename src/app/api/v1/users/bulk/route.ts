// Users bulk import endpoint removed.
// This route intentionally returns 404 to disable bulk imports for users.
export async function POST() {
  return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
}

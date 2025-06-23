import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log to server console for debugging
    console.log(`[${body.type?.toUpperCase() || 'DEBUG'}]`, JSON.stringify(body.data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DEBUG-LOG] Error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}

import { extractPaymentInfo } from '@/lib/openai-utils';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30; // OCR might take a bit longer

export async function POST(req: NextRequest) {
  try {
    console.log('[OCR API] Received request');
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Validate that it's a base64 data URL
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URL' },
        { status: 400 }
      );
    }

    console.log('[OCR API] Image size:', image.length, 'characters');
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('[OCR API] OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OCR service not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Extract payment information using OpenAI Vision
    const result = await extractPaymentInfo(image);
    
    console.log('[OCR API] Extraction result:', result);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[OCR API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

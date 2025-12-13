import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export const runtime = 'nodejs';
export const maxDuration = 30; // OCR might take a bit longer

export async function POST(req: NextRequest) {
  try {
    console.log('[OCR API] Received request');
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    console.log('[OCR API] Processing image:', image.name, image.size, 'bytes');

    // Convert File to Buffer
    const buffer = Buffer.from(await image.arrayBuffer());

    // Perform OCR using Tesseract.js
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: (m) => console.log('[Tesseract]', m),
    });

    const text = result.data.text;
    console.log('[OCR API] Extracted text:', text);

    // Extract payment information from the text
    const paymentInfo = extractPaymentInfoFromText(text);
    console.log('[OCR API] Extraction result:', paymentInfo);

    return NextResponse.json({
      success: true,
      data: paymentInfo,
      rawText: text,
    });
  } catch (error) {
    console.error('[OCR API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

function extractPaymentInfoFromText(text: string): {
  amount?: string;
  referenceNumber?: string;
} {
  const result: { amount?: string; referenceNumber?: string } = {};

  // Extract amount - look for patterns like: ₱500, PHP 500, 500.00, P500
  const amountPatterns = [
    /₱\s*([\d,]+\.?\d*)/i,
    /PHP\s*([\d,]+\.?\d*)/i,
    /P\s*([\d,]+\.?\d*)/i,
    /amount[:\s]*₱?\s*([\d,]+\.?\d*)/i,
    /total[:\s]*₱?\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.amount = match[1].replace(/,/g, '');
      break;
    }
  }

  // Extract reference number - look for patterns like: Ref: 123456, Reference Number: 123456
  const refPatterns = [
    /ref(?:erence)?\s*(?:no|number)?[:\s]*([A-Z0-9]{6,})/i,
    /transaction\s*(?:id|number)?[:\s]*([A-Z0-9]{6,})/i,
    /confirmation[:\s]*([A-Z0-9]{6,})/i,
  ];

  for (const pattern of refPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.referenceNumber = match[1];
      break;
    }
  }

  return result;
}

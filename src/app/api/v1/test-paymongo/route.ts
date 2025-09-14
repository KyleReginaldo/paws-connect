import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, phone } = body;
    
    // Format phone number for PayMongo (must be +[area code][10 digits])
    let formattedPhone = phone;
    if (phone && !phone.startsWith('+')) {
      // If phone doesn't start with +, assume it's Philippine number and add +63
      formattedPhone = phone.startsWith('09') 
        ? `+63${phone.substring(1)}` 
        : `+63${phone}`;
    }
    // Remove any non-digit characters except the + sign
    formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
    
    console.log('Testing PayMongo API with formatted phone:', formattedPhone);
    
    const paymongoResponse = await fetch('https://api.paymongo.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            first_name: username,
            last_name: username,
            phone: formattedPhone,
            email: email
          }
        }
      }),
    });

    const responseData = await paymongoResponse.json();
    
    return new Response(JSON.stringify({
      success: paymongoResponse.ok,
      status: paymongoResponse.status,
      headers: Object.fromEntries(paymongoResponse.headers.entries()),
      data: responseData,
      originalPhone: phone,
      formattedPhone: formattedPhone
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    console.log('Attempting to send SMS to:', phone)
    console.log('Message:', message)

    const projectId = process.env.NEXT_PUBLIC_TELERIVET_PROJECT_ID
    const apiKey = process.env.NEXT_PUBLIC_TELERIVET_API_KEY
    const routeId = process.env.NEXT_PUBLIC_TELERIVET_ROUTE_ID

    if (!projectId || !apiKey) {
      console.error('Telerivet configuration missing')
      return NextResponse.json(
        { error: 'SMS service not configured. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Validate phone number format
    if (!phone.startsWith('+')) {
      return NextResponse.json(
        { error: 'Phone number must include country code (e.g., +234...)' },
        { status: 400 }
      )
    }

    // Telerivet API call with sender ID
    const telerivetUrl = `https://api.telerivet.com/v1/projects/${projectId}/messages/send`
    
    const response = await fetch(telerivetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      },
      body: JSON.stringify({
        content: message,
        to_number: phone,
        route_id: routeId || undefined,
        // Add sender ID parameter - try different options
        from_number: 'NOLTFINANCE', // Option 1: Direct in API
        // OR use the route's configured sender ID
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Telerivet API error:', responseData)
      
      // If sender ID fails, try without it (fallback)
      if (responseData.error?.message?.includes('sender') || responseData.error?.message?.includes('from')) {
        console.log('Retrying without sender ID...')
        const fallbackResponse = await fetch(telerivetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
          },
          body: JSON.stringify({
            content: message,
            to_number: phone,
            route_id: routeId || undefined,
            // Omit from_number if it causes issues
          }),
        })
        
        const fallbackData = await fallbackResponse.json()
        if (!fallbackResponse.ok) throw new Error(fallbackData.error?.message || 'Fallback failed')
        
        console.log('SMS sent successfully (fallback):', fallbackData)
        return NextResponse.json({ success: true, data: fallbackData })
      }
      
      throw new Error(responseData.error?.message || `Telerivet error: ${response.status}`)
    }

    console.log('SMS sent successfully:', responseData)
    return NextResponse.json({ success: true, data: responseData })

  } catch (error: any) {
    console.error('SMS sending error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS. Please check your Telerivet setup.' },
      { status: 500 }
    )
  }
}
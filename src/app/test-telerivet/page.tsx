'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function TestTelerivetPage() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('Test message from NOLT FINANCE')
  const [testing, setTesting] = useState(false)

  const testSMS = async () => {
    if (!phone) {
      toast.error('Please enter a phone number')
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Test SMS sent successfully! Check your phone.')
        console.log('SMS response:', data)
      } else {
        toast.error(`Failed: ${data.error}`)
        console.error('SMS error:', data)
      }
    } catch (error: any) {
      toast.error('Network error: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Sender ID Setup</CardTitle>
          <CardDescription>
            Test that messages show "NOLTFINANCE" as sender instead of your phone number
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+2348012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-sm text-gray-500">Include country code (e.g., +234...)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Test Message</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button 
            onClick={testSMS} 
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Sending Test SMS...' : 'Send Test SMS'}
          </Button>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Expected Result:</h3>
            <div className="text-sm text-green-600">
              <p>✅ Message should show <strong>NOLTFINANCE</strong> as sender</p>
              <p>✅ Not your personal phone number</p>
              <p>✅ Professional appearance for customers</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Sender ID Configuration:</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Method 1: API parameter (from_number: "NOLTFINANCE")</li>
              <li>• Method 2: Telerivet route settings (Recommended)</li>
              <li>• Method 3: Contact provider for dedicated sender ID</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Nigeria Regulations:</h3>
            <ul className="text-sm text-yellow-600 space-y-1">
              <li>• Alpha Sender IDs must be registered with carriers</li>
              <li>• Some carriers may block unregistered sender IDs</li>
              <li>• Telerivet may have pre-approved sender IDs</li>
              <li>• Contact Telerivet support if sender ID doesn't work</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
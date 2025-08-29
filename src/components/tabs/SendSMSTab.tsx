'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface Contact {
  id: string
  phone: string
  name: string | null
  amount: number | null
  sent: boolean
}

interface Template {
  id: string
  title: string
  body: string
}

export default function SendSMSTab() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [sending, setSending] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      // Load unsent contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', user.id)
        .eq('sent', false)
        .order('created_at', { ascending: false })

      if (contactsError) throw contactsError

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      setContacts(contactsData || [])
      setTemplates(templatesData || [])
      if (templatesData && templatesData.length > 0) {
        setSelectedTemplate(templatesData[0].id)
      }
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message)
    }
  }

  const sendSMS = async (phone: string, message: string): Promise<{ success: boolean; error?: string }> => {
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

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || 'Failed to send SMS' 
        }
      }

      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Network error' 
      }
    }
  }

  const handleSendSMS = async () => {
    if (!user || !selectedTemplate || contacts.length === 0) return

    setSending(true)
    let successCount = 0
    let failCount = 0
    const failedContacts: { phone: string; error: string }[] = []

    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) {
      toast.error('No template selected')
      setSending(false)
      return
    }

    for (const contact of contacts) {
      const message = template.body
        .replace('{{name}}', contact.name || 'Customer')
        .replace('{{amount}}', contact.amount ? `₦${contact.amount.toLocaleString()}` : '')
        .replace('{{phone}}', contact.phone)

      const result = await sendSMS(contact.phone, message)

      if (result.success) {
        // Mark as sent in database
        await supabase
          .from('contacts')
          .update({ sent: true })
          .eq('id', contact.id)
        
        successCount++
      } else {
        failCount++
        failedContacts.push({
          phone: contact.phone,
          error: result.error || 'Unknown error'
        })
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setSending(false)
    
    if (successCount > 0) {
      toast.success(`Successfully sent ${successCount} messages`)
    }
    
    if (failCount > 0) {
      toast.error(`${failCount} messages failed to send`)
      console.error('Failed contacts:', failedContacts)
    }

    loadData() // Reload data to update UI
  }

  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send SMS</CardTitle>
        <CardDescription>
          Review and send your SMS messages to all uploaded contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Development Notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
            <strong>Development Mode:</strong> SMS will be logged to console but not actually sent.
          </div>
        )}

        {/* Template Selection */}
        {templates.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Contacts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
            <div className="text-sm text-blue-600">Contacts Ready</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{templates.length}</div>
            <div className="text-sm text-yellow-600">Templates</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.sent).length}
            </div>
            <div className="text-sm text-green-600">Already Sent</div>
          </div>
        </div>

        {/* Preview */}
        {selectedTemplateObj && contacts.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Message Preview:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm mb-4">
              {selectedTemplateObj.body
                .replace('{{name}}', contacts[0].name || 'Customer')
                .replace('{{amount}}', contacts[0].amount ? `₦${contacts[0].amount.toLocaleString()}` : '')
                .replace('{{phone}}', contacts[0].phone)}
            </div>
            <p className="text-sm text-gray-600">
              Will be sent to: <strong>{contacts[0].phone}</strong>
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={handleSendSMS} 
          disabled={sending || contacts.length === 0 || !selectedTemplate}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending {contacts.length} messages...
            </>
          ) : (
            `Send SMS to ${contacts.length} Contacts`
          )}
        </Button>

        {/* Important Notes */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-red-600 space-y-1">
            <li>• SMS will be sent using your Telerivet Android SIM</li>
            <li>• Standard carrier rates may apply</li>
            <li>• Double-check all content before sending</li>
            <li>• This action cannot be undone</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
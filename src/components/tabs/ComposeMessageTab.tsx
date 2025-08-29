'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Template {
  id?: string
  title: string
  body: string
}

export default function ComposeMessageTab() {
  const [title, setTitle] = useState('Loan Reminder')
  const [body, setBody] = useState('Dear {{name}}, your loan repayment of ₦{{amount}} is overdue. Pay into Acct: 1304485269 Bank: Providus')
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const { user } = useAuth()

  useEffect(() => {
    loadTemplates()
  }, [user])

  const loadTemplates = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load templates')
      return
    }

    setTemplates(data || [])
  }

  const handleSaveTemplate = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('templates')
        .insert([
          {
            owner_id: user.id,
            title,
            body
          }
        ])

      if (error) throw error

      toast.success('Template saved successfully!')
      loadTemplates() // Reload templates
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const loadTemplate = (template: Template) => {
    setTitle(template.title)
    setBody(template.body)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
        <CardDescription>
          Create your SMS template with placeholders for dynamic data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Template Title</Label>
          <Input
            id="title"
            placeholder="e.g., Loan Reminder"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message Template</Label>
          <Textarea
            id="body"
            rows={6}
            placeholder="Enter your message template with {{placeholders}}..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="font-mono text-sm"
          />
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Available Placeholders:</h3>
          <ul className="text-sm text-yellow-600 space-y-1">
            <li>• <code>{'{{name}}'}</code> - Contact name</li>
            <li>• <code>{'{{amount}}'}</code> - Loan amount</li>
            <li>• <code>{'{{phone}}'}</code> - Phone number</li>
          </ul>
        </div>

        <Button onClick={handleSaveTemplate} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Template'
          )}
        </Button>

        {templates.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Saved Templates:</h4>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="font-medium">{template.title}</div>
                  <div className="text-sm text-gray-600 truncate">{template.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Preview:</h4>
          <div className="bg-gray-100 p-4 rounded-lg text-sm">
            {body
              .replace('{{name}}', 'John Doe')
              .replace('{{amount}}', '15,000')
              .replace('{{phone}}', '+2348012345678')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
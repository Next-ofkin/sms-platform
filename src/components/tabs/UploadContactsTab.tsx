'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface CSVContact {
  phone: string
  name?: string
  amount?: string
}

export default function UploadContactsTab() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const { user } = useAuth()

  const downloadCSVTemplate = () => {
    // Create CSV content
    const csvContent = [
      'phone,name,amount',
      '+2348012345678,John Doe,15000.50',
      '+2348023456789,Jane Smith,25000.00',
      '+2348034567890,Michael Johnson,35000.75'
    ].join('\n')

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sms_contacts_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('CSV template downloaded successfully!')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
    } else {
      toast.error('Please select a valid CSV file')
    }
  }

  const parseCSV = async (file: File): Promise<CSVContact[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          
          if (!headers.includes('phone')) {
            throw new Error('CSV must contain a "phone" column')
          }

          const contacts: CSVContact[] = []
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue
            
            const values = lines[i].split(',').map(v => v.trim())
            const contact: CSVContact = { phone: '' }
            
            headers.forEach((header, index) => {
              if (header === 'phone') contact.phone = values[index]
              if (header === 'name') contact.name = values[index]
              if (header === 'amount') contact.amount = values[index]
            })
            
            if (contact.phone) {
              contacts.push(contact)
            }
          }
          
          resolve(contacts)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  const handleUpload = async () => {
    if (!file || !user) return
    
    setProcessing(true)
    try {
      const contacts = await parseCSV(file)
      
      // Validate phone numbers
      const invalidPhones = contacts.filter(contact => 
        !contact.phone.startsWith('+') || contact.phone.length < 10
      )
      
      if (invalidPhones.length > 0) {
        throw new Error(`Invalid phone numbers found. Please include country code (e.g., +234...)`)
      }

      // Insert contacts into Supabase
      const { error } = await supabase
        .from('contacts')
        .insert(
          contacts.map(contact => ({
            owner_id: user.id,
            phone: contact.phone,
            name: contact.name || null,
            amount: contact.amount ? parseFloat(contact.amount) : null,
            sent: false,
            batch_date: new Date().toISOString().split('T')[0]
          }))
        )

      if (error) throw error

      toast.success(`Successfully uploaded ${contacts.length} contacts!`)
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (error: any) {
      toast.error(error.message || 'Failed to process CSV file')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Contacts</CardTitle>
        <CardDescription>
          Upload a CSV file with phone numbers and contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Template Button */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Need a template?</h3>
              <p className="text-sm text-blue-600">
                Download our CSV template to ensure proper formatting
              </p>
            </div>
            <Button 
              onClick={downloadCSVTemplate} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
            disabled={processing}
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">CSV files only</p>
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <Button onClick={handleUpload} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process File'
              )}
            </Button>
          </div>
        )}

        {/* CSV Format Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">CSV Format Requirements:</h3>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• <strong>Required column:</strong> <code>phone</code> (with country code, e.g., +2348012345678)</li>
            <li>• <strong>Optional columns:</strong> <code>name</code>, <code>amount</code></li>
            <li>• Header row is required</li>
            <li>• File must be UTF-8 encoded</li>
            <li>• Maximum file size: 5MB</li>
          </ul>
          
          <div className="mt-3 p-3 bg-white rounded border">
            <h4 className="font-medium text-blue-800 mb-1">Example CSV structure:</h4>
            <pre className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
{`phone,name,amount
+2348012345678,John Doe,15000.50
+2348023456789,Jane Smith,25000.00
+2348034567890,Michael Johnson,35000.75`}
            </pre>
          </div>
        </div>

        {/* Validation Tips */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Validation Tips:</h3>
          <ul className="text-sm text-yellow-600 space-y-1">
            <li>• Phone numbers must start with <code>+</code> followed by country code</li>
            <li>• Amounts should be numeric values (decimals allowed)</li>
            <li>• Avoid special characters in names</li>
            <li>• Remove any empty rows from your CSV</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
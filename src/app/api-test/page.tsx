'use client'

import { useState } from 'react'
import { NavBar } from '@/components/nav-bar'

interface TestResult {
  endpoint: string
  method: string
  status: number
  duration: number
  request: any
  response: any
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const testEndpoint = async (
    endpoint: string,
    method: string,
    body?: any,
    isFormData = false
  ) => {
    const startTime = Date.now()

    try {
      const options: RequestInit = {
        method,
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
      }

      const response = await fetch(endpoint, options)
      const duration = Date.now() - startTime
      const data = await response.json()

      const result: TestResult = {
        endpoint,
        method,
        status: response.status,
        duration,
        request: body,
        response: data
      }

      setResults(prev => [...prev, result])
      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      const result: TestResult = {
        endpoint,
        method,
        status: 0,
        duration,
        request: body,
        response: { error: error.message }
      }
      setResults(prev => [...prev, result])
      return result
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    setResults([])

    // Test 1: DataShopper Webhook
    await testEndpoint('/api/webhooks/datashopper', 'POST', {
      event_type: 'leads.single',
      workspace_id: 'test-workspace',
      lead: {
        email: 'test@datashopper.com',
        first_name: 'Test',
        last_name: 'DataShopper',
        company_name: 'DataShopper Test Co',
        company_industry: 'Healthcare',
        company_location: { state: 'CA', country: 'US' },
        job_title: 'CEO'
      }
    })

    // Test 2: Clay Webhook
    await testEndpoint('/api/webhooks/clay', 'POST', {
      event_type: 'enrichment.completed',
      clay_record_id: 'clay_test_123',
      person: {
        full_name: 'Test Clay User',
        email: 'test@clay.com',
        phone: '+1-555-0123',
        linkedin_url: 'https://linkedin.com/in/test'
      },
      company: {
        name: 'Clay Test Company',
        domain: 'claytest.com',
        industry: 'Healthcare'
      }
    })

    // Test 3: Audience Labs Webhook
    await testEndpoint('/api/webhooks/audience-labs', 'POST', {
      event_type: 'import.batch',
      import_job_id: 'import_test_456',
      workspace_id: 'test-workspace',
      leads: [
        {
          id: 'al_test_1',
          first_name: 'Test',
          last_name: 'AudienceLabs',
          email: 'test@audiencelabs.com',
          company_name: 'AudienceLabs Test',
          company_industry: 'HVAC',
          location: { state: 'TX', country: 'US' },
          job_title: 'Manager'
        }
      ]
    })

    // Test 4: CSV Bulk Upload
    const csvContent = `company_name,industry,state,country,email,workspace_id
Test Company 1,Healthcare,CA,US,test1@test.com,test-workspace
Test Company 2,HVAC,TX,US,test2@test.com,test-workspace
Test Company 3,Solar,WA,US,test3@test.com,test-workspace`

    const formData = new FormData()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    formData.append('file', blob, 'test.csv')
    formData.append('source', 'csv')

    await testEndpoint('/api/leads/bulk-upload', 'POST', formData, true)

    setTesting(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-xl font-semibold text-zinc-900 mb-8">API Endpoint Testing</h1>

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-6 mb-8">
            <div className="flex gap-3 mb-6">
              <button
                onClick={runAllTests}
                disabled={testing}
                className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Run All Tests'}
              </button>
              <button
                onClick={clearResults}
                disabled={testing}
                className="h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 disabled:opacity-50"
              >
                Clear Results
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <div className="text-[13px] text-zinc-600 mb-1">Total Tests</div>
                <div className="text-2xl font-semibold text-zinc-900">{results.length}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="text-[13px] text-emerald-700 mb-1">Successful</div>
                <div className="text-2xl font-semibold text-emerald-700">
                  {results.filter(r => r.status >= 200 && r.status < 300).length}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-[13px] text-red-700 mb-1">Failed</div>
                <div className="text-2xl font-semibold text-red-700">
                  {results.filter(r => r.status === 0 || r.status >= 400).length}
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <div className="text-[13px] text-zinc-600 mb-1">Avg Duration</div>
                <div className="text-2xl font-semibold text-zinc-900">
                  {results.length > 0
                    ? Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)
                    : 0}ms
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white border border-zinc-200 rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-zinc-900">{result.endpoint}</h3>
                    <p className="text-[13px] text-zinc-600 mt-1">{result.method}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium ${
                        result.status >= 200 && result.status < 300
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {result.status === 0 ? 'ERROR' : result.status}
                    </span>
                    <p className="text-[12px] text-zinc-500 mt-1">{result.duration}ms</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[13px] font-semibold text-zinc-900 mb-2">Request</h4>
                    <pre className="bg-zinc-900 text-emerald-400 p-4 rounded-lg text-[12px] overflow-auto max-h-64">
                      {JSON.stringify(result.request, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-zinc-900 mb-2">Response</h4>
                    <pre className="bg-zinc-900 text-emerald-400 p-4 rounded-lg text-[12px] overflow-auto max-h-64">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length === 0 && !testing && (
            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-12 text-center">
              <p className="text-[13px] text-zinc-500">No tests run yet. Click "Run All Tests" to begin.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

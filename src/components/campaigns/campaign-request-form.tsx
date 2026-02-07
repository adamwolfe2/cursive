'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Sparkles, Target, Users, Mail, Zap, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import { useToast } from '@/lib/hooks/use-toast'

const campaignRequestSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  contact_name: z.string().min(2, 'Your name is required'),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string().optional(),

  // ICP Details
  target_industry: z.string().min(1, 'Target industry is required'),
  target_company_size: z.string().min(1, 'Target company size is required'),
  target_job_titles: z.string().min(5, 'Target job titles are required'),
  geographic_focus: z.string().min(2, 'Geographic focus is required'),

  // Campaign Goals
  campaign_goal: z.string().min(1, 'Campaign goal is required'),
  monthly_budget: z.string().min(1, 'Budget range is required'),
  expected_volume: z.string().min(1, 'Expected lead volume is required'),

  // Value Proposition
  unique_value_prop: z.string().min(20, 'Please describe your unique value (min 20 characters)'),
  pain_points_addressed: z.string().min(20, 'Please describe pain points you address (min 20 characters)'),

  // Additional Info
  current_challenges: z.string().optional(),
  timeline: z.string().min(1, 'Timeline is required'),
})

type CampaignRequestFormData = z.infer<typeof campaignRequestSchema>

const INDUSTRIES = [
  'Technology/SaaS',
  'Healthcare',
  'Finance/Banking',
  'Real Estate',
  'Manufacturing',
  'Retail/E-commerce',
  'Professional Services',
  'Education',
  'Other',
]

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
]

const BUDGET_RANGES = [
  'Less than $2,000/month',
  '$2,000 - $5,000/month',
  '$5,000 - $10,000/month',
  '$10,000 - $20,000/month',
  '$20,000+/month',
]

const LEAD_VOLUMES = [
  '50-100 leads/month',
  '100-250 leads/month',
  '250-500 leads/month',
  '500-1000 leads/month',
  '1000+ leads/month',
]

const CAMPAIGN_GOALS = [
  'Lead Generation',
  'Product Launch',
  'Event Promotion',
  'Partnership Outreach',
  'Customer Expansion',
  'Re-engagement',
]

const TIMELINES = [
  'ASAP (Within 2 weeks)',
  '2-4 weeks',
  '1-2 months',
  '2-3 months',
  'Flexible',
]

export function CampaignRequestForm() {
  const router = useRouter()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignRequestFormData>({
    resolver: zodResolver(campaignRequestSchema),
  })

  const onSubmit = async (data: CampaignRequestFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/campaigns/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit campaign request')
      }

      toast.success('Campaign request submitted successfully!')
      router.push('/campaigns/request/success')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Powered by EmailBison
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Apply for a Custom Email Campaign
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let our experts craft a high-converting email campaign tailored to your ICP.
            Fill out the form below and we'll reach out within 24 hours.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">ICP Targeting</h3>
              </div>
              <p className="text-sm text-gray-600">
                Precision targeting based on your ideal customer profile
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold">Expert Copywriting</h3>
              </div>
              <p className="text-sm text-gray-600">
                Compelling email sequences written by conversion specialists
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold">Managed Service</h3>
              </div>
              <p className="text-sm text-gray-600">
                Full campaign management and optimization included
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Campaign Request Details</CardTitle>
              <CardDescription>
                Tell us about your company and campaign goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      autoComplete="organization"
                      {...register('company_name')}
                      placeholder="Your company name"
                    />
                    {errors.company_name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.company_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_name">Your Name *</Label>
                    <Input
                      id="contact_name"
                      autoComplete="name"
                      {...register('contact_name')}
                      placeholder="Your full name"
                    />
                    {errors.contact_name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.contact_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_email">Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      {...register('contact_email')}
                      placeholder="john@acme.com"
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.contact_email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_phone">Phone (Optional)</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      {...register('contact_phone')}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* ICP Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Ideal Customer Profile (ICP)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_industry">Target Industry *</Label>
                    <Select
                      onValueChange={(value) => setValue('target_industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.target_industry && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.target_industry.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="target_company_size">Target Company Size *</Label>
                    <Select
                      onValueChange={(value) => setValue('target_company_size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.target_company_size && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.target_company_size.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="target_job_titles">Target Job Titles *</Label>
                    <Input
                      id="target_job_titles"
                      {...register('target_job_titles')}
                      placeholder="e.g., VP Sales, Director of Marketing"
                    />
                    {errors.target_job_titles && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.target_job_titles.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="geographic_focus">Geographic Focus *</Label>
                    <Input
                      id="geographic_focus"
                      {...register('geographic_focus')}
                      placeholder="e.g., United States, EMEA, Global"
                    />
                    {errors.geographic_focus && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.geographic_focus.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Campaign Goals */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Campaign Goals & Budget
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign_goal">Primary Goal *</Label>
                    <Select
                      onValueChange={(value) => setValue('campaign_goal', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPAIGN_GOALS.map((goal) => (
                          <SelectItem key={goal} value={goal}>
                            {goal}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.campaign_goal && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.campaign_goal.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="monthly_budget">Monthly Budget *</Label>
                    <Select
                      onValueChange={(value) => setValue('monthly_budget', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((budget) => (
                          <SelectItem key={budget} value={budget}>
                            {budget}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.monthly_budget && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.monthly_budget.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="expected_volume">Expected Lead Volume *</Label>
                    <Select
                      onValueChange={(value) => setValue('expected_volume', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select volume" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_VOLUMES.map((volume) => (
                          <SelectItem key={volume} value={volume}>
                            {volume}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.expected_volume && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.expected_volume.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="timeline">Timeline *</Label>
                    <Select onValueChange={(value) => setValue('timeline', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMELINES.map((timeline) => (
                          <SelectItem key={timeline} value={timeline}>
                            {timeline}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.timeline && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.timeline.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Value Proposition
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="unique_value_prop">
                      What makes your offering unique? *
                    </Label>
                    <Textarea
                      id="unique_value_prop"
                      {...register('unique_value_prop')}
                      placeholder="Describe what sets you apart from competitors..."
                      rows={4}
                    />
                    {errors.unique_value_prop && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.unique_value_prop.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pain_points_addressed">
                      What pain points do you address? *
                    </Label>
                    <Textarea
                      id="pain_points_addressed"
                      {...register('pain_points_addressed')}
                      placeholder="Describe the key problems you solve for customers..."
                      rows={4}
                    />
                    {errors.pain_points_addressed && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.pain_points_addressed.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="current_challenges">
                      Current Marketing Challenges (Optional)
                    </Label>
                    <Textarea
                      id="current_challenges"
                      {...register('current_challenges')}
                      placeholder="What challenges are you currently facing with lead generation?"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                <p className="text-sm text-gray-500 text-center sm:text-left">
                  We'll review your request and contact you within 24 hours
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto sm:min-w-[200px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}

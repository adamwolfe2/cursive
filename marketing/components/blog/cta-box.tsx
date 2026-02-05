import { Button } from '../ui/button'
import { ArrowRight, Sparkles, Target, Zap } from 'lucide-react'

type CTAVariant = 'demo' | 'trial' | 'pricing' | 'newsletter'

interface CTABoxProps {
  variant?: CTAVariant
  customTitle?: string
  customDescription?: string
  customButtonText?: string
  customButtonHref?: string
}

const ctaConfig: Record<
  CTAVariant,
  {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    buttonText: string
    buttonHref: string
    accentColor: string
  }
> = {
  demo: {
    icon: Target,
    title: 'See Cursive in action',
    description:
      'Book a personalized demo and discover how Cursive identifies 70% of your anonymous website visitors and turns them into qualified leads.',
    buttonText: 'Book Your Demo',
    buttonHref: 'https://cal.com/adamwolfe/cursive-ai-audit',
    accentColor: 'bg-blue-50 border-blue-200',
  },
  trial: {
    icon: Zap,
    title: 'Start identifying visitors today',
    description:
      'Install our tracking pixel in 5 minutes and start seeing which companies are visiting your site. No credit card required.',
    buttonText: 'Get Started Free',
    buttonHref: '/signup',
    accentColor: 'bg-green-50 border-green-200',
  },
  pricing: {
    icon: Sparkles,
    title: 'Ready to grow your pipeline?',
    description:
      'Explore our flexible pricing plans designed for B2B SaaS companies, agencies, and enterprise sales teams.',
    buttonText: 'View Pricing',
    buttonHref: '/pricing',
    accentColor: 'bg-purple-50 border-purple-200',
  },
  newsletter: {
    icon: Sparkles,
    title: 'Get weekly lead gen insights',
    description:
      'Join 5,000+ marketers receiving our weekly newsletter with actionable tactics for visitor identification and lead generation.',
    buttonText: 'Subscribe Now',
    buttonHref: '/newsletter',
    accentColor: 'bg-orange-50 border-orange-200',
  },
}

export function CTABox({
  variant = 'demo',
  customTitle,
  customDescription,
  customButtonText,
  customButtonHref,
}: CTABoxProps) {
  const config = ctaConfig[variant]
  const Icon = config.icon

  const title = customTitle || config.title
  const description = customDescription || config.description
  const buttonText = customButtonText || config.buttonText
  const buttonHref = customButtonHref || config.buttonHref

  return (
    <div
      className={`border-2 rounded-lg p-6 md:p-8 my-8 print:hidden ${config.accentColor}`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-3">
            <Icon className="h-6 w-6 text-[#007AFF] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-gray-700">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button
            href={buttonHref}
            target={buttonHref.startsWith('http') ? '_blank' : undefined}
            size="lg"
            className="w-full md:w-auto"
          >
            {buttonText}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getServiceLink } from '@/lib/stripe/payment-links'

export function ServiceTiersCard() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Need More Than Software?</CardTitle>
          <Link
            href="/services"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All Services →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Explore done-for-you services from custom lead lists to full-service growth partnership.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Cursive Data */}
          <a
            href={getServiceLink('data')}
            className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              Cursive Data
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Custom lead lists delivered monthly
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">$1k-3k</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </a>

          {/* Cursive Outbound */}
          <a
            href={getServiceLink('outbound')}
            className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              Cursive Outbound
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Done-for-you email campaigns
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">$3-5k</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">+ $2.5k setup</p>
          </a>

          {/* Cursive Pipeline */}
          <a
            href={getServiceLink('pipeline')}
            className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              Cursive Pipeline
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Full pipeline with AI SDR
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">$5-10k</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">+ $5k setup</p>
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Get custom pricing and white-glove service with Cursive Studio
            </p>
            <Link
              href="/services/contact"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors text-sm"
            >
              Contact Sales
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

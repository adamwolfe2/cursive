'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'

interface ReferralStats {
  referralCode: string
  totalReferrals: number
  successfulReferrals: number
  totalCreditsEarned: number
  pendingReferrals: number
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/referrals')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/signup?ref=${stats.referralCode}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/signup?ref=${stats.referralCode}`
      const text = `Join me on the Lead Marketplace! Sign up with my referral link and get $10 in free credits: ${link}`

      if (navigator.share) {
        navigator.share({
          title: 'Join Lead Marketplace',
          text: text,
          url: link,
        })
      } else {
        copyReferralLink()
      }
    }
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Referral Program</h1>
              <p className="text-[13px] text-zinc-500 mt-1">Invite friends and earn credits</p>
            </div>
            <Link
              href="/marketplace"
              className="h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Marketplace
            </Link>
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 mb-8 text-white">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px] font-semibold">1</span>
                </div>
                <div>
                  <p className="text-[14px] font-medium">Share your link</p>
                  <p className="text-[13px] text-white/80 mt-1">Send your unique referral link to friends</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px] font-semibold">2</span>
                </div>
                <div>
                  <p className="text-[14px] font-medium">They sign up</p>
                  <p className="text-[13px] text-white/80 mt-1">Your friend creates an account and gets $10 credits</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px] font-semibold">3</span>
                </div>
                <div>
                  <p className="text-[14px] font-medium">You earn $25</p>
                  <p className="text-[13px] text-white/80 mt-1">When they make their first purchase, you get $25 credits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-8">
            <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Your Referral Link</h3>
            {isLoading ? (
              <div className="h-12 bg-zinc-100 rounded animate-pulse" />
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
                  <p className="text-[13px] text-zinc-500 mb-1">Referral Link</p>
                  <p className="text-[14px] font-mono text-zinc-900 truncate">
                    {window.location.origin}/signup?ref={stats?.referralCode}
                  </p>
                </div>
                <button
                  onClick={copyReferralLink}
                  className="h-auto px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={shareReferralLink}
                  className="h-auto px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-100">
              <p className="text-[12px] text-zinc-500">
                Your referral code: <span className="font-mono font-medium">{stats?.referralCode}</span>
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <p className="text-[12px] text-zinc-500 mb-1">Total Referrals</p>
              {isLoading ? (
                <div className="h-7 w-12 bg-zinc-100 rounded animate-pulse" />
              ) : (
                <p className="text-xl font-semibold text-zinc-900">{stats?.totalReferrals || 0}</p>
              )}
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <p className="text-[12px] text-zinc-500 mb-1">Successful</p>
              {isLoading ? (
                <div className="h-7 w-12 bg-zinc-100 rounded animate-pulse" />
              ) : (
                <p className="text-xl font-semibold text-zinc-900">{stats?.successfulReferrals || 0}</p>
              )}
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <p className="text-[12px] text-zinc-500 mb-1">Pending</p>
              {isLoading ? (
                <div className="h-7 w-12 bg-zinc-100 rounded animate-pulse" />
              ) : (
                <p className="text-xl font-semibold text-zinc-900">{stats?.pendingReferrals || 0}</p>
              )}
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <p className="text-[12px] text-zinc-500 mb-1">Credits Earned</p>
              {isLoading ? (
                <div className="h-7 w-12 bg-zinc-100 rounded animate-pulse" />
              ) : (
                <p className="text-xl font-semibold text-emerald-600">${stats?.totalCreditsEarned || 0}</p>
              )}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-[13px] font-medium text-zinc-900 mb-1">How much do I earn per referral?</h4>
                <p className="text-[13px] text-zinc-600">
                  You earn $25 in credits when someone signs up with your link and makes their first purchase.
                  Your friend gets $10 in credits just for signing up!
                </p>
              </div>
              <div>
                <h4 className="text-[13px] font-medium text-zinc-900 mb-1">Is there a limit to how many people I can refer?</h4>
                <p className="text-[13px] text-zinc-600">
                  No! There's no limit. Refer as many friends as you'd like and earn credits for each successful referral.
                </p>
              </div>
              <div>
                <h4 className="text-[13px] font-medium text-zinc-900 mb-1">When do I receive my credits?</h4>
                <p className="text-[13px] text-zinc-600">
                  Credits are added to your account as soon as your referred friend completes their first purchase.
                </p>
              </div>
              <div>
                <h4 className="text-[13px] font-medium text-zinc-900 mb-1">Do credits expire?</h4>
                <p className="text-[13px] text-zinc-600">
                  No, credits never expire. Use them whenever you're ready to purchase leads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

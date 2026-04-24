import { useEffect, useState } from 'react'
import { lookupCallCard, reportSpam } from '../lib/api'
import { CallCardData, StatusType } from '../lib/types'
import { LookupResultPanel } from '../components/blocks/LookupResultPanel'
import { LookupActionsSidebar } from '../components/blocks/LookupActionsSidebar'
import {
  BusinessValueSection,
  DownloadCtaSection,
  HowItWorksSection,
  PublicHeroSection,
  ReceiverExperienceSection,
  SocialProofSection,
  SupportSection,
} from '../components/blocks/PublicProductSections'

const defaultPhone = '+358401234567'
const unknownScenarioPhone = '+358409876543'
const suspiciousScenarioPhone = '+358408887766'

type DemoMode = 'guided' | 'live'
type DemoScenarioKey = 'verified' | 'unknown' | 'suspicious'

interface GuidedScenario {
  key: DemoScenarioKey
  eyebrow: string
  title: string
  detail: string
  phone: string
  outcomeLabel: string
  outcomeSummary: string
  meaning: string
  nextStep: string
  statusType: StatusType
  liveStatus: string
  notFound?: boolean
  callCard?: CallCardData
}

const guidedScenarios: Record<DemoScenarioKey, GuidedScenario> = {
  verified: {
    key: 'verified',
    eyebrow: 'Verified caller',
    title: 'Trusted business call with a clear reason',
    detail: 'Start with the strongest product story: a legitimate caller, a visible reason for outreach, and a confident recommendation.',
    phone: defaultPhone,
    outcomeLabel: 'Trusted',
    outcomeSummary: 'This is the ideal experience: the receiver sees who is calling, why the call matters, and whether it is safe to answer.',
    meaning: 'A verified number with a strong trust score turns an unknown incoming call into a recognisable business interaction.',
    nextStep: 'Show this state first so users immediately understand the core value before trying edge cases.',
    statusType: 'success',
    liveStatus: 'Verified demo match loaded. This caller card reflects the selected guided scenario.',
    callCard: {
      found: true,
      phone_number: defaultPhone,
      company_name: 'Nordic Health',
      label: 'Appointments',
      verified: true,
      trust_score: 96,
      spam_reports: 0,
      lookup_count: 128,
      risk_level: 'low',
      recommendation: 'Trusted caller',
      reason_title: 'Appointment confirmation',
      reason_description: 'A verified clinic coordinator is calling to confirm a booked appointment and share arrival instructions.',
      priority: 'High priority',
    },
  },
  unknown: {
    key: 'unknown',
    eyebrow: 'Unknown number',
    title: 'No verified caller profile is available yet',
    detail: 'Use this scenario to explain what the product does when the registry has no trusted match for a number.',
    phone: unknownScenarioPhone,
    outcomeLabel: 'No match',
    outcomeSummary: 'The product still gives a useful answer: no verified record, no trust signal, and a clear prompt to stay cautious.',
    meaning: 'An unknown result is still valuable because it stops the experience from feeling ambiguous. No match means no verified trust.',
    nextStep: 'Invite the user to verify identity another way or try a different number in the live registry.',
    statusType: 'info',
    liveStatus: 'No verified caller profile was found. This matches the selected unknown-number scenario.',
    notFound: true,
  },
  suspicious: {
    key: 'suspicious',
    eyebrow: 'Suspicious caller',
    title: 'A recognised number with degraded trust signals',
    detail: 'This scenario shows that caller recognition alone is not enough. Spam reports and weak trust should still trigger caution.',
    phone: suspiciousScenarioPhone,
    outcomeLabel: 'Suspicious',
    outcomeSummary: 'The product can still surface a caller profile while warning the receiver not to treat the call as fully safe.',
    meaning: 'This is the nuanced case: a known number can become risky when trust drops or reports increase.',
    nextStep: 'Use the recommendation and reason together before deciding whether to answer, ignore, or report the call.',
    statusType: 'info',
    liveStatus: 'Suspicious demo match loaded. The caller card reflects the selected high-risk scenario.',
    callCard: {
      found: true,
      phone_number: suspiciousScenarioPhone,
      company_name: 'Northline Billing',
      label: 'Collections desk',
      verified: true,
      trust_score: 34,
      spam_reports: 4,
      lookup_count: 19,
      risk_level: 'high',
      recommendation: 'Likely suspicious',
      reason_title: 'Outstanding payment reminder',
      reason_description: 'The caller is recognised, but repeated reports and low trust indicate the receiver should verify the request before engaging.',
      priority: 'Review carefully',
    },
  },
}

function scenarioForPhone(phoneNumber: string): GuidedScenario | null {
  const normalizedPhone = phoneNumber.trim()

  for (const scenario of Object.values(guidedScenarios)) {
    if (scenario.phone === normalizedPhone) {
      return scenario
    }
  }

  return null
}

export default function TrustPlatformPage() {
  const [phone, setPhone] = useState(defaultPhone)
  const [status, setStatus] = useState('Guided demo is showing a trusted verified caller. Try another number against the live registry below.')
  const [statusType, setStatusType] = useState<StatusType>('idle')
  const [demoMode, setDemoMode] = useState<DemoMode>('guided')
  const [selectedScenario, setSelectedScenario] = useState<DemoScenarioKey>('verified')
  const [liveCallCard, setLiveCallCard] = useState<CallCardData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const activeScenario = guidedScenarios[selectedScenario]
  const displayedCallCard = demoMode === 'live' ? liveCallCard : activeScenario.callCard ?? null
  const displayedNotFound = demoMode === 'live' ? notFound : Boolean(activeScenario.notFound)
  const displayedStatus = demoMode === 'live' ? status : activeScenario.outcomeSummary
  const displayedStatusType = demoMode === 'live' ? statusType : activeScenario.statusType

  useEffect(() => {
    if (!reportSuccess) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setReportSuccess(false)
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [reportSuccess])

  async function handleLookup() {
    const trimmedPhone = phone.trim()

    if (!trimmedPhone) {
      setStatusType('error')
      setStatus('Please enter a phone number.')
      return
    }

    setDemoMode('live')
    setLoading(true)
    setStatusType('loading')
    setStatus('Checking the live registry for this number...')
    setLiveCallCard(null)
    setNotFound(false)

    try {
      const matchedScenario = scenarioForPhone(trimmedPhone)
      if (matchedScenario) {
        setSelectedScenario(matchedScenario.key)
        setNotFound(Boolean(matchedScenario.notFound))
        setLiveCallCard(matchedScenario.callCard ?? null)
        setStatusType(matchedScenario.statusType)
        setStatus(matchedScenario.liveStatus)
        return
      }

      const result = await lookupCallCard(trimmedPhone)
      if (!result.found) {
        setNotFound(true)
        setStatusType('info')
        setStatus('No verified caller profile was found. Treat this number as unverified until you can confirm identity.')
        return
      }
      setLiveCallCard(result)
      setStatusType('success')
      setStatus('Live registry match found. The caller trust card is ready below.')
    } catch (error) {
      console.error(error)
      setStatusType('error')
      setStatus('Could not fetch call card.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReportSpam() {
    if (!liveCallCard?.phone_number) {
      setStatusType('error')
      setStatus('Run a live lookup match first before reporting spam.')
      return
    }

    setReporting(true)
    setStatusType('loading')
    setStatus('Reporting spam...')

    try {
      await reportSpam(liveCallCard.phone_number)
      setReportSuccess(true)
      setStatusType('success')
      setStatus('Spam report submitted.')
      await handleLookup()
    } catch (error) {
      console.error(error)
      setStatusType('error')
      setStatus('Could not report spam.')
    } finally {
      setReporting(false)
    }
  }

  function handleSelectScenario(key: string) {
    if (!(key in guidedScenarios)) {
      return
    }

    const nextKey = key as DemoScenarioKey
    const nextScenario = guidedScenarios[nextKey]
    setSelectedScenario(nextKey)
    setDemoMode('guided')
    setPhone(nextScenario.phone)
    setReportSuccess(false)
  }

  function handlePhoneChange(value: string) {
    setPhone(value)

    const matchedScenario = scenarioForPhone(value)
    if (matchedScenario) {
      setSelectedScenario(matchedScenario.key)
    }
  }

  return (
    <main className="px-4 pb-12 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <PublicHeroSection
          selectedScenario={selectedScenario}
          scenarios={Object.values(guidedScenarios)}
          phone={phone}
          status={status}
          statusType={statusType}
          loading={loading}
          onSelectScenario={handleSelectScenario}
          onPhoneChange={handlePhoneChange}
          onLookup={handleLookup}
        />

        <section className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
          <LookupResultPanel
            loading={loading}
            notFound={displayedNotFound}
            callCard={displayedCallCard}
            status={displayedStatus}
            statusType={displayedStatusType}
            isLiveResult={demoMode === 'live'}
            scenario={activeScenario}
          />
          <LookupActionsSidebar
            callCard={displayedCallCard}
            loading={loading}
            reporting={reporting}
            reportSuccess={reportSuccess}
            isLiveResult={demoMode === 'live'}
            scenario={activeScenario}
            onLookup={handleLookup}
            onReportSpam={handleReportSpam}
          />
        </section>

        <HowItWorksSection />
        <ReceiverExperienceSection />
        <BusinessValueSection />
        <SocialProofSection />
        <DownloadCtaSection />
        <SupportSection />
      </div>
    </main>
  )
}

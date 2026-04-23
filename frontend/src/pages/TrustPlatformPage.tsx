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

export default function TrustPlatformPage() {
  const [phone, setPhone] = useState(defaultPhone)
  const [status, setStatus] = useState('Enter a phone number to lookup.')
  const [statusType, setStatusType] = useState<StatusType>('idle')
  const [callCard, setCallCard] = useState<CallCardData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

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

    setLoading(true)
    setStatusType('loading')
    setStatus('Looking up number...')
    setCallCard(null)
    setNotFound(false)

    try {
      const result = await lookupCallCard(trimmedPhone)
      if (!result.found) {
        setNotFound(true)
        setStatusType('info')
        setStatus('Lookup completed. Number not found.')
        return
      }
      setCallCard(result)
      setStatusType('success')
      setStatus('Lookup completed.')
    } catch (error) {
      console.error(error)
      setStatusType('error')
      setStatus('Could not fetch call card.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReportSpam() {
    if (!callCard?.phone_number) {
      setStatusType('error')
      setStatus('Lookup a phone number first.')
      return
    }

    setReporting(true)
    setStatusType('loading')
    setStatus('Reporting spam...')

    try {
      await reportSpam(callCard.phone_number)
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

  return (
    <main className="px-4 pb-12 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <PublicHeroSection
          phone={phone}
          status={status}
          statusType={statusType}
          loading={loading}
          onPhoneChange={setPhone}
          onLookup={handleLookup}
        />

        <section className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
          <LookupResultPanel loading={loading} notFound={notFound} callCard={callCard} status={status} statusType={statusType} />
          <LookupActionsSidebar
            callCard={callCard}
            loading={loading}
            reporting={reporting}
            reportSuccess={reportSuccess}
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

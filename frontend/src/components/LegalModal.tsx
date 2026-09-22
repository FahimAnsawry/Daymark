import { useEffect } from 'react'
import { FileText, ShieldCheck, X } from 'lucide-react'

export type LegalModalType = 'terms' | 'privacy'

interface LegalModalProps {
  type: LegalModalType | null
  onClose: () => void
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!type) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [type, onClose])

  if (!type) return null

  const isTerms = type === 'terms'

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center p-4 bg-[#0a1813]/62 backdrop-blur-[5px] animate-[modalFadeIn_0.2s_ease-out]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="relative w-full max-w-[540px] max-h-[min(85vh,680px)] flex flex-col bg-[#fafbf8] dark:bg-[#14221c] border border-[#d4ded4] dark:border-[#a7d0ab]/22 rounded-lg shadow-[0_16px_40px_rgba(12,33,26,0.22)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden animate-[modalSlideUp_0.24s_cubic-bezier(0.16,1,0.3,1)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="flex items-start justify-between gap-3 p-[18px_20px_14px] border-b border-[#e1e8e2] dark:border-[#a7d0ab]/15">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-9 h-9 rounded-full bg-[#e3ece5] dark:bg-[#a7d0ab]/16 text-[#204934] dark:text-[#a7d0ab] shrink-0" aria-hidden="true">
              {isTerms ? <FileText size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h2 id="legal-modal-title" className="m-0 font-serif text-[1.22rem] font-bold text-[#182e24] dark:text-[#e7efe9] leading-tight">
                {isTerms ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <p className="mt-0.5 text-[0.72rem] text-[#738479] dark:text-[#91a397] font-medium">
                Daymark Platform • Updated September 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            className="grid place-items-center w-8 h-8 rounded border-0 bg-transparent text-[#738479] dark:text-[#8fa196] cursor-pointer transition-colors hover:bg-[#ebf1ec] dark:hover:bg-[#a7d0ab]/15 hover:text-[#203127] dark:hover:text-[#f0f7f2]"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-[18px_20px]">
          {isTerms ? (
            <div className="flex flex-col gap-4">
              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">1. Acceptance of Terms</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  By creating an account or using Daymark, you agree to comply with and be bound by these Terms of Service. If you do not agree with any portion of these terms, you should discontinue use of the service.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">2. Account Registration & Security</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  You agree to provide accurate and complete registration information. You are solely responsible for safeguarding your credentials and for all activities conducted through your account. Notify us immediately if you suspect unauthorized access.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">3. Content Ownership & Rights</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  You retain 100% ownership of your tasks, notes, journal reflections, and personal entries created within Daymark. We claim no intellectual property rights over the material you provide to the service.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">4. Acceptable Conduct</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  Daymark is crafted for mindful productivity and personal reflection. You agree not to misuse our systems, attempt unauthorized penetration testing, reverse engineer platform assets, or disrupt other members’ service.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">5. Service Availability & Changes</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  We continuously improve Daymark to provide an exceptional experience. We may occasionally update features or modify functionality, and significant revisions to these terms will be communicated in advance.
                </p>
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">1. Our Privacy Commitment</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  Daymark is built with privacy as a foundational principle. Your daily logs, journal thoughts, and task workflows are private to you. We do not sell your personal data or journaling habits to advertisers or third-party data brokers.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">2. Information We Collect</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  We collect only the essential information needed to operate your account: your name, email address, and encrypted credentials. If you choose to sign in with Google, we securely receive your verified name and email.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">3. Data Protection & Encryption</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  All data transmitted to and from Daymark is protected using TLS encryption. Data stored in our database is secured with enterprise-grade encryption at rest and strict access controls.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">4. Your Rights & Data Export</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  You own your data. You may export your logs or delete your account along with all associated records at any time from your account settings.
                </p>
              </section>

              <section>
                <h3 className="m-0 mb-1 text-[0.85rem] font-bold text-[#1e362a] dark:text-[#cde0d2] tracking-tight">5. Policy Updates</h3>
                <p className="m-0 text-[0.8rem] leading-[1.55] text-[#43544a] dark:text-[#a5b7ac]">
                  If our privacy practices evolve, we will update this policy and provide noticeable notice through the application interface before changes take effect.
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="flex justify-end p-[12px_20px_16px] border-t border-[#e1e8e2] dark:border-[#a7d0ab]/15 bg-[#f4f7f4] dark:bg-[#101b16]">
          <button
            type="button"
            className="px-[18px] py-2 border border-[#244934] dark:border-[#3b7454] rounded-[3px] bg-[#244934] dark:bg-[#2b563e] text-white text-[0.8rem] font-bold cursor-pointer transition-all hover:bg-[#356248] dark:hover:bg-[#386d4f] hover:-translate-y-0.5"
            onClick={onClose}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}

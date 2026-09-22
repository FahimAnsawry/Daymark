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
      className="legal-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="legal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="legal-modal-header">
          <div className="legal-modal-title-wrap">
            <div className="legal-modal-icon-badge" aria-hidden="true">
              {isTerms ? <FileText size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h2 id="legal-modal-title" className="legal-modal-title">
                {isTerms ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <p className="legal-modal-subtitle">
                Daymark Platform • Updated September 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            className="legal-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="legal-modal-body">
          {isTerms ? (
            <div className="legal-content">
              <section className="legal-section">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By creating an account or using Daymark, you agree to comply with and be bound by these Terms of Service. If you do not agree with any portion of these terms, you should discontinue use of the service.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Account Registration & Security</h3>
                <p>
                  You agree to provide accurate and complete registration information. You are solely responsible for safeguarding your credentials and for all activities conducted through your account. Notify us immediately if you suspect unauthorized access.
                </p>
              </section>

              <section className="legal-section">
                <h3>3. Content Ownership & Rights</h3>
                <p>
                  You retain 100% ownership of your tasks, notes, journal reflections, and personal entries created within Daymark. We claim no intellectual property rights over the material you provide to the service.
                </p>
              </section>

              <section className="legal-section">
                <h3>4. Acceptable Conduct</h3>
                <p>
                  Daymark is crafted for mindful productivity and personal reflection. You agree not to misuse our systems, attempt unauthorized penetration testing, reverse engineer platform assets, or disrupt other members’ service.
                </p>
              </section>

              <section className="legal-section">
                <h3>5. Service Availability & Changes</h3>
                <p>
                  We continuously improve Daymark to provide an exceptional experience. We may occasionally update features or modify functionality, and significant revisions to these terms will be communicated in advance.
                </p>
              </section>
            </div>
          ) : (
            <div className="legal-content">
              <section className="legal-section">
                <h3>1. Our Privacy Commitment</h3>
                <p>
                  Daymark is built with privacy as a foundational principle. Your daily logs, journal thoughts, and task workflows are private to you. We do not sell your personal data or journaling habits to advertisers or third-party data brokers.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Information We Collect</h3>
                <p>
                  We collect only the essential information needed to operate your account: your name, email address, and encrypted credentials. If you choose to sign in with Google, we securely receive your verified name and email.
                </p>
              </section>

              <section className="legal-section">
                <h3>3. Data Protection & Encryption</h3>
                <p>
                  All data transmitted to and from Daymark is protected using TLS encryption. Data stored in our database is secured with enterprise-grade encryption at rest and strict access controls.
                </p>
              </section>

              <section className="legal-section">
                <h3>4. Your Rights & Data Export</h3>
                <p>
                  You own your data. You may export your logs or delete your account along with all associated records at any time from your account settings.
                </p>
              </section>

              <section className="legal-section">
                <h3>5. Policy Updates</h3>
                <p>
                  If our privacy practices evolve, we will update this policy and provide noticeable notice through the application interface before changes take effect.
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="legal-modal-footer">
          <button
            type="button"
            className="legal-modal-confirm-btn"
            onClick={onClose}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}

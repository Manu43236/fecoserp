export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--color-primary, #0f766e)' }}
          >
            F
          </div>
          <span className="font-semibold text-gray-900">FECOS ERP</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: September 9, 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              FECOS ERP ("we", "our", or "us") is a Field Engineering Chemical Operations Solution
              developed by Endura. This Privacy Policy explains how we collect, use, and protect your
              information when you use our web console (<strong>console.fecoserp.com</strong>) and
              our mobile application ("FECOS Field App") available on Google Play.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <ul className="space-y-3 list-none">
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <div>
                  <strong>Account Information:</strong> Full name, mobile number, email address, and
                  role/designation provided during account setup by your employer (tenant administrator).
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <div>
                  <strong>Location Data:</strong> GPS coordinates captured during field service visits,
                  tank inspections, and route deliveries. Location is recorded only when you actively
                  perform a field action in the app — not in the background.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <div>
                  <strong>Photos:</strong> Images captured as service visit proof, tank-level
                  documentation, and delivery confirmation. Photos are uploaded to secure storage
                  associated with your employer's workspace.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <div>
                  <strong>Operational Data:</strong> Service records, inventory movements, chemical
                  treatment logs, route assignments, and related business data you enter while using
                  the application.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <div>
                  <strong>Device Information:</strong> Device model, operating system version, and app
                  version — used solely for troubleshooting and compatibility purposes.
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Provide and operate the FECOS ERP platform for your employer</li>
              <li>Record service visits, deliveries, and field activities against the correct location and time</li>
              <li>Generate reports, route schedules, and operational analytics for your employer</li>
              <li>Authenticate your identity and enforce role-based access controls</li>
              <li>Troubleshoot technical issues and improve application performance</li>
              <li>Comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal information. Data may be shared only as follows:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>With your employer (tenant):</strong> All operational data you enter belongs to
                your employer's workspace and is accessible to authorized personnel within that workspace.
              </li>
              <li>
                <strong>With service providers:</strong> Cloud hosting, file storage, and infrastructure
                providers operating under strict confidentiality agreements.
              </li>
              <li>
                <strong>When required by law:</strong> In response to valid legal process or to protect
                the rights and safety of users.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Location Data — Specific Disclosure</h2>
            <p>
              FECOS Field App requests location permission to capture GPS coordinates at the moment you
              record a service visit, tank inspection, or delivery event. We use <strong>foreground-only
              location access</strong>. The app does not track your location continuously or in the
              background. You may deny location permission; however, certain features (GPS-tagged service
              records) will not function without it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Camera and Photos</h2>
            <p>
              The app requests camera permission to capture service-proof photographs. Photos are taken
              only when you explicitly trigger the camera within the app. Images are uploaded to your
              employer's secure workspace and are not stored locally beyond the upload session.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              Your data is retained for the duration of your employer's active subscription. When an
              employer's workspace is terminated, data may be retained for up to 90 days before permanent
              deletion, unless a shorter period is requested. Individual account data can be removed upon
              your employer's request to us at <strong>support@fecoserp.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Data Security</h2>
            <p>
              We use industry-standard measures including HTTPS/TLS encryption for all data in transit,
              encrypted storage for files and credentials, role-based access controls enforced at every
              API endpoint, and regular security reviews. No transmission method over the internet is
              100% secure; we continuously work to improve our safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Your Rights</h2>
            <p className="mb-3">
              You have the right to access, correct, or request deletion of your personal data. Since
              your account is provisioned by your employer, most requests should be directed to your
              employer's administrator. For requests that require our direct involvement, contact us at
              the address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
            <p>
              FECOS ERP is a business application intended for use by adults in professional settings.
              We do not knowingly collect information from individuals under 18 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The "Last updated" date at the top of
              this page reflects the most recent revision. Continued use of the application after changes
              are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
            <div className="mt-3 p-4 bg-gray-100 rounded-lg text-sm space-y-1">
              <p><strong>Endura</strong></p>
              <p>FECOS ERP — Field Engineering Chemical Operations Solution</p>
              <p>Email: <a href="mailto:support@fecoserp.com" className="text-blue-600 hover:underline">support@fecoserp.com</a></p>
              <p>Website: <a href="https://console.fecoserp.com" className="text-blue-600 hover:underline">console.fecoserp.com</a></p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Endura · FECOS ERP · All rights reserved
      </footer>
    </div>
  )
}

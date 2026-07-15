export default function Privacy() {
  return (
    <div className="flex-1 w-full bg-background pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-white mb-4 text-shadow-neon-pink">
          PRIVACY POLICY
        </h1>
        <p className="text-muted-foreground mb-8 pb-8 border-b border-white/10">
          Last Updated: July 15, 2026
        </p>

        <div className="prose prose-invert prose-p:text-white/70 prose-headings:font-display prose-headings:text-white prose-a:text-primary max-w-none space-y-2">

          <p>
            Chip Society LLC ("we," "us," or "our") operates the Chip Society mobile application and related web services (collectively, the "Services"). This Privacy Policy describes how we collect, use, store, and share information when you use our Services, and explains the choices available to you regarding that information.
          </p>
          <p>
            <strong>Chip Society is a social card-game app using virtual chips only. No real money is wagered, won, or lost. This app is not a gambling application.</strong>
          </p>

          <h2>1. Information We Collect</h2>

          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Username &amp; PIN:</strong> Required to create an account and authenticate. We store a hashed (bcrypt) version of your PIN — we never store it in plain text.</li>
            <li><strong>Email Address:</strong> Optional. Collected only if you voluntarily provide it for account recovery or support contact.</li>
            <li><strong>Social Content:</strong> Posts, comments, and reactions you submit to the in-app social feed.</li>
            <li><strong>Support Communications:</strong> Messages you send through our contact or support channels.</li>
          </ul>

          <h3>Information Collected Automatically</h3>
          <ul>
            <li><strong>Gameplay Data:</strong> Hand history, chip balances, tournament participation, game mode preferences, and mission progress. Stored locally on your device using AsyncStorage and, for multiplayer, on our servers.</li>
            <li><strong>Device &amp; Technical Data:</strong> Operating system version, device model, app version, and crash reports. Collected via Sentry for stability monitoring.</li>
            <li><strong>Purchase Records:</strong> If you make an in-app purchase, Apple processes the transaction. We receive a transaction record (product identifier and transaction ID) via RevenueCat to fulfill your order. We do not receive or store your payment card information.</li>
            <li><strong>Session &amp; Log Data:</strong> Server-side logs of API requests, including IP address, request timestamps, and response codes, retained for up to 30 days for security and abuse-prevention purposes.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To create and manage your Chip Society account.</li>
            <li>To operate multiplayer game rooms and synchronize game state in real time.</li>
            <li>To process and fulfill in-app purchases (virtual chip bundles and Fortune Cookie tickets).</li>
            <li>To display social feed content and enable interactions between players.</li>
            <li>To detect, investigate, and prevent cheating, abuse, or violations of our Terms of Service.</li>
            <li>To diagnose crashes and performance issues using Sentry crash reporting.</li>
            <li>To respond to support requests and account inquiries.</li>
            <li>To send in-app notifications such as moderation decisions or admin announcements.</li>
            <li>To improve the app through anonymized usage analytics.</li>
          </ul>

          <h2>3. In-App Purchases</h2>
          <p>
            Chip Society offers optional in-app purchases of virtual chip bundles and Fortune Cookie scratch tickets through Apple's App Store. All transactions are processed by Apple, Inc. We use RevenueCat to validate and fulfill purchases on our end.
          </p>
          <ul>
            <li>All purchases are for <strong>virtual, in-game items only</strong>. They have no monetary value and cannot be transferred, exchanged for real money, or refunded through Chip Society.</li>
            <li>Refund requests must be submitted directly to Apple via <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">reportaproblem.apple.com</a>.</li>
            <li>We do not collect or store your payment card information at any time.</li>
          </ul>

          <h2>4. Third-Party Services</h2>
          <p>We use the following third-party services, each with their own privacy practices:</p>
          <ul>
            <li><strong>Apple App Store &amp; StoreKit</strong> — payment processing for in-app purchases. <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple Privacy Policy</a></li>
            <li><strong>RevenueCat</strong> — purchase validation and entitlement management. <a href="https://www.revenuecat.com/privacy/" target="_blank" rel="noopener noreferrer">RevenueCat Privacy Policy</a></li>
            <li><strong>Sentry</strong> — crash and error reporting. <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">Sentry Privacy Policy</a></li>
            <li><strong>Railway</strong> — cloud hosting for our API and database. Data is stored on Railway's infrastructure in the United States. <a href="https://railway.app/legal/privacy" target="_blank" rel="noopener noreferrer">Railway Privacy Policy</a></li>
          </ul>
          <p>We do not sell, rent, or share your personal information with advertisers or marketing networks.</p>

          <h2>5. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal data. We may share information only in the following limited circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> With the third-party vendors listed above, solely to provide the Services.</li>
            <li><strong>Legal Requirements:</strong> When required by law, subpoena, or other legal process, or to protect the rights, property, or safety of Chip Society, our users, or the public.</li>
            <li><strong>Business Transfer:</strong> If Chip Society is acquired or merges with another entity, your information may be transferred as part of that transaction. We will notify you via in-app notice or email (if provided) before any such transfer.</li>
          </ul>

          <h2>6. Data Retention</h2>
          <ul>
            <li><strong>Account data</strong> is retained for as long as your account is active.</li>
            <li><strong>Server logs</strong> are retained for up to 30 days.</li>
            <li><strong>Crash reports</strong> are retained by Sentry for 90 days.</li>
            <li>After account deletion, we remove your username, email, and gameplay records within 30 days, except where retention is required by law.</li>
          </ul>

          <h2>7. Children's Privacy</h2>
          <p>
            Chip Society is intended for users aged <strong>13 and older</strong> (or the minimum digital age of consent in your jurisdiction). We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us immediately at <a href="mailto:support@chipsociety.app">support@chipsociety.app</a> and we will promptly delete that information.
          </p>
          <p>
            Users between 13 and 17 should review this policy with a parent or guardian. In-app purchases require parental approval through the device's parental controls.
          </p>

          <h2>8. Your Rights and Choices</h2>
          <p>Depending on your jurisdiction (including GDPR, CCPA, and similar laws), you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
            <li><strong>Opt-Out of Sale:</strong> We do not sell personal data, so no opt-out is required for this purpose.</li>
            <li><strong>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw consent at any time.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at <a href="mailto:support@chipsociety.app">support@chipsociety.app</a>. We will respond within 30 days.
          </p>

          <h2>9. California Residents (CCPA)</h2>
          <p>
            California residents have additional rights under the California Consumer Privacy Act. We do not sell personal information. You have the right to know what personal information is collected, the right to delete personal information, and the right not to be discriminated against for exercising these rights. To submit a request, email <a href="mailto:support@chipsociety.app">support@chipsociety.app</a> with the subject line "CCPA Request."
          </p>

          <h2>10. Data Security</h2>
          <p>
            We implement industry-standard security measures including bcrypt password hashing, HTTPS encryption for all data in transit, and access-controlled server infrastructure. However, no method of electronic storage or internet transmission is 100% secure. We cannot guarantee absolute security of your information.
          </p>

          <h2>11. International Transfers</h2>
          <p>
            Our servers are located in the United States. If you access the Services from outside the United States, your information may be transferred to and processed in the United States, where data protection laws may differ from those in your country. By using the Services, you consent to this transfer.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last Updated" date at the top of this page and notify you through the app. Continued use of the Services after changes become effective constitutes acceptance of the revised policy.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:support@chipsociety.app">support@chipsociety.app</a></li>
            <li><strong>Support page:</strong> <a href="/support/contact">chipsociety.app/support/contact</a></li>
          </ul>

        </div>
      </div>
    </div>
  );
}

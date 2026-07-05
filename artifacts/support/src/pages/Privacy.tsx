export default function Privacy() {
  return (
    <div className="flex-1 w-full bg-background pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-white mb-4 text-shadow-neon-pink">
          PRIVACY POLICY
        </h1>
        <p className="text-muted-foreground mb-8 pb-8 border-b border-white/10">
          Last Updated: July 4, 2026
        </p>

        <div className="prose prose-invert prose-p:text-white/70 prose-headings:font-display prose-headings:text-white prose-a:text-primary max-w-none">
          <p>
            Chip Society LLC ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the Chip Society application and related services (the "Services").
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect limited information to provide and improve the Services:
          </p>
          <ul>
            <li><strong>Account Information:</strong> When you create an account, we collect your chosen username. An email address is only collected if you choose to provide it for support or recovery purposes.</li>
            <li><strong>Gameplay Data:</strong> We collect data regarding your in-game activity, chip balances, tournament participation, and game preferences.</li>
            <li><strong>Device Information:</strong> We may collect technical information about the device you use to access the Services, such as OS version and unique device identifiers, for troubleshooting and analytics.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the collected information for the following purposes:
          </p>
          <ul>
            <li>To operate, maintain, and provide features of the Services.</li>
            <li>To manage your account and virtual chip balance.</li>
            <li>To respond to customer support requests.</li>
            <li>To monitor for cheating, abuse, and violations of our Terms of Service.</li>
            <li>To analyze usage trends and improve the app.</li>
          </ul>

          <h2>3. Data Sharing and Disclosure</h2>
          <p>
            <strong>We do not sell your personal data to third parties.</strong> We may share information only in the following circumstances:
          </p>
          <ul>
            <li>With service providers that perform services on our behalf (e.g., hosting, analytics).</li>
            <li>To comply with legal obligations or respond to lawful requests from authorities.</li>
            <li>To protect the rights, property, or safety of Chip Society, our users, or the public.</li>
          </ul>

          <h2>4. Your Rights (GDPR / CCPA)</h2>
          <p>
            Depending on your jurisdiction, you may have rights regarding your personal data, including:
          </p>
          <ul>
            <li>The right to request access to the data we hold about you.</li>
            <li>The right to request deletion of your data.</li>
            <li>The right to opt-out of certain data processing.</li>
          </ul>
          <p>
            To exercise these rights, please contact our support team.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement reasonable security measures to protect your information from unauthorized access, loss, or alteration. However, no internet transmission is entirely secure, and we cannot guarantee absolute security.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            For any questions or concerns regarding this Privacy Policy or your data, please contact us at: <a href="mailto:support@chipsociety.app">support@chipsociety.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

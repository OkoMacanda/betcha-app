import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageSEO } from '@/hooks/usePageSEO';
import Navigation from '@/components/Navigation';

const Privacy = () => {
  const navigate = useNavigate();

  usePageSEO({
    title: 'Privacy Policy - Challenger',
    description: 'Privacy policy for the Challenger platform',
    canonicalPath: '/privacy'
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="p-4 md:p-8 bg-background">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Challenger ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you use our platform. Please
                read this policy carefully. If you do not agree with the terms of this privacy policy, please
                do not access the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">We collect the following types of information:</p>

              <h3 className="text-lg font-medium mt-4 mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Full name and email address</li>
                <li>Account credentials (securely hashed passwords)</li>
                <li>Profile information (avatar, bio)</li>
                <li>KYC documents (government-issued ID, address proof, selfie)</li>
                <li>Payment information (processed by third-party providers)</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Transaction Data</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Bet history and outcomes</li>
                <li>Wallet balance and transaction records</li>
                <li>Evidence submissions (photos, videos, documents, links)</li>
                <li>Dispute records and resolutions</li>
                <li>Escrow and payout information</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Usage Data</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Device information (browser, OS, device type)</li>
                <li>IP address and location data</li>
                <li>Pages visited and features used</li>
                <li>Time and date of access</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>To create and manage your account</li>
                <li>To process bets, deposits, and withdrawals</li>
                <li>To verify your identity (KYC compliance)</li>
                <li>To resolve disputes and enforce platform rules</li>
                <li>To provide customer support</li>
                <li>To improve our services and user experience</li>
                <li>To send important notifications about your account</li>
                <li>To detect and prevent fraud, abuse, and security threats</li>
                <li>To comply with legal obligations and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
              <p className="text-muted-foreground mb-2">
                We take data security seriously and implement industry-standard measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>All data is stored on secure Supabase infrastructure with encryption at rest</li>
                <li>Passwords are hashed using bcrypt with salt</li>
                <li>All communications use SSL/TLS encryption (HTTPS)</li>
                <li>Access to personal data is restricted to authorized personnel only</li>
                <li>KYC documents are stored in encrypted storage buckets</li>
                <li>Regular security audits and vulnerability assessments</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                However, no method of transmission over the internet is 100% secure. While we strive to protect
                your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
              <p className="text-muted-foreground mb-2">
                We use the following third-party services that may collect your information:
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Payment Processors</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Paystack - Payment processing for deposits and withdrawals</li>
                <li>Stripe - Alternative payment processing (global markets)</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Infrastructure & Storage</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Supabase - Database, authentication, and file storage</li>
                <li>Vercel/Netlify - Hosting and CDN services</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">KYC Verification (Planned)</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Jumio or Onfido - Identity verification services</li>
              </ul>

              <p className="text-muted-foreground mt-2">
                These third parties have their own privacy policies. We encourage you to review their policies
                before providing any information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-2">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>With your explicit consent</li>
                <li>With service providers who assist in platform operations (under strict confidentiality)</li>
                <li>To comply with legal obligations, court orders, or government requests</li>
                <li>To enforce our Terms & Conditions and protect our rights</li>
                <li>In connection with a merger, acquisition, or sale of assets (with notice)</li>
                <li>To protect the safety and security of our users and the public</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-2">You have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal obligations)</li>
                <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                To exercise these rights, contact us at privacy@challenger.app. We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide
                services. After account deletion, we may retain certain information for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Legal compliance and tax purposes (minimum 7 years)</li>
                <li>Fraud prevention and dispute resolution</li>
                <li>Enforcing our terms and protecting our rights</li>
                <li>Anonymous analytics (personally identifiable information removed)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-2">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use the platform</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                You can control cookies through your browser settings. However, disabling cookies may limit
                certain platform features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Challenger is not intended for users under the age of 18 (or the legal age in your jurisdiction).
                We do not knowingly collect information from minors. If we discover that we have collected
                information from a minor, we will delete it immediately. If you believe a minor has provided
                us with information, please contact us at privacy@challenger.app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. These
                countries may have different data protection laws. We ensure that appropriate safeguards are
                in place to protect your data in compliance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of material changes
                via email or platform notifications. The "Last Updated" date at the top of this policy indicates
                when it was last revised. Your continued use of the platform after changes constitutes acceptance
                of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
              <p className="text-muted-foreground mb-2">
                If you have questions or concerns about this Privacy Policy or our data practices, contact us at:
              </p>
              <p className="text-muted-foreground font-semibold mt-2">
                Email: privacy@challenger.app
              </p>
              <p className="text-muted-foreground">
                Support: support@challenger.app
              </p>
              <p className="text-muted-foreground">
                Data Protection Officer: dpo@challenger.app
              </p>
            </section>

            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground italic">
                By using Challenger, you acknowledge that you have read and understood this Privacy Policy and
                consent to the collection, use, and disclosure of your information as described herein.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Privacy;

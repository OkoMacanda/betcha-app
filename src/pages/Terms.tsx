import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageSEO } from '@/hooks/usePageSEO';
import Navigation from '@/components/Navigation';

const Terms = () => {
  const navigate = useNavigate();

  usePageSEO({
    title: 'Terms & Conditions - Betcha',
    description: 'Terms and conditions for using the Betcha platform',
    canonicalPath: '/terms'
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
            <CardTitle className="text-3xl">Terms & Conditions</CardTitle>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Betcha ("the Platform"), you accept and agree to be bound by these Terms and Conditions.
                If you do not agree to these terms, please do not use our service. Your continued use of the Platform
                constitutes acceptance of any changes to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. User Responsibilities</h2>
              <p className="text-muted-foreground mb-2">You agree to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Provide accurate and truthful information during registration</li>
                <li>Maintain the security and confidentiality of your account credentials</li>
                <li>Not engage in any fraudulent, illegal, or harmful activities</li>
                <li>Submit honest and authentic evidence for bet outcomes</li>
                <li>Respect other users and comply with all platform rules</li>
                <li>Not create multiple accounts to circumvent platform rules</li>
                <li>Be at least 18 years of age or the legal age in your jurisdiction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Betting Rules</h2>
              <p className="text-muted-foreground mb-2">
                All bets placed on Betcha are binding agreements between participants. Once a bet is accepted:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Funds are immediately locked in escrow until bet resolution</li>
                <li>Both parties must submit required evidence as specified by the game rules</li>
                <li>REF AI will evaluate all submitted evidence and determine the outcome</li>
                <li>Disputes can be raised within 48 hours if you disagree with the decision</li>
                <li>All decisions, whether by REF AI or moderators, are final after dispute resolution</li>
                <li>Bets cannot be canceled once accepted by both parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Platform Fees</h2>
              <p className="text-muted-foreground mb-2">
                Betcha charges a 10% platform fee on all completed bets. This fee is non-negotiable and is calculated as follows:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Total Pot = Bet Amount × Number of Participants</li>
                <li>Platform Fee = Total Pot × 10%</li>
                <li>Winner Payout = Total Pot - Platform Fee</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Example: In a $100 1v1 bet, the total pot is $200. The platform fee is $20 (10%),
                and the winner receives $180.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Evidence Submission</h2>
              <p className="text-muted-foreground mb-2">
                Users are required to submit valid evidence to prove bet outcomes:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Evidence must be authentic, unmodified, and verifiable</li>
                <li>Acceptable formats include photos, videos, documents, and external links</li>
                <li>Evidence must be submitted within the timeframe specified in the bet</li>
                <li>Submitting false or manipulated evidence may result in account suspension</li>
                <li>The Platform reserves the right to request additional evidence</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Dispute Resolution</h2>
              <p className="text-muted-foreground mb-2">
                If you dispute a bet outcome, our moderation team will review all evidence and make a final decision:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Disputes must be raised within 48 hours of the REF AI decision</li>
                <li>You must provide a clear reason for the dispute</li>
                <li>The moderation team's decision is final and binding</li>
                <li>Repeated frivolous disputes may result in penalties or account suspension</li>
                <li>In cases of uncertainty, bets may be refunded to all participants</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Prohibited Activities</h2>
              <p className="text-muted-foreground mb-2">The following activities are strictly prohibited:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Creating fake accounts or impersonating other users</li>
                <li>Submitting false, manipulated, or AI-generated evidence</li>
                <li>Colluding with other users to manipulate bet outcomes</li>
                <li>Using the platform for illegal gambling or money laundering</li>
                <li>Attempting to exploit, hack, or compromise the platform's security</li>
                <li>Harassing, threatening, or abusing other users</li>
                <li>Using automated bots or scripts to interact with the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Wallet and Payments</h2>
              <p className="text-muted-foreground mb-2">
                Your Betcha wallet allows you to deposit, hold, and withdraw funds:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Deposits are processed through our payment partners (Paystack/Stripe)</li>
                <li>Withdrawals require KYC verification for security and compliance</li>
                <li>Withdrawal processing may take 1-5 business days</li>
                <li>Minimum withdrawal amount is $10</li>
                <li>Funds locked in escrow cannot be withdrawn until bet resolution</li>
                <li>The Platform is not responsible for losses due to user error</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. KYC Verification</h2>
              <p className="text-muted-foreground mb-2">
                Know Your Customer (KYC) verification is required for withdrawals:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>You must provide valid government-issued identification</li>
                <li>You may be required to provide proof of address</li>
                <li>KYC documents are securely stored and handled in compliance with privacy laws</li>
                <li>Withdrawals are disabled until KYC verification is complete</li>
                <li>False or fraudulent KYC submissions will result in account termination</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Account Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate accounts that violate these terms. In cases of
                termination due to fraud or abuse, remaining wallet balance may be forfeited. In cases of voluntary
                account closure, you may withdraw your balance after completing all active bets.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Betcha provides the platform "as is" without warranties of any kind. We are not liable for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Disputes between users regarding bet outcomes</li>
                <li>Technical failures, downtime, or service interruptions</li>
                <li>Loss of funds due to user error or negligence</li>
                <li>Actions of third-party payment processors</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Our maximum liability is limited to the amount currently in your wallet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, trademarks, logos, and intellectual property on Betcha are owned by the Platform
                or its licensors. You may not copy, modify, distribute, or create derivative works without
                explicit written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms at any time. Material changes will be communicated via email or
                platform notifications. Continued use of the platform after changes constitutes acceptance
                of the new terms. You should review these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Governing Law</h2>
              <p className="text-muted-foreground">
                These terms are governed by the laws of the jurisdiction in which Betcha operates. Any
                disputes shall be resolved through binding arbitration in accordance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">15. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these terms or to report violations, contact us at:
              </p>
              <p className="text-muted-foreground font-semibold mt-2">
                Email: legal@betcha.app
              </p>
              <p className="text-muted-foreground">
                Support: support@betcha.app
              </p>
            </section>

            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground italic">
                By using Betcha, you acknowledge that you have read, understood, and agree to be bound by these
                Terms & Conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Terms;

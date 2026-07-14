import { LegalDocument } from "@/components/layout/legal-document";

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="July 1, 2026"
      intro="These terms govern your use of Resumely. By creating an account or using the product, you agree to them."
      sections={[
        {
          heading: "1. Using Resumely",
          body: [
            "You must be at least 16 years old to create an account.",
            "You're responsible for the accuracy of the information you enter — Resumely helps you write and format your resume, but you own and control its content.",
            "You agree not to use the product to generate false credentials, misrepresent qualifications, or violate any applicable law.",
          ],
        },
        {
          heading: "2. Your content",
          body: [
            "You retain ownership of the resumes, cover letters, and other content you create.",
            "You grant Resumely a limited license to process your content solely to provide the service (e.g., AI tailoring, exports, scoring).",
          ],
        },
        {
          heading: "3. Subscriptions and billing",
          body: [
            "Paid plans are billed in advance on a recurring basis until cancelled.",
            "You can cancel at any time from your account settings; cancellation takes effect at the end of the current billing period.",
          ],
        },
        {
          heading: "4. AI-generated content",
          body: [
            "AI suggestions are generated from the information you provide and may contain errors. You are responsible for reviewing all content before submitting it to an employer.",
            "Resumely does not guarantee interview or employment outcomes.",
          ],
        },
        {
          heading: "5. Termination",
          body: [
            "You may stop using Resumely and delete your account at any time.",
            "We may suspend or terminate accounts that violate these terms or misuse the platform.",
          ],
        },
        {
          heading: "6. Limitation of liability",
          body: [
            "Resumely is provided 'as is' without warranties of any kind. To the maximum extent permitted by law, Resumely is not liable for indirect or consequential damages arising from use of the service.",
          ],
        },
        {
          heading: "7. Contact us",
          body: ["Questions about these terms can be sent to legal@resumely.com."],
        },
      ]}
    />
  );
}

import { LegalDocument } from "@/components/layout/legal-document";

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="July 1, 2026"
      intro="This policy explains what information Resumely, Inc. ('Resumely', 'we', 'us') collects, how we use it, and the choices you have."
      sections={[
        {
          heading: "1. Information we collect",
          body: [
            "Account information such as your name, email address, and password when you register.",
            "Resume content you upload or create, including work history, education, and skills.",
            "Usage data such as pages visited, features used, and device/browser information, collected via cookies and similar technologies.",
          ],
        },
        {
          heading: "2. How we use your information",
          body: [
            "To provide and improve the resume building, tailoring, and review features you use.",
            "To generate AI suggestions based only on the information you provide — we never invent experience or skills on your behalf.",
            "To communicate with you about your account, product updates, and support requests.",
          ],
        },
        {
          heading: "3. How we share your information",
          body: [
            "We do not sell your personal information.",
            "We share data with service providers (such as hosting and AI infrastructure providers) strictly to operate the product, under contracts that limit their use of your data.",
            "We may disclose information if required by law or to protect the rights and safety of our users.",
          ],
        },
        {
          heading: "4. Data retention and deletion",
          body: [
            "Resume versions and account data are retained while your account is active.",
            "You can delete individual resumes or your entire account at any time from your dashboard settings; deletion removes the data from our production systems within 30 days.",
          ],
        },
        {
          heading: "5. Your choices",
          body: [
            "You can access, update, export, or delete your data at any time from your account settings.",
            "You can opt out of non-essential cookies through your browser settings.",
          ],
        },
        {
          heading: "6. Contact us",
          body: [
            "Questions about this policy can be sent to privacy@resumely.com.",
          ],
        },
      ]}
    />
  );
}

import { LegalDocument } from "@/components/layout/legal-document";

export default function SecurityPage() {
  return (
    <LegalDocument
      title="Security"
      updated="July 1, 2026"
      intro="We treat your resume and account data as sensitive by default. Here's how we protect it."
      sections={[
        {
          heading: "1. Encryption",
          body: [
            "Data is encrypted in transit using TLS 1.2+ and at rest in our production database.",
            "Passwords are hashed and never stored or logged in plaintext.",
          ],
        },
        {
          heading: "2. Infrastructure",
          body: [
            "Resumely runs on reputable cloud infrastructure with isolated environments for production, staging, and development.",
            "Access to production systems is limited to engineers who need it, and is logged and reviewed regularly.",
          ],
        },
        {
          heading: "3. Application security",
          body: [
            "All external input is validated before being processed or stored.",
            "We run automated dependency and vulnerability scanning as part of our release process.",
          ],
        },
        {
          heading: "4. Data isolation",
          body: [
            "Each account's resumes and generated content are isolated at the database level and are never used to train models for other users.",
          ],
        },
        {
          heading: "5. Reporting a vulnerability",
          body: [
            "If you believe you've found a security issue, please email security@resumely.com with details. We aim to acknowledge reports within 2 business days.",
          ],
        },
      ]}
    />
  );
}

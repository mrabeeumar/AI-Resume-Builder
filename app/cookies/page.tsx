import { LegalDocument } from "@/components/layout/legal-document";

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      updated="July 1, 2026"
      intro="This policy explains how ResoVo uses cookies and similar technologies on our site."
      sections={[
        {
          heading: "1. What are cookies",
          body: [
            "Cookies are small text files stored on your device that help websites remember information about your visit.",
          ],
        },
        {
          heading: "2. How we use cookies",
          body: [
            "Essential cookies keep you signed in and remember your editor preferences — the product doesn't function properly without them.",
            "Analytics cookies help us understand how the product is used so we can improve it.",
            "We do not use cookies to sell your data to third parties.",
          ],
        },
        {
          heading: "3. Managing cookies",
          body: [
            "Most browsers let you block or delete cookies through their settings. Blocking essential cookies may prevent you from staying signed in or saving edits.",
          ],
        },
        {
          heading: "4. Contact us",
          body: ["Questions about this policy can be sent to privacy@resovo.com."],
        },
      ]}
    />
  );
}

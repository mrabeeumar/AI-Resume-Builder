import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonalInfoContent } from "@/types/resume-section";

type Props = {
  content: PersonalInfoContent;
  onChange: (content: PersonalInfoContent) => void;
};

const PHONE_ALLOWED_CHARS = /[^0-9+\-() ]/g;

export function PersonalInfoForm({ content, onChange }: Props) {
  const update =
    (field: keyof PersonalInfoContent) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...content, [field]: e.target.value });
    };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...content,
      phone: e.target.value.replace(PHONE_ALLOWED_CHARS, ""),
    });
  };

  const emailIsInvalid = content.email.length > 0 && !content.email.includes("@");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="personal-full-name">Full name</Label>
        <Input
          id="personal-full-name"
          value={content.fullName}
          onChange={update("fullName")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="personal-email">Email</Label>
        <Input
          id="personal-email"
          type="email"
          value={content.email}
          onChange={update("email")}
          aria-invalid={emailIsInvalid}
        />
        {emailIsInvalid && (
          <p role="alert" className="text-destructive text-xs">
            Enter a valid email address.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="personal-phone">Phone</Label>
        <Input
          id="personal-phone"
          type="tel"
          inputMode="tel"
          value={content.phone}
          onChange={handlePhoneChange}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="personal-location">Location</Label>
        <Input
          id="personal-location"
          value={content.location}
          onChange={update("location")}
        />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="personal-website">Website</Label>
        <Input
          id="personal-website"
          value={content.website}
          onChange={update("website")}
        />
      </div>
    </div>
  );
}

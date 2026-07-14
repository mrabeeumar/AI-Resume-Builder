import { LifeBuoyIcon, MailIcon, MessageCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { SiteFooter } from "@/components/layout/site-footer";

const CHANNELS = [
  {
    icon: MailIcon,
    title: "General inquiries",
    description: "Questions, feedback, or partnership ideas.",
    contact: "hello@resumely.com",
  },
  {
    icon: LifeBuoyIcon,
    title: "Support",
    description: "Trouble with your account, exports, or billing.",
    contact: "support@resumely.com",
  },
  {
    icon: MessageCircleIcon,
    title: "Press",
    description: "Media requests and interview inquiries.",
    contact: "press@resumely.com",
  },
];

export default function ContactPage() {
  return (
    <>
      <MarketingNav />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="Contact"
          title={
            <>
              We&apos;d love to <span className="gradient-text-static">hear from you</span>
            </>
          }
          subtitle="Reach out to the right team below, or send us a message and we'll route it for you."
        />

        <section className="py-16">
          <Container className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {CHANNELS.map((channel) => (
              <Card key={channel.title} className="hover-glow h-full gap-3 p-6">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <channel.icon className="size-5" />
                </div>
                <h3 className="font-heading text-base font-semibold">{channel.title}</h3>
                <p className="text-muted-foreground text-sm">{channel.description}</p>
                <a href={`mailto:${channel.contact}`} className="text-primary text-sm font-semibold">
                  {channel.contact}
                </a>
              </Card>
            ))}
          </Container>
        </section>

        <section className="pb-24">
          <Container className="max-w-2xl">
            <Card className="p-8">
              <h2 className="font-heading text-xl font-semibold">Send us a message</h2>
              <form className="mt-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    className="border-input bg-background w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="email"
                    placeholder="you@email.com"
                    className="border-input bg-background w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <textarea
                  placeholder="How can we help?"
                  rows={5}
                  className="border-input bg-background w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <Button type="submit" className="self-start">
                  Send message
                </Button>
              </form>
            </Card>
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

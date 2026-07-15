import type { ResumeSectionItem } from "@/types/resume-section";

// Single dummy resume shared by every template preview (public gallery,
// future "preview as you design" surfaces). Keeping one dataset means every
// template renders identical content, so differences a user sees are purely
// the template's layout/typography, not different input data.
export const SAMPLE_RESUME_TITLE = "Product Designer Resume";

const now = new Date("2026-01-01T00:00:00.000Z");

function section(
  id: string,
  type: ResumeSectionItem["type"],
  order: number,
  content: unknown,
): ResumeSectionItem {
  return {
    id,
    resumeId: "sample-resume",
    type,
    order,
    hidden: false,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

export const SAMPLE_RESUME_SECTIONS: ResumeSectionItem[] = [
  section("sample-personal-info", "PERSONAL_INFO", 0, {
    fullName: "Jordan Avery",
    email: "jordan.avery@email.com",
    phone: "(555) 214-7890",
    location: "Austin, TX",
    website: "jordanavery.design",
  }),
  section("sample-summary", "SUMMARY", 1, {
    text: "Product designer with 7+ years crafting user-centered interfaces for B2B SaaS platforms. Led design for a checkout redesign that lifted conversion 18%, and built the design system currently powering 40+ product screens. Skilled at translating ambiguous problems into shippable, accessible experiences.",
  }),
  section("sample-experience", "EXPERIENCE", 2, {
    items: [
      {
        id: "exp-1",
        company: "Northwind Software",
        role: "Senior Product Designer",
        location: "Austin, TX",
        startDate: "Mar 2022",
        endDate: "",
        current: true,
        description:
          "Lead designer for the billing and checkout experience, partnering with 3 engineering teams. Redesigned the checkout flow, increasing conversion 18% and cutting support tickets 25%. Built and maintain the company's Figma design system, adopted across 6 product squads.",
      },
      {
        id: "exp-2",
        company: "Brightline Analytics",
        role: "Product Designer",
        location: "Remote",
        startDate: "Jun 2019",
        endDate: "Feb 2022",
        current: false,
        description:
          "Designed core dashboard and reporting features for a data analytics platform used by 12,000+ customers. Ran quarterly usability studies that informed the navigation redesign. Mentored 2 junior designers.",
      },
      {
        id: "exp-3",
        company: "Studio Halcyon",
        role: "UI/UX Designer",
        location: "Austin, TX",
        startDate: "Aug 2017",
        endDate: "May 2019",
        current: false,
        description:
          "Delivered UI and UX for client web and mobile apps across fintech and healthcare. Owned design from wireframe through developer handoff on 10+ shipped projects.",
      },
    ],
  }),
  section("sample-education", "EDUCATION", 3, {
    items: [
      {
        id: "edu-1",
        school: "University of Texas at Austin",
        degree: "B.F.A.",
        fieldOfStudy: "Design",
        startDate: "2013",
        endDate: "2017",
        description: "Graduated with honors. Minor in Human-Computer Interaction.",
      },
      {
        id: "edu-2",
        school: "Austin Community College",
        degree: "A.A.",
        fieldOfStudy: "Visual Communication",
        startDate: "2011",
        endDate: "2013",
        description: "",
      },
    ],
  }),
  section("sample-skills", "SKILLS", 4, {
    items: [
      "Figma",
      "Design Systems",
      "User Research",
      "Prototyping",
      "Interaction Design",
      "Accessibility (WCAG)",
      "HTML/CSS",
      "Usability Testing",
      "Design Ops",
      "Cross-functional Leadership",
    ],
  }),
  section("sample-projects", "PROJECTS", 5, {
    items: [
      {
        id: "proj-1",
        name: "Atlas Design System",
        description:
          "Component library and documentation site used across the company's product suite. Reduced new-feature design time by roughly 30%.",
        url: "atlas.jordanavery.design",
        technologies: "Figma, Storybook, React",
      },
      {
        id: "proj-2",
        name: "Checkout Redesign",
        description:
          "End-to-end redesign of the multi-step checkout flow, from research through A/B-tested rollout.",
        url: "",
        technologies: "Figma, Maze, Amplitude",
      },
    ],
  }),
  section("sample-certifications", "CERTIFICATIONS", 6, {
    items: [
      {
        id: "cert-1",
        name: "Certified Usability Analyst",
        issuer: "Human Factors International",
        date: "2021",
        url: "",
      },
      {
        id: "cert-2",
        name: "Accessibility Fundamentals",
        issuer: "Deque University",
        date: "2020",
        url: "",
      },
    ],
  }),
];

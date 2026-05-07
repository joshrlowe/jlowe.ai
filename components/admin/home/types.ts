export interface CtaButton {
  text: string;
  href: string;
}

export interface TechBadge {
  name: string;
  color: string;
}

export interface HomeContent {
  typingIntro: string;
  heroTitle: string;
  typingStrings: string[];
  primaryCta: CtaButton;
  secondaryCta: CtaButton;
  techBadges: TechBadge[];
  githubSectionTitle: string;
  githubSectionDescription: string;
}

export interface WelcomeData {
  name: string;
  briefBio: string;
  callToAction: string;
}

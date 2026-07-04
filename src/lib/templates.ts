export interface CarouselTemplate {
  id: string;
  name: string;
  hookPrefix: string;
  curiositySlideText: string;
  ctaKeywords: string[];
  systemInstruction: string;
}

export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  {
    id: "things-illegal",
    name: "Things That Feel Illegal To Know",
    hookPrefix: "Things That Feel Illegal To Know",
    curiositySlideText: "WAIT... THE OTHER 5 ARE EVEN BETTER 🤫",
    ctaKeywords: ["WEB", "CODE", "TOOLKIT"],
    systemInstruction: "Create an authoritative, high-value tone. Present websites or tools that are so powerful they feel like they shouldn't be free. Emphasize utility and shock-value.",
  },
  {
    id: "developer-black-market",
    name: "Developer Black Market",
    hookPrefix: "The Developer Black Market",
    curiositySlideText: "YOU WON'T FIND THESE ON THE FRONT PAGE OF GITHUB 🤫",
    ctaKeywords: ["SECRET", "DEV", "REPOS"],
    systemInstruction: "Create a mystery, high-value hacker-inspired tone. Focus on underground repositories, automation scripts, and powerful resources that developers hide from each other.",
  },
  {
    id: "hidden-gems",
    name: "Hidden Gems",
    hookPrefix: "Hidden Developer Gems",
    curiositySlideText: "MOST DEVELOPERS DON'T KNOW THESE 💎",
    ctaKeywords: ["GEMS", "AI", "SPEED"],
    systemInstruction: "Create a discovery, insight-rich tone. Showcase lesser-known design components, SaaS APIs, or micro-tools that solve big problems but fly under the radar.",
  },
];

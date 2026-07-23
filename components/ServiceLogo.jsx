// components/ServiceLogo.jsx
// Renders a brand logo from logo.dev when the service name is recognised,
// with an emoji fallback for unknown services.
//
// logo.dev is free for basic usage — no API key required.
// Format: https://img.logo.dev/{domain}?token=pk_free&size=128&format=png
//
// Usage:
//   <ServiceLogo name="Netflix" emoji="🎬" size={48} borderRadius={14} />

import React, { useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";

// ─── Domain map: service name keywords → logo.dev domain ─────────────────────
const DOMAIN_MAP = {
  // Streaming
  netflix:       "netflix.com",
  "disney+":     "disneyplus.com",
  disney:        "disneyplus.com",
  hulu:          "hulu.com",
  "apple tv":    "apple.com",
  "prime video": "primevideo.com",
  "amazon prime":"amazon.com",
  hbomax:        "max.com",
  "hbo max":     "max.com",
  max:           "max.com",
  peacock:       "peacocktv.com",
  paramount:     "paramountplus.com",
  "discovery+":  "discoveryplus.com",
  crunchyroll:   "crunchyroll.com",
  showtime:      "showtime.com",
  starz:         "starz.com",
  mubi:          "mubi.com",

  // Music
  spotify:       "spotify.com",
  "apple music": "apple.com",
  tidal:         "tidal.com",
  deezer:        "deezer.com",
  soundcloud:    "soundcloud.com",
  pandora:       "pandora.com",
  "youtube music":"youtube.com",
  "amazon music":"amazon.com",

  // Gaming
  "xbox game pass": "xbox.com",
  "game pass":      "xbox.com",
  xbox:             "xbox.com",
  playstation:      "playstation.com",
  "ps plus":        "playstation.com",
  "ps now":         "playstation.com",
  "ea play":        "ea.com",
  "nintendo":       "nintendo.com",
  "nintendo online":"nintendo.com",
  steam:            "steampowered.com",
  roblox:           "roblox.com",
  "apple arcade":   "apple.com",

  // Cloud / Productivity
  icloud:        "apple.com",
  dropbox:       "dropbox.com",
  "google one":  "google.com",
  onedrive:      "microsoft.com",
  "google drive":"google.com",
  notion:        "notion.so",
  slack:         "slack.com",
  zoom:          "zoom.us",
  "microsoft 365":"microsoft.com",
  "office 365":  "microsoft.com",
  microsoft:     "microsoft.com",
  "google workspace":"google.com",
  trello:        "trello.com",
  asana:         "asana.com",
  airtable:      "airtable.com",
  clickup:       "clickup.com",
  linear:        "linear.app",
  figma:         "figma.com",

  // AI
  chatgpt:       "openai.com",
  openai:        "openai.com",
  "claude ai":   "anthropic.com",
  claude:        "anthropic.com",
  gemini:        "google.com",
  "google bard": "google.com",
  midjourney:    "midjourney.com",
  copilot:       "microsoft.com",
  grammarly:     "grammarly.com",
  jasper:        "jasper.ai",
  runway:        "runwayml.com",
  perplexity:    "perplexity.ai",

  // Social / Communication
  youtube:       "youtube.com",
  twitter:       "twitter.com",
  "x premium":   "twitter.com",
  linkedin:      "linkedin.com",
  reddit:        "reddit.com",
  discord:       "discord.com",
  telegram:      "telegram.org",

  // News / Reading
  medium:        "medium.com",
  substack:      "substack.com",
  nyt:           "nytimes.com",
  "new york times":"nytimes.com",
  "washington post":"washingtonpost.com",
  wsj:           "wsj.com",
  "wall street journal":"wsj.com",
  audible:       "audible.com",
  kindle:        "amazon.com",
  "kindle unlimited":"amazon.com",

  // Fitness / Health
  peloton:       "onepeloton.com",
  strava:        "strava.com",
  calm:          "calm.com",
  headspace:     "headspace.com",
  noom:          "noom.com",
  whoop:         "whoop.com",
  myfitnesspal:  "myfitnesspal.com",

  // Education
  duolingo:      "duolingo.com",
  coursera:      "coursera.org",
  udemy:         "udemy.com",
  skillshare:    "skillshare.com",
  masterclass:   "masterclass.com",
  datacamp:      "datacamp.com",
  pluralsight:   "pluralsight.com",

  // Finance
  revolut:       "revolut.com",
  monzo:         "monzo.com",
  quickbooks:    "quickbooks.intuit.com",
  xero:          "xero.com",

  // Design / Creative
  adobe:         "adobe.com",
  canva:         "canva.com",
  "adobe creative cloud":"adobe.com",
  invision:      "invisionapp.com",
  sketch:        "sketch.com",
  framer:        "framer.com",

  // Dev tools
  github:        "github.com",
  gitlab:        "gitlab.com",
  vercel:        "vercel.com",
  netlify:       "netlify.com",
  heroku:        "heroku.com",
  digitalocean:  "digitalocean.com",
  aws:           "aws.amazon.com",
  "amazon web services":"aws.amazon.com",
  datadog:       "datadoghq.com",
  sentry:        "sentry.io",
  postman:       "postman.com",

  // Transport / Delivery
  uber:          "uber.com",
  lyft:          "lyft.com",
  "uber eats":   "ubereats.com",
  doordash:      "doordash.com",
  instacart:     "instacart.com",
  gopuff:        "gopuff.com",

  // Other
  shopify:       "shopify.com",
  squarespace:   "squarespace.com",
  wix:           "wix.com",
  mailchimp:     "mailchimp.com",
  hubspot:       "hubspot.com",
  salesforce:    "salesforce.com",
  zendesk:       "zendesk.com",
  intercom:      "intercom.com",
  "1password":   "1password.com",
  lastpass:      "lastpass.com",
  nordvpn:       "nordvpn.com",
  expressvpn:    "expressvpn.com",
};

// logo.dev free public token (works without sign-up for basic usage)
const LOGO_DEV_TOKEN = "pk_free";

export function getDomain(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  // Exact match first
  if (DOMAIN_MAP[lower]) return DOMAIN_MAP[lower];
  // Partial match
  for (const key of Object.keys(DOMAIN_MAP)) {
    if (lower.includes(key)) return DOMAIN_MAP[key];
  }
  // Fallback: guess domain from name (e.g. "Notion" → "notion.com")
  // Only for single clean words
  if (/^[a-z0-9]+$/.test(lower) && lower.length > 2) {
    return `${lower}.com`;
  }
  return null;
}

export function getLogoUrl(name, size = 128) {
  const domain = getDomain(name);
  if (!domain) return null;
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${size}&format=png`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ServiceLogo({
  name,
  emoji = "⭐",
  size = 48,
  borderRadius = 14,
  bgColor = "#f4f3ff",
  style,
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = getLogoUrl(name, size * 2); // 2× for retina

  const showLogo = logoUrl && !logoFailed;

  return (
    <View style={[
      logo.wrap,
      { width: size, height: size, borderRadius, backgroundColor: showLogo ? "#fff" : bgColor },
      style,
    ]}>
      {showLogo ? (
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size - 10, height: size - 10, borderRadius: borderRadius - 4 }}
          resizeMode="contain"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
      )}
    </View>
  );
}

const logo = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

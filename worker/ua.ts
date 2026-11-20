/* Just enough user-agent reading for a dashboard: the kind of device, the
   browser family and the operating system. No versions are kept. */

export function device(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua)) return 'tablet';
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function browser(ua: string): string {
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn app';
  if (/FBAN|FBAV|Instagram/.test(ua)) return 'Facebook/Instagram app';
  if (/FxiOS|Firefox\//.test(ua)) return 'Firefox';
  if (/CriOS|Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

export function os(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

/* Crawlers and tools that run scripts. They are dropped, not counted. */
export const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|preview|curl|wget|python|axios|node-fetch|go-http|java\/|phantom|puppeteer|playwright|selenium/i;

/* The apps that fetch a page to draw a preview card when someone pastes the
   link into a chat or a post. Each fetch is a sign the link was shared. */
const PREVIEWERS: [RegExp, string][] = [
  [/LinkedInBot/i, 'LinkedIn'],
  [/WhatsApp/i, 'WhatsApp'],
  [/facebookexternalhit|Facebot/i, 'Facebook'],
  [/Twitterbot/i, 'X'],
  [/Slackbot/i, 'Slack'],
  [/TelegramBot/i, 'Telegram'],
  [/Discordbot/i, 'Discord'],
  [/SkypeUriPreview|Teams/i, 'Teams/Skype'],
  [/Applebot|iMessage/i, 'iMessage'],
  [/Googlebot/i, 'Google (crawl)'],
  [/bingbot/i, 'Bing (crawl)'],
];

export function previewer(ua: string): string | null {
  for (const [re, name] of PREVIEWERS) if (re.test(ua)) return name;
  return null;
}

/* Where a visit came from, in words: a utm tag wins, then the referrer. */
export function source(refHost: string, utmSource: string, ownHost: string): string {
  const u = utmSource.toLowerCase();
  if (u) {
    if (u.includes('linkedin')) return 'LinkedIn';
    if (u.includes('whatsapp')) return 'WhatsApp';
    if (u === 'email' || u.includes('mail')) return 'Email';
    if (u === 'copy' || u === 'native') return 'Shared link';
    if (u === 'x' || u.includes('twitter')) return 'X';
    return utmSource.slice(0, 40);
  }
  const h = refHost.toLowerCase().replace(/^www\./, '');
  if (!h || h === ownHost || h.endsWith('.' + ownHost) || h.endsWith('.pages.dev')) return 'Direct';
  if (h.includes('linkedin') || h === 'lnkd.in') return 'LinkedIn';
  if (/^google\.|\.google\./.test(h) || h.startsWith('google.')) return 'Google';
  if (h.includes('bing.')) return 'Bing';
  if (h.includes('duckduckgo')) return 'DuckDuckGo';
  if (h.includes('yahoo')) return 'Yahoo';
  if (h.includes('whatsapp') || h === 'wa.me') return 'WhatsApp';
  if (h === 't.co' || h === 'x.com' || h.includes('twitter')) return 'X';
  if (h.includes('facebook') || h === 'fb.me' || h === 'l.facebook.com') return 'Facebook';
  if (h.includes('instagram')) return 'Instagram';
  if (h.includes('github')) return 'GitHub';
  if (h.includes('mail.') || h.includes('outlook')) return 'Email';
  if (h.includes('chatgpt') || h.includes('openai') || h.includes('perplexity') || h.includes('claude.ai') || h.includes('gemini')) return 'AI assistant';
  return h.slice(0, 60);
}

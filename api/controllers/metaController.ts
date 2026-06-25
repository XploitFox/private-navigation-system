import { Request, Response } from 'express';
import dns from 'node:dns/promises';
import { config } from '../config/env.js';

const MAX_REDIRECTS = 5;

const isPrivateIp = (ip: string) => {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
};

const pickFirstMatch = (html: string, patterns: RegExp[]) => {
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1];
  }
  return '';
};

const getMetaContent = (html: string, predicate: (attrs: Record<string, string>) => boolean) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs: Record<string, string> = {};
    const re = /([^\s=]+)\s*=\s*["']([^"']*)["']/g;
    for (const m of tag.matchAll(re)) {
      attrs[String(m[1]).toLowerCase()] = String(m[2]);
    }
    if (predicate(attrs) && attrs.content) {
      return attrs.content;
    }
  }
  return '';
};

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

const decodeHtmlEntities = (s: string) => {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (all, entity) => {
    const e = String(entity).toLowerCase();

    if (e.startsWith('#x')) {
      const cp = parseInt(e.slice(2), 16);
      if (!Number.isFinite(cp)) return all;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return all;
      }
    }

    if (e.startsWith('#')) {
      const cp = parseInt(e.slice(1), 10);
      if (!Number.isFinite(cp)) return all;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return all;
      }
    }

    if (e === 'amp') return '&';
    if (e === 'lt') return '<';
    if (e === 'gt') return '>';
    if (e === 'quot') return '"';
    if (e === 'apos') return "'";

    return all;
  });
};

const getLinkHref = (html: string, predicate: (attrs: Record<string, string>) => boolean) => {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs: Record<string, string> = {};
    const re = /([^\s=]+)\s*=\s*["']([^"']*)["']/g;
    for (const m of tag.matchAll(re)) {
      attrs[String(m[1]).toLowerCase()] = String(m[2]);
    }
    if (predicate(attrs) && attrs.href) {
      return attrs.href;
    }
  }
  return '';
};

const isValidFetchProtocol = (url: URL) => url.protocol === 'http:' || url.protocol === 'https:';

const isBlockedHostname = (hostname: string) => hostname === 'localhost';

const validateFetchTarget = async (url: URL) => {
  if (!isValidFetchProtocol(url)) {
    return false;
  }

  if (isBlockedHostname(url.hostname)) {
    return false;
  }

  try {
    const ips = await dns.lookup(url.hostname, { all: true });
    return !ips.some((x) => isPrivateIp(x.address));
  } catch {
    return false;
  }
};

const fetchWithSafeRedirects = async (initialUrl: URL, signal: AbortSignal) => {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (!(await validateFetchTarget(currentUrl))) {
      return null;
    }

    const response = await fetch(currentUrl.toString(), {
      redirect: 'manual',
      signal,
      headers: {
        'user-agent': 'private-nav/1.0',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return null;
      }

      try {
        currentUrl = new URL(location, currentUrl);
        continue;
      } catch {
        return null;
      }
    }

    return {
      response,
      finalUrl: currentUrl,
    };
  }

  return null;
};

export const MetaController = {
  async get(req: Request, res: Response) {
    const urlStr = typeof req.query.url === 'string' ? req.query.url : '';
    if (!urlStr) return res.status(400).json({ message: 'url is required' });

    let url: URL;
    try {
      url = new URL(urlStr);
    } catch {
      return res.status(400).json({ message: 'invalid url' });
    }

    if (!isValidFetchProtocol(url)) {
      return res.status(400).json({ message: 'invalid protocol' });
    }

    if (isBlockedHostname(url.hostname)) {
      return res.status(400).json({ message: 'invalid hostname' });
    }

    if (!(await validateFetchTarget(url))) {
      return res.status(400).json({ message: 'invalid hostname' });
    }

    const controller = new AbortController();
    const timeoutMs = Number.isFinite(config.metaFetchTimeoutMs) ? Math.max(1500, Math.min(15000, config.metaFetchTimeoutMs)) : 4500;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchResult = await fetchWithSafeRedirects(url, controller.signal);
      if (!fetchResult) {
        return res.status(200).json({ title: '', description: '' });
      }

      const { response: resp, finalUrl } = fetchResult;

      if (!resp.ok) {
        return res.status(200).json({ title: '', description: '' });
      }

      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('text/html')) {
        return res.status(200).json({ title: '', description: '' });
      }

      const text = normalize((await resp.text()).slice(0, 250_000));

      const ogTitle = getMetaContent(text, (a) => a.property === 'og:title');
      const ogDesc = getMetaContent(text, (a) => a.property === 'og:description');
      const metaDesc = getMetaContent(text, (a) => a.name === 'description');

      const iconHref =
        getLinkHref(text, (a) => {
          const rel = (a.rel || '').toLowerCase();
          return rel.includes('icon') || rel.includes('apple-touch-icon');
        }) ||
        getMetaContent(text, (a) => a.property === 'og:image');

      const titleRaw = ogTitle || pickFirstMatch(text, [/<title[^>]*>([^<]*)<\/title>/i]);
      const descriptionRaw = metaDesc || ogDesc;

      const title = normalize(decodeHtmlEntities(titleRaw));
      const description = normalize(decodeHtmlEntities(descriptionRaw));

      let favicon = '';
      if (iconHref) {
        try {
          favicon = new URL(decodeHtmlEntities(iconHref), finalUrl).toString();
        } catch {
          favicon = '';
        }
      }

      return res.status(200).json({ title, description, favicon });
    } catch {
      return res.status(200).json({ title: '', description: '' });
    } finally {
      clearTimeout(timeout);
    }
  },
};

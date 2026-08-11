const { google } = require('googleapis');

/**
 * Google & IndexNow Instant Indexing Service
 */
const SITE_DOMAIN = process.env.SITE_URL || 'https://shasnadeshupdates.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'shasnadesh2026indexnowkey';

/**
 * Build a GoogleAuth instance from environment variables.
 * Uses the credentials object approach — confirmed working with googleapis v174+.
 * google.auth.JWT (old approach) has a bug with "No key or keyFile set."
 */
function getGoogleAuth() {
  let credentials = null;

  // Method 1: Full service account JSON string (preferred)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
      console.warn('⚠️ [Google Indexing] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  }

  // Method 2: Separate GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY env vars
  if (!credentials && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    };
  }

  if (!credentials) {
    console.log('ℹ️ [Google Indexing skipped]: No credentials configured in environment variables.');
    return null;
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
}

/**
 * Send Instant Indexing Request to Google Search Console
 * @param {string} targetUrl - Full URL to index (e.g. https://shasnadeshupdates.com/blog/my-slug)
 * @param {string} type - 'URL_UPDATED' or 'URL_DELETED'
 */
async function notifyGoogleIndexing(targetUrl, type = 'URL_UPDATED') {
  try {
    const auth = getGoogleAuth();
    if (!auth) {
      return { success: false, message: 'Google credentials not configured' };
    }

    const client = await auth.getClient();
    const indexing = google.indexing({ version: 'v3', auth: client });

    const response = await indexing.urlNotifications.publish({
      requestBody: { url: targetUrl, type }
    });

    console.log(`⚡ [Google Instant Indexing OK] (${type}): ${targetUrl}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ [Google Instant Indexing Error]: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send Instant Indexing Request to IndexNow (Bing, Yandex, Seznam, Naver)
 * @param {string} targetUrl - Full URL to index
 */
async function notifyIndexNow(targetUrl) {
  try {
    const host = new URL(SITE_DOMAIN).hostname;
    const bodyData = {
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_DOMAIN}/${INDEXNOW_KEY}.txt`,
      urlList: [targetUrl]
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(bodyData)
    });

    if (res.ok || res.status === 202) {
      console.log(`⚡ [IndexNow (Bing/Yandex) OK]: ${targetUrl}`);
      return { success: true };
    } else {
      console.warn(`⚠️ [IndexNow Warning]: HTTP ${res.status}`);
      return { success: false, status: res.status };
    }
  } catch (error) {
    console.error(`❌ [IndexNow Error]: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Notify all search engine instant indexing services (Google + IndexNow)
 * @param {string} urlOrSlug - Full URL or blog slug
 * @param {string} type - 'URL_UPDATED' or 'URL_DELETED'
 */
async function notifyAllIndexing(urlOrSlug, type = 'URL_UPDATED') {
  const targetUrl = urlOrSlug.startsWith('http')
    ? urlOrSlug
    : `${SITE_DOMAIN}/blog/${urlOrSlug}`;

  const [googleRes, indexNowRes] = await Promise.allSettled([
    notifyGoogleIndexing(targetUrl, type),
    notifyIndexNow(targetUrl)
  ]);

  return {
    targetUrl,
    type,
    google: googleRes.status === 'fulfilled' ? googleRes.value : { success: false, error: googleRes.reason },
    indexNow: indexNowRes.status === 'fulfilled' ? indexNowRes.value : { success: false, error: indexNowRes.reason }
  };
}

module.exports = {
  notifyGoogleIndexing,
  notifyIndexNow,
  notifyAllIndexing
};

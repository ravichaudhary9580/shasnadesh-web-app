const { google } = require('googleapis');

/**
 * Google & IndexNow Instant Indexing Service
 */
const SITE_DOMAIN = process.env.SITE_URL || 'https://shasnadeshupdates.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'shasnadesh2026indexnowkey';

/**
 * Initialize Google Auth JWT Client from environment variables
 */
function getGoogleAuthClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    // Check if full JSON string is provided in GOOGLE_SERVICE_ACCOUNT_JSON
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        return new google.auth.JWT(
          parsed.client_email,
          null,
          parsed.private_key,
          ['https://www.googleapis.com/auth/indexing']
        );
      } catch (err) {
        console.warn('⚠️ Invalid GOOGLE_SERVICE_ACCOUNT_JSON env variable format.');
        return null;
      }
    }
    return null;
  }

  // Replace escaped newlines if passed in env string
  privateKey = privateKey.replace(/\\n/g, '\n');

  return new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/indexing']
  );
}

/**
 * Send Instant Indexing Request to Google Search Console
 * @param {string} targetUrl - Full URL to index (e.g. https://shasnadeshupdates.com/blog/my-slug)
 * @param {string} type - 'URL_UPDATED' or 'URL_DELETED'
 */
async function notifyGoogleIndexing(targetUrl, type = 'URL_UPDATED') {
  try {
    const authClient = getGoogleAuthClient();
    if (!authClient) {
      console.log(`ℹ️ [Google Indexing skipped]: GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY not configured in .env`);
      return { success: false, message: 'Google credentials not configured' };
    }

    const tokens = await authClient.authorize();
    const indexing = google.indexing({ version: 'v3', auth: authClient });

    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: targetUrl,
        type: type
      }
    });

    console.log(`⚡ [Google Instant Indexing OK] (${type}): ${targetUrl}`, response.data);
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
      host: host,
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

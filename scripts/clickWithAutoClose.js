const puppeteer = require('puppeteer');

async function getApplyUrl(jobUrl) {
  const cookieJar = [
    { name: 'SESSION_ID',   value: 'fd6b584b818e48f398551dee770d5d4c', domain: 'jobright.ai', path: '/', httpOnly: true,  secure: true, sameSite: 'Lax' },
    { name: '__stripe_mid', value: '565ea7ff-f521-45b8-aa94-bfc2e722e7f0f60b78', domain: 'jobright.ai', path: '/', httpOnly: false, secure: true, sameSite: 'Strict' },
    { name: '_clck',        value: 'kf7ep4%7C2%7Cfve%7C0%7C1898',          domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
    { name: '_clsk',        value: 'xr49aa%7C1745703182964%7C12%7C1%7Cn.clarity.ms%2Fcollect', domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
    { name: '_fbp',         value: 'fb.1.1741898092480.517065837929298741', domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
    { name: '_ga',          value: 'GA1.1.1163292672.1741898093',          domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ];

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Setup popup listener before navigation
    let popupUrl = null;
    let popupPromise = new Promise(resolve => {
      page.on('popup', async popup => {
        try {
          // Wait for the popup to load
          await popup.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
          popupUrl = popup.url();
          resolve(popupUrl);
        } catch (err) {
          console.error('Error handling popup:', err);
          resolve(null);
        }
      });
    });

    // Inject cookies and navigate
    await page.setCookie(...cookieJar);
    await page.goto(jobUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for and click the apply button
    await page.waitForSelector('#apply-now-button-id', { timeout: 15000 });
    await page.click('#apply-now-button-id');

    // Wait for either popup URL or timeout
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5000));
    popupUrl = await Promise.race([popupPromise, timeoutPromise]);

    // If no popup detected, return original URL
    const finalUrl = popupUrl || jobUrl;
    console.log('\n✅ FINAL URL:', finalUrl);
    return finalUrl;

  } catch (error) {
    console.error('Error during URL capture:', error);
    return jobUrl; // Return original URL on error
  } finally {
    await browser.close();
  }
}

// If running directly (not imported)
if (require.main === module) {
  const JOB_PAGE = process.argv[2] || 'https://jobright.ai/jobs/info/680d2cb443c522965368c51c';
  
  getApplyUrl(JOB_PAGE)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { getApplyUrl }; 
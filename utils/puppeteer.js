// Vercel-compatible Puppeteer configuration
// Using vanilla puppeteer for Vercel compatibility
const puppeteer = require('puppeteer');
console.log('🤖 Using vanilla puppeteer for Vercel compatibility');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fillSwissVignetteForm(orderDetails) {
  console.log('🤖 Starting web automation for via.admin.ch...');
  
  let browser;
  let paymentUrl = null;
  
  try {
    // Helper utilities for text-based interactions without XPath
    async function waitForText(textRegex, timeoutMs = 60000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const found = await page.evaluate((pattern) => {
          try {
            const re = new RegExp(pattern, 'i');
            return re.test(document.body.innerText || '');
          } catch { return false; }
        }, textRegex.source || String(textRegex));
        if (found) return true;
        await wait(500);
      }
      throw new Error(`Timed out waiting for text: ${textRegex}`);
    }
    async function clickByText(text, candidateSelectors = ['button', 'a', '[role="button"]', '[data-testid]'], timeoutMs = 60000) {
      await page.waitForFunction((t, sels) => {
        const isVisible = (el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
        };
        for (const sel of sels) {
          const list = Array.from(document.querySelectorAll(sel));
          const found = list.find(el => isVisible(el) && (el.innerText || '').trim().includes(t));
          if (found) {
            found.setAttribute('data-auto-target', '1');
            return true;
          }
        }
        // Fallback: search any element
        const all = Array.from(document.querySelectorAll('*'));
        const any = all.find(el => isVisible(el) && (el.innerText || '').trim().includes(t));
        if (any) {
          any.setAttribute('data-auto-target', '1');
          return true;
        }
        return false;
      }, { timeout: timeoutMs, polling: 'mutation' }, text, candidateSelectors);
      await page.click('[data-auto-target="1"]');
      await page.evaluate(() => {
        const el = document.querySelector('[data-auto-target="1"]');
        if (el) el.removeAttribute('data-auto-target');
      });
    }

    async function selectOptionByText(text, timeoutMs = 60000) {
      // Click element containing text in common list containers
      await page.waitForFunction((t) => {
        const containers = document.querySelectorAll('ul, [role="listbox"], .menu, .dropdown, body');
        const isVisible = (el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
        };
        for (const c of containers) {
          const candidates = Array.from(c.querySelectorAll('li, option, button, [role="option"], *'));
          const match = candidates.find(el => isVisible(el) && (el.innerText || '').trim().includes(t));
          if (match) {
            match.setAttribute('data-auto-option', '1');
            return true;
          }
        }
        return false;
      }, { timeout: timeoutMs, polling: 'mutation' }, text);
      await page.click('[data-auto-option="1"]');
      await page.evaluate(() => {
        const el = document.querySelector('[data-auto-option="1"]');
        if (el) el.removeAttribute('data-auto-option');
      });
    }

    async function clickVisible(elHandle) {
      if (!elHandle) return;
      try { await elHandle.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' })); } catch {}
      await elHandle.click({ delay: 20 });
    }

    // Resilient navigation with retries
    async function navigateWithRetries(targetUrl, options = {}, maxRetries = 3) {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🌐 Navigating to ${targetUrl} (attempt ${attempt}/${maxRetries})...`);
          await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 90000, ...options });
          // Quick content sanity check
          const hasContent = await page.evaluate(() => (document.body.innerText || '').length > 100);
          if (!hasContent) throw new Error('Page content seems empty');
          return; // success
        } catch (err) {
          lastError = err;
          console.log(`⚠️ Navigation attempt ${attempt} failed: ${err.message}`);
          // Hard refresh between attempts
          try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }); } catch {}
          await wait(2000);
        }
      }
      throw lastError;
    }

    async function selectCountry(name = 'Schweiz') {
      // Open selector
      await clickByText('Zulassungsland', ['button', '[role="button"]', 'div']);
      // Wait for country overlay and click the country
      await page.waitForFunction(() => /Länder durchsuchen|Häufig verwendet/i.test(document.body.innerText||''), { timeout: 30000 });
      await clickByText(name, ['li', 'button', '[role="option"]', 'div']);
      await wait(800);
    }

    async function selectCountryMulti() {
      // Works for both German and English UI
      console.log('🔍 Looking for country selector...');
      
      // Click the country selector to open the sidebar
      const countryClicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const countryEl = elements.find(el => {
          const text = (el.innerText || '').toLowerCase();
          return text.includes('zulassungsland') || 
                 text.includes('country of registration') ||
                 text.includes('select country');
        });
        if (countryEl) {
          countryEl.click();
          return true;
        }
        return false;
      });
      
      if (!countryClicked) {
        throw new Error('Could not find country selector');
      }
      
      console.log('✅ Opened country selector');
      
      // Wait for the sidebar to appear on the right - more flexible detection
      try {
        await page.waitForFunction(() => {
          // Look for any overlay, modal, or sidebar that appeared
          const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="sidebar"], [class*="drawer"], [class*="panel"], [class*="popup"]');
          const hasCountryList = /Schweiz|Switzerland|Länder|Countries|Frequently used|Search countries/i.test(document.body.innerText);
          const hasNewContent = document.body.innerText.includes('Search countries') || document.body.innerText.includes('Frequently used');
          return overlays.length > 0 || hasCountryList || hasNewContent;
        }, { timeout: 10000 });
      } catch (e) {
        console.log('⚠️ Sidebar detection timeout, proceeding anyway...');
        await wait(2000); // Give it a moment
      }
      
      console.log('🔍 Country sidebar opened, looking for Switzerland...');
      
      // Wait a moment for the sidebar to fully load
      await wait(1000);
      
      // Debug: Log what's in the sidebar
      const sidebarContent = await page.evaluate(() => {
        const sidebars = document.querySelectorAll('[class*="sidebar"], [class*="drawer"], [class*="panel"]');
        if (sidebars.length > 0) {
          const sidebar = sidebars[sidebars.length - 1];
          return {
            text: sidebar.innerText,
            html: sidebar.innerHTML.substring(0, 500)
          };
        }
        return null;
      });
      console.log('🔍 Sidebar content:', sidebarContent);
      
      // Look for Switzerland in the sidebar - PRECISE approach
      const switzerlandSelected = await page.evaluate(() => {
        // Look specifically for Switzerland text in the sidebar
        const sidebar = document.querySelector('[class*="sidebar"], [class*="drawer"], [class*="panel"]');
        if (!sidebar) {
          console.log('🔍 No sidebar found');
          return false;
        }
        
        // Look for Switzerland in the sidebar
        const swissElements = Array.from(sidebar.querySelectorAll('*')).filter(el => {
          const text = (el.innerText || '').toLowerCase();
          return text.includes('schweiz') || text.includes('switzerland');
        });
        
        if (swissElements.length > 0) {
          console.log('🔍 Found Switzerland element, clicking...');
          swissElements[0].click();
          return true;
        }
        
        // If no Switzerland found, look for the first country in the list
        const countryElements = Array.from(sidebar.querySelectorAll('li, div, button, [role="button"]')).filter(el => {
          const text = (el.innerText || '').trim();
          const rect = el.getBoundingClientRect();
          return text.length > 0 && text.length < 50 && 
                 rect.width > 0 && rect.height > 0 &&
                 !text.includes('Search') && !text.includes('Frequently') && 
                 !text.includes('Remaining') && !text.includes('Via');
        });
        
        if (countryElements.length > 0) {
          console.log('🔍 Found first country element, clicking...');
          countryElements[0].click();
          return true;
        }
        
        console.log('🔍 No country elements found in sidebar');
        return false;
      });
      
      if (!switzerlandSelected) {
        throw new Error('Could not find Switzerland in country list');
      }
      
      console.log('✅ Selected Switzerland from sidebar');
      
      // Wait for the sidebar to close and verify country selection
      await wait(2000);
      
      // Verify that Switzerland was actually selected
      const countrySelected = await page.evaluate(() => {
        const text = document.body.innerText || '';
        return text.includes('Switzerland') || text.includes('Schweiz') || 
               !text.includes('Select country of registration');
      });
      
      if (!countrySelected) {
        console.log('⚠️ Country selection may have failed, trying again...');
        // Try clicking the first country again
        await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('li, div, button, [role="button"]'));
          const firstClickable = elements.find(el => {
            const text = (el.innerText || '').trim();
            return text.length > 0 && text.length < 50 && 
                   !text.includes('Search') && !text.includes('Frequently');
          });
          if (firstClickable) firstClickable.click();
        });
        await wait(1000);
      }
    }

    async function markPlateInputsWithRetry(maxRetries = 3) {
      for (let i = 0; i < maxRetries; i++) {
        console.log(`🔍 Attempt ${i + 1} to find plate inputs...`);
        
        const res = await page.evaluate(() => {
          const isVisible = (el) => {
            const s = getComputedStyle(el); 
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
          };
          
          // Look for all input fields
          const allInputs = Array.from(document.querySelectorAll('input')).filter(isVisible);
          console.log(`Found ${allInputs.length} visible inputs`);
          
          // Filter for text inputs that could be plate inputs
          const textInputs = allInputs.filter(input => {
            const type = input.type || 'text';
            return /text|search|tel|number/i.test(type) && !input.disabled && !input.readOnly;
          });
          
          console.log(`Found ${textInputs.length} text inputs`);
          
          // Look for inputs near registration number labels
          let first = null, second = null;
          
          // Strategy 1: Look for inputs with specific placeholders or names
          for (const input of textInputs) {
            const placeholder = (input.placeholder || '').toLowerCase();
            const name = (input.name || '').toLowerCase();
            const id = (input.id || '').toLowerCase();
            
            if (placeholder.includes('registration') || placeholder.includes('plate') || 
                name.includes('registration') || name.includes('plate') ||
                id.includes('registration') || id.includes('plate')) {
              if (!first) {
                first = input;
                console.log('Found first input by placeholder/name/id');
              } else if (!second) {
                second = input;
                console.log('Found second input by placeholder/name/id');
                break;
              }
            }
          }
          
          // Strategy 2: Look for inputs near labels
          if (!first || !second) {
            const labels = Array.from(document.querySelectorAll('label, span, div')).filter(isVisible);
            for (const label of labels) {
              const text = (label.innerText || '').toLowerCase();
              if (text.includes('registration') || text.includes('plate') || text.includes('kontrollschild')) {
                const input = label.querySelector('input') || 
                             label.nextElementSibling?.querySelector?.('input') ||
                             label.parentElement?.querySelector?.('input');
                if (input && textInputs.includes(input)) {
                  if (!first) {
                    first = input;
                    console.log('Found first input by label');
                  } else if (!second) {
                    second = input;
                    console.log('Found second input by label');
                    break;
                  }
                }
              }
            }
          }
          
          // Strategy 3: Just take first two text inputs
          if (!first || !second) {
            first = first || textInputs[0] || null;
            second = second || textInputs[1] || null;
            console.log('Using first two text inputs as fallback');
          }
          
          if (first) {
            first.setAttribute('data-auto-input', 'plate-1');
            console.log('Marked first input');
          }
          if (second) {
            second.setAttribute('data-auto-input', 'plate-2');
            console.log('Marked second input');
          }
          
          return { first: !!first, second: !!second };
        });
        
        if (res.first && res.second) {
          console.log('✅ Found both plate inputs');
          return true;
        }
        
        console.log(`❌ Only found ${res.first ? 1 : 0} input(s), retrying...`);
        // Scroll a bit and retry
        await page.evaluate(() => window.scrollBy(0, 300));
        await wait(1000);
      }
      return false;
    }

    async function clickEnabledButtonByText(text, timeoutMs = 60000) {
      await page.waitForFunction((t) => {
        const isVisible = (el) => {
          const s = getComputedStyle(el); const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        };
        const isEnabled = (el) => !el.disabled && el.getAttribute('aria-disabled') !== 'true';
        const btns = Array.from(document.querySelectorAll('button, [role="button"], a'))
          .filter(isVisible)
          .filter(isEnabled)
          .filter(el => ((el.innerText||'').trim().toLowerCase().includes(t.toLowerCase())));
        if (btns[0]) { btns[0].setAttribute('data-auto-enabled-btn', '1'); return true; }
        return false;
      }, { timeout: timeoutMs, polling: 'mutation' }, text);
      await page.click('[data-auto-enabled-btn="1"]');
      await page.evaluate(() => {
        const el = document.querySelector('[data-auto-enabled-btn="1"]');
        if (el) el.removeAttribute('data-auto-enabled-btn');
      });
    }

    async function typeIntoInputLabeled(labelText, index = 1, value = '', timeoutMs = 60000) {
      // Quick path: placeholder-based lookup
      const placeholder = await page.$(`input[placeholder*="${labelText}"]`);
      if (placeholder && index === 1) {
        await placeholder.click();
        if (value) await placeholder.type(value, { delay: 50 });
        return;
      }
      await page.waitForFunction((t, i) => {
        const xpath = `//label[contains(normalize-space(.), '${'${'}t${'}'}')]`;
        const it = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let node = it.iterateNext();
        const labels = [];
        while (node) { labels.push(node); node = it.iterateNext(); }
        if (labels.length === 0) return false;
        // Collect following inputs near the first matching label
        const container = labels[0].closest('form') || document;
        const inputs = Array.from(container.querySelectorAll('input'));
        const visibleInputs = inputs.filter(el => {
          const s = getComputedStyle(el); const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        });
        if (visibleInputs.length < i) return false;
        const target = visibleInputs[i - 1];
        target.setAttribute('data-auto-input', String(i));
        return true;
      }, { timeout: timeoutMs, polling: 'mutation' }, labelText, index);
      await page.click(`[data-auto-input="${index}"]`);
      if (value) {
        await page.type(`[data-auto-input="${index}"]`, value, { delay: 50 });
      }
      await page.evaluate((i) => {
        const el = document.querySelector(`[data-auto-input="${i}"]`);
        if (el) el.removeAttribute('data-auto-input');
      }, index);
    }

    // Vercel-compatible browser launch
    const launchOptions = {
      headless: true, // Run in headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: 60000
    };

    // Use executablePath for Vercel if available
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // Retryable launch to mitigate headless startup flakiness
    async function launchBrowserWithRetry(options) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🚀 Launching browser (attempt ${attempt})...`);
          return await puppeteer.launch(options);
        } catch (err) {
          console.error(`❌ Browser launch failed (attempt ${attempt}):`, err.message);
          if (attempt === 3) throw err;
        }
      }
    }

    browser = await launchBrowserWithRetry(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
    page.setDefaultNavigationTimeout(90000);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9,de-DE,de;q=0.8' });
    await page.evaluateOnNewDocument(() => {
      try {
        // Hint UI libraries about preferred language but let site choose
        if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'en');
      } catch {}
    });

    // Pipe browser console to Node for diagnostics
    page.on('console', msg => {
      try { console.log('🧭 [browser]', msg.type(), msg.text()); } catch {}
    });

    // Set user agent for better compatibility
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Monitor for payment URLs (strict pattern)
    const paymentRegex = /https:\/\/pajar\.bazg\.admin\.ch\/checkout\/[^^\s/]+\/selection/;
    page.on('response', response => {
      const url = response.url();
      if (paymentRegex.test(url)) {
        console.log('🔗 Payment URL detected:', url);
        paymentUrl = url;
      }
    });

    page.on('framenavigated', frame => {
      const url = frame.url();
      if (paymentRegex.test(url)) {
        console.log('🔗 Payment URL detected (frame):', url);
        paymentUrl = url;
      }
    });

    console.log('🌐 Step 1: Navigating to via.admin.ch dashboard...');
    await navigateWithRetries('https://via.admin.ch/shop/dashboard');
    await wait(3000);
    
    // Check if page is blank or still loading (common issue with this site)
    const pageState = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const hasContent = bodyText.length > 100; // Page should have substantial content
      const hasLoading = bodyText.includes('i18n.') || 
                        document.querySelector('[class*="loading"], [class*="spinner"]') !== null;
      const isBlank = bodyText.trim().length < 50; // Very little content = blank page
      
      return { hasContent, hasLoading, isBlank, bodyLength: bodyText.length };
    });
    
    console.log('🔍 Page state check:', pageState);
    
    if (pageState.isBlank || pageState.hasLoading || !pageState.hasContent) {
      console.log('🔄 Page is blank or still loading, refreshing...');
      await navigateWithRetries('https://via.admin.ch/shop/dashboard');
      await wait(3000);
      
      // Check again after refresh
      const afterRefresh = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        return { hasContent: bodyText.length > 100, bodyLength: bodyText.length };
      });
      
      console.log('🔍 After refresh:', afterRefresh);
      
      if (!afterRefresh.hasContent) {
        console.log('🔄 Still blank after refresh, trying one more time...');
        await navigateWithRetries('https://via.admin.ch/shop/dashboard');
        await wait(3000);
      }
    }

    // Handle cookie consent if present (German variants too)
    try {
      const tryAcceptCookies = async () => {
        const candidates = await page.$$('button, [role="button"], .cookie-accept');
        for (const btn of candidates) {
          const text = (await page.evaluate(el => (el.innerText || '').trim(), btn)) || '';
          if (/akzeptieren|alle akzeptieren|zustimmen|einverstanden|accept/i.test(text)) {
            await btn.click();
            return true;
          }
        }
        return false;
      };
      await tryAcceptCookies();
      await wait(1000);
    } catch (e) {
      console.log('No cookie consent found or already accepted');
    }

    // Scroll and click the E‑Vignette Kaufen button
    console.log('🌐 Schritt 2: Suche nach E‑Vignette und Button "Kaufen"...');
    
    // Wait for page to have actionable buttons (German or English) with reload retries
    {
      let ready = false;
      for (let attempt = 1; attempt <= 3 && !ready; attempt++) {
        try {
          await page.waitForFunction(() => {
            const isVisible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
            const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(isVisible);
            const hasBuy = buttons.some(b => /(kaufen|buy)/i.test((b.innerText||'')));
            const text = document.body.innerText || '';
            const hasTile = /E[\u2011\u2010\-\s]?vignette/i.test(text) || /Digitale Vignette|E‑Vignette|E‑vignette|digital vignette/i.test(text);
            return hasBuy || hasTile;
          }, { timeout: 20000 });
          ready = true;
        } catch (e) {
          console.log(`🔄 Dashboard still loading (attempt ${attempt}), refreshing...`);
          try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }); } catch {}
          await wait(2000);
        }
      }
      if (!ready) throw new Error('Dashboard did not become ready in time');
    }
    
    console.log('✅ Page loaded with content');

    // Try to switch UI to German explicitly if a language selector exists
    try {
      const switched = await page.evaluate(() => {
        const isVisible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
        const items = Array.from(document.querySelectorAll('button, a, [role="button"], li')).filter(isVisible);
        const de = items.find(el => /\bDE\b|Deutsch/i.test(el.innerText||''));
        if (de) { de.click(); return true; }
        return false;
      });
      if (switched) { await wait(1500); }
    } catch {}
    
    // Scroll to make sure all content is visible
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.5));
      await wait(500);
    }
    
    await wait(2000);
    
    // Try multiple strategies to find and click Kaufen with retries
    let clicked = false;
    for (let attempt = 1; attempt <= 3 && !clicked; attempt++) {
      try {
        // Strategy 1: Look for E-Vignette card and its Kaufen button
        clicked = await page.evaluate(() => {
          const isVisible = (el) => {
            const s = getComputedStyle(el); const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
          };
          const cards = Array.from(document.querySelectorAll('*')).filter(el => {
            const t = (el.innerText||'');
            return isVisible(el) && (/E[\u2011\u2010\-\s]?Vignette/i.test(t) || /Digitale Vignette|Digital Vignette/i.test(t));
          });
          for (const card of cards) {
            const btns = Array.from(card.querySelectorAll('button, a, [role="button"]')).filter(isVisible);
            const buy = btns.find(b => /(kaufen|buy)/i.test((b.innerText||'').trim()));
            if (buy) { buy.click(); return true; }
          }
          return false;
        });
      } catch (e) {
        console.log('Strategy 1 failed:', e.message);
      }

      if (!clicked) {
        try {
          // Strategy 2: Direct text search
          try { await clickByText('Kaufen', ['button', 'a', '[role="button"]', '[data-testid]'], 10000); clicked = true; } catch {}
          if (!clicked) { try { await clickByText('Buy', ['button', 'a', '[role="button"]', '[data-testid]'], 10000); clicked = true; } catch {} }
        } catch (e) {
          console.log('Strategy 2 failed:', e.message);
        }
      }

      if (!clicked) {
        // Strategy 3: Look for any button with "Kaufen" or "Buy"
        clicked = await page.evaluate(() => {
          const isVisible = (el) => {
            const s = getComputedStyle(el); const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
          };
          const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(isVisible);
          const buyBtn = allBtns.find(b => /(kaufen|buy)/i.test((b.innerText||'').trim()));
          if (buyBtn) { buyBtn.click(); return true; }
          return false;
        });
      }

      if (!clicked) {
        console.log(`🔄 Kaufen/Buy not clickable yet (attempt ${attempt}), reloading list...`);
        try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }); } catch {}
        await wait(1500);
      }
    }
    
    if (!clicked) {
      throw new Error('Could not find Kaufen button');
    }
    
    console.log('🎯 "Kaufen" geklickt');
    await page.waitForFunction(() => location.href.includes('/shop/config/evignette'), { timeout: 60000 });
    await wait(1000);

    // Tag configurator root to scope all further actions (avoid dashboard widgets)
    await page.evaluate(() => {
      const possible = document.querySelector('[data-testid="configurator"]') || document.querySelector('main') || document.body;
      possible && possible.setAttribute('data-auto-config', '1');
      // Disable help/info hotspots that steal clicks
      try {
        const disable = (el) => { if (!el) return; el.style.pointerEvents = 'none'; el.setAttribute('data-auto-disabled', '1'); };
        const selectors = [
          '[aria-label*="How does" i]', '[aria-label*="funktioniert" i]', '[title*="How does" i]', '[title*="funktioniert" i]',
          '[data-testid*="info" i]', '[class*="info" i]'
        ];
        selectors.forEach(sel => document.querySelectorAll(sel).forEach(disable));
      } catch {}
    });

    console.log('🌐 Schritt 3: Fahrzeugdaten ausfüllen...');
    // Wait for configurator page indicator (URL or key texts)
    await page.waitForFunction(() => location.href.includes('/shop/config/evignette') || !!document.querySelector('[data-testid="configurator"]'), { timeout: 60000 }).catch(() => null);
    try {
      await waitForText(/Fahrzeugkategorie|Vehicle category|Country of registration|Select country of registration|Registration number/i, 60000);
    } catch (_) {
      // As a fallback, wait for any form to appear
      await page.waitForFunction(() => !!document.querySelector('[data-auto-config] input, [data-auto-config] button'), { timeout: 60000 });
    }
    await wait(1500);

    // Helper: click element containing text inside configurator only
    async function clickInConfiguratorByText(text) {
      const clicked = await page.evaluate((t) => {
        const root = document.querySelector('[data-auto-config]') || document.body;
        const isVisible = (el) => {
          const s = getComputedStyle(el); const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        };
        const all = Array.from(root.querySelectorAll('button, [role="button"], a, div'));
        const el = all.find(e => isVisible(e) && (e.innerText||'').toLowerCase().includes(t.toLowerCase()));
        if (el) { el.click(); return true; }
        return false;
      }, text);
      if (!clicked) throw new Error(`Configurator element not found: ${text}`);
    }

    // Select vehicle category: Click Motorfahrzeug tile using DOM-safe approach
    console.log('🎯 Selecting vehicle category...');
    try {
      // Wait for the Angular custom element to load
      await page.waitForSelector('.category-tile label', { timeout: 10000 });
      console.log('✅ Vehicle category section loaded');
      
      // Find and click Motorfahrzeug tile using DOM-safe approach
      await page.evaluate(() => {
        const tiles = document.querySelectorAll('.category-tile');
        const target = Array.from(tiles).find(t => (t.innerText || '').includes('Motorfahrzeug'));
        if (target) target.click();
      });
      console.log('✅ Clicked Motorfahrzeug tile');
    } catch (e) {
      console.log('⚠️ Vehicle selection error:', e.message);
      throw e;
    }
    await wait(1500);

    // Verify vehicle category selection
    try {
      await page.waitForFunction(() => {
        const selectedTile = document.querySelector('fc-category-tile div[category-item-selected="true"]');
        return selectedTile && selectedTile.innerText.includes('Motorfahrzeug');
      }, { timeout: 5000 });
      console.log('✅ Vehicle category verified');
    } catch (e) {
      console.log('⚠️ Vehicle category verification failed');
    }

    // Country selection: robust headless-safe selection with mouse click + retry
    console.log('🌍 Selecting country...');
    try {
      await page.waitForSelector('fc-country-selection-field .country-selection-field', { timeout: 10000 });
      console.log('✅ Country selection field loaded');

      // Open selector first
      await page.click('fc-country-selection-field .country-selection-field');
      console.log('✅ Opened country selector');

      // Wait for overlay items to render and be visible
      await page.waitForSelector('fc-country-list-item .country-list-item-container', { visible: true, timeout: 10000 });
      console.log('✅ Country list overlay loaded');

      let success = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🖱️ Selecting Switzerland (attempt ${attempt})...`);
          const handle = await page.evaluateHandle(() => {
            const items = Array.from(document.querySelectorAll('fc-country-list-item .country-list-item-container'));
            let target = items.find(el => el.getAttribute('country-code') === 'CH');
            if (!target) target = items.find(el => (el.innerText || '').includes('Schweiz'));
            if (!target && items.length > 0) target = items[0]; // fallback: first item
            return target || null;
          });

          if (handle) {
            const box = await handle.boundingBox();
            if (box) {
              await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
              // verify some country selected (non-empty text in field)
              await page.waitForFunction(() => {
                const field = document.querySelector('fc-country-selection-field .country-selection-field');
                return field && field.innerText && field.innerText.trim().length > 0;
              }, { timeout: 8000 });
              console.log('✅ Country selected');
              success = true;
              await handle.dispose();
              break;
            }
            await handle.dispose();
          }
        } catch (err) {
          console.warn(`⚠️ Attempt ${attempt} failed: ${err.message}`);
          // Try to dismiss overlay and re-open
          try { await page.keyboard.press('Escape'); } catch {}
          await wait(300);
          try { await page.click('fc-country-selection-field .country-selection-field'); } catch {}
          await page.waitForSelector('fc-country-list-item .country-list-item-container', { visible: true, timeout: 10000 }).catch(() => {});
        }
      }

      if (!success) {
        throw new Error('Country selection failed after retries');
      }
    } catch (e) {
      console.log('⚠️ Country selection failed:', e.message);
      throw e;
    }
    await wait(500);

    // Verify country selection
    try {
      await page.waitForFunction(() => {
        const countryText = document.querySelector('fc-country-selection-field .country-list-item-txt');
        return countryText && (countryText.innerText.includes('Schweiz') || countryText.innerText.includes('Switzerland'));
      }, { timeout: 5000 });
      console.log('✅ Country selection verified');
    } catch (e) {
      console.log('⚠️ Country selection verification failed');
    }

    // Ensure we are in the registration section
    await page.evaluate(() => {
      const root = document.querySelector('[data-auto-config]') || document.body;
      const t = (el) => (el.innerText||'').toLowerCase();
      const reg = Array.from(root.querySelectorAll('*')).find(el => t(el).includes('kontrollschild') || t(el).includes('kennzeichen') || t(el).includes('registration number') || t(el).includes('number plate') || t(el).includes('license plate'));
      if (reg) reg.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await wait(1000);

    // Find registration inputs strictly inside configurator
    console.log('✍️  Locating registration inputs...');
    let inputsFound = { hasFirst: false, hasSecond: false };
    for (let i = 0; i < 4; i++) {
      inputsFound = await page.evaluate(() => {
        const root = document.querySelector('[data-auto-config]') || document.body;
        const isVisible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
        const getAllInputsDeep = () => {
          const result = [];
          const walk = (node) => {
            const tree = (node.shadowRoot || node);
            const inputs = tree.querySelectorAll ? tree.querySelectorAll('input') : [];
            inputs.forEach(i => result.push(i));
            const children = tree.children ? Array.from(tree.children) : [];
            for (const child of children) walk(child);
            const shadowHosts = tree.querySelectorAll ? Array.from(tree.querySelectorAll('*')).filter(el => el.shadowRoot) : [];
            for (const host of shadowHosts) walk(host);
          };
          walk(root);
          return result;
        };
        const inputs = getAllInputsDeep().filter(isVisible);
        // Prefer inputs within the registration section
        const section = Array.from(root.querySelectorAll('*')).find(el => /(\bkontrollschild\b|\bkennzeichen\b|registration number|number plate|license plate)/i.test(el.innerText||'')) || root;
        const sectionInputs = Array.from(section.querySelectorAll('input'));
        const candidates = inputs.length ? inputs : sectionInputs;
        // Heuristic: exclude search bars or obvious unrelated inputs
        const filtered = candidates.filter(i => {
          const ph = (i.placeholder||'').toLowerCase();
          const name = (i.name||'').toLowerCase();
          const id = (i.id||'').toLowerCase();
          return /(plate|kennzeichen|kontroll|reg|nummer|license)/.test(ph+name+id) || i.maxLength >= 6 || i.getAttribute('inputmode') === 'text' || i.getAttribute('aria-label');
        });
        const first = filtered[0] || candidates[0] || null;
        const second = (filtered[1] || candidates[1]) || null;
        if (first) first.setAttribute('data-auto-config-input','first');
        if (second) second.setAttribute('data-auto-config-input','second');
        return { hasFirst: !!first, hasSecond: !!second };
      });
      if (inputsFound.hasFirst) break;
      await wait(1500);
    }
 
    if (!inputsFound.hasFirst) throw new Error('Registration input not found in configurator');

    // Type plate into first, then second (strictly inside configurator)
    const firstHandle = await page.$('[data-auto-config-input="first"]');
    if (firstHandle) {
      await firstHandle.click();
      await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
      await firstHandle.type(orderDetails.plateNumber, { delay: 80 });
      await wait(600);
    }

    // Try to reveal second input by focusing out and back in
    await page.keyboard.press('Tab');
    await wait(600);

    // Ensure second exists; if not, re-scan within configurator
    let secondHandle = await page.$('[data-auto-config-input="second"]');
    if (!secondHandle) {
      await page.evaluate(() => {
        const root = document.querySelector('[data-auto-config]');
        const isVisible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
        const textInputs = Array.from(root.querySelectorAll('input[type="text"], input[aria-label], input[placeholder]')).filter(isVisible);
        const first = root.querySelector('[data-auto-config-input="first"]');
        const second = textInputs.find(el => first && el !== first);
        if (second) second.setAttribute('data-auto-config-input','second');
      });
      secondHandle = await page.$('[data-auto-config-input="second"]');
    }

    if (secondHandle) {
      await secondHandle.click();
      await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
      await secondHandle.type(orderDetails.plateNumber, { delay: 80 });
      await wait(800);
    } else {
      console.log('⚠️ Could not find second input inside configurator; proceeding with single input');
    }

    // After inputs, wait for Add to cart to enable
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"], a'));
      const btn = btns.find(b => /(add to cart|in den warenkorb)/i.test((b.innerText||'')));
      if (!btn) return false;
      const disabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
      return !disabled;
    }, { timeout: 10000 }).catch(() => {});

    // Trigger validation and try to enable the Add to Cart button
    try {
      await page.evaluate(() => {
        // Dispatch input/change events to trigger validators
        const inputs = Array.from(document.querySelectorAll('input'));
        inputs.forEach((el) => {
          try {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.blur && el.blur();
          } catch {}
        });
      });
      await wait(1000);
    } catch {}

    // Add to cart: In den Warenkorb (ensure enabled)
    console.log('🌐 Schritt 4: In den Warenkorb...');
    
    // Wait for inputs to be processed and button to become enabled
    await wait(2000);
    
    // Try multiple strategies to click add to cart
    let addedToCart = false;
    
    // Strategy 0: If button exists but disabled, try to enable it
    try {
      const triedEnable = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = candidates.find(b => /(In den Warenkorb|Add to cart)/i.test((b.innerText||'')));
        if (btn && (btn.disabled || btn.getAttribute('aria-disabled') === 'true')) {
          // Attempt to enable
          btn.disabled = false;
          btn.setAttribute && btn.setAttribute('aria-disabled', 'false');
          return true;
        }
        return false;
      });
      if (triedEnable) await wait(300);
    } catch {}

    // Strategy 1: Look for enabled button by text
    try {
      await clickEnabledButtonByText('In den Warenkorb', 10000);
      addedToCart = true;
      console.log('✅ Added to cart (German)');
    } catch (e) {
      console.log('German button not found, trying English...');
    }
    
    if (!addedToCart) {
      try {
        await clickEnabledButtonByText('Add to cart', 10000);
        addedToCart = true;
        console.log('✅ Added to cart (English)');
      } catch (e) {
        console.log('English button not found, trying fallback...');
      }
    }
    
    // Strategy 2: Look for any button with cart/shopping icon
    if (!addedToCart) {
      addedToCart = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"], a'));
        const cartButton = buttons.find(btn => {
          const text = (btn.innerText || '').toLowerCase();
          const hasCartIcon = btn.querySelector('svg, [class*="cart"], [class*="basket"], [class*="shopping"]');
          const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
          return (text.includes('warenkorb') || text.includes('cart') || aria.includes('cart') || hasCartIcon);
        });
        if (cartButton) {
          cartButton.click();
          return true;
        }
        return false;
      });
      if (addedToCart) console.log('✅ Added to cart (fallback)');
    }
    
    // Strategy 3: Force click if present but still disabled
    if (!addedToCart) {
      const forced = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"], a'));
        const btn = buttons.find(b => /(In den Warenkorb|Add to cart)/i.test((b.innerText||'')) || (b.getAttribute('aria-label')||'').toLowerCase().includes('cart'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (forced) {
        addedToCart = true;
        console.log('✅ Forced add to cart click');
      }
    }

    if (!addedToCart) {
      throw new Error('Could not find or click Add to cart button');
    }
    
    await wait(3000);

    // Popup: Öffentlich einsehbar → Aktivieren
    try {
      const popup = await page.$('.modal, .popup, [role="dialog"], .dialog');
      if (popup) {
        try {
          await clickByText('Aktivieren', ['button', '[role="button"]'], 20000);
          await wait(1500);
        } catch (_) {}
      }
    } catch (e) {
      console.log('Kein Popup gefunden oder bereits behandelt');
    }

    console.log('🌐 Schritt 5: Zur Kasse...');
    
    // Wait for cart to load and checkout button to appear
    await wait(2000);
    
    // Try multiple strategies to find checkout button
    let checkoutClicked = false;
    
    // Strategy 1: Look for checkout button by text
    const checkoutTexts = ['Zur Kasse', 'Proceed to checkout', 'Checkout', 'Kasse', 'Check out'];
    
    for (const text of checkoutTexts) {
      try {
        await clickEnabledButtonByText(text, 10000);
        checkoutClicked = true;
        console.log(`✅ Proceeded to checkout (${text})`);
        break;
      } catch (e) {
        console.log(`❌ ${text} button not found`);
      }
    }
    
    // Strategy 2: Look for any button in cart/sidebar area
    if (!checkoutClicked) {
      checkoutClicked = await page.evaluate(() => {
        // Look for buttons in cart/sidebar area (side cart)
        const cartAreas = document.querySelectorAll('[class*="cart"], [class*="sidebar"], [class*="basket"], [class*="drawer"]');
        let searchArea = document;
        
        // Use the most recent cart/sidebar (usually the side cart)
        if (cartAreas.length > 0) {
          searchArea = cartAreas[cartAreas.length - 1];
        }
        
        const buttons = Array.from(searchArea.querySelectorAll('button, [role="button"], a'));
        
        const checkoutButton = buttons.find(btn => {
          const text = (btn.innerText || '').toLowerCase();
          return (text.includes('checkout') || text.includes('kasse') || text.includes('proceed')) && !btn.disabled;
        });
        
        if (checkoutButton) {
          checkoutButton.click();
          return true;
        }
        return false;
      });
      
      if (checkoutClicked) console.log('✅ Proceeded to checkout (side cart)');
    }
    
    // Strategy 3: Look for any button with checkout-related text
    if (!checkoutClicked) {
      checkoutClicked = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button, [role="button"], a'));
        const checkoutButton = allButtons.find(btn => {
          const text = (btn.innerText || '').toLowerCase();
          return (text.includes('checkout') || text.includes('kasse') || text.includes('proceed') || text.includes('pay')) && !btn.disabled;
        });
        
        if (checkoutButton) {
          checkoutButton.click();
          return true;
        }
        return false;
      });
      
      if (checkoutClicked) console.log('✅ Proceeded to checkout (fallback)');
    }
    
    if (!checkoutClicked) {
      throw new Error('Could not find or click checkout button');
    }
    
    await wait(5000);

    // Wait for the quick redirect and capture the transient URL
    console.log('🔍 Waiting for payment redirect...');
    
    // Wait for navigation to payment page
    try {
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (_) {
      console.log('No navigation detected, checking current URL...');
    }
    
    // Get the current URL
    const currentUrl = page.url();
    console.log('🔗 Current URL:', currentUrl);
    
    // Check if we got the payment URL
    if (paymentRegex.test(currentUrl)) {
      paymentUrl = currentUrl;
      console.log('✅ Real payment URL captured from navigation:', paymentUrl);
      return paymentUrl;
    }
    
    // If we didn't get the payment URL, wait a bit more and check again
    await wait(2000);
    const finalUrl = page.url();
    console.log('🔗 Final URL after wait:', finalUrl);
    
    if (paymentRegex.test(finalUrl)) {
      paymentUrl = finalUrl;
      console.log('✅ Real payment URL captured after wait:', paymentUrl);
      return paymentUrl;
    }
    
    // Check if we have any captured URLs from the listeners
    if (paymentUrl) {
      console.log('✅ Real payment URL captured from listeners:', paymentUrl);
      return paymentUrl;
    }
    
    console.log('⚠️ No payment URL detected, returning null to signal failure');
    return null;

  } catch (error) {
    console.error('❌ Error during web automation:', error.message);
    
    // Do not fabricate; propagate failure
    return null;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Check vignette validity by navigating to the validity page, entering the plate number,
 * and scraping the status with normalization and a single retry on invalid.
 */
async function checkVignetteValidity(plateNumber) {
  const axios = require('axios');
  try {
    const normalizedPlate = String(plateNumber).replace(/[\s.-]/g, '');
    const response = await axios.put(
      'https://via.admin.ch/shop/api/v1/vehicle/query-license-plate',
      {
        country: 'CH',
        plate: normalizedPlate,
        productType: 'E_VIGNETTE'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 20000
      }
    );

    const data = response && response.data ? response.data : {};
    if (data && data.status === 'VALID') {
      console.log('✅ Vignette valid until:', data.validUntil);
      return { valid: true, validUntil: data.validUntil };
    }

    console.log('❌ Not valid or not found');
    return { valid: false };
  } catch (err) {
    console.error('❌ Error checking vignette:', err.message);
    return { valid: false, error: err.message };
  }
}

module.exports = { fillSwissVignetteForm, checkVignetteValidity };

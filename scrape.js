const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 4000 });
  
  // Navigate to the site and wait for content to render
  await page.goto('https://thisisnabi-dev.liara.run', { 
    waitUntil: 'networkidle0',
    timeout: 60000 
  });
  
  // Wait for curriculum section to be present
  await page.waitForSelector('#curriculum', { timeout: 30000 });
  
  // Extract full curriculum data using JavaScript
  const curriculumData = await page.evaluate(() => {
    const result = {
      parts: []
    };
    
    // Find the curriculum section
    const curriculumSection = document.querySelector('#curriculum');
    if (!curriculumSection) return result;
    
    // Get the grid with all 6 level cards
    const gridContainer = curriculumSection.querySelector('.nbG3[style*="margin-top: 24px"]');
    if (!gridContainer) return result;
    
    const levelCards = gridContainer.querySelectorAll(':scope > div');
    
    levelCards.forEach((card, cardIndex) => {
      const orderEl = card.querySelector('[style*="Silkscreen"]');
      const titleEl = card.querySelector('[style*="font-size: 15px"][style*="font-weight: 600"], [style*="font-size: 14px"][style*="font-weight: 700"]');
      const descEl = card.querySelector('p');
      const topicsEl = card.querySelector('[style*="JetBrains Mono"][style*="10px"]');
      
      if (!orderEl || !titleEl) return;
      
      const partData = {
        order: cardIndex + 1,
        orderText: orderEl.textContent.trim(),
        title: titleEl.textContent.trim(),
        description: descEl ? descEl.textContent.trim() : '',
        topicsCount: topicsEl ? topicsEl.textContent.trim() : '',
        items: []
      };
      
      result.parts.push(partData);
    });
    
    // Now try to find the expanded detail sections below the grid
    // These contain the actual topic lists
    const allDivs = curriculumSection.querySelectorAll(':scope > div');
    
    // Look for sections that have the detailed topic lists
    // They typically have structure: header div with order number, then grid with columns
    allDivs.forEach((div, divIndex) => {
      // Check if this is a detail section (has nbG2 grid inside)
      const detailGrid = div.querySelector('.nbG2');
      if (!detailGrid) return;
      
      // Get the header info
      const headerDiv = div.querySelector(':scope > div:first-child');
      if (!headerDiv) return;
      
      const orderEl = headerDiv.querySelector('[style*="Silkscreen"]');
      const titleEl = headerDiv.querySelector('[style*="font-size: 26px"], [style*="font-size: 24px"]');
      
      if (!orderEl) return;
      
      const orderNum = parseInt(orderEl.textContent.trim());
      if (isNaN(orderNum) || orderNum < 1 || orderNum > 6) return;
      
      const partIndex = orderNum - 1;
      if (!result.parts[partIndex]) return;
      
      // Update title if we found a better one
      if (titleEl) {
        result.parts[partIndex].detailedTitle = titleEl.textContent.trim();
      }
      
      // Get description from header
      const descEl = headerDiv.querySelector('[style*="font-size: 14px"], [style*="font-size: 13px"]');
      if (descEl && !result.parts[partIndex].description) {
        result.parts[partIndex].description = descEl.textContent.trim();
      }
      
      // Extract items from columns
      const columns = detailGrid.querySelectorAll(':scope > div');
      columns.forEach(col => {
        // Check for column header (PRINCIPLES or PATTERNS)
        const headerSpan = col.querySelector('[style*="JetBrains Mono"][style*="11px"][style*="letter-spacing"]');
        let itemType = 'topic';
        if (headerSpan) {
          const headerText = headerSpan.textContent.toUpperCase();
          if (headerText.includes('PRINCIPLE')) itemType = 'principle';
          else if (headerText.includes('PATTERN')) itemType = 'pattern';
          else if (headerText.includes('TRACK')) itemType = 'track';
        }
        
        // Get all topic items
        const topicItems = col.querySelectorAll('[style*="border-bottom"], [style*="padding: 7px"]');
        topicItems.forEach(item => {
          const text = item.textContent.trim();
          if (text && text.length > 2 && !text.includes('TOPICS') && !text.includes('PRINCIPLES') && !text.includes('PATTERNS')) {
            result.parts[partIndex].items.push({
              name: text,
              type: itemType,
              source_text: text,
              source_url: ''
            });
          }
        });
      });
    });
    
    return result;
  });
  
  console.log(JSON.stringify(curriculumData, null, 2));
  fs.writeFileSync('/workspace/curriculum_data.json', JSON.stringify(curriculumData, null, 2));
  
  await browser.close();
})();

/* Knowledge Base App - 100% offline, no external dependencies */

(function() {
  'use strict';
  
  // Theme Toggle
  const themeToggle = document.getElementById('kbThemeToggle');
  const html = document.documentElement;
  
  // Check for saved theme preference or default to system preference
  const savedTheme = localStorage.getItem('kb-theme');
  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('kb-theme', newTheme);
      
      // Update icon
      themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    });
    
    // Set initial icon
    const currentTheme = html.getAttribute('data-theme') || 
                        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
  }
  
  // Search/Filter functionality
  const searchInput = document.getElementById('kbSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll('.kb-item');
      let visibleCount = 0;
      
      items.forEach(function(item) {
        const name = item.querySelector('.kb-item-name');
        const type = item.querySelector('.kb-item-type');
        const teaser = item.querySelector('.kb-item-teaser');
        
        const searchText = [
          name ? name.textContent.toLowerCase() : '',
          type ? type.textContent.toLowerCase() : '',
          teaser ? teaser.textContent.toLowerCase() : ''
        ].join(' ');
        
        if (query === '' || searchText.includes(query)) {
          item.classList.remove('hidden');
          visibleCount++;
        } else {
          item.classList.add('hidden');
        }
      });
      
      // Show/hide no results message
      const noResults = document.querySelector('.kb-no-results');
      if (noResults) {
        if (visibleCount === 0 && query !== '') {
          noResults.style.display = 'block';
        } else {
          noResults.style.display = 'none';
        }
      }
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Focus search on '/' key
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      const searchInput = document.getElementById('kbSearch');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Close sidebar on Escape (mobile)
    if (e.key === 'Escape') {
      const sidebar = document.querySelector('.kb-sidebar');
      if (sidebar && window.innerWidth <= 900) {
        sidebar.style.display = 'none';
      }
    }
  });
  
  // Active nav link highlighting based on scroll position
  const navLinks = document.querySelectorAll('.kb-nav-link');
  const parts = document.querySelectorAll('.kb-part');
  
  if (navLinks.length > 0 && parts.length > 0) {
    window.addEventListener('scroll', function() {
      const scrollPos = window.scrollY + 150;
      
      parts.forEach(function(part, index) {
        const partTop = part.offsetTop;
        const partHeight = part.offsetHeight;
        
        if (scrollPos >= partTop && scrollPos < partTop + partHeight) {
          navLinks.forEach(function(link) {
            link.classList.remove('active');
          });
          
          const activeLink = document.querySelector(`.kb-nav-link[href="#part${index + 1}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    });
  }
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId !== '#') {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
  
  // Copy code button (if code blocks exist)
  document.querySelectorAll('.kb-code-block').forEach(function(codeBlock) {
    const pre = codeBlock.querySelector('pre');
    if (pre) {
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.style.cssText = 'position:absolute;top:0.5rem;right:0.5rem;padding:0.25rem 0.5rem;font-size:0.7rem;border:1px solid var(--border-color);border-radius:3px;background:var(--bg-secondary);color:var(--text-secondary);cursor:pointer;';
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(pre.textContent).then(function() {
          copyBtn.textContent = 'Copied!';
          setTimeout(function() {
            copyBtn.textContent = 'Copy';
          }, 2000);
        });
      });
      codeBlock.style.position = 'relative';
      codeBlock.appendChild(copyBtn);
    }
  });
  
})();

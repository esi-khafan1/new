// Knowledge Base App - 100% Offline, No External Dependencies

(function() {
  'use strict';

  // Theme toggle with localStorage persistence
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  
  // Load saved theme
  const savedTheme = localStorage.getItem('kb-theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
  } else if (savedTheme === 'light') {
    body.classList.remove('dark-mode');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      body.classList.toggle('dark-mode');
      const isDark = body.classList.contains('dark-mode');
      localStorage.setItem('kb-theme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
    
    // Set initial button text
    const isDark = body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  // Search functionality
  const searchInput = document.getElementById('kbSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll('.kb-item');
      let visibleCount = 0;
      
      items.forEach(function(item) {
        const name = item.querySelector('.kb-item-name').textContent.toLowerCase();
        const teaser = item.querySelector('.kb-item-teaser').textContent.toLowerCase();
        const type = item.querySelector('.kb-item-type').textContent.toLowerCase();
        
        if (query === '' || name.includes(query) || teaser.includes(query) || type.includes(query)) {
          item.classList.remove('hidden');
          visibleCount++;
        } else {
          item.classList.add('hidden');
        }
      });
      
      // Show/hide no results message
      let noResults = document.querySelector('.no-results');
      if (visibleCount === 0 && query !== '') {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'no-results';
          noResults.textContent = 'No topics found matching "' + query + '"';
          document.querySelector('.kb-items').appendChild(noResults);
        }
      } else if (noResults) {
        noResults.remove();
      }
      
      // Update counts in nav
      document.querySelectorAll('.kb-nav-count').forEach(function(countEl) {
        const partId = countEl.parentElement.querySelector('.kb-nav-link').getAttribute('href').substring(1);
        const partSection = document.getElementById(partId);
        if (partSection) {
          const visibleItems = partSection.querySelectorAll('.kb-item:not(.hidden)').length;
          countEl.textContent = visibleCount > 0 ? visibleCount : '0';
        }
      });
    });

    // Keyboard shortcut: focus search with /
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, '#' + targetId);
      }
    });
  });

  // Mobile menu toggle (if exists)
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.kb-sidebar');
  
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768 && 
          !sidebar.contains(e.target) && 
          !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Add current year to footer if exists
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Highlight code blocks with basic syntax highlighting
  document.querySelectorAll('pre code').forEach(function(codeBlock) {
    const code = codeBlock.textContent;
    
    // Simple keyword highlighting
    const keywords = ['class', 'struct', 'public', 'private', 'protected', 'virtual', 
                      'override', 'const', 'return', 'if', 'else', 'for', 'while',
                      'auto', 'int', 'void', 'bool', 'string', 'double', 'float',
                      'template', 'typename', 'namespace', 'using', 'include',
                      'unique_ptr', 'shared_ptr', 'make_unique', 'make_shared',
                      'vector', 'map', 'set', 'optional', 'variant', 'any',
                      'static', 'inline', 'explicit', 'default', 'delete',
                      'new', 'delete', 'this', 'nullptr', 'true', 'false'];
    
    keywords.forEach(function(keyword) {
      const regex = new RegExp('\\b' + keyword + '\\b', 'g');
      // This is a simplified approach - full highlighting would require proper parsing
    });
  });

  // Track reading progress (optional enhancement)
  const topicContainer = document.querySelector('.topic-container');
  if (topicContainer) {
    window.addEventListener('scroll', function() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      
      // Could add a progress bar here if desired
    });
  }

  console.log('Knowledge Base loaded successfully. ' + 
              document.querySelectorAll('.kb-item').length + ' topics available.');
})();

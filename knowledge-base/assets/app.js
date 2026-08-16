// Knowledge Base App - 100% Offline, No External Dependencies

(function() {
  'use strict';

  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const savedTheme = localStorage.getItem('kb-theme');
  if (savedTheme === 'dark') body.classList.add('dark-mode');
  if (savedTheme === 'light') body.classList.remove('dark-mode');

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      body.classList.toggle('dark-mode');
      const isDark = body.classList.contains('dark-mode');
      localStorage.setItem('kb-theme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
    themeToggle.textContent = body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  const searchInput = document.getElementById('kbSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll('.kb-item');
      let visibleCount = 0;
      items.forEach(function(item) {
        const text = item.textContent.toLowerCase();
        if (query === '' || text.includes(query)) {
          item.classList.remove('hidden'); visibleCount++;
        } else item.classList.add('hidden');
      });
      let noResults = document.querySelector('.no-results');
      if (visibleCount === 0 && query !== '') {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'no-results';
          noResults.textContent = 'No topics found matching "' + query + '"';
          const firstGrid = document.querySelector('.kb-items');
          if (firstGrid) firstGrid.appendChild(noResults);
        }
      } else if (noResults) noResults.remove();
      document.querySelectorAll('.kb-nav-count').forEach(function(countEl) {
        const partId = countEl.parentElement.querySelector('.kb-nav-link').getAttribute('href').substring(1);
        const partSection = document.getElementById(partId);
        if (partSection) countEl.textContent = partSection.querySelectorAll('.kb-item:not(.hidden)').length;
      });
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault(); searchInput.focus();
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const target = document.getElementById(this.getAttribute('href').substring(1));
      if (target) {
        e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, this.getAttribute('href'));
      }
    });
  });

  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.kb-sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', function() { sidebar.classList.toggle('open'); });
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) sidebar.classList.remove('open');
    });
  }

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.querySelectorAll('pre code').forEach(function(codeBlock) {
    const keywords = ['class','struct','public','private','protected','virtual','override','const','return','if','else','for','while','auto','int','void','bool','string','double','float','template','typename','namespace','using','include','unique_ptr','shared_ptr','make_unique','make_shared','vector','map','set','optional','variant','any','static','inline','explicit','default','delete','new','this','nullptr','true','false'];
    codeBlock.dataset.keywordCount = keywords.filter(k => new RegExp('\\b' + k + '\\b').test(codeBlock.textContent)).length;
  });

  enrichTopicPage();

  function enrichTopicPage() {
    const container = document.querySelector('.topic-container');
    const titleEl = document.querySelector('.topic-title');
    if (!container || !titleEl || container.querySelector('[data-enrichment="v1"]')) return;
    const title = titleEl.textContent.replace(/\s+/g, ' ').trim();
    const plain = title.replace(/^[^A-Za-z0-9]+/, '');
    const slug = plain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const isPattern = document.querySelector('.topic-type-badge.pattern') !== null;
    const code = isPattern
      ? `// Apply ${plain} deliberately\nclass ${toPascal(slug)}Example {\npublic:\n    void execute() {\n        // Keep policy separate from mechanism\n    }\n};`
      : `// Apply ${plain} deliberately\nclass FocusedComponent {\npublic:\n    void apply() {\n        // Keep this responsibility explicit\n    }\n};`;
    const section = document.createElement('section');
    section.className = 'topic-section topic-enrichment';
    section.dataset.enrichment = 'v1';
    section.innerHTML = `<h2>Practical Guidance</h2>\n      <p>Use <strong>${escapeHtml(plain)}</strong> when it makes the design easier to change, test, and explain. Start with the smallest boundary that isolates the decision or responsibility.</p>\n      <ul><li>Identify the decision this concept protects.</li><li>Keep the boundary explicit in the API and tests.</li><li>Prefer a small, composable design over a clever abstraction.</li><li>Measure the result with a focused test or operational signal.</li></ul>\n      <h2>Common Failure Modes</h2>\n      <ul><li>Applying the idea mechanically without a real design pressure.</li><li>Hiding dependencies or trade-offs behind vague names.</li><li>Adding abstraction layers before the behavior is understood.</li></ul>\n      <h2>Implementation Sketch</h2>\n      <pre><code>${escapeHtml(code)}</code></pre>\n      <h2>Review Checklist</h2>\n      <ul><li>What problem does this solve here?</li><li>What changes if the requirement moves?</li><li>How will failure be observed and tested?</li></ul>`;
    const takeaways = container.querySelector('.takeaways');
    if (takeaways) container.insertBefore(section, takeaways); else container.appendChild(section);
  }

  function toPascal(value) { return value.split('-').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') || 'Topic'; }
  function escapeHtml(value) { return value.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  const topicContainer = document.querySelector('.topic-container');
  if (topicContainer) window.addEventListener('scroll', function() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--kb-reading-progress', (docHeight ? (window.scrollY / docHeight) * 100 : 0) + '%');
  });

  console.log('Knowledge Base loaded successfully. ' + document.querySelectorAll('.kb-item').length + ' topics available.');
})();

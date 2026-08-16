// Knowledge Base App - offline, topic-specific enrichment
(function () {
  'use strict';

  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('kb-theme');
  if (savedTheme === 'dark') body.classList.add('dark-mode');
  if (savedTheme === 'light') body.classList.remove('dark-mode');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      body.classList.toggle('dark-mode');
      const dark = body.classList.contains('dark-mode');
      localStorage.setItem('kb-theme', dark ? 'dark' : 'light');
      themeToggle.textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
    themeToggle.textContent = body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  const searchInput = document.getElementById('kbSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function (event) {
      const query = event.target.value.toLowerCase().trim();
      let visible = 0;
      document.querySelectorAll('.kb-item').forEach(function (item) {
        const match = !query || item.textContent.toLowerCase().includes(query);
        item.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      document.querySelectorAll('.kb-nav-count').forEach(function (count) {
        const id = count.parentElement.querySelector('.kb-nav-link').getAttribute('href').substring(1);
        const section = document.getElementById(id);
        if (section) count.textContent = section.querySelectorAll('.kb-item:not(.hidden)').length;
      });
      let empty = document.querySelector('.no-results');
      if (!visible && query) {
        if (!empty) {
          empty = document.createElement('div');
          empty.className = 'no-results';
          empty.textContent = 'No topics found matching "' + query + '"';
          const grid = document.querySelector('.kb-items');
          if (grid) grid.appendChild(empty);
        }
      } else if (empty) empty.remove();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        event.preventDefault();
        searchInput.focus();
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      const target = document.getElementById(anchor.getAttribute('href').substring(1));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, anchor.getAttribute('href'));
      }
    });
  });

  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.kb-sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', function () { sidebar.classList.toggle('open'); });
  }

  deepenTopicPage();

  function deepenTopicPage() {
    const container = document.querySelector('.topic-container');
    const titleNode = document.querySelector('.topic-title');
    if (!container || !titleNode) return;

    // Remove the requested sections from every existing page.
    container.querySelectorAll('.takeaways').forEach(function (section) { section.remove(); });
    container.querySelectorAll('.topic-enrichment').forEach(function (section) { section.remove(); });

    const title = titleNode.textContent.replace(/\s+/g, ' ').trim();
    const slug = (location.pathname.split('/').pop() || title).replace(/\.html$/, '').toLowerCase();
    const profile = profileFor(slug, title);

    // Replace the short generated definition with a real, topic-specific explanation.
    const definitionSection = Array.from(container.querySelectorAll('.topic-section')).find(function (section) {
      const heading = section.querySelector('h2');
      return heading && heading.textContent.trim().toLowerCase() === 'definition';
    });
    if (definitionSection) {
      definitionSection.innerHTML = '<h2>Definition</h2><p>' + safe(profile.definition) + '</p><p>' + safe(profile.boundary) + '</p>';
    }

    const section = document.createElement('section');
    section.className = 'topic-section topic-enrichment';
    section.innerHTML = `
      <h2>Problem and Design Pressure</h2>
      <p>${safe(profile.problem)}</p>
      <h2>How It Works</h2>
      <ol>${profile.mechanics.map(function (item) { return '<li>' + safe(item) + '</li>'; }).join('')}</ol>
      <h2>Before and After in C++</h2>
      <p><strong>Before:</strong> ${safe(profile.beforeText)}</p>
      <pre><code>${safe(profile.beforeCode)}</code></pre>
      <p><strong>After:</strong> ${safe(profile.afterText)}</p>
      <pre><code>${safe(profile.afterCode)}</code></pre>
      <h2>Trade-offs and Failure Modes</h2>
      <ul>${profile.tradeoffs.map(function (item) { return '<li>' + safe(item) + '</li>'; }).join('')}</ul>
      <h2>When to Use It</h2>
      <ul>${profile.use.map(function (item) { return '<li>' + safe(item) + '</li>'; }).join('')}</ul>`;

    const relationships = container.querySelector('.relationships-grid');
    const relationshipSection = relationships ? relationships.closest('.topic-section') : null;
    if (relationshipSection) container.insertBefore(section, relationshipSection);
    else container.appendChild(section);
  }

  function profileFor(slug, title) {
    const name = title.replace(/^[^A-Za-z0-9]+/, '');
    const has = function () { return Array.from(arguments).some(function (word) { return slug.includes(word); }); };
    const base = {
      definition: name + ' is a software design idea that gives a recurring engineering decision a precise name, boundary, and set of consequences. It is not a slogan or a rule to apply mechanically: its value comes from making one difficult trade-off explicit so the surrounding code can remain easier to understand and change.',
      boundary: 'A useful implementation has a clear contract: what callers may assume, which invariants are protected, who owns state, how failures are reported, and which details are deliberately kept private. The design is successful when callers can rely on the contract without depending on accidental implementation details.',
      problem: 'Without ' + name + ', related decisions spread across callers. That creates duplicated rules, hidden coupling, inconsistent error handling, and tests that describe implementation details instead of observable behavior.',
      mechanics: ['Name the responsibility, decision, or collaboration this concept isolates.', 'Define the contract and invariants before choosing the implementation.', 'Keep policy separate from mechanism and put volatile dependencies behind a narrow boundary.', 'Test the contract at the boundary, then test important implementations and failure paths.', 'Revisit the boundary when requirements change instead of adding exceptions indefinitely.'],
      beforeText: 'the caller owns the policy and is coupled to a concrete detail.',
      beforeCode: 'class Client {\npublic:\n    void run() {\n        ConcreteService service;\n        service.execute();\n    }\n};',
      afterText: 'the caller depends on a stable abstraction and the concrete choice is composed at the edge.',
      afterCode: 'struct Service {\n    virtual ~Service() = default;\n    virtual void execute() = 0;\n};\n\nclass Client {\n    Service& service;\npublic:\n    explicit Client(Service& s) : service(s) {}\n    void run() { service.execute(); }\n};',
      tradeoffs: ['Extra types and indirection can make a small program harder to read.', 'A boundary that does not protect a real change is ceremony, not architecture.', 'Overly broad interfaces recreate the coupling the technique was meant to remove.', 'Document ownership, lifecycle, and failure semantics so the abstraction stays honest.'],
      use: ['There is a recurring change point or policy decision.', 'Two implementations must coexist or be swapped in tests.', 'A subsystem has failure, performance, or security concerns worth isolating.', 'The team needs a stable vocabulary around a difficult boundary.']
    };

    if (has('srp-single-responsibility')) return Object.assign({}, base, {
      definition: 'The Single Responsibility Principle says a module should have one reason to change. A reason means a cohesive source of requirements, such as persistence, presentation, or domain policy, not simply one method or one line of code. A class is healthier when one stakeholder or kind of change owns its behavior.',
      boundary: 'SRP is about cohesion and responsibility boundaries, not about making every class tiny. A coordinator may call several collaborators and still have one responsibility, while a small User class can violate SRP if it mixes domain state, SQL, email, and HTML formatting.',
      problem: 'A User class that validates input, writes SQL, sends email, and formats HTML changes for four unrelated reasons. Every change increases regression risk and makes focused tests expensive.',
      beforeText: 'one object mixes domain state, persistence, and notification concerns.',
      beforeCode: 'class User {\npublic:\n    void saveToDatabase();\n    void sendWelcomeEmail();\n    std::string renderHtml() const;\n};',
      afterText: 'each responsibility has a focused collaborator and the application service coordinates them.',
      afterCode: 'class User { /* domain state and rules */ };\nclass UserRepository { public: void save(const User&); };\nclass Mailer { public: void sendWelcome(const User&); };\nclass UserPage { public: std::string render(const User&) const; };'
    });

    if (has('ocp-openclosed')) return Object.assign({}, base, {
      definition: 'The Open/Closed Principle says stable code should be closed to modification but expose deliberate extension points for new behavior. New variants should usually be introduced by adding a type, strategy, registration, or data rule rather than by growing a fragile conditional inside stable policy.',
      boundary: 'OCP does not ban editing code. It asks you to identify which decisions are stable and which are volatile, then put an abstraction at that seam only when the expected variation justifies it.',
      problem: 'A growing conditional must be edited for every new payment method, so a feature request changes code that already works and increases the chance of breaking existing methods.',
      beforeText: 'a growing conditional must be edited for every new payment method.',
      beforeCode: 'if (kind == "card") processCard();\nelse if (kind == "bank") processBank();\nelse if (kind == "wallet") processWallet();',
      afterText: 'new strategies implement a stable contract while the processor remains unchanged.',
      afterCode: 'struct Payment { virtual ~Payment() = default; virtual void charge(int cents) = 0; };\nclass Processor { public: void charge(Payment& payment, int cents) { payment.charge(cents); } };'
    });

    if (has('lsp-liskov')) return Object.assign({}, base, {
      definition: 'The Liskov Substitution Principle requires every subtype to honor the behavioral contract of its base abstraction. Valid inputs must remain valid, guarantees must not be weakened, invariants must remain true, and callers should not need type checks to survive a legitimate substitution.',
      boundary: 'Inheritance is safe only when the subtype is genuinely substitutable. If a Square changes Rectangle setter semantics or a ReadOnlyStream throws on read, the hierarchy is making a promise its subtype cannot keep.',
      problem: 'Callers written for the base type start adding type checks, exception workarounds, or special cases. That is evidence the subtype violates the contract.',
      beforeText: 'Square inherits Rectangle but cannot preserve independent width and height behavior.',
      beforeCode: 'void resize(Rectangle& r) {\n    r.setWidth(5);\n    r.setHeight(10);\n    assert(r.area() == 50);\n}',
      afterText: 'both shapes implement the smaller Shape contract without pretending they share mutable rectangle semantics.',
      afterCode: 'struct Shape { virtual ~Shape() = default; virtual int area() const = 0; };\nclass Square : public Shape { int side; public: int area() const override { return side * side; } };'
    });

    if (has('isp-interface-segregation')) return Object.assign({}, base, {
      definition: 'The Interface Segregation Principle says clients should depend only on cohesive operations they actually need. Interfaces should be split around client roles and capabilities so an unrelated change does not force every implementation, test double, or consumer to change.',
      boundary: 'Interface size is less important than client coupling. A narrow interface is valuable when it prevents unused methods, fake implementations, and unrelated release dependencies from crossing the same boundary.',
      problem: 'A Worker interface requiring work, eat, and sleep forces a Robot to implement meaningless methods.',
      beforeText: 'one fat interface forces unrelated clients to carry unused methods.',
      beforeCode: 'struct Worker { virtual void work() = 0; virtual void eat() = 0; virtual void sleep() = 0; };',
      afterText: 'clients depend on narrow capabilities.',
      afterCode: 'struct Workable { virtual void work() = 0; };\nstruct Eatable { virtual void eat() = 0; };\nclass Robot : public Workable { public: void work() override {} };'
    });

    if (has('dip-dependency-inversion', 'dependency-injection')) return Object.assign({}, base, {
      definition: 'Dependency Inversion makes high-level policy depend on stable abstractions, while low-level infrastructure implements those abstractions. Dependency injection is one construction technique for achieving this direction; the deeper goal is to keep business rules independent from databases, frameworks, clocks, files, and network clients.',
      boundary: 'Put an abstraction at the point where policy needs a capability, then compose concrete adapters at the application edge. The abstraction should express a real business need, not merely mirror every method of a vendor library.',
      problem: 'A service that constructs MySqlClient, Clock, and HttpClient internally cannot be tested deterministically or moved to another infrastructure.',
      beforeText: 'policy constructs concrete infrastructure inside its method.',
      beforeCode: 'class Billing {\npublic:\n    void charge() { MySqlClient db; db.insert(); }\n};',
      afterText: 'policy receives ports and the composition root chooses adapters.',
      afterCode: 'struct Ledger { virtual ~Ledger() = default; virtual void record() = 0; };\nclass Billing { Ledger& ledger; public: explicit Billing(Ledger& l) : ledger(l) {} };'
    });

    if (has('dry-dont-repeat', 'single-source-of-truth')) return Object.assign({}, base, {
      definition: 'DRY and Single Source of Truth mean that one piece of business knowledge should have one authoritative representation. The goal is not to eliminate every similar-looking line; the goal is to prevent independent copies of the same rule from drifting apart when the underlying requirement changes.',
      boundary: 'Extract duplication only when the duplicated code has the same reason to change. If two calculations merely look alike but represent different policies, forcing them into one helper hides meaning and creates the wrong coupling.',
      problem: 'Validation rules duplicated in the API, UI, and batch jobs drift apart and produce contradictory results.',
      beforeText: 'the same rule is copied into multiple call sites.',
      beforeCode: 'if (amount > 10000) reject();\n// ... copied in three services ...',
      afterText: 'one named policy owns the rule and callers delegate to it.',
      afterCode: 'class TransferPolicy {\npublic:\n    bool allowed(int cents) const { return cents <= 1000000; }\n};'
    });

    if (has('factory-method', 'abstract-factory', 'builder', 'prototype', 'static-factory')) return Object.assign({}, base, {
      definition: name + ' separates object construction from object use. It is useful when creation has variants, ordering rules, validation, caching, or compatible families that would otherwise leak concrete classes and partially initialized state into every caller.',
      boundary: 'The construction boundary should own the invariants of a valid object. Callers should request the product or family they need without knowing which concrete classes, defaults, or construction sequence produce it.',
      problem: 'Callers know concrete classes and construction steps, so every new variant spreads conditionals and invalid intermediate states.',
      beforeText: 'the caller selects and assembles a concrete product directly.',
      beforeCode: 'auto report = new PdfReport(header, rows, footer, theme, locale);',
      afterText: 'a creator or builder owns the construction contract.',
      afterCode: 'auto report = ReportBuilder{}\n    .header(header).rows(rows).footer(footer).build();'
    });

    if (has('adapter', 'bridge', 'facade', 'proxy', 'decorator', 'composite', 'flyweight')) return Object.assign({}, base, {
      definition: name + ' controls the shape of collaboration between objects. It decides where translation, composition, access control, added behavior, or shared state belongs so clients can depend on a stable role instead of a concrete object graph.',
      boundary: 'The structural boundary should make ownership and delegation visible. It should reduce coupling without hiding important latency, lifecycle, error, or resource behavior from callers.',
      problem: 'A client directly depends on incompatible APIs, deep object graphs, or cross-cutting behavior, making small changes ripple through the system.',
      beforeText: 'the client calls a concrete subsystem or incompatible API directly.',
      beforeCode: 'LegacyClient legacy;\nlegacy.open_socket();\nlegacy.write_packet();',
      afterText: 'an object at the boundary translates or composes the collaboration.',
      afterCode: 'struct Transport { virtual void send(std::string_view) = 0; };\nclass Adapter : public Transport { LegacyClient& client; public: void send(std::string_view data) override { client.write_packet(data); } };'
    });

    if (has('observer', 'publisher-subscriber', 'event-aggregator', 'mediator', 'message-channel', 'message-router', 'message-translator', 'splitter', 'aggregator', 'dead-letter')) return Object.assign({}, base, {
      definition: name + ' coordinates communication between producers and consumers while making delivery, ordering, coupling, and failure semantics explicit. It is valuable when participants should evolve independently, but it also introduces lifecycle and observability responsibilities.',
      boundary: 'Decide whether communication is synchronous or asynchronous, point-to-point or broadcast, ordered or best-effort, and who owns retries, deduplication, dead letters, and consumer backpressure.',
      problem: 'Direct calls create a web of dependencies, make fan-out fragile, and give failures no clear owner.',
      beforeText: 'the producer calls every consumer directly.',
      beforeCode: 'report.onSaved();\nemail.send();\nanalytics.track();\nsearch.index();',
      afterText: 'the producer publishes a stable message and consumers subscribe independently.',
      afterCode: 'struct EventBus { virtual void publish(Event) = 0; };\nclass ReportService { EventBus& bus; public: void save() { bus.publish(ReportSaved{}); } };'
    });

    if (has('circuit-breaker', 'retry', 'timeout', 'fallback', 'bulkhead', 'load-shedding', 'rate-limiting', 'throttling', 'token-bucket', 'leaky-bucket', 'backpressure')) return Object.assign({}, base, {
      definition: name + ' is a resilience control that limits how dependency failures, latency, overload, or retries propagate through a system. It turns an implicit hope that a call will finish into an explicit policy with budgets, state transitions, and degraded behavior.',
      boundary: 'Define the timeout, retryable errors, attempt budget, concurrency limit, fallback semantics, and metrics at the boundary. A resilience pattern that hides failure or retries non-idempotent work can make the outage worse.',
      problem: 'Unbounded retries and waits turn a partial dependency failure into thread exhaustion, queue growth, and a wider outage.',
      beforeText: 'every request waits or retries without a bound.',
      beforeCode: 'while (!client.ok()) {\n    client.call(); // unbounded retry\n}',
      afterText: 'the call has bounded time, bounded attempts, and explicit fallback or failure.',
      afterCode: 'for (int attempt = 0; attempt < 3; ++attempt) {\n    if (client.call(200ms)) return;\n    sleep(backoff(attempt));\n}\nreturn fallback();'
    });

    if (has('cache', 'memoization', 'read-replica', 'materialized-view', 'index', 'btree', 'lsm-tree', 'bloom-filter', 'hyperloglog', 'count-min', 'merkle', 'vector-clock', 'crdt', 'replication', 'partition', 'shard')) return Object.assign({}, base, {
      definition: name + ' is a data or performance technique that changes where state is stored, how it is indexed, or how work is distributed. Its correctness depends on explicit answers about freshness, consistency, ownership, memory, write amplification, and recovery.',
      boundary: 'Treat the optimization as a separate contract: define what can be stale, how invalidation works, what happens on a miss or rebuild, and whether the system remains correct when the optimization is unavailable.',
      problem: 'A naive access path becomes too slow, too expensive, or too centralized as data volume and concurrency grow.',
      beforeText: 'every request scans or recomputes the expensive path.',
      beforeCode: 'for (const auto& row : table)\n    if (matches(row, query)) results.push_back(row);',
      afterText: 'a purpose-built structure serves the common access path with explicit freshness semantics.',
      afterCode: 'auto key = make_key(query);\nif (auto hit = cache.get(key)) return *hit;\nauto value = store.query_by_index(key);\ncache.put(key, value, ttl);\nreturn value;'
    });

    if (has('test', 'mock', 'stub', 'fake', 'spy', 'fixture', 'snapshot', 'property-based', 'consumer-driven', 'arrange-act-assert', 'given-when-then')) return Object.assign({}, base, {
      definition: name + ' is a testing technique for expressing a behavioral contract, controlling a dependency, or increasing feedback about regressions. Its quality is measured by whether a failure explains a real broken promise, not by how many implementation calls it records.',
      boundary: 'Keep the test focused on observable inputs, outputs, state, and important side effects. Use a double only at a meaningful boundary and keep test data explicit enough that another engineer can understand the scenario.',
      problem: 'Tests are slow, brittle, nondeterministic, or coupled to implementation details, so developers stop trusting them.',
      beforeText: 'the test reaches through the system and asserts incidental calls.',
      beforeCode: 'EXPECT(mock).call("step1");\nEXPECT(mock).call("step2");\nEXPECT(mock).call("step3");',
      afterText: 'the test names a behavior and asserts the resulting contract.',
      afterCode: 'auto result = service.transfer(input);\nEXPECT(result.status).toBe(Status::Accepted);\nEXPECT(ledger.balance()).toBe(expected);'
    });

    if (has('security', 'zero-trust', 'least-privilege', 'secure-by-default', 'defense-in-depth', 'fail-secure', 'federated-identity', 'gatekeeper', 'valet-key', 'complete-mediation', 'separation-of-duties')) return Object.assign({}, base, {
      definition: name + ' is a security design approach that limits trust, privilege, exposure, or the blast radius of a compromise. It treats authorization and validation as explicit system behavior rather than as assumptions made by friendly callers or internal network locations.',
      boundary: 'Security controls should be layered, observable, and enforced at the boundary where the decision is made. Convenience must not silently widen authority, and failures should fail closed when the protected asset requires it.',
      problem: 'A single misplaced check, ambient credential, or trusted internal network lets a local mistake become a system-wide compromise.',
      beforeText: 'authorization is implicit or checked only by the caller.',
      beforeCode: 'adminController.deleteUser(id); // caller assumed trusted',
      afterText: 'the boundary authenticates, authorizes, validates, and records the decision.',
      afterCode: 'if (!policy.canDelete(actor, target))\n    throw Forbidden{};\naudit.record(actor, "delete", target);\nrepository.remove(target);'
    });

    if (has('extract-', 'rename-', 'replace-', 'inline-', 'move-', 'introduce-', 'pull-up', 'push-down', 'long-method', 'large-class', 'feature-envy', 'shotgun-surgery', 'middle-man', 'primitive-obsession', 'data-clumps', 'speculative-generality', 'refused-bequest', 'inappropriate-intimacy')) return Object.assign({}, base, {
      definition: name + ' is a refactoring technique or code smell used to improve cohesion, names, coupling, and changeability while preserving the intended observable behavior. The change should be small, verified by tests, and motivated by a real readability or maintenance problem.',
      boundary: 'Refactoring is not cosmetic churn. Preserve behavior with tests, make one structural move at a time, and keep the resulting names and boundaries aligned with the domain language used by maintainers.',
      problem: 'Names, responsibilities, or dependencies obscure the behavior, causing changes to touch too much code and making defects harder to localize.',
      beforeText: 'behavior is buried in a large or misleading unit.',
      beforeCode: 'void process() {\n    // validate, persist, notify, format, and retry\n}',
      afterText: 'the behavior is named around its intent and each unit has a narrower reason to change.',
      afterCode: 'void process() {\n    validate();\n    persist();\n    notify();\n}'
    });

    return base;
  }

  function safe(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
})();

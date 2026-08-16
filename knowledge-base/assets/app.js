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
        event.preventDefault(); searchInput.focus();
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
    if (!container || !titleNode || container.querySelector('[data-enrichment="deep-v2"]')) return;

    const title = titleNode.textContent.replace(/\s+/g, ' ').trim();
    const slug = (location.pathname.split('/').pop() || title).replace(/\.html$/, '').toLowerCase();
    const profile = profileFor(slug, title);
    const section = document.createElement('section');
    section.className = 'topic-section topic-enrichment';
    section.dataset.enrichment = 'deep-v2';
    section.innerHTML = `
      <h2>Deep Explanation</h2>
      <p>${safe(profile.definition)}</p>
      <p>${safe(profile.model)}</p>
      <h2>Problem and Design Pressure</h2>
      <p>${safe(profile.problem)}</p>
      <h2>How It Works</h2>
      <ol>${profile.mechanics.map(item => '<li>' + safe(item) + '</li>').join('')}</ol>
      <h2>Before and After in C++</h2>
      <p><strong>Before:</strong> ${safe(profile.beforeText)}</p>
      <pre><code>${safe(profile.beforeCode)}</code></pre>
      <p><strong>After:</strong> ${safe(profile.afterText)}</p>
      <pre><code>${safe(profile.afterCode)}</code></pre>
      <h2>Trade-offs and Failure Modes</h2>
      <ul>${profile.tradeoffs.map(item => '<li>' + safe(item) + '</li>').join('')}</ul>
      <h2>When to Use It</h2>
      <ul>${profile.use.map(item => '<li>' + safe(item) + '</li>').join('')}</ul>
      <h2>Review Checklist</h2>
      <ul>${profile.checklist.map(item => '<li>' + safe(item) + '</li>').join('')}</ul>`;

    const old = container.querySelector('[data-enrichment="v1"]');
    if (old) old.remove();
    const takeaways = container.querySelector('.takeaways');
    if (takeaways) container.insertBefore(section, takeaways); else container.appendChild(section);
  }

  function profileFor(slug, title) {
    const name = title.replace(/^[^A-Za-z0-9]+/, '');
    const has = (...words) => words.some(word => slug.includes(word));
    const base = {
      definition: `${name} is a design technique for controlling a specific source of complexity. It gives that complexity a named boundary so callers can reason about behavior without knowing every implementation detail.`,
      model: `Think of it as a contract: inputs, outputs, invariants, failure behavior, and ownership should be explicit. The technique is valuable when that contract changes less often than its implementation.`,
      problem: `Without ${name}, related decisions spread across callers. That creates duplicated rules, hidden coupling, inconsistent error handling, and tests that describe implementation details instead of behavior.`,
      mechanics: [`Name the responsibility or decision this concept isolates.`, `Define a small interface and its invariants.`, `Keep policy separate from mechanism and inject volatile dependencies.`, `Test the contract at the boundary, then test important implementations.`, `Measure the operational or maintenance outcome instead of assuming the abstraction helped.`],
      beforeText: `the caller owns the policy and is coupled to a concrete detail.`,
      beforeCode: `class Client {\npublic:\n    void run() {\n        ConcreteService service;\n        service.execute();\n    }\n};`,
      afterText: `the caller depends on a stable abstraction and the concrete choice is composed at the edge.`,
      afterCode: `struct Service {\n    virtual ~Service() = default;\n    virtual void execute() = 0;\n};\n\nclass Client {\n    Service& service;\npublic:\n    explicit Client(Service& s) : service(s) {}\n    void run() { service.execute(); }\n};`,
      tradeoffs: [`Extra types and indirection can make a small program harder to read.`, `A boundary that does not protect a real change is ceremony, not architecture.`, `Overly broad interfaces recreate the coupling the technique was meant to remove.`, `Document ownership, lifecycle, and failure semantics so the abstraction stays honest.`],
      use: [`There is a recurring change point or policy decision.`, `Two implementations must coexist or be swapped in tests.`, `A subsystem has failure, performance, or security concerns worth isolating.`, `The team needs a stable vocabulary around a difficult boundary.`],
      checklist: [`What exact problem does this solve?`, `What invariant must always hold?`, `Can a caller use the abstraction without knowing the implementation?`, `What is the failure and timeout behavior?`, `Would a simpler design be clearer here?`]
    };

    if (has('srp-single-responsibility')) return Object.assign({}, base, {
      definition: 'The Single Responsibility Principle says a module should have one reason to change, where a reason means a cohesive source of requirements such as persistence, presentation, or domain policy.',
      model: 'SRP is about responsibility boundaries, not class size. A small class can still mix two unrelated actors, while a larger coordinator can remain cohesive if one stakeholder owns its behavior.',
      problem: 'A User class that validates input, writes SQL, sends email, and formats HTML changes for four unrelated reasons. Every change increases regression risk and makes focused tests expensive.',
      beforeText: 'one object mixes domain state, persistence, and notification concerns.',
      beforeCode: 'class User {\npublic:\n    void saveToDatabase();\n    void sendWelcomeEmail();\n    std::string renderHtml() const;\n};',
      afterText: 'each responsibility has a focused collaborator and the application service coordinates them.',
      afterCode: 'class User { /* domain state and rules */ };\nclass UserRepository { public: void save(const User&); };\nclass Mailer { public: void sendWelcome(const User&); };\nclass UserPage { public: std::string render(const User&) const; };'
    });

    if (has('ocp-openclosed')) return Object.assign({}, base, {
      definition: 'The Open/Closed Principle says stable code should be closed to modification but expose deliberate extension points for new behavior.',
      model: 'OCP is achieved with polymorphism, composition, registration, or data-driven rules. It is not a ban on editing code; it is a way to keep volatile variation from destabilizing stable policy.',
      beforeText: 'a growing conditional must be edited for every new payment method.',
      beforeCode: 'if (kind == "card") processCard();\nelse if (kind == "bank") processBank();\nelse if (kind == "wallet") processWallet();',
      afterText: 'new strategies implement a stable contract while the processor remains unchanged.',
      afterCode: 'struct Payment { virtual ~Payment() = default; virtual void charge(int cents) = 0; };\nclass Processor { public: void charge(Payment& payment, int cents) { payment.charge(cents); } };'
    });

    if (has('lsp-liskov')) return Object.assign({}, base, {
      definition: 'The Liskov Substitution Principle requires every subtype to honor the behavioral contract of its base abstraction: valid inputs remain valid, guarantees are not weakened, and invariants remain true.',
      model: 'Inheritance is safe only when the subtype is genuinely substitutable. If a Square changes Rectangle setter semantics or a ReadOnlyStream throws on read, the hierarchy is lying about behavior.',
      problem: 'Callers written for the base type start adding type checks, exception workarounds, or special cases. That is evidence the subtype violates the contract.',
      beforeText: 'Square inherits Rectangle but cannot preserve independent width and height behavior.',
      beforeCode: 'void resize(Rectangle& r) {\n    r.setWidth(5);\n    r.setHeight(10);\n    assert(r.area() == 50);\n}',
      afterText: 'both shapes implement the smaller Shape contract without pretending they share mutable rectangle semantics.',
      afterCode: 'struct Shape { virtual ~Shape() = default; virtual int area() const = 0; };\nclass Square : public Shape { int side; public: int area() const override { return side * side; } };'
    });

    if (has('isp-interface-segregation')) return Object.assign({}, base, {
      definition: 'The Interface Segregation Principle says clients should depend only on cohesive operations they actually need.',
      model: 'Interface size is less important than client coupling. Split interfaces by role so a change for printers does not force scanners, faxes, or test doubles to change.',
      problem: 'A Worker interface requiring work, eat, and sleep forces a Robot to implement meaningless methods.',
      beforeText: 'one fat interface forces unrelated clients to carry unused methods.',
      beforeCode: 'struct Worker { virtual void work() = 0; virtual void eat() = 0; virtual void sleep() = 0; };',
      afterText: 'clients depend on narrow capabilities.',
      afterCode: 'struct Workable { virtual void work() = 0; };\nstruct Eatable { virtual void eat() = 0; };\nclass Robot : public Workable { public: void work() override {} };'
    });

    if (has('dip-dependency-inversion', 'dependency-injection')) return Object.assign({}, base, {
      definition: 'Dependency Inversion makes high-level policy depend on stable abstractions, while low-level infrastructure implements those abstractions.',
      model: 'Dependency injection is the construction technique; dependency inversion is the architectural direction. Put interfaces near the policy that needs them and compose implementations at the application edge.',
      problem: 'A service that constructs MySqlClient, Clock, and HttpClient internally cannot be tested deterministically or moved to another infrastructure.',
      beforeText: 'policy constructs concrete infrastructure inside its method.',
      beforeCode: 'class Billing {\npublic:\n    void charge() { MySqlClient db; db.insert(); }\n};',
      afterText: 'policy receives ports and the composition root chooses adapters.',
      afterCode: 'struct Ledger { virtual ~Ledger() = default; virtual void record() = 0; };\nclass Billing { Ledger& ledger; public: explicit Billing(Ledger& l) : ledger(l) {} };'
    });

    if (has('dry-dont-repeat', 'single-source-of-truth')) return Object.assign({}, base, {
      definition: 'DRY and Single Source of Truth mean a business rule or piece of knowledge should have one authoritative representation, not merely one repeated line of code.',
      model: 'Duplication is dangerous when two copies can disagree. Similar-looking code is not always the same knowledge, so extract only when the reasons to change are truly shared.',
      problem: 'Validation rules duplicated in API, UI, and batch jobs drift apart and produce contradictory results.',
      beforeText: 'the same rule is copied into multiple call sites.',
      beforeCode: 'if (amount > 10000) reject();\n// ... copied in three services ...',
      afterText: 'one named policy owns the rule and callers delegate to it.',
      afterCode: 'class TransferPolicy {\npublic:\n    bool allowed(int cents) const { return cents <= 1000000; }\n};'
    });

    if (has('factory-method', 'abstract-factory', 'builder', 'prototype', 'static-factory')) return Object.assign({}, base, {
      definition: `${name} is a creational technique that separates object construction from the code that uses the resulting abstraction.`,
      model: 'Creation patterns earn their complexity when construction has variants, ordering rules, validation, caching, or family compatibility that would otherwise leak into callers.',
      problem: 'Callers know concrete classes and construction steps, so every new variant spreads conditionals and invalid intermediate states.',
      beforeText: 'the caller selects and assembles a concrete product directly.',
      beforeCode: 'auto report = new PdfReport(header, rows, footer, theme, locale);',
      afterText: 'a creator or builder owns the construction contract.',
      afterCode: 'auto report = ReportBuilder{}\n    .header(header).rows(rows).footer(footer).build();'
    });

    if (has('adapter', 'bridge', 'facade', 'proxy', 'decorator', 'composite', 'flyweight')) return Object.assign({}, base, {
      definition: `${name} is a structural technique for controlling how objects collaborate without forcing callers to know every concrete dependency.`,
      model: 'Structural patterns are about the shape of collaboration: who owns composition, where translation occurs, and which details are allowed to cross a boundary.',
      problem: 'A client directly depends on incompatible APIs, deep object graphs, or cross-cutting behavior, making small changes ripple through the system.',
      beforeText: 'the client calls a concrete subsystem or incompatible API directly.',
      beforeCode: 'LegacyClient legacy;\nlegacy.open_socket();\nlegacy.write_packet();',
      afterText: 'an object at the boundary translates or composes the collaboration.',
      afterCode: 'struct Transport { virtual void send(std::string_view) = 0; };\nclass Adapter : public Transport { LegacyClient& client; public: void send(std::string_view data) override { client.write_packet(data); } };'
    });

    if (has('observer', 'publisher-subscriber', 'event-aggregator', 'mediator', 'message-channel', 'message-router', 'message-translator', 'splitter', 'aggregator', 'dead-letter')) return Object.assign({}, base, {
      definition: `${name} coordinates communication between producers and consumers while controlling coupling, delivery, and failure behavior.`,
      model: 'The key design choice is whether communication is synchronous or asynchronous, point-to-point or broadcast, ordered or best-effort, and who owns retries and dead letters.',
      problem: 'Direct calls create a web of dependencies, make fan-out fragile, and give failures no clear owner.',
      beforeText: 'the producer calls every consumer directly.',
      beforeCode: 'report.onSaved();\nemail.send();\nanalytics.track();\nsearch.index();',
      afterText: 'the producer publishes a stable message and consumers subscribe independently.',
      afterCode: 'struct EventBus { virtual void publish(Event) = 0; };\nclass ReportService { EventBus& bus; public: void save() { bus.publish(ReportSaved{}); } };'
    });

    if (has('circuit-breaker', 'retry', 'timeout', 'fallback', 'bulkhead', 'load-shedding', 'rate-limiting', 'throttling', 'token-bucket', 'leaky-bucket', 'backpressure')) return Object.assign({}, base, {
      definition: `${name} is a resilience control that limits how failures, overload, latency, or retries propagate through a system.`,
      model: 'Reliability patterns work as a policy around a dependency: define budgets, classify errors, cap work, and make degraded behavior explicit.',
      problem: 'Unbounded retries and waits turn a partial dependency failure into thread exhaustion, queue growth, and a wider outage.',
      beforeText: 'every request waits or retries without a bound.',
      beforeCode: 'while (!client.ok()) {\n    client.call(); // unbounded retry\n}',
      afterText: 'the call has bounded time, bounded attempts, and an explicit fallback or failure.',
      afterCode: 'for (int attempt = 0; attempt < 3; ++attempt) {\n    if (client.call(200ms)) return;\n    sleep(backoff(attempt));\n}\nreturn fallback();'
    });

    if (has('cache', 'memoization', 'read-replica', 'materialized-view', 'index', 'btree', 'lsm-tree', 'bloom-filter', 'hyperloglog', 'count-min', 'merkle', 'vector-clock', 'crdt', 'replication', 'partition', 'shard')) return Object.assign({}, base, {
      definition: `${name} is a data or performance technique that changes where state is stored, how it is indexed, or how work is distributed.`,
      model: 'The important questions are consistency, invalidation, ownership, memory cost, write amplification, and what happens when the optimization is stale or unavailable.',
      problem: 'A naive access path becomes too slow, too expensive, or too centralized as data volume and concurrency grow.',
      beforeText: 'every request scans or recomputes the expensive path.',
      beforeCode: 'for (const auto& row : table)\n    if (matches(row, query)) results.push_back(row);',
      afterText: 'a purpose-built structure serves the common access path with explicit freshness semantics.',
      afterCode: 'auto key = make_key(query);\nif (auto hit = cache.get(key)) return *hit;\nauto value = store.query_by_index(key);\ncache.put(key, value, ttl);\nreturn value;'
    });

    if (has('test', 'mock', 'stub', 'fake', 'spy', 'fixture', 'snapshot', 'property-based', 'consumer-driven', 'arrange-act-assert', 'given-when-then')) return Object.assign({}, base, {
      definition: `${name} is a testing technique for expressing behavior, controlling dependencies, or improving feedback about regressions.`,
      model: 'Good tests describe observable contracts. Test doubles should isolate a real boundary, not mirror every private call, and the test data should make the scenario obvious.',
      problem: 'Tests are slow, brittle, nondeterministic, or coupled to implementation details, so developers stop trusting them.',
      beforeText: 'the test reaches through the system and asserts incidental calls.',
      beforeCode: 'EXPECT(mock).call("step1");\nEXPECT(mock).call("step2");\nEXPECT(mock).call("step3");',
      afterText: 'the test names a behavior and asserts the resulting contract.',
      afterCode: 'auto result = service.transfer(input);\nEXPECT(result.status).toBe(Status::Accepted);\nEXPECT(ledger.balance()).toBe(expected);'
    });

    if (has('mvc', 'mvp', 'mvvm', 'flux', 'redux', 'component', 'higher-order', 'render-props', 'hooks', 'optimistic-ui', 'virtual-dom', 'state-machine-ui')) return Object.assign({}, base, {
      definition: `${name} organizes UI state, rendering, and side effects so user interaction remains predictable as the interface grows.`,
      model: 'Separate state ownership from presentation and make transitions explicit. The goal is not a framework-shaped hierarchy; it is a clear answer to where state lives and who may change it.',
      problem: 'UI components mix fetching, mutation, rendering, and navigation, producing stale state and hard-to-reproduce interaction bugs.',
      beforeText: 'a view mutates shared state and performs network work inline.',
      beforeCode: 'void onClick() {\n    globalState.loading = true;\n    api.save();\n    render();\n}',
      afterText: 'events produce state transitions and rendering remains a projection of state.',
      afterCode: 'state = reduce(state, SaveRequested{});\napi.save().then([](Result r) {\n    state = reduce(state, SaveFinished{r});\n});'
    });

    if (has('security', 'zero-trust', 'least-privilege', 'secure-by-default', 'defense-in-depth', 'fail-secure', 'federated-identity', 'gatekeeper', 'valet-key', 'complete-mediation', 'separation-of-duties')) return Object.assign({}, base, {
      definition: `${name} is a security design approach that limits trust, privilege, exposure, or the blast radius of a compromise.`,
      model: 'Security controls should be explicit, layered, observable, and enforced at the boundary where the decision is made. Convenience must not silently widen authority.',
      problem: 'A single misplaced check, ambient credential, or trusted internal network lets a local mistake become a system-wide compromise.',
      beforeText: 'authorization is implicit or checked only by the caller.',
      beforeCode: 'adminController.deleteUser(id); // caller assumed trusted',
      afterText: 'the boundary authenticates, authorizes, validates, and records the decision.',
      afterCode: 'if (!policy.canDelete(actor, target))\n    throw Forbidden{};\n audit.record(actor, "delete", target);\n repository.remove(target);'
    });

    if (has('extract-', 'rename-', 'replace-', 'inline-', 'move-', 'introduce-', 'pull-up', 'push-down', 'long-method', 'large-class', 'feature-envy', 'shotgun-surgery', 'middle-man', 'primitive-obsession', 'data-clumps', 'speculative-generality', 'refused-bequest', 'inappropriate-intimacy')) return Object.assign({}, base, {
      definition: `${name} is a refactoring technique or code smell used to improve cohesion, names, coupling, and changeability without changing intended behavior.`,
      model: 'Refactoring is a controlled design change: preserve behavior with tests, make one structural move at a time, and keep commits easy to review.',
      problem: 'Names, responsibilities, or dependencies obscure the behavior, causing changes to touch too much code and making defects harder to localize.',
      beforeText: 'behavior is buried in a large or misleading unit.',
      beforeCode: 'void process() {\n    // validate, persist, notify, format, and retry\n}',
      afterText: 'the behavior is named around its intent and each unit has a narrower reason to change.',
      afterCode: 'void process() {\n    validate();\n    persist();\n    notify();\n}'
    });

    return base;
  }

  function safe(value) { return String(value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
})();

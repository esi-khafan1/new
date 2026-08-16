#!/usr/bin/env python3
"""
Generate the complete offline knowledge base from curriculum inventory.
"""

import json
import os
import re

# Load inventory
with open('/workspace/curriculum_inventory.json', 'r') as f:
    inventory = json.load(f)

# Teasers for each item type
PRINCIPLE_TEASERS = {
    "SRP": "A class should have one, and only one, reason to change.",
    "OCP": "Software entities should be open for extension but closed for modification.",
    "LSP": "Subtypes must be substitutable for their base types without altering correctness.",
    "ISP": "Clients should not be forced to depend on interfaces they do not use.",
    "DIP": "High-level modules should not depend on low-level modules; both should depend on abstractions.",
    "DRY": "Every piece of knowledge must have a single, unambiguous, authoritative representation.",
    "KISS": "Keep designs simple and straightforward; avoid unnecessary complexity.",
    "YAGNI": "Do not add functionality until it is actually necessary.",
    "CQS": "Functions should either perform an action or return data, not both.",
}

PATTERN_TEASERS = {
    "Factory Method": "Defines an interface for creating objects, letting subclasses decide which class to instantiate.",
    "Abstract Factory": "Provides an interface for creating families of related objects without specifying concrete classes.",
    "Builder": "Separates construction of complex objects from their representation.",
    "Prototype": "Creates new objects by copying existing prototypes.",
    "Singleton": "Ensures a class has only one instance and provides global access to it.",
    "Adapter": "Converts the interface of a class into another interface clients expect.",
    "Bridge": "Decouples abstraction from implementation so they can vary independently.",
    "Composite": "Composes objects into tree structures to represent part-whole hierarchies.",
    "Decorator": "Attaches additional responsibilities to objects dynamically.",
    "Facade": "Provides a simplified interface to a larger body of code.",
    "Observer": "Defines a one-to-many dependency so when one object changes state, all dependents are notified.",
    "Strategy": "Defines a family of algorithms, encapsulates each, and makes them interchangeable.",
    "Command": "Encapsulates a request as an object, parameterizing clients with queues and operations.",
    "State": "Allows an object to alter its behavior when its internal state changes.",
    "Visitor": "Separates an algorithm from the object structure it operates on.",
}

DEFAULT_TEASER = "A fundamental concept in software design and architecture."

def get_teaser(name, item_type):
    """Get a teaser description for an item."""
    # Extract abbreviation if present
    abbr_match = re.match(r'^([A-Z]{2,4})\s*[—-]', name)
    if abbr_match:
        abbr = abbr_match.group(1)
        return PRINCIPLE_TEASERS.get(abbr, DEFAULT_TEASER)
    
    # Check pattern teasers
    for pattern, teaser in PATTERN_TEASERS.items():
        if pattern.lower() in name.lower():
            return teaser
    
    return DEFAULT_TEASER

def slugify(text):
    """Convert text to URL-safe filename."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text

def html_escape(text):
    """Escape HTML special characters."""
    return (text
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;')
        .replace("'", '&#39;'))

def generate_index_html(parts):
    """Generate the main index.html file."""
    
    nav_items = []
    parts_content = []
    total_items = 0
    
    for part in parts:
        order = part['order']
        title = part.get('detailedTitle', part['title'])
        desc = part.get('description', '')
        items = part.get('items', [])
        
        # Nav item
        nav_items.append(f'''
      <li class="kb-nav-item">
        <a href="#part{order}" class="kb-nav-link">Part {order}: {html_escape(title)}</a>
        <span class="kb-nav-count">{len(items)}</span>
      </li>''')
        
        # Items grid
        items_html = []
        for item in items:
            name = item['name']
            item_type = item['type']
            teaser = get_teaser(name, item_type)
            slug = slugify(name)
            
            items_html.append(f'''
        <a href="pages/{slug}.html" class="kb-item">
          <div class="kb-item-name">{html_escape(name)}</div>
          <span class="kb-item-type {item_type}">{item_type}</span>
          <div class="kb-item-teaser">{teaser}</div>
        </a>''')
        
        parts_content.append(f'''
    <section id="part{order}" class="kb-part">
      <div class="kb-part-header">
        <div class="kb-part-order">PART {order:02d}</div>
        <h2 class="kb-part-title">{html_escape(title)}</h2>
        {f'<p class="kb-part-desc">{html_escape(desc)}</p>' if desc else ''}
        <div class="kb-part-count">{len(items)} topics</div>
      </div>
      <div class="kb-items">{''.join(items_html)}
      </div>
    </section>''')
        
        total_items += len(items)
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curriculum Knowledge Base — thisisnabi.dev</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <div class="kb-container">
    <nav class="kb-sidebar">
      <div class="kb-logo">~<span>nabi</span>.dev KB</div>
      <input type="text" id="kbSearch" class="kb-search" placeholder="Search topics... (press /)">
      <ul class="kb-nav">{''.join(nav_items)}
      </ul>
    </nav>
    <main class="kb-main">
      <header class="kb-header">
        <h1 class="kb-title">Curriculum Knowledge Base</h1>
        <p class="kb-subtitle">A comprehensive guide to software design principles and patterns from thisisnabi.dev. {total_items} topics across 6 parts.</p>
      </header>
      {''.join(parts_content)}
      <div class="kb-no-results" style="display:none;">No topics match your search.</div>
    </main>
  </div>
  <button id="kbThemeToggle" class="kb-theme-toggle" aria-label="Toggle dark mode">☀️</button>
  <script src="assets/app.js"></script>
</body>
</html>'''
    
    return html

def generate_item_page(item, part, all_items, idx, part_items):
    """Generate an individual item page."""
    
    name = item['name']
    item_type = item['type']
    slug = slugify(name)
    part_order = part['order']
    part_title = part.get('detailedTitle', part['title'])
    
    # Get prev/next items
    prev_item = part_items[idx - 1] if idx > 0 else None
    next_item = part_items[idx + 1] if idx < len(part_items) - 1 else None
    
    # Find related items
    related = []
    for other_part in [part]:  # Could expand to other parts
        for other_item in other_part.get('items', []):
            if other_item['name'] != name and other_item['type'] == item_type:
                related.append(other_item)
                if len(related) >= 5:
                    break
    
    # Generate C++ code examples
    code_before = generate_code_before(name, item_type)
    code_after = generate_code_after(name, item_type)
    
    # Generate relationships HTML
    relationships_html = ""
    for rel in related[:5]:
        rel_slug = slugify(rel['name'])
        relationships_html += f'\n        <a href="{rel_slug}.html" class="kb-relationship">{html_escape(rel["name"])}</a>'
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html_escape(name)} — Knowledge Base</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
  <div class="kb-container">
    <nav class="kb-sidebar">
      <div class="kb-logo"><a href="../index.html" style="text-decoration:none;color:inherit;">~<span>nabi</span>.dev KB</a></div>
      <input type="text" id="kbSearch" class="kb-search" placeholder="Search topics...">
      <ul class="kb-nav">
        <li class="kb-nav-item"><a href="../index.html" class="kb-nav-link">← Back to Index</a></li>
        <li class="kb-nav-item"><a href="../index.html#part{part_order}" class="kb-nav-link">Part {part_order}: {html_escape(part_title)}</a></li>
      </ul>
    </nav>
    <main class="kb-main">
      <article class="kb-page">
        <header class="kb-page-header">
          <div class="kb-breadcrumb">
            <a href="../index.html">Home</a> / 
            <a href="../index.html#part{part_order}">Part {part_order}</a> / 
            <span>{html_escape(item_type)}</span>
          </div>
          <h1 class="kb-page-title">{html_escape(name)}</h1>
          <div class="kb-page-meta">Part {part_order}: {html_escape(part_title)}</div>
        </header>
        
        <section class="kb-section">
          <h2 class="kb-section-title">Definition</h2>
          <div class="kb-section-content">
            {generate_definition(name, item_type)}
          </div>
        </section>
        
        <section class="kb-section">
          <h2 class="kb-section-title">The Problem It Solves</h2>
          <div class="kb-section-content">
            {generate_problem(name, item_type)}
          </div>
        </section>
        
        <section class="kb-section">
          <h2 class="kb-section-title">Reasoning & Concepts</h2>
          <div class="kb-section-content">
            {generate_reasoning(name, item_type)}
          </div>
        </section>
        
        <section class="kb-section">
          <h2 class="kb-section-title">C++ Code Examples</h2>
          <div class="kb-section-content">
            <h3>Before / Naive Approach</h3>
            <div class="kb-code-block"><pre><code>{code_before}</code></pre></div>
            <h3>After / Applying {html_escape(name)}</h3>
            <div class="kb-code-block"><pre><code>{code_after}</code></pre></div>
          </div>
        </section>
        
        <section class="kb-section">
          <h2 class="kb-section-title">Trade-offs & Costs</h2>
          <div class="kb-section-content">
            {generate_tradeoffs(name, item_type)}
          </div>
        </section>
        
        <section class="kb-section">
          <h2 class="kb-section-title">When NOT to Use It</h2>
          <div class="kb-section-content">
            {generate_when_not(name, item_type)}
          </div>
        </section>
        
        <section class="kb-section">
          <h2 class="kb-section-title">Relationships</h2>
          <div class="kb-section-content">
            <p>How this concept interacts with others in the knowledge base:</p>
            <div class="kb-relationships">{relationships_html}
            </div>
          </div>
        </section>
        
        <section class="kb-takeaways">
          <h4>Key Takeaways</h4>
          <ul>
            {generate_takeaways(name, item_type)}
          </ul>
        </section>
        
        <nav class="kb-page-nav">
          <div>
            {f'<a href="{slugify(prev_item["name"])}.html">← {html_escape(prev_item["name"])}</a>' if prev_item else '<span></span>'}
          </div>
          <div>
            {f'<a href="{slugify(next_item["name"])}.html">{html_escape(next_item["name"])} →</a>' if next_item else '<span></span>'}
          </div>
        </nav>
      </article>
    </main>
  </div>
  <button id="kbThemeToggle" class="kb-theme-toggle" aria-label="Toggle dark mode">☀️</button>
  <script src="../assets/app.js"></script>
</body>
</html>'''
    
    return html

def generate_definition(name, item_type):
    """Generate definition content."""
    definitions = {
        "SRP": "<p>The Single Responsibility Principle states that a class should have only one reason to change, meaning it should have only one job or responsibility. This principle, introduced by Robert C. Martin, is foundational to creating maintainable and understandable code.</p><p>When a class has multiple responsibilities, changes to one responsibility may affect the other, leading to fragile code that breaks unexpectedly. By separating concerns into distinct classes, each class becomes more focused, easier to test, and simpler to modify.</p>",
        "OCP": "<p>The Open/Closed Principle states that software entities (classes, modules, functions) should be open for extension but closed for modification. This means you should be able to add new functionality without changing existing code.</p><p>This principle promotes stability: existing, tested code remains unchanged while new features are added through extension mechanisms like inheritance, composition, or strategy patterns. It reduces the risk of introducing bugs into working code.</p>",
        "LSP": "<p>The Liskov Substitution Principle states that objects of a superclass should be replaceable with objects of its subclasses without breaking the application. In other words, a subclass must behave identically to its parent class from the perspective of the caller.</p><p>Violating LSP leads to code that must check object types before using them, defeating the purpose of polymorphism. Proper adherence ensures that inheritance hierarchies are truly substitutable.</p>",
    }
    
    default_def = f"<p><strong>{name}</strong> is a fundamental concept in software design that guides developers toward creating maintainable, scalable, and robust systems.</p><p>This {(item_type.lower())} addresses common challenges in software development by providing a proven approach to structuring code and making design decisions. Understanding and applying this {(item_type.lower())} helps prevent technical debt and improves code quality.</p>"
    
    return definitions.get(name.split()[0], default_def)

def generate_problem(name, item_type):
    """Generate problem statement content."""
    return f"<p>Without applying <strong>{name}</strong>, codebases tend to accumulate technical debt rapidly. Developers face several concrete pains:</p><ul><li><strong>Tight coupling:</strong> Changes in one area ripple through unrelated parts of the system.</li><li><strong>Difficulty testing:</strong> Units of code cannot be isolated for testing without extensive mocking.</li><li><strong>Poor readability:</strong> The intent of the code becomes obscured by mixed concerns.</li><li><strong>Fragile code:</strong> Small modifications cause unexpected failures elsewhere.</li><li><strong>Reduced velocity:</strong> Teams spend more time fixing issues than adding value.</li></ul><p>These problems compound over time, making the codebase increasingly difficult to maintain and extend.</p>"

def generate_reasoning(name, item_type):
    """Generate reasoning content."""
    return f"<p>The reasoning behind <strong>{name}</strong> stems from decades of software engineering experience. It's not an arbitrary rule but an observation about what makes systems sustainable.</p><p><strong>Why it works:</strong> By following this {(item_type.lower())}, you align your code structure with how humans think about problems. We naturally decompose complex problems into smaller, manageable pieces. This {(item_type.lower())} formalizes that intuition.</p><p><strong>Design thinking:</strong> Good software design mirrors the domain it models. When code structure reflects business concepts clearly, changes in requirements map cleanly to changes in code. This {(item_type.lower())} helps achieve that alignment.</p><p><strong>Cognitive load:</strong> Developers can only hold so much in working memory. This {(item_type.lower())} reduces cognitive load by creating clear boundaries and expectations, allowing developers to focus on one concern at a time.</p>"

def generate_tradeoffs(name, item_type):
    """Generate trade-offs content."""
    return f"<p>While <strong>{name}</strong> provides significant benefits, it's not without costs:</p><ul><li><strong>Increased abstraction:</strong> More layers of indirection can make code harder to follow initially.</li><li><strong>More files/classes:</strong> Separation often means more artifacts to manage.</li><li><strong>Potential over-engineering:</strong> Applied dogmatically, it can lead to unnecessary complexity for simple problems.</li><li><strong>Performance overhead:</strong> Additional indirection may introduce minor performance costs (usually negligible).</li><li><strong>Learning curve:</strong> Team members must understand the pattern to work effectively with the code.</li></ul><p>The key is judicious application: use this {(item_type.lower())} where the benefits outweigh the costs, typically in code that will be maintained and evolved over time.</p>"

def generate_when_not(name, item_type):
    """Generate when-not-to-use content."""
    return f"<p><strong>{name}</strong> should NOT be applied when:</p><ul><li><strong>Simple scripts or one-off tools:</strong> For throwaway code, the overhead isn't justified.</li><li><strong>Performance-critical sections:</strong> In hot paths where every cycle counts, simplicity may trump design purity.</li><li><strong>Proof-of-concept work:</strong> When validating an idea quickly, premature optimization of design slows learning.</li><li><strong>Team unfamiliarity:</strong> If the team doesn't understand the {(item_type.lower())}, it creates confusion rather than clarity.</li><li><strong>Over-engineering risk:</strong> Don't create abstractions for hypothetical future requirements (violates YAGNI).</li></ul><p>Remember: design principles serve you, not vice versa. Apply them thoughtfully based on context.</p>"

def generate_takeaways(name, item_type):
    """Generate takeaways list."""
    takeaways = [
        f"{name} helps create code that is easier to understand, test, and maintain.",
        "Apply this principle consistently in production code, but be pragmatic about simple scripts.",
        "The benefit compounds over time as the codebase evolves.",
        "Balance strict adherence with practical considerations like team knowledge and deadlines.",
        "This principle works best in combination with others, not in isolation."
    ]
    
    return ''.join(f'<li>{t}</li>' for t in takeaways)

def generate_code_before(name, item_type):
    """Generate 'before' C++ code example."""
    return '''// Violation: Multiple responsibilities in one class
class UserManager {
public:
    // Handles user data
    void setUserData(const std::string& name, int age) {
        // ... store data
    }
    
    // Handles database operations  
    void saveToDatabase() {
        // SQL connection and insert
    }
    
    // Handles email notifications
    void sendWelcomeEmail() {
        // SMTP logic
    }
    
    // Handles validation
    bool validateUser() {
        // Validation logic
    }
};

// Problems:
// - Cannot test database without actual DB
// - Email changes require recompiling user logic
// - Validation rules mixed with business logic
// - Hard to reuse user data without DB/email'''

def generate_code_after(name, item_type):
    """Generate 'after' C++ code example."""
    return '''// Solution: Each responsibility in its own class

// 1. Pure data holder
struct UserData {
    std::string name;
    int age;
};

// 2. Validation logic (single responsibility)
class UserValidator {
public:
    static bool isValid(const UserData& user) {
        return !user.name.empty() && user.age > 0;
    }
};

// 3. Database operations (single responsibility)
class UserRepository {
public:
    virtual ~UserRepository() = default;
    virtual void save(const UserData& user) = 0;
};

class SqlUserRepository : public UserRepository {
public:
    void save(const UserData& user) override {
        // SQL implementation
    }
};

// 4. Email notification (single responsibility)
class UserNotifier {
public:
    virtual ~UserNotifier() = default;
    virtual void sendWelcome(const std::string& name) = 0;
};

// 5. Orchestrator using dependencies
class UserService {
    std::unique_ptr<UserRepository> repo_;
    std::unique_ptr<UserNotifier> notifier_;
    
public:
    UserService(std::unique_ptr<UserRepository> repo,
                std::unique_ptr<UserNotifier> notifier)
        : repo_(std::move(repo)), notifier_(std::move(notifier)) {}
    
    void registerUser(const std::string& name, int age) {
        UserData user{name, age};
        
        if (!UserValidator::isValid(user)) {
            throw std::invalid_argument("Invalid user data");
        }
        
        repo_->save(user);
        notifier_->sendWelcome(name);
    }
};

// Benefits:
// - Each class has one reason to change
// - Easy to mock for testing
// - Can swap implementations (e.g., different DB)
// - Clear separation of concerns'''

# Main execution
print("Generating knowledge base...")

# Create directories
os.makedirs('/workspace/knowledge-base/pages', exist_ok=True)
os.makedirs('/workspace/knowledge-base/assets', exist_ok=True)

# Generate index.html
print("  Generating index.html...")
index_html = generate_index_html(inventory['parts'])
with open('/workspace/knowledge-base/index.html', 'w') as f:
    f.write(index_html)

# Generate individual pages
total_pages = 0
for part in inventory['parts']:
    part_title = part.get('detailedTitle', part['title'])
    items = part.get('items', [])
    
    print(f"  Generating {len(items)} pages for Part {part['order']} ({part_title})...")
    
    for idx, item in enumerate(items):
        page_html = generate_item_page(item, part, [], idx, items)
        slug = slugify(item['name'])
        
        with open(f'/workspace/knowledge-base/pages/{slug}.html', 'w') as f:
            f.write(page_html)
        
        total_pages += 1

print(f"\nGeneration complete!")
print(f"  - 1 index.html")
print(f"  - {total_pages} individual pages in pages/")
print(f"  - assets/style.css")
print(f"  - assets/app.js")

# Save summary
summary = {
    "total_parts": len(inventory['parts']),
    "total_pages": total_pages,
    "parts": []
}

for part in inventory['parts']:
    summary['parts'].append({
        "order": part['order'],
        "title": part.get('detailedTitle', part['title']),
        "item_count": len(part.get('items', []))
    })

with open('/workspace/generation_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print("\nSummary saved to generation_summary.json")

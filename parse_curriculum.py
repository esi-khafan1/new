#!/usr/bin/env python3
"""
Parse the rendered HTML from thisisnabi.dev and extract curriculum data.
Then generate the offline knowledge base.
"""

import re
import json
import os
import html

# Read the rendered HTML
with open('/workspace/rendered_html.txt', 'r') as f:
    html_content = f.read()

# Decode HTML entities
html_content = html.unescape(html_content)

# Extract curriculum section - everything between #curriculum and #sessions
curriculum_match = re.search(r'<div id="curriculum".*?(?=<div id="sessions")', html_content, re.DOTALL)
if not curriculum_match:
    print("Could not find curriculum section")
    exit(1)

curriculum_html = curriculum_match.group(0)

# Parse the 6 parts from the grid summary
parts_data = []

# Find all level cards in the grid - more flexible pattern
grid_pattern = r'<div style="display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 11px;[^>]*>.*?</div>'
grid_matches = re.findall(grid_pattern, curriculum_html)

for i, match in enumerate(grid_matches):
    # Extract order number
    order_match = re.search(r'<span style="font-family: Silkscreen, monospace; font-size: 22px; color: [^"]+; flex: 0 0 auto; line-height: 1;">([^<]+)</span>', match)
    # Extract title
    title_match = re.search(r'<span style="display: block; font-size: 15px; font-weight: 600; color: [^"]+; letter-spacing: -0.01em;">([^<]+)</span>', match)
    # Extract topics count
    topics_match = re.search(r'<span style="display: block; font-family: &quot;JetBrains Mono&quot;, monospace; font-size: 10px; letter-spacing: 0.1em; color: [^"]+; margin-top: 3px;">(\d+ TOPICS|\d+ TRACKS)</span>', match)
    
    if order_match and title_match:
        order_text = order_match.group(1).strip()
        title = title_match.group(1).strip()
        topics_count = topics_match.group(1).strip() if topics_match else ""
        
        # Determine order number for sorting (handle the ✦ symbol)
        if order_text == '✦':
            order_num = 6
        else:
            try:
                order_num = int(order_text)
            except:
                order_num = i + 1
        
        parts_data.append({
            "order": order_num,
            "orderText": order_text,
            "title": title,
            "topicsCount": topics_count,
            "description": "",
            "items": []
        })

# Sort by order
parts_data.sort(key=lambda x: x["order"])

print(f"Found {len(parts_data)} parts in grid:")
for p in parts_data:
    print(f"  {p['order']}. {p['title']} ({p['topicsCount']})")

# Now extract detailed items from the expanded sections
# Split by the detail section markers
detail_section_pattern = r'<div style="margin-top: 22px; border: 1px solid rgb\(221, 215, 203\); border-radius: 14px;'
detail_sections = re.split(detail_section_pattern, curriculum_html)[1:]  # Skip first empty split

print(f"\nFound {len(detail_sections)} detail sections")

# Process each detail section
for idx, section in enumerate(detail_sections[:6]):
    # Get order number from header
    order_match = re.search(r'<div style="font-family: Silkscreen, monospace; font-size: 30px; color: [^"]+;">(\d+|✦)</div>', section)
    if not order_match:
        print(f"  Section {idx}: No order number found, skipping")
        continue
    
    order_text = order_match.group(1)
    if order_text == '✦':
        order_num = 6
    else:
        order_num = int(order_text)
    
    if order_num < 1 or order_num > 6:
        print(f"  Section {idx}: Order {order_num} out of range, skipping")
        continue
    
    print(f"  Processing section {idx} -> Part {order_num}")
    
    # Get title from header
    title_match = re.search(r'<div style="font-size: 26px; font-weight: 700; color: [^"]+; letter-spacing: -0.01em;">([^<]+)</div>', section)
    if title_match:
        parts_data[order_num - 1]["detailedTitle"] = title_match.group(1).strip()
    
    # Get description from header  
    desc_match = re.search(r'<div style="font-size: 14px; color: [^"]+; margin-top: 3px;">([^<]+)</div>', section)
    if desc_match:
        parts_data[order_num - 1]["description"] = desc_match.group(1).strip()
    
    # Extract column headers to determine item types
    # Look for PRINCIPLES or PATTERNS headers
    col_headers = re.findall(r'<span style="font-family: &quot;JetBrains Mono&quot;, monospace; font-size: 11px; letter-spacing: 0.12em; color: [^"]+;">(PRINCIPLES|PATTERNS|TRACKS)</span>', section)
    
    # Extract all topic items with their context
    # We need to track which column we're in
    current_item_type = "topic"
    
    # Split by column divs
    col_divs = re.findall(r'<div[^>]*style="[^"]*border-right:[^"]*padding: 22px 22px 26px;[^>]*>|<div[^>]*style="padding: 22px 22px 26px;[^>]*>', section)
    
    # Alternative: extract items directly with surrounding context
    # Pattern for items: <div style="padding: 7px 0px; border-bottom: 1px dotted...">ITEM NAME</div>
    item_matches = re.findall(r'<div style="padding: 7px 0px; border-bottom: 1px dotted[^>]*>([^<]+)</div>', section)
    
    # For type detection, look at what comes before each item
    for item_text in item_matches:
        item_text = item_text.strip()
        if len(item_text) > 2:
            # Determine type based on text patterns
            item_type = "topic"
            
            # Check if it's a principle (has abbreviation like "SRP —")
            if re.match(r'^[A-Z]{2,4}\s*[—-]', item_text):
                item_type = "principle"
            # Check if it's a known GoF pattern
            elif item_text in ["Factory Method", "Abstract Factory", "Builder", "Prototype", "Singleton", 
                              "Static Factory Method", "Adapter", "Bridge", "Composite", "Decorator",
                              "Facade", "Flyweight", "Proxy", "Chain of Responsibility", "Command",
                              "Interpreter", "Iterator", "Mediator", "Memento", "Observer", "State",
                              "Strategy", "Template Method", "Visitor", "Null Object"]:
                item_type = "pattern"
            
            parts_data[order_num - 1]["items"].append({
                "name": item_text,
                "type": item_type,
                "source_text": item_text,
                "source_url": ""
            })
    
    print(f"    Found {len(item_matches)} items in part {order_num}")

# Print inventory JSON
inventory = {"parts": parts_data}
print("\n\n=== INVENTORY JSON ===")
print(json.dumps(inventory, indent=2))

# Save to file
with open('/workspace/curriculum_inventory.json', 'w') as f:
    json.dump(inventory, f, indent=2)

total_items = sum(len(p['items']) for p in parts_data)
print(f"\n\nTotal items extracted: {total_items}")
for p in parts_data:
    print(f"  Part {p['order']}: {len(p['items'])} items")

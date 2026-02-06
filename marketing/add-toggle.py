#!/usr/bin/env python3
"""
Script to add Human/Machine toggle to marketing pages
"""

import re
import os

# Pages that need the toggle added
PAGES = [
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/visitor-identification/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/audience-builder/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/intent-audiences/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/direct-mail/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/data-access/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/clean-room/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/services/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/pricing/page.tsx",
    "/Users/adamwolfe/cursive-project/cursive-work/marketing/app/faq/page.tsx",
]

def add_imports(content):
    """Add view-wrapper imports if not present"""
    if 'HumanView' in content or 'MachineView' in content:
        return content  # Already has imports

    # Find the last import statement
    import_pattern = r'^import\s+.*from\s+["\'].*["\']'
    imports = list(re.finditer(import_pattern, content, re.MULTILINE))

    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        new_import = '\nimport { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"'
        content = content[:insert_pos] + new_import + content[insert_pos:]

    return content

def wrap_with_human_view(content):
    """Wrap existing main content with HumanView"""
    # Find the return statement and main tag
    return_match = re.search(r'return\s+\(\s*(?:<>)?\s*<main', content, re.MULTILINE)
    if not return_match:
        return content

    # Already wrapped?
    if '<HumanView>' in content:
        return content

    # Insert HumanView opening
    main_start = content.find('<main', return_match.start())
    before_main = content[:main_start]
    after_main = content[main_start:]

    # Add wrapper before <main>
    content = before_main + '{/* Human View */}\n      <HumanView>\n        ' + after_main

    # Find closing </main> tag
    main_close_match = re.search(r'</main>\s*(?:</>\s*)?\s*\)', content)
    if main_close_match:
        close_pos = content.find('</main>', main_close_match.start())
        close_end = close_pos + len('</main>')
        content = content[:close_end] + '\n  </HumanView>' + content[close_end:]

    return content

def add_machine_view_placeholder(content, page_name):
    """Add Machine View placeholder"""
    if '<MachineView>' in content:
        return content

    # Find the end of HumanView
    human_view_close = content.rfind('</HumanView>')
    if human_view_close == -1:
        return content

    insert_pos = human_view_close + len('</HumanView>')

    machine_content = f'''

  {{/* Machine View - AEO-Optimized */}}
  <MachineView>
    <MachineContent>
      {{/* Header */}}
      <div className="mb-12 pb-6 border-b border-gray-200">
        <h1 className="text-2xl text-gray-900 font-bold mb-4">{page_name.upper()}</h1>
        <p className="text-gray-700 leading-relaxed">
          [Page description for AI/machine readers]
        </p>
      </div>

      {{/* Key Information */}}
      <MachineSection title="Overview">
        <p className="text-gray-700 mb-4">
          [Add machine-readable content here]
        </p>
      </MachineSection>

      {{/* Contact */}}
      <MachineSection title="Learn More">
        <MachineList items={{[
          {{
            label: "Book a Demo",
            href: "https://cal.com/adamwolfe/cursive-ai-audit",
            description: "Schedule a personalized walkthrough"
          }},
          {{
            label: "View Pricing",
            href: "https://meetcursive.com/pricing"
          }}
        ]}}} />
      </MachineSection>

    </MachineContent>
  </MachineView>
</>'''

    content = content[:insert_pos] + machine_content + content[insert_pos:]

    # Ensure we have the <> wrapper
    return_match = re.search(r'return\s+\(', content)
    if return_match:
        after_return = content[return_match.end():].strip()
        if not after_return.startswith('<>'):
            insert_pos = return_match.end()
            while content[insert_pos].isspace():
                insert_pos += 1
            content = content[:insert_pos] + '\n    <>\n      ' + content[insert_pos:]

    return content

def process_page(filepath):
    """Process a single page file"""
    print(f"Processing: {filepath}")

    if not os.path.exists(filepath):
        print(f"  SKIP: File not found")
        return False

    with open(filepath, 'r') as f:
        content = f.read()

    # Check if already has toggle
    if 'HumanView' in content and 'MachineView' in content:
        print(f"  SKIP: Already has toggle")
        return False

    original_content = content

    # Extract page name from path
    page_name = os.path.basename(os.path.dirname(filepath))
    if page_name == 'app':
        page_name = 'HOME'
    page_name = page_name.replace('-', ' ').title()

    # Add imports
    content = add_imports(content)

    # Wrap with HumanView
    content = wrap_with_human_view(content)

    # Add MachineView placeholder
    content = add_machine_view_placeholder(content, page_name)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓ Updated")
        return True
    else:
        print(f"  SKIP: No changes needed")
        return False

def main():
    print("Adding Human/Machine toggle to pages...\n")

    updated_count = 0
    for page in PAGES:
        if process_page(page):
            updated_count += 1

    print(f"\n✓ Updated {updated_count} pages")

if __name__ == "__main__":
    main()

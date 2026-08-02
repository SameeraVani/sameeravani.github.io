# encoding: utf-8
"""
Pratika Grahana Bolding Utility Script for Sanskrit Commentaries (Vivruti).

Usage:
  python bold_pratikas.py <path_to_markdown_file>
Example:
  python bold_pratikas.py public/books/bhagavad-gita/sa/ch2.md
"""

import sys
import re
import os

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def bold_pratikas_in_vivruti(viv_text):
    """
    Identifies and bolds Pratika Grahanas (प्रतीकग्रहणम्) in Sanskrit commentary text.
    Handles Devanagari Sandhi rules where इति combines with the pratika:
    - -निति (गुरून् + इति -> गुरूनिति)
    - -ेति (हत्वा + इति -> हत्वेति, यद्वा + इति -> यद्वेति)
    - -दिति (न चैतत् + इति -> न चैतदिति)
    - -मिति (आपूर्यमाणम् + इति -> आपूर्यमाणमिति)
    - -ीति / -ओति / -ुति / इति / इत्यादि / इत्याह
    - Quotes (“...”, ‘...’, '...')
    - Double-danda pratikas (॥ ... ॥)
    """
    if not viv_text:
        return ""
    
    clean_v = re.sub(r'\*\*([^*]+)\*\*', r'\1', viv_text)

    # 1. Double quotes: “...”
    clean_v = re.sub(r'(“[^”\n]+”)', r'**\1**', clean_v)

    # 2. Single quotes: ‘...’ or '...'
    clean_v = re.sub(r"([‘'][\u0900-\u097F\s,'.॥]+?[’'])", r'**\1**', clean_v)

    # 3. Double dandas: ॥ ... ॥ (when short <= 60 chars)
    clean_v = re.sub(r'(॥\s*[^\n॥]{1,60}?\s*॥)', r'**\1**', clean_v)

    # 4. Danda Pratika ending with इति / इत्यादि / इत्याह / sandhi-iti or danda । or ॥
    pattern_danda = r'(॥\s*[\u0900-\u097F\s\u0902\u0903\u093D]{1,60}?(?:इति|इत्यादि|इत्याह|[ेोीानिदिसम]ति|\b।+|\b॥+)(?:\s*।+|\s*॥+)?)'
    
    def mark_pratika(m):
        txt = m.group(1).strip()
        if txt.startswith('**') and txt.endswith('**'):
            return txt
        return f"**{txt}**"

    clean_v = re.sub(pattern_danda, mark_pratika, clean_v)

    # Clean up redundant bolding
    clean_v = re.sub(r'\*\*\s*\*\*', '', clean_v)
    while re.search(r'\*\*\*+[^*]+\*\*\*+', clean_v):
        clean_v = re.sub(r'\*\*+([^*]+)\*\*+', r'**\1**', clean_v)

    return clean_v


def bold_file(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        full_text = f.read()

    blocks = re.split(r'(?=\*\*श्लोकः\s*[०-९\d]+\*\*)', full_text)
    updated_blocks = []

    for block in blocks:
        if not block.strip():
            updated_blocks.append(block)
            continue
        
        pattern = r'(\*\*गीताविवृतिः\*\*\s*\([^)]*\)\s*\n)(.*?)(?=\n\n\*\*भावार्थः\*\*|\n\*\*भावार्थः\*\*|\Z)'
        m = re.search(pattern, block, re.DOTALL)
        if m:
            header = m.group(1)
            v_body = m.group(2)
            v_body_bolded = bold_pratikas_in_vivruti(v_body)
            block = block[:m.start()] + header + v_body_bolded + block[m.end():]
        
        updated_blocks.append(block)

    new_full_text = "".join(updated_blocks)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_full_text)

    print(f"Successfully processed and updated Pratika bolding in '{file_path}'.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = "public/books/bhagavad-gita/sa/ch2.md"
    bold_file(target)

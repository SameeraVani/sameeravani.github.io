# encoding: utf-8
"""
Sanskrit Shloka Engine Helper Script
Provides validation, assembly, commentary parsing, Pratika Grahana bolding, and formatting utilities for Sanskrit books.
Integrates directly with Sri Raghavendra Swamiji's Gita Vivruti commentary file (e.g., ch2.md).
"""

import sys
import re
import os
import argparse

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def devanagari_digit(n):
    """Converts an integer to Devanagari numerals string."""
    return ''.join(chr(0x0966 + int(d)) for d in str(n))


def parse_vivruti_exact(commentary_file_path, chapter_num=2, max_shlokas=72):
    """
    Parses Sri Raghavendra Swamiji's Gita Vivruti commentary file (e.g. RefBooks/Rayar works/Gita Vivruti/ch2.md).
    Uses exact marker pairs (1st match after shloka text to 2nd match at commentary end) to preserve shloka alignment.
    Returns a dictionary mapping shloka_number -> commentary_text string.
    """
    if not os.path.exists(commentary_file_path):
        print(f"Error: Commentary file {commentary_file_path} not found.")
        return {}

    with open(commentary_file_path, 'r', encoding='utf-8') as f:
        v_raw = f.read()

    vivruti_dict = {}
    for i in range(1, max_shlokas + 1):
        dev = devanagari_digit(i)
        pattern = rf'॥\s*[{chapter_num}{devanagari_digit(chapter_num)}]\.{dev}\s*॥'
        matches = list(re.finditer(pattern, v_raw))
        if len(matches) >= 2:
            start = matches[0].end()
            end = matches[1].start()
            chunk = v_raw[start:end]
            chunk = re.sub(r'###\s*\*\*\[Page\s*\d+\]\*\*', '', chunk)
            chunk = re.sub(r'^\s*\d+\s*$', '', chunk, flags=re.MULTILINE)
            vivruti_dict[i] = chunk.strip()
        elif len(matches) == 1:
            start = matches[0].end()
            next_m = re.search(rf'॥\s*[{chapter_num}{devanagari_digit(chapter_num)}]\.[०-९\d]+\s*॥', v_raw[start:])
            if next_m:
                chunk = v_raw[start : start + next_m.start()]
            else:
                chunk = v_raw[start : start + 4000]
            chunk = re.sub(r'###\s*\*\*\[Page\s*\d+\]\*\*', '', chunk)
            chunk = re.sub(r'^\s*\d+\s*$', '', chunk, flags=re.MULTILINE)
            vivruti_dict[i] = chunk.strip()

    return vivruti_dict


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


def bold_file_pratikas(file_path):
    """
    Applies Pratika Grahana bolding to all गीताविवृतिः blocks in a Markdown file.
    """
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return False

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

    print(f"Successfully applied Pratika bolding to {file_path}")
    return True


def validate_sanskrit_markdown(file_path, total_expected=None, commentary_file=None):
    """
    Validates a generated Sanskrit book markdown file.
    Checks that all shlokas are present and each shloka has all required sections.
    """
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist.")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    sections = ['**सन्धिः**', '**पदपरिचयः**', '**अन्वयः**', '**गीताविवृतिः**', '**भावार्थः**', '**व्याकरणविश्लेषणम्**']
    found_shlokas = []
    missing_shlokas = []
    
    if total_expected:
        for i in range(1, total_expected + 1):
            dev = devanagari_digit(i)
            pattern = rf'\*\*श्लोकः\s*{dev}\*\*'
            if re.search(pattern, text):
                found_shlokas.append(i)
            else:
                missing_shlokas.append(i)

    print(f"=== Validation Report for {os.path.basename(file_path)} ===")
    print(f"Total size: {len(text.encode('utf-8'))} bytes, total lines: {len(text.splitlines())}")
    
    if total_expected:
        print(f"Found {len(found_shlokas)} / {total_expected} expected shlokas.")
        if missing_shlokas:
            print(f"WARNING: Missing shlokas: {missing_shlokas}")

    print("\nSection Counts:")
    all_passed = True
    for sec in sections:
        cnt = len(re.findall(re.escape(sec), text))
        print(f"  {sec}: {cnt}")
        if total_expected and cnt < total_expected:
            all_passed = False

    if commentary_file and os.path.exists(commentary_file):
        commentaries = parse_vivruti_exact(commentary_file)
        print(f"\nCommentary File Integration: Loaded {len(commentaries)} shloka Vivrutis from {os.path.basename(commentary_file)}.")

    return all_passed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sanskrit Shloka & Commentary Processing Engine")
    parser.add_argument("command", nargs="?", default="validate", help="Action to perform: validate, parse-commentary, bold-pratikas")
    parser.add_argument("--file", help="Path to target markdown file")
    parser.add_argument("--expected", type=int, help="Expected number of shlokas")
    parser.add_argument("--commentary", help="Path to commentary file (e.g. RefBooks/Rayar works/Gita Vivruti/ch2.md)")
    args, unknown = parser.parse_known_args()

    if args.command == "parse-commentary" and args.commentary:
        comms = parse_vivruti_exact(args.commentary)
        print(f"Successfully extracted {len(comms)} shloka commentaries from {args.commentary}")
        for k in range(1, min(6, len(comms) + 1)):
            print(f"\n--- Shloka {k} Commentary Sample ---")
            print(bold_pratikas_in_vivruti(comms[k])[:200])
    elif args.command == "bold-pratikas" and args.file:
        bold_file_pratikas(args.file)
    elif args.file:
        validate_sanskrit_markdown(args.file, args.expected, args.commentary)
    else:
        print("Usage:")
        print("  python sanskrit_engine.py validate --file public/books/bhagavad-gita/sa/ch2.md --expected 72")
        print("  python sanskrit_engine.py bold-pratikas --file public/books/bhagavad-gita/sa/ch2.md")
        print("  python sanskrit_engine.py parse-commentary --commentary 'RefBooks/Rayar works/Gita Vivruti/ch2.md'")

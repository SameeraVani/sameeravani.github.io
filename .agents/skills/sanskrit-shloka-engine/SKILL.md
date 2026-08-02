---
name: sanskrit-shloka-engine
description: Generate, analyze, format, and bold Pratika Grahanas for Sanskrit shlokas and literature into structured markdown with Sandhi, Padaparichaya, Anvaya, Gita Vivruti, Bhavartha, and Vyakaranavishleshana based on authentic Dvaita commentaries (Madhva Bhashya, Jayatirtha Tika, Raghavendra Vivruti).
---

# Sanskrit Shloka & Grammar Analysis Engine

This skill provides a standard, repeatable workflow and automated engine for processing Sanskrit literature (Bhagavad Gita, Upanishads, Stotras, Puranas, etc.) and generating publication-ready Markdown files with authentic commentary and Pratika Grahana formatting.

## Source Commentary Integration

The engine directly loads and parses the authentic Sanskrit commentary file (e.g. `RefBooks\Rayar works\Gita Vivruti\ch2.md`) using `sanskrit_engine.py`.
- **Primary Source**: Sri Raghavendra Swamiji's *Gita Vivruti* (`RefBooks\Rayar works\Gita Vivruti\ch2.md`) along with Sri Madhvacharya's *Gita Bhashya* and Sri Jayatirtha's *Prameya Deepika*.
- **Direct Commentary Extraction**: For each shloka $N$, Sri Raghavendra Swamiji's exact Vivruti commentary is displayed in a dedicated section (`**गीताविवृतिः**`).
- **Simple Sanskrit Purport**: The `**भावार्थः**` section presents a concise summary of Sri Raghavendra Swamiji's Vivruti text in simple, clear Sanskrit.

---

## Pratika Grahana (प्रतीकग्रहणम्) Bolding Rules

In Sanskrit commentaries (*Vivruti* / *Tika*), words quoted directly from the Mula Shloka are Pratika Grahanas.
When bolding Pratika Grahanas in Devanagari text, the engine handles all Sandhi combinations where `इति` joins with the Pratika:
- **`-निति`**: `गुरून्` + `इति` $\rightarrow$ `**॥ गुरूनिति ।**` (e.g. Gita 2.5)
- **`-ेति`**: `हत्वा` + `इति` $\rightarrow$ `**॥ हत्वेति ।**`, `यद्वा` + `इति` $\rightarrow$ `**॥ यद्वेति ।**`, `यानेव` + `इति` $\rightarrow$ `**॥ यानेवेति ।**`
- **`-दिति`**: `न चैतत्` + `इति` $\rightarrow$ `**॥ न चैतदिति ।**`, `अवाप्य` + `इति` $\rightarrow$ `**॥ अवाप्येति ।**`
- **`-मिति`**: `आपूर्यमाणम्` + `इति` $\rightarrow$ `**॥ आपूर्यमाणमिति ।**`
- **`-ीति`, `-ओति`, `-ुति`, `इति`, `इत्यादि`, `इत्याह`**: `**॥ न हीति ।**`, `**॥ कथम्इत्यादि**`
- **Quoted Pratikas**: `**“ततः किं जातम्”**`, `**'स्थितप्रज्ञस्य का भाषेति'**`

---

## Standard Output Format Per Shloka

For every shloka, format the analysis into the following sections in exact order:

### 1. Title & Shloka Text
- Normal text (no Markdown headings like `#` or `###`).
- Bold title `**श्लोकः N**` (e.g., `**श्लोकः २१**`).
- Speaker line on line 2 in bold if present (e.g., `**सञ्जय उवाच**`, `**श्रीभगवानुवाच**`).
- Display the entire shloka in 2 lines, bolded.

### 2. Sandhi (सन्धिः)
- Bold section title: `**सन्धिः**`
- Paragraph format splitting every word in the shloka.
- Sandhi names in parentheses `()` between poorva pada and uttara pada.

### 3. Padaparichaya Table (पदपरिचयः)
- Bold section title: `**पदपरिचयः**`
- Table columns: `| पदम् | पदविभागः | पदपरिचयः | संस्कृत अर्थः |`
- `पदविभागः`: `ना` (Noun), `क्रि` (Verb), `अ` (Indeclinable).
- `पदपरिचयः`:
  - Nouns: `Anta, Pratipadika, Linga, Vibhakti, Vachana`.
  - Verbs: `Dhatu - Artha, Parasmaipadi/Atmanepadi, Lakara, Purusha, Vachana`.
  - Indeclinables: `अव्ययम्`.
- `संस्कृत अर्थः`: Meanings strictly grounded in Sri Raghavendra Swamiji's Vivruti text.

### 4. Anvaya (अन्वयः)
- Bold section title: `**अन्वयः**`
- Words rearranged in prose order ending with ` ।`.

### 5. Gita Vivruti (गीताविवृतिः)
- Bold section title: `**गीताविवृतिः** (श्रीराघवेन्द्रतीर्थकृता)`
- Contains the exact, unabridged/authentic Sanskrit commentary text from Sri Raghavendra Swamiji's *Gita Vivruti*, with all Pratika Grahanas properly boldfaced.

### 6. Bhavartha (भावार्थः)
- Bold section title: `**भावार्थः** (सरलसंस्क्तेन)`
- Simple, clear Sanskrit prose summary of Sri Raghavendra Swamiji's Vivruti text.

### 7. Vyakaranavishleshana Table (व्याकरणविश्लेषणम्)
- Bold section title: `**व्याकरणविश्लेषणम्**`
- Table columns: `| पदम् | समासः | कृदन्तः | तद्धितान्तः |`

### 8. Separator
- Separator line `---` on a new line after each shloka.

---

## Engine Utility Commands

Run `.agents/skills/sanskrit-shloka-engine/scripts/sanskrit_engine.py` or `bold_pratikas.py`:
- **Bold Pratika Grahanas in Markdown File**:
  `python .agents/skills/sanskrit-shloka-engine/scripts/sanskrit_engine.py bold-pratikas --file public/books/bhagavad-gita/sa/ch2.md`
  or
  `python .agents/skills/sanskrit-shloka-engine/scripts/bold_pratikas.py public/books/bhagavad-gita/sa/ch2.md`

- **Extract & Parse Commentary**:
  `python .agents/skills/sanskrit-shloka-engine/scripts/sanskrit_engine.py parse-commentary --commentary "RefBooks/Rayar works/Gita Vivruti/ch2.md"`

- **Validate Generated Book**:
  `python .agents/skills/sanskrit-shloka-engine/scripts/sanskrit_engine.py validate --file public/books/bhagavad-gita/sa/ch2.md --expected 72 --commentary "RefBooks/Rayar works/Gita Vivruti/ch2.md"`

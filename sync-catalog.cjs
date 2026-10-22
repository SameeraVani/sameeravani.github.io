const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, 'public/books');
const masterCatalogPath = path.join(booksDir, 'catalog.json');

// 1. Read existing master catalog (if any)
let existingBooks = [];
if (fs.existsSync(masterCatalogPath)) {
  try {
    existingBooks = JSON.parse(fs.readFileSync(masterCatalogPath, 'utf8'));
  } catch (err) {
    console.error('Error reading existing catalog.json:', err.message);
  }
}

// Map of existing books by ID for reference
const existingMap = new Map();
existingBooks.forEach((b) => existingMap.set(b.id, b));

// 2. Discover all book folders in public/books/
const entries = fs.readdirSync(booksDir, { withFileTypes: true });
const bookDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

// Preserve ordering from existing catalog.json first, then append any new folders
const orderedBookIds = [];
existingBooks.forEach((b) => {
  if (bookDirs.includes(b.id) && !orderedBookIds.includes(b.id)) {
    orderedBookIds.push(b.id);
  }
});
bookDirs.forEach((dir) => {
  if (!orderedBookIds.includes(dir)) {
    orderedBookIds.push(dir);
  }
});

const updatedMasterList = [];

orderedBookIds.forEach((bookId) => {
  const perBookCatalogPath = path.join(booksDir, bookId, 'catalog.json');
  let bookData = null;

  if (fs.existsSync(perBookCatalogPath)) {
    // Load from dedicated per-book catalog
    try {
      bookData = JSON.parse(fs.readFileSync(perBookCatalogPath, 'utf8'));
    } catch (err) {
      console.error(`Error reading per-book catalog for ${bookId}:`, err.message);
    }
  }

  // If per-book catalog doesn't exist yet, migrate from master catalog
  if (!bookData && existingMap.has(bookId)) {
    bookData = existingMap.get(bookId);
    // Write out the dedicated per-book catalog
    fs.writeFileSync(perBookCatalogPath, JSON.stringify(bookData, null, 2), 'utf8');
    console.log(`[Created] ${bookId}/catalog.json (migrated from master)`);
  }

  if (bookData) {
    // Calculate chapter count
    let chapterCount = 0;
    if (bookData.chapters) {
      const counts = Object.values(bookData.chapters).map((arr) => (Array.isArray(arr) ? arr.length : 0));
      chapterCount = counts.length > 0 ? Math.max(...counts) : 0;
    }

    // Build lightweight entry for master catalog (exclude the heavy chapters tree)
    const masterEntry = {
      id: bookData.id,
      title: bookData.title,
      author: bookData.author,
      year: bookData.year,
      genre: bookData.genre,
      description: bookData.description,
      coverUrl: bookData.coverUrl,
      languages: bookData.languages || [],
      shlokaLabel: bookData.shlokaLabel,
      chapterCount: chapterCount,
      localized: bookData.localized || {}
    };

    if (bookData.playlists) {
      masterEntry.playlists = bookData.playlists;
    }

    updatedMasterList.push(masterEntry);
  }
});

// 3. Write back the lightweight master catalog
fs.writeFileSync(masterCatalogPath, JSON.stringify(updatedMasterList, null, 2), 'utf8');
console.log(`\nSuccessfully synced ${updatedMasterList.length} books.`);
console.log(`Master catalog updated at: ${masterCatalogPath}`);

const fetch = require('node-fetch');
const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');

// Replace this with your actual Google Sheets CSV URL.
// const PUBLICATION_CSV_URL = process.env.PUBLICATION_CSV_URL;
const PUBLICATION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1RGmQ2-gbt0p9A2Zvr7ywIek-y2NZDBW88Mklz6sk0zg/export?format=csv&gid=1791259441';

/**
 * Convert the "Item type" string into a camelCase string.
 * For example, "Journal Article" becomes "journalArticle".
 */
function mapItemType(itemType) {
  if (!itemType) return "";
  const words = itemType.trim().split(/\s+/);
  if (words.length === 0) return "";
  const firstWord = words[0].toLowerCase();
  const rest = words.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return [firstWord, ...rest].join('');
}

/**
 * Map a CSV record to the desired JSON structure.
 */
function mapRecord(record) {
  return {
    "Item Type": mapItemType(record["Item type"]),
    "Publication Year": record["Publication year"] ? parseFloat(record["Publication year"]) : "",
    "Author": record["Authors"] || "",
    "Title": record["Title"] || "",
    "Short Title": record["Journal"] || "", // Using "Journal" field for short title.
    "Publication Title": record["Full journall"] || "",
    "DOI": record["DOI"] || "",
    "Url": record["URLs"] || "",
    "Abstract Note": record["Abstract"] || "",
    "Date": record["Date published"] || "",
    "Pages": record["Pages"] || "",
    "Issue": record["Issue"] || "",
    "Volume": record["Volume"] || "",
    "Library Catalog": "" // Not provided by CSV, leave as empty string.
  };
}

/**
 * Download CSV data from the Google Sheet, convert to JSON, map each record,
 * and save the result to publications.json.
 */
async function downloadAndSavePublications() {
  try {
    console.log("Fetching CSV data from Google Sheets...");
    const response = await fetch(PUBLICATION_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data: ${response.statusText}`);
    }
    const csvText = await response.text();
    console.log("Converting CSV data to JSON...");
    const jsonArray = await csv().fromString(csvText);

    // Map each record to the desired format.
    const mappedRecords = jsonArray.map(mapRecord);

    // Define output file path.
    const outputPath = path.join(__dirname, '..', '_data', 'publications.json');
    fs.writeFileSync(outputPath, JSON.stringify(mappedRecords, null, 2));
    console.log(`Successfully saved JSON data to ${outputPath}`);
  } catch (error) {
    console.error("Error during download and save:", error);
  }
}

downloadAndSavePublications();

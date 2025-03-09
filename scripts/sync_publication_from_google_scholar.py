#!/usr/bin/env python3
"""
Script to update publications.json by fetching data from Google Scholar.
"""
import json
import os
import re
from datetime import datetime
from scholarly import scholarly

# Configuration
# List of author IDs to track
SCHOLAR_AUTHOR_IDS = [
    "WWrZhf0AAAAJ"
]

def format_author_names(authors_list):
    """Format author names in the required format with 'and' as delimiter."""
    if isinstance(authors_list, str):
        return authors_list
    
    # Join authors with " and " instead of semicolons
    return " and ".join(authors_list)

def clean_title(title):
    """Clean up title formatting."""
    return title.strip()

def parse_publication_date(bib):
    """Extract and format publication date."""
    # Try to extract date from bib info
    year = bib.get('pub_year', '')
    
    # Default to current year if no year is found
    if not year:
        return datetime.now().strftime("%Y-%m-%d"), datetime.now().year
    
    # Create a date string (using January 1st as default)
    date_str = f"{year}-01-01"
    
    return date_str, int(year)

def convert_scholar_to_publication_format(pub):
    """Convert Google Scholar publication data to our JSON format."""
    bib = pub.get('bib', {})
    
    # Extract and format date information
    date_str, year = parse_publication_date(bib)
    
    # Determine publication type (simplified)
    pub_type = "journalArticle"
    if "conference" in bib.get('venue', '').lower():
        pub_type = "conferencePaper"
    
    # Create entry in our format
    entry = {
        "Item Type": pub_type,
        "Publication Year": int(year),
        "Author": format_author_names(bib.get('author', [])),
        "Title": clean_title(bib.get('title', '')),
        "Short Title": "",
        "Publication Title": bib.get('venue', ''),
        "DOI": bib.get('url', ''),  # Using URL as DOI if actual DOI not available
        "Url": bib.get('url', ''),
        "Abstract Note": bib.get('abstract', ''),
        "Date": date_str,
        "Pages": bib.get('pages', ''),
        "Issue": "",
        "Volume": "",
        "Library Catalog": "Google Scholar"
    }
    
    return entry

def get_publications_from_scholar():
    """Fetch publications from Google Scholar for specified authors."""
    all_publications = []
    
    for author_id in SCHOLAR_AUTHOR_IDS:
        try:
            author = scholarly.search_author_id(author_id)
            
            if author:
                # Fill in author data
                author = scholarly.fill(author)
                
                # Get publications
                for pub in author.get('publications', []):
                    try:
                        # Fill in publication details
                        filled_pub = scholarly.fill(pub)
                        
                        # Convert to our format
                        entry = convert_scholar_to_publication_format(filled_pub)
                        
                        # Add to our list if it's not already there (check by title)
                        if not any(p["Title"] == entry["Title"] for p in all_publications):
                            all_publications.append(entry)
                    except Exception as e:
                        print(f"Error processing publication: {e}")
        except Exception as e:
            print(f"Error fetching author {author_id}: {e}")
    
    return all_publications

def update_publications_json():
    """Update the publications.json file with new data from Google Scholar."""
    json_path = os.path.join(os.path.dirname(__file__), "..", "_data", "publications.json")
    
    # Read existing data
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = []
    
    # Get new data from Google Scholar
    scholar_publications = get_publications_from_scholar()
    
    # Merge data (add new publications)
    for pub in scholar_publications:
        # Check if publication already exists (by title)
        if not any(p["Title"] == pub["Title"] for p in existing_data):
            existing_data.append(pub)
    
    # Sort by publication year (descending) and then by title
    existing_data.sort(key=lambda x: (-x.get("Publication Year", 0), x.get("Title", "")))
    
    # Write back to file
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=4, ensure_ascii=False)
    
    print(f"Updated {json_path} with {len(scholar_publications)} new publications")

if __name__ == "__main__":
    update_publications_json()
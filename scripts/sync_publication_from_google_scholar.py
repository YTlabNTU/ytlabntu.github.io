import difflib
import json
import requests
from scholarly import scholarly

def get_author_publications(author_id):
    """
    Retrieves an author's publications from Google Scholar using their author_id.
    """
    try:
        author = scholarly.search_author_id(author_id)
        author = scholarly.fill(author, sections=['publications'])
        publications = author.get('publications', [])
        return publications
    except Exception as e:
        print(f"Error retrieving publications: {e}")
        return []
    
def search_crossref_strict(title, author, year):
    """
    Searches CrossRef for a publication using the title, author, and year.
    Returns a tuple (doi, details) if found and the title match is 90% or more, otherwise (None, None).
    """
    if year == "":
        return search_crossref_by_title_and_author(title, author)
    
    crossref_url = "https://api.crossref.org/works"
    params = {
        'query.bibliographic': title,
        'query.author': author,
        'query.issued': year,
        'rows': 1  # Get the top result only
    }
    try:
        response = requests.get(crossref_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            items = data.get("message", {}).get("items", [])
            if items:
                best_match = items[0]
                doi = best_match.get("DOI")
                # Get the title from the CrossRef result (it may be a list)
                crossref_title = best_match.get("title", [None])[0]
                if crossref_title:
                    # Calculate similarity ratio using difflib
                    match_ratio = difflib.SequenceMatcher(None, title.lower(), crossref_title.lower()).ratio()
                    if match_ratio >= 0.9:
                        return doi, best_match
                    else:
                        print(f"Title match percentage too low: {match_ratio:.2%} (required >= 90%)")
                else:
                    print("No title found in CrossRef result.")
        else:
            print(f"CrossRef returned status {response.status_code}")
    except Exception as e:
        print(f"Error fetching details from CrossRef: {e}")
    return None, None
    
def search_crossref_by_title_and_author(title, author):
    """
    Searches CrossRef for a publication using the title and author.
    Returns a tuple (doi, details) if found, otherwise (None, None).
    """
    crossref_url = "https://api.crossref.org/works"
    params = {
        'query.bibliographic': title,
        'query.author': author,
        'rows': 1  # Get top result
    }
    try:
        response = requests.get(crossref_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            items = data.get("message", {}).get("items", [])
            if items:
                best_match = items[0]
                doi = best_match.get("DOI")
                # Get the title from the CrossRef result (it may be a list)
                crossref_title = best_match.get("title", [None])[0]
                if crossref_title:
                    # Calculate similarity ratio using difflib
                    match_ratio = difflib.SequenceMatcher(None, title.lower(), crossref_title.lower()).ratio()
                    if match_ratio >= 0.9:
                        return doi, best_match
                    else:
                        print(f"Title match percentage too low: {match_ratio:.2%} (required >= 90%)")
                else:
                    print("No title found in CrossRef result.")
        else:
            print(f"CrossRef returned status {response.status_code}")
    except Exception as e:
        print(f"Error fetching details from CrossRef: {e}")
    return None, None

def search_crossref_by_title(title):
    """
    Searches CrossRef for a publication using the title.
    Returns a tuple (doi, details) if found, otherwise (None, None).
    """
    crossref_url = "https://api.crossref.org/works"
    params = {
        'query.title': title,
        'rows': 1  # Get top result
    }
    try:
        response = requests.get(crossref_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            items = data.get("message", {}).get("items", [])
            if items:
                best_match = items[0]
                doi = best_match.get("DOI")
                return doi, best_match
            else:
                print(f"No CrossRef match found for title: {title}")
                return None, None
        else:
            print(f"CrossRef returned status {response.status_code} for title: {title}")
            return None, None
    except Exception as e:
        print(f"Error searching CrossRef for title '{title}': {e}")
        return None, None

def map_crossref_to_record(details):
    """
    Maps CrossRef metadata to the required JSON keys.
    """
    def format_item_type(item_type):
        # Convert from e.g., "journal-article" to "journalArticle"
        if not item_type:
            return ""
        parts = item_type.split("-")
        return parts[0].lower() + "".join(word.capitalize() for word in parts[1:])
    
    def extract_year(issued):
        try:
            date_parts = issued.get("date-parts", [])
            if date_parts and len(date_parts[0]) > 0:
                return int(date_parts[0][0])
        except Exception:
            pass
        return ""
    
    def format_date(issued):
        try:
            date_parts = issued.get("date-parts", [])
            if date_parts and len(date_parts[0]) > 0:
                parts = date_parts[0]
                # Create a date string in YYYY-MM-DD format (if month/day available)
                year = str(parts[0])
                month = f"{parts[1]:02d}" if len(parts) > 1 else "01"
                day = f"{parts[2]:02d}" if len(parts) > 2 else "01"
                return f"{year}-{month}-{day}"
        except Exception:
            pass
        return ""
    
    # Build the record with the required keys
    record = {
        "Item Type": format_item_type(details.get("type", "")),
        "Publication Year": extract_year(details.get("issued", {})),
        "Author": "; ".join(
            f"{author.get('family', '')}, {author.get('given', '')}".strip(", ") 
            for author in details.get("author", [])
        ),
        "Title": details.get("title", [""])[0] if details.get("title") else "",
        "Short Title": "",  # Not provided by CrossRef
        "Publication Title": details.get("container-title", [""])[0] if details.get("container-title") else "",
        "DOI": f"https://doi.org/{details.get('DOI')}" if details.get("DOI") else "",
        "Url": details.get("URL", ""),
        "Abstract Note": details.get("abstract", ""),
        "Date": format_date(details.get("issued", {})),
        "Pages": details.get("page", ""),
        "Issue": details.get("issue", ""),
        "Volume": details.get("volume", ""),
        "Library Catalog": ""
    }
    return record

def main(author_id):
    print("Fetching publications from Google Scholar...")
    publications = get_author_publications(author_id)
    print(f"Found {len(publications)} publications.")

    records = []
    for pub in publications:
        title = pub.get('bib', {}).get('title', '')
        year = pub.get('bib', {}).get('year', '')
        if not title:
            continue
        print(f"Processing publication: {title}")
        # doi, details = search_crossref_by_title(title)
        # doi, details = search_crossref_by_title_and_author(title, 'Yu-Ting Hsu')
        doi, details = search_crossref_strict(title, 'Yu-Ting Hsu', year)
        if doi and details:
            record = map_crossref_to_record(details)
            records.append(record)
            print(f"  Added record with DOI: {doi}")
        else:
            print("  No DOI or details found, skipping.")

    output_filename = "_data/publications.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=4)
    print(f"Saved {len(records)} publication records to '{output_filename}'.")

if __name__ == "__main__":
    # Replace with your actual Google Scholar author ID.
    author_id = "WWrZhf0AAAAJ"
    main(author_id)
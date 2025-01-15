from bs4 import BeautifulSoup
import json
import time
import traceback
import os

def parse_project_html(content):
    """Parse EVERYTHING from the HTML content"""
    try:
        soup = BeautifulSoup(content, 'html.parser')
        
        # Initialize project dictionary
        project = {
            'scraped_at': time.strftime("%Y-%m-%d %H:%M:%S"),
            'raw_data': {}  # We'll store everything here
        }

        # Get literally everything with an ID
        for element in soup.find_all(id=True):
            project['raw_data'][element['id']] = {
                'tag': element.name,
                'text': element.get_text(separator='\n', strip=True),
                'classes': element.get('class', []),
                'attributes': {k:v for k,v in element.attrs.items() if k != 'class'},
                'html': str(element)
            }

        # Get all headers and their content
        headers = {}
        for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            header_text = h.get_text(strip=True)
            if header_text:
                # Get all content until next header
                content = []
                for sibling in h.next_siblings:
                    if sibling.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                        break
                    if sibling.name:  # Only get elements with tags
                        content.append({
                            'tag': sibling.name,
                            'text': sibling.get_text(separator='\n', strip=True),
                            'classes': sibling.get('class', []),
                            'html': str(sibling)
                        })
                headers[header_text] = content

        project['headers'] = headers

        # Get all divs with classes
        project['divs'] = {}
        for div in soup.find_all('div', class_=True):
            for class_name in div.get('class', []):
                if class_name not in project['divs']:
                    project['divs'][class_name] = []
                project['divs'][class_name].append({
                    'text': div.get_text(separator='\n', strip=True),
                    'html': str(div),
                    'attributes': {k:v for k,v in div.attrs.items() if k != 'class'}
                })

        # Get all meta tags
        project['meta'] = {}
        for meta in soup.find_all('meta'):
            name = meta.get('name') or meta.get('property') or meta.get('http-equiv')
            if name:
                project['meta'][name] = meta.get('content')

        # Get all links
        project['links'] = []
        for a in soup.find_all('a'):
            project['links'].append({
                'text': a.get_text(strip=True),
                'href': a.get('href'),
                'classes': a.get('class', []),
                'id': a.get('id'),
                'html': str(a)
            })

        # Get all images
        project['images'] = []
        for img in soup.find_all('img'):
            project['images'].append({
                'src': img.get('src'),
                'alt': img.get('alt'),
                'classes': img.get('class', []),
                'id': img.get('id'),
                'html': str(img)
            })

        # Get all forms
        project['forms'] = []
        for form in soup.find_all('form'):
            project['forms'].append({
                'action': form.get('action'),
                'method': form.get('method'),
                'classes': form.get('class', []),
                'id': form.get('id'),
                'inputs': [{'type': i.get('type'), 'name': i.get('name'), 'id': i.get('id')} 
                          for i in form.find_all('input')],
                'html': str(form)
            })

        # Get all scripts
        project['scripts'] = []
        for script in soup.find_all('script'):
            project['scripts'].append({
                'src': script.get('src'),
                'type': script.get('type'),
                'content': script.string if script.string else None,
                'html': str(script)
            })

        # Get all iframes
        project['iframes'] = []
        for iframe in soup.find_all('iframe'):
            project['iframes'].append({
                'src': iframe.get('src'),
                'classes': iframe.get('class', []),
                'id': iframe.get('id'),
                'html': str(iframe)
            })

        # Get all lists
        project['lists'] = {
            'ul': [],
            'ol': []
        }
        for list_type in ['ul', 'ol']:
            for lst in soup.find_all(list_type):
                items = [{'text': li.get_text(strip=True), 'html': str(li)} 
                        for li in lst.find_all('li')]
                project['lists'][list_type].append({
                    'items': items,
                    'classes': lst.get('class', []),
                    'id': lst.get('id'),
                    'html': str(lst)
                })

        # Get all tables
        project['tables'] = []
        for table in soup.find_all('table'):
            rows = []
            for tr in table.find_all('tr'):
                cells = []
                for td in tr.find_all(['td', 'th']):
                    cells.append({
                        'text': td.get_text(strip=True),
                        'html': str(td),
                        'is_header': td.name == 'th'
                    })
                rows.append(cells)
            project['tables'].append({
                'rows': rows,
                'classes': table.get('class', []),
                'id': table.get('id'),
                'html': str(table)
            })

        # Get structured data (JSON-LD)
        project['structured_data'] = []
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                if script.string:
                    project['structured_data'].append(json.loads(script.string))
            except:
                pass

        return project
        
    except Exception as e:
        print(f"Error parsing project: {str(e)}")
        print(traceback.format_exc())
        return None

def parse_saved_html_file(filename):
    """Parse a saved HTML file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        project = parse_project_html(content)
        if project:
            project['source_file'] = filename
            print(f"Successfully parsed {filename}")
            return project
            
    except Exception as e:
        print(f"Error reading file {filename}: {str(e)}")
        print(traceback.format_exc())
        return None

if __name__ == "__main__":
    # Get all HTML files from the raw_html directory
    raw_html_dir = "ai/scraper/data/raw_html"
    if not os.path.exists(raw_html_dir):
        print(f"Directory {raw_html_dir} does not exist!")
        exit(1)
        
    # Get all HTML files
    html_files = [f for f in os.listdir(raw_html_dir) if f.endswith('.html')]
    if not html_files:
        print(f"No HTML files found in {raw_html_dir}")
        exit(1)
        
    print(f"Found {len(html_files)} HTML files to parse")
    
    # Parse each file
    projects = []
    for filename in html_files:
        full_path = os.path.join(raw_html_dir, filename)
        print(f"\nProcessing {filename}...")
        
        project = parse_saved_html_file(full_path)
        if project:
            projects.append(project)
            
    # Save all parsed projects to a JSON file
    output_file = "ai/scraper/data/parsed_projects.json"
    print(f"\nSaving {len(projects)} projects to {output_file}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2)
        
    print("Done!") 
import json
import openai
import os
from time import sleep
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def load_data():
    with open("projects_data.json", "r", encoding='utf-8') as f:
        projects = json.load(f)
    with open("prizes.json", "r", encoding='utf-8') as f:
        prizes = json.load(f)
    return projects, prizes

def get_matching_prize(project_text, prizes, client):
    prompt = f"""
Given this project description:
"{project_text}"

And these prizes:
{prizes}

Which prize (if any) does this project best qualify for? Return ONLY the exact prize text that matches best, or "None" if no prizes match well. 
Consider the project's features and goals when matching to prize criteria.
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return None

def match_projects_to_prizes():
    # Initialize OpenAI client
    client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    # Load data
    projects, prizes = load_data()
    
    # Process each project
    for i, project in enumerate(projects):
        print(f"\nProcessing project {i+1}/{len(projects)}: {project['title']}")
        
        # Combine title and text for better context
        project_text = f"{project['title']}. {project['text']}"
        
        # Get matching prize
        matched_prize = get_matching_prize(project_text, prizes, client)

        print(f"Matched prize: {matched_prize}")
        
        # Add matched prize to project data
        project['matched_prize'] = matched_prize
        
        # Save after each project in case of interruption
        with open("projects_data.json", "w", encoding='utf-8') as f:
            json.dump(projects, f, indent=2, ensure_ascii=False)
        
        # Rate limiting
        sleep(1)
    
    print("\nMatching complete! Updated projects_data.json")

if __name__ == "__main__":
    match_projects_to_prizes()

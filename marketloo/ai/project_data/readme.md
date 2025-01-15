# SCRAPERS FOR MARKETLOO

## HOW TO USE

There are several scrapers in this repo that are used to scrape data specific to a hackathon's Devpost page.

### `scraper.py`

This page is used to scrape the links to the projects for a hackathon.

### `tracks.py`

This script is used to scrape the prizes for a hackathon.

### `project_data_scraper.py`

This script is used to scrape the project data for a hackathon.

### `match_project_prize.py`

This script is used to match the project data with the prizes for a hackathon.

## HOW TO RUN

First scrape the links to the projects and prizes using `scraper.py` and `tracks.py`.

Then run `project_data_scraper.py` to get the project data.

Finally, run `match_project_prize.py` to match the project data with the prizes.

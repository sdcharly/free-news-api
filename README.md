# SearXNG News API

This project provides a customizable news API that uses SearXNG as its backend. It allows users to search for news articles with various filtering options.

## Features

- Search for news articles using custom queries
- Filter results by date, language, and region
- Sort results by relevance or date
- Include or exclude specific domains
- Fetch article summaries

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure the `config.yaml` file with your preferred settings
4. Start the server:
   ```
   npm start
   ```

## Usage

Send a POST request to `http://localhost:3000/api/news` with a JSON body containing your query and any optional parameters.

Example request body:

```json
{
  "query": "artificial intelligence",
  "sortBy": "date",
  "timeframe": "week",
  "language": "en",
  "region": "us",
  "count": 15,
  "includeSummary": true,
  "excludeDomains": ["example.com"],
  "includeDomains": ["techcrunch.com", "wired.com"]
}
```

## Configuration

Edit the `config.yaml` file to change default settings, allowed domains, and blocked domains.

## License

This project is licensed under the MIT License.

import express from 'express';
import axios from 'axios';
import yaml from 'js-yaml';
import fs from 'fs';
import moment from 'moment';
import cheerio from 'cheerio';

// Load configuration
let config;
try {
  config = yaml.load(fs.readFileSync('config.yaml', 'utf8'));
} catch (e) {
  console.error('Error loading config file:', e);
  process.exit(1);
}

const app = express();
const port = config.server.port || 3000;
const searxngUrl = config.searxng.url;

app.use(express.json());

const fetchSummary = async (url) => {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(response.data);
    const paragraphs = $('p').map((_, el) => $(el).text()).get();
    return paragraphs.slice(0, 2).join(' ').substring(0, 200) + '...';
  } catch (error) {
    console.error('Error fetching summary:', error);
    return 'Summary not available';
  }
};

app.post('/api/news', async (req, res) => {
  try {
    const {
      query,
      sortBy = config.api.default_settings.sort_by,
      timeframe = config.api.default_settings.timeframe,
      language = config.api.default_settings.language,
      region = config.api.default_settings.region,
      count = config.api.default_settings.count,
      includeSummary = config.api.default_settings.include_summary,
      excludeDomains = [],
      includeDomains = []
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const searchParams = {
      q: query,
      categories: 'news',
      format: 'json',
      time_range: timeframe,
      language: language,
      sort: sortBy,
      region: region,
      results: count
    };

    const finalExcludeDomains = [...config.api.blocked_domains, ...excludeDomains];
    if (finalExcludeDomains.length > 0) {
      searchParams.exclude_domains = finalExcludeDomains.join(',');
    }

    const finalIncludeDomains = includeDomains.length > 0 ? includeDomains : config.api.allowed_domains;
    if (finalIncludeDomains.length > 0) {
      searchParams.engines = finalIncludeDomains.join(',');
    }

    const searchResponse = await axios.get(`${searxngUrl}/search`, { params: searchParams, timeout: 10000 });

    const headlines = await Promise.all(
      searchResponse.data.results.slice(0, count).map(async result => {
        const headline = {
          title: result.title,
          link: result.url,
          source: result.engine,
          publishedDate: result.publishedDate ? moment(result.publishedDate).format('YYYY-MM-DD HH:mm:ss') : 'Unknown'
        };

        if (includeSummary) {
          headline.summary = await fetchSummary(result.url);
        }

        return headline;
      })
    );

    res.json({
      query,
      sortBy,
      timeframe,
      language,
      region,
      count,
      includeSummary,
      excludeDomains: finalExcludeDomains,
      includeDomains: finalIncludeDomains,
      totalResults: headlines.length,
      headlines
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching news headlines.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

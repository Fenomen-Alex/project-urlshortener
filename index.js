require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Storage for shortened URL mappings
const urlDatabase = {};
let urlCounter = 1;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to shorten URLs
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Check if the URL is valid
  const urlPattern = /^(https?:\/\/)(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/;
  if (!urlPattern.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Extract hostname and verify it using dns.lookup
  const url = new URL(originalUrl);
  dns.lookup(url.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Store the original URL and create a short URL
    const shortUrl = urlCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// Redirect from /api/shorturl/<short_url> to the original URL
app.get('/api/shorturl/:shorturl', (req, res) => {
  const shortUrl = req.params.shorturl;
  const originalUrl = urlDatabase[shortUrl];

  // Check if the original URL exists
  if (originalUrl) {
    return res.redirect(originalUrl);
  } else {
    return res.status(404).json({ error: 'Short URL not found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

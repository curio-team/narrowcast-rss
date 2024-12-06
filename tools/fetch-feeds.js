// Fetches the RSS feeds, such that we don't encounter CORS errors in the browser
// when fetching the original RSS feed.
import fs from 'fs';
import path from 'path';

import feeds from "../feeds.json" with { type: "json" };

feeds.forEach(async feed => {
    const response = await fetch(feed.url);
    const xml = await response.text();

    // Create the directory if it doesn't exist
    const directory = path.dirname(feed.localUrl);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }

    fs.writeFileSync(feed.localUrl, xml);
});

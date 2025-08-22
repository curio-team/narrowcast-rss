document.addEventListener('DOMContentLoaded', () => {
    const logoContainer = document.getElementById('logo');
    const logoTitleElement = logoContainer.querySelector('h2');
    const logoImageElement = logoContainer.querySelector('img');
    const feedContainer = document.getElementById('rss-feed');

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (err) {
            return false;
        }
    }

    function sanitizeHtml(html) {
        return html.replace(/<\/?[^>]+(>|$)/g, "");
    }

    async function fetchLastThreeRSSItems(feedUrl) {
        const response = await fetch(feedUrl);

        if (!response.ok)
            throw new Error('Failed to fetch RSS feed');

        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');

        if (xml.querySelector('parsererror')) {
            console.error('Parsing Error:', xml.querySelector('parsererror').textContent);
            return [];
        }

        const allNewsItems = Array.from(xml.querySelectorAll('item'));
        const lastThreeNewsItems = allNewsItems.slice(0, 3);
        const items = [];

        for (const item of lastThreeNewsItems) {
            const title = item.querySelector('title')?.textContent || 'No title';
            const link = item.querySelector('link')?.textContent || '#';
            const description = item.querySelector('description')?.textContent || 'No description';
            let image = item.querySelector('media\\:content, enclosure')?.getAttribute('url') || null;

            if (!image) {
                const mediaThumbnail = item.getElementsByTagNameNS('*', 'thumbnail')[0];

                if (mediaThumbnail) {
                    image = mediaThumbnail.getAttribute('url');
                }
            }

            // If we have an image and its not a valid url, set it to null
            // This is also to prevent injection
            if (image && !isValidUrl(image)) {
                image = null;
            }

            items.push({
                title,
                link,
                description,
                image,
            });
        }

        return items;
    }

    async function displayRSSItems(feed) {
        const items = await fetchLastThreeRSSItems(feed.url);

        if (items.length === 0) {
            feedContainer.textContent = 'No items to display.';
            return;
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'feed-item';

            let description = item.description;

            if (feed.replaceToFooter) {
                description = description.replace(feed.replaceToFooter, '');
            }

            if (feed.replace) {
                for (const [search, replace] of Object.entries(feed.replace)) {
                    description = description.replace(search, replace);
                }
            }

            const content = `
                <div class="content">
                    <h3></h3>
                    <p></p>
                </div>
            `;

            if (feed.noImages)
                itemElement.innerHTML = `${content}`;
            else {
                const imagePath = item.image || 'images/no-image.png';
                const image = `<img src="${imagePath}">`;

                itemElement.innerHTML = `${image}${content}`;
            }

            feedContainer.appendChild(itemElement);

            // Insert the title and description safely (no HTML) to prevent XSS
            itemElement.querySelector('h3').textContent = sanitizeHtml(item.title);
            itemElement.querySelector('p').textContent = sanitizeHtml(description);
        });

        if (!feed.replaceToFooter) {
            return;
        }

        const footer = document.createElement('footer');
        footer.textContent = feed.replaceToFooter;
        feedContainer.appendChild(footer);
    }

    /**
     * @returns {Object} The feed object based on the anchor in the URL
     */
    function getFeedFromAnchor(feeds) {
        let anchor = window.location.hash?.slice(1) || '';

        if (!anchor) {
            return feeds[0];
        }

        return feeds.find(feed => feed.title.toLowerCase() === anchor.toLowerCase());
    }

    // Load the feeds from the feeds.json file
    fetch('./feeds.json')
        .then(response => response.json())
        .then(feeds => {
            const feed = getFeedFromAnchor(feeds);

            if (feed.showTitle) {
                logoTitleElement.textContent = feed.title;
            } else {
                logoTitleElement.textContent = '';
            }

            logoImageElement.src = feed.logo;

            displayRSSItems(feed);
        });
});

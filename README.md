# Narrowcast RSS viewer

For our narrowcasting, this fetches RSS feeds and displays them on GitHub pages.

## Prefetching RSS

Some of our feeds (notably Tweakers) have no CORS setup to allow fetching from a different domain. To work around this, we use a GitHub action to fetch the feeds and store them in the `rss/` of this repository.

Every hour, the action runs and fetches the feeds, committing the changes to the repository. This way, we can fetch the feeds from the same domain.

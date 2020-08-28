const { readFile, writeFile } = require('fs').promises;
const { join } = require('path');
const got = require('got');
const randomEmoji = require('random-emoji');

const query = `
query tilPostCollection {
  tilPostCollection(limit: 10) {
    total
    items {
      title
      slug
    }
  }
}
`;

const { SPACE_ID, AUTH_TOKEN } = process.env;

async function fetchTilPosts() {
  const { body } = await got(
    `https://graphql.contentful.com/content/v1/spaces/${SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  try {
    const posts = JSON.parse(body).data.tilPostCollection.items;
    return posts;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

(async () => {
  const posts = await fetchTilPosts();

  const readme = await readFile(join(__dirname, 'README.md'), 'utf8');
  const contentfulDataRegex = /<!-- CONTENTFUL_START.*?CONTENTFUL_END -->/gs;

  const newReadme = readme.replace(
    contentfulDataRegex,
    `
<!-- CONTENTFUL_START -->
${posts
  .map(
    ({ title, slug }) => `
    - ${randomEmoji
      .random({ count: 3 })
      .map(({ character }) => character)
      .join('')} [${title}](https://www.stefanjudis.com/today-i-learned/${slug})
  `
  )
  .join('\n')}
<!-- CONTENTFUL_END -->
  `
  );

  await writeFile(join(__dirname, 'README.md'), newReadme, 'utf8');
  console.log(`You've written the readme`);
  console.log(newReadme);
})();

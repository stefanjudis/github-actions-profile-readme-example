const { readFile, writeFile } = require('fs').promises;
const got = require('got');

// use 'join' to include "/" or "\" in file paths depending on operating system
const { join } = require('path');
const README_PATH = join(__dirname, 'README.md');

const { SPACE_ID, AUTH_TOKEN } = process.env;

/**
 * Fetch data from Contentful and return GraphQL data
 *
 * @return  {Promise<Array>}  [return description]
 */
async function fetchTilPosts() {
  try {
    const { body } = await got(
      `https://graphql.contentful.com/content/v1/spaces/${SPACE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query tilPostCollection {
              tilPostCollection(limit: 10) {
                total
                items {
                  title
                  slug
                }
              }
            }`,
        }),
      }
    );

    const posts = JSON.parse(body).data.tilPostCollection.items;
    return posts;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Update and replace the Contentful placeholders
 * of the passed readme with some real API data
 *
 * @param   {string}  readme  String of read README.md
 *
 * @return  {Promise<string>}          Updated README.md
 */
async function getUpdatedReadme(readme) {
  const posts = await fetchTilPosts();
  const contentfulDataRegex = /<!-- CONTENTFUL_START.*?CONTENTFUL_END -->/gs;

  return readme.replace(
    contentfulDataRegex,
    [
      '<!-- CONTENTFUL_START -->',
      ...posts.map(
        ({ title, slug }) =>
          `- [${title}](https://www.stefanjudis.com/today-i-learned/${slug})`
      ),
      '<!-- CONTENTFUL_END -->',
    ].join('\n')
  );
}

/**
 * @return  {Promise}
 */
async function main() {
  // read README.md
  const readme = await readFile(README_PATH, 'utf8');

  // do something with the readme
  const updatedReadme = await getUpdatedReadme(readme);

  // write README.md
  await writeFile(README_PATH, updatedReadme, 'utf8');
  console.log(`New readme written!`);
  console.log(updatedReadme);
}

main();

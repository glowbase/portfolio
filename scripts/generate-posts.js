const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(__dirname, "..", "public", "posts");
const outputFile = path.join(postsDir, "posts.json");

function isDirectory(source) {
  return fs.existsSync(source) && fs.lstatSync(source).isDirectory();
}

function generatePostsIndex() {
  if (!fs.existsSync(postsDir)) {
    console.error(`Posts directory not found: ${postsDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(postsDir, { withFileTypes: true });

  const posts = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folderName = entry.name;
      const folderPath = path.join(postsDir, folderName);
      const markdownPath = path.join(folderPath, "post.md");

      if (!fs.existsSync(markdownPath)) {
        console.warn(`Skipping ${folderName}: no post.md found`);
        return null;
      }

      const rawMarkdown = fs.readFileSync(markdownPath, "utf8");
      const { data } = matter(rawMarkdown);

      const slug = data.slug || folderName;
      const cover = data.cover
        ? `/posts/${folderName}/${data.cover}`
        : null;

      return {
        title: data.title || folderName,
        slug,
        date: data.date || null,
        excerpt: data.excerpt || "",
        cover,
        tags: Array.isArray(data.tags) ? data.tags : [],
        markdown: `/posts/${folderName}/post.md`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });

  fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
  console.log(`Generated ${outputFile} with ${posts.length} posts.`);
}

generatePostsIndex();
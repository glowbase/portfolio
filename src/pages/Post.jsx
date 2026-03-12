import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractHeadings(markdown) {
  const lines = markdown.split("\n");

  return lines
    .map((line) => {
      const match = line.match(/^(##|###)\s+(.*)$/);
      if (!match) return null;

      const level = match[1].length;
      const text = match[2].trim();

      return {
        level,
        text,
        id: slugifyHeading(text),
      };
    })
    .filter(Boolean);
}

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      try {
        console.log("Current slug:", slug);

        const postsResponse = await fetch("/posts/posts.json");
        const posts = await postsResponse.json();

        console.log("Posts loaded:", posts);

        const found = posts.find((item) => item.slug === slug);

        console.log("Matched post:", found);

        if (!found) {
          setPost(null);
          setContent("");
          setLoading(false);
          return;
        }

        if (!found.markdown) {
          console.error("Post is missing markdown path:", found);
          setPost(null);
          setContent("");
          setLoading(false);
          return;
        }

        const markdownResponse = await fetch(found.markdown);
        const rawMarkdown = await markdownResponse.text();

        setPost(found);
        setContent(stripFrontmatter(rawMarkdown));
        setLoading(false);
      } catch (error) {
        console.error("Failed to load post:", error);
        setPost(null);
        setContent("");
        setLoading(false);
      }
    }

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeHeading, setActiveHeading] = useState(null);

  useEffect(() => {
    if (!headings.length) return;

    const observers = [];

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveHeading(heading.id);
          }
        },
        {
          rootMargin: "-40% 0px -55% 0px",
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [headings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] px-6 py-24 text-[#8892b0]">
        <div className="mx-auto max-w-5xl">
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a192f] px-6 py-24 text-[#8892b0]">
        <div className="mx-auto max-w-5xl">
          <nav className="mb-10 font-mono text-sm text-[#8892b0]">
            <Link to="/" className="transition hover:text-[#f59e0b]">
              Home
            </Link>
            <span className="mx-2 text-[#5f6b86]">/</span>
            <Link to="/blog" className="transition hover:text-[#f59e0b]">
              Blog
            </Link>
          </nav>

          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[#ccd6f6] sm:text-[48px]">
            Post not found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a192f] px-6 py-24 text-[#8892b0]">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 font-mono text-sm text-[#8892b0]">
          <Link to="/" className="transition hover:text-[#f59e0b]">
            Home
          </Link>
          <span className="mx-2 text-[#5f6b86]">/</span>
          <Link to="/blog" className="transition hover:text-[#f59e0b]">
            Blog
          </Link>
          <span className="mx-2 text-[#5f6b86]">/</span>
          <span className="text-[#f59e0b]">
            {post.title}
          </span>
        </nav>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="min-w-0">
            <p className="font-mono text-sm tracking-[0.14em] text-[#f59e0b]">
              {post.date}
            </p>

            <h1 className="mt-4 text-[56px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#ccd6f6] sm:text-[72px] md:text-[80px]">
              {post.title}
            </h1>

            {post.tags?.length ? (
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-[#a8b2d1]">
                {post.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}

            {post.excerpt && (
              <p className="mt-6 max-w-3xl leading-9 text-[#8892b0]">
                {post.excerpt}
              </p>
            )}

            {/* {post.cover ? (
              <div className="mt-10 overflow-hidden rounded-xl ring-1 ring-[#233554]">
                <img
                  src={post.cover}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null} */}

            <div className="mt-12 prose prose-invert max-w-none prose-p:text-[20px] prose-p:leading-8 prose-headings:text-[#ccd6f6] prose-strong:text-[#ccd6f6] prose-a:text-[#f59e0b] prose-li:text-[#8892b0] prose-code:text-[#f59e0b] prose-pre:bg-[#112240] prose-blockquote:border-[#f59e0b]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => {
                    const text = String(children).trim();
                    const id = slugifyHeading(text);

                    return (
                      <h2
                        id={id}
                        className="scroll-mt-24 mt-16 text-[34px] font-semibold tracking-[-0.02em] text-[#ccd6f6]"
                      >
                        <span className="mr-3 font-mono text-[#f59e0b]">#</span>
                        {children}
                      </h2>
                    );
                  },

                  h3: ({ children }) => {
                    const text = String(children).trim();
                    const id = slugifyHeading(text);

                    return (
                      <h3
                        id={id}
                        className="scroll-mt-24 mt-12 text-[26px] font-semibold text-[#ccd6f6]"
                      >
                        <span className="mr-3 font-mono text-[#f59e0b]">##</span>
                        {children}
                      </h3>
                    );
                  },

                  p: ({ children }) => (
                    <p className="text-[20px] leading-9 text-[#8892b0]">
                      {children}
                    </p>
                  ),

                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");

                    if (!inline && match) {
                      return (
                        <div className="my-8 mt-2 overflow-hidden rounded-xl bg-[#112240] ring-1 ring-[#233554] shadow-lg shadow-[#020c1b]/40">
                          <SyntaxHighlighter
                            language={match[1]}
                            style={oneDark}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: "18px",
                              background: "#112240",
                              fontSize: "14px",
                              borderRadius: 0,
                            }}
                            codeTagProps={{
                              style: {
                                background: "transparent",
                              },
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    return (
                      <code className="rounded bg-[#112240] px-1.5 py-1 text-[15px] text-[#f59e0b]">
                        {children}
                      </code>
                    );
                  },

                  ul: ({ children }) => (
                    <ul className="mt-6 list-disc space-y-2 pl-6 text-[20px] leading-9 text-[#8892b0]">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="mt-6 list-decimal space-y-2 pl-6 text-[20px] leading-9 text-[#8892b0]">
                      {children}
                    </ol>
                  ),

                  blockquote: ({ children }) => (
                    <blockquote className="my-8 border-l-4 border-[#f59e0b] pl-6 italic text-[#a8b2d1]">
                      {children}
                    </blockquote>
                  ),

                  table: ({ children }) => (
                    <div className="my-10 overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        {children}
                      </table>
                    </div>
                  ),

                  th: ({ children }) => (
                    <th className="border-b border-[#233554] py-3 text-[#ccd6f6]">
                      {children}
                    </th>
                  ),

                  td: ({ children }) => (
                    <td className="border-b border-[#233554] py-3 text-[#8892b0]">
                      {children}
                    </td>
                  ),

                  img: ({ src, alt }) => {
                    const resolvedSrc =
                      src && src.startsWith("./")
                        ? `/posts/${slug}/${src.replace("./", "")}`
                        : src;

                    return (
                      <img
                        src={resolvedSrc}
                        alt={alt || ""}
                        className="my-4 rounded-lg"
                      />
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-[#233554] bg-[#112240] p-5">
              <p className="font-mono text-sm tracking-[0.14em] text-[#f59e0b]">
                Table of Contents
              </p>

              {headings.length ? (
                <ul className="mt-4 space-y-3">
                  {headings.map((heading) => (
                    <li
                      key={heading.id}
                      className={heading.level === 3 ? "ml-4" : ""}
                    >
                      <a
                        href={`#${heading.id}`}
                        className={`text-[15px] leading-6 transition ${
                          activeHeading === heading.id
                            ? "text-[#f59e0b]"
                            : "text-[#a8b2d1] hover:text-[#f59e0b]"
                        }`}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[#8892b0]">
                  No section headings found.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
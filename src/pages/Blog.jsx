import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/posts/posts.json")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a192f] px-6 py-24 text-[#8892b0]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 pt-6">
          <nav className="font-mono text-sm text-[#8892b0]">
            <Link to="/" className="transition hover:text-[#f59e0b]">
              Home
            </Link>
            <span className="mx-2 text-[#5f6b86]">/</span>
            <span className="text-[#f59e0b]">Blog</span>
          </nav>
        </div>

        <p className="font-mono text-sm tracking-[0.14em] text-[#f59e0b]">
          
        </p>

        <h1 className="mt-4 text-5xl font-semibold text-[#ccd6f6]">
          Blog
        </h1>

        <p className="mt-6 max-w-2xl text-[20px] leading-8 text-[#8892b0]">
          Notes, writeups, and thoughts on security operations, homelab projects,
          detection engineering and lots of Hack the Box.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded bg-[#112240] shadow-lg shadow-[#020c1b]/30 ring-1 ring-[#233554] transition duration-200 hover:-translate-y-2"
            >

              {/* cover image */}
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.cover}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">

                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm text-[#f59e0b]">
                    {post.date}
                  </p>

                  <ArrowUpRight
                    size={18}
                    className="text-[#ccd6f6] transition group-hover:text-[#f59e0b]"
                  />
                </div>

                <h2 className="mt-3 text-xl font-semibold text-[#ccd6f6] transition group-hover:text-[#f59e0b]">
                  {post.title}
                </h2>

                <p className="mt-4 flex-1 text-[20px] leading-8 text-[#8892b0] line-clamp-3">
                    {post.excerpt}
                </p>

                {/* tags */}
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-[#a8b2d1]">
                  {post.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
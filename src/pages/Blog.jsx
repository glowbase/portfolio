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
    <div className="min-h-screen px-6 py-24 text-[#b3b6b7]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 pt-6">
          <nav className="font-mono text-sm text-[#b3b6b7]">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <span className="mx-2 text-[#525759]">/</span>
            <span className="text-white">Blog</span>
          </nav>
        </div>

        <h1 className="mt-4 text-[44px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[60px] md:text-[72px]">
          Blog
        </h1>

        <p className="mt-6 max-w-2xl text-[20px] leading-8 text-[#b3b6b7]">
          Mostly working notes I keep while breaking into things and building others. You'll find my Hack the Box writeups, the homelab I use to learn on, and the occasional hardware project — documenting what worked and what didn't. Expect plenty of Active Directory, privilege escalation, and detection engineering.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[15px] bg-white/[0.02] ring-1 ring-white/[0.07] backdrop-blur-sm transition duration-200 hover:-translate-y-2 hover:bg-white/[0.04] hover:ring-white/15"
            >

              {/* cover image */}
              <div className="aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,_rgba(255,138,0,0.12),_rgba(19,21,21,0.92))]">
                {post.cover && (
                  <img
                    src={post.cover}
                    alt={post.title}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">

                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm text-[#ff8a00]">
                    {post.date}
                  </p>

                  <ArrowUpRight
                    size={18}
                    className="text-white transition group-hover:text-[#ff8a00]"
                  />
                </div>

                <h2 className="mt-3 text-xl font-semibold text-white transition group-hover:text-[#ff8a00]">
                  {post.title}
                </h2>

                <p className="mt-4 flex-1 text-[20px] leading-8 text-[#b3b6b7] line-clamp-3">
                    {post.excerpt}
                </p>

                {/* tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-[#cfd4d4] ring-1 ring-white/10"
                    >
                      {tag}
                    </span>
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
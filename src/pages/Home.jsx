import {
  Github,
  Linkedin,
  ExternalLink,
  Folder,
  ArrowUpRight,
  Menu,
  Box,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const socialItems = [
    { icon: Github, href: "https://github.com/glowbase", label: "GitHub" },
    // { icon: Linkedin, href: "https://www.linkedin.com/in/cooperbeltrami", label: "LinkedIn" },
    { icon: Box, href: "https://app.hackthebox.com/public/users/200316", label: "HackTheBox" },
  ];

  const jobs = [
    {
      company: "Australian Government",
      title: "Detection Engineering & Uplift",
      period: "2022 — Present",
      points: [
        "Lead initiatives to uplift detection maturity, focusing on coverage, quality, and operational efficiency.",
        "Identify gaps in visibility and implement improvements across telemetry, detections, and processes.",
        "Drive continuous improvement of detection engineering practices through tuning, validation, and optimisation.",
        "Collaborate across teams to enhance security tooling, infrastructure, and overall defensive capability."
      ],
    },
    {
      company: "Australian Government",
      title: "Assistant Technical Lead",
      period: "2025 — 2026",
      points: [
        "Support MDR teams in coordinating and leading complex incident investigations.",
        "Provide technical guidance to analysts during security event triage, threat analysis, and incident response within a large and complex operational environment.",
        "Drive improvements in detection engineering, refining and tuning detection logic to enhance threat visibility and response capability.",
        "Contribute to the design and engineering of infrastructure improvements that strengthen organisational security posture and operational resilience."
      ],
    },
    {
      company: "Australian Government",
      title: "Cyber Analyst",
      period: "2022 — 2025",
      points: [
        "Conducted cyber threat monitoring, analysis, and incident response across Defence networks and systems.",
        "Investigated security events and vulnerabilities to identify risks and support cyber defence operations.",
        "Utilised cyber security tools and intelligence to detect, assess, and respond to malicious activity."
      ],
    },
    {
      company: "Australian Government",
      title: "Cyber Security & Robotics Program",
      period: "Jun 2019",
      points: [
        "Developed skills in cyber threat detection, including identifying system intrusions, monitoring network traffic for exploits, and detecting email compromise incidents.",
        "Performed digital forensics and investigation, including hard drive forensic examination and analysis of compromised systems.",
        "Studied cryptography and data protection, including modern encryption methods, key recovery, and encryption/decryption using open-source tooling.",
        "Applied technical problem-solving across security and engineering, including geospatial imagery analysis, hardware/software security solutions, and robotics programming with Arduino circuits."
      ],
    },
    {
      company: "Shearwater Solutions",
      title: "Penetration Testing Internship",
      period: "Nov 2018",
      points: [
        "Learned and applied the core fundamentals of penetration testing, including reconnaissance, exploitation, and post-exploitation techniques.",
        "Conducted network infrastructure scanning and intrusion assessments using industry-standard tools.",
        "Gained hands-on experience in web application security testing, including vulnerability discovery and validation."
      ],
    },
  ];

  const featuredProjects = [
    {
      overline: "Featured Project",
      title: "Decider-v2",
      description:
        "A threat intelligence platform that maps adversary behaviour to MITRE ATT&CK techniques and correlates them with ISM and NIST controls to help defenders identify effective remediations and make informed security decisions.",
      tech: ["Python", "ISM", "Jinja", "Docker", "NIST"],
      github: "https://github.com/glowbase/decider-v2"
    },
  ];

  const otherProjects = [
    {
      title: "Nix DFIR",
      description: "Perform post-mortem Linux baselining and forensic analysis.",
      tech: ["Unix", "Forensics", "DFIR"],
      github: "https://github.com/glowbase/nix_dfir"
    },
    {
      title: "Net DFIR",
      description: "Perform artifact driven analysis on network captures.",
      tech: ["PCAP", "DFIR", "Incident Response"],
      github: "https://github.com/glowbase/net_dfir"
    },
    {
      title: "Strapi CMS Exploit",
      description: "This exploit targets two vulnerabilities in the Strapi CMS Framework version 3.0.0-beta-17.4 allowing for unauthenticated remote code execution (RCE).",
      tech: ["CVE-2019-18818", "CVE-2019-19609"],
      github: "https://github.com/glowbase/CVE-2019-19609"
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#8892b0] antialiased selection:bg-[#f59e0b]/30 selection:text-[#ccd6f6]">
      <style>{`
        html { scroll-behavior: smooth; }
        body { background: #0a192f; }
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(100,255,218,0.08),_transparent_28%),linear-gradient(to_bottom,_#0a192f,_#0a192f)]" />

      <header className="fixed top-0 z-50 w-full bg-[#0a192f]/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10 lg:px-12">
        <Link
          to="/"
          className="group flex h-11 w-11 items-center justify-center rounded-md border border-[#f59e0b] text-[#f59e0b] transition hover:bg-[#f59e0b]/10"
          aria-label="Home"
        >
          <div className="h-6 w-6 border-2 border-current [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0%_50%)]" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
            <a
                href="/#about"
                className="font-mono text-sm text-[#ccd6f6] transition hover:text-[#f59e0b]"
            >
                <span className="mr-1 text-[#f59e0b]">01.</span>
                About
            </a>

            <a
                href="/#experience"
                className="font-mono text-sm text-[#ccd6f6] transition hover:text-[#f59e0b]"
            >
                <span className="mr-1 text-[#f59e0b]">02.</span>
                Experience
            </a>

            <a
                href="/#projects"
                className="font-mono text-sm text-[#ccd6f6] transition hover:text-[#f59e0b]"
            >
                <span className="mr-1 text-[#f59e0b]">03.</span>
                Projects
            </a>

            <Link
              to="/blog"
              className="rounded border border-[#f59e0b] px-4 py-2 font-mono text-sm text-[#f59e0b] transition hover:-translate-y-0.5 hover:bg-[#f59e0b]/10"
              >
              Blog
            </Link>
        </nav>

        <button
          className="rounded-md p-2 text-[#f59e0b] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          <Menu size={28} />
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-800 bg-[#112240] px-6 py-6 md:hidden">
          <div className="flex flex-col items-start gap-4">
            <div className="flex flex-col items-start gap-4">
                <a
                    href="/#about"
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-sm text-[#ccd6f6]"
                >
                    <span className="mr-2 text-[#f59e0b]">01.</span>
                    About
                </a>

                <a
                    href="/#experience"
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-sm text-[#ccd6f6]"
                >
                    <span className="mr-2 text-[#f59e0b]">02.</span>
                    Experience
                </a>

                <a
                    href="/#projects"
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-sm text-[#ccd6f6]"
                >
                    <span className="mr-2 text-[#f59e0b]">03.</span>
                    Projects
                </a>

                <Link
                  to="/blog"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 rounded border border-[#f59e0b] px-4 py-2 font-mono text-sm text-[#f59e0b]"
                  >
                  Blog
                </Link>
            </div>
          </div>
        </div>
      )}
    </header>

      <aside className="fixed bottom-0 left-8 hidden lg:block">
        <div className="flex flex-col items-center gap-5">
          {socialItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                target="_blank"
                rel="noreferrer"
                className="translate-y-0 text-[#a8b2d1] transition duration-200 hover:-translate-y-1 hover:text-[#f59e0b]"
              >
                <Icon size={20} strokeWidth={1.8} />
              </a>
            );
          })}
          <div className="mt-2 h-24 w-px bg-[#a8b2d1]" />
        </div>
      </aside>

      {/* <aside className="fixed bottom-0 right-8 hidden lg:block">
        <div className="flex flex-col items-center gap-6">
          <a
            href="mailto:mail@cooperbeltra.me"
            className="font-mono text-sm tracking-[0.18em] text-[#a8b2d1] [writing-mode:vertical-rl] transition hover:-translate-y-1 hover:text-[#f59e0b]"
          >
            mail@cooperbeltra.me
          </a>
          <div className="h-24 w-px bg-[#a8b2d1]" />
        </div>
      </aside> */}

      <main className="mx-auto max-w-6xl px-6 pt-28 md:px-12 lg:px-24">
        <section id="hero" className="flex min-h-screen items-start pt-32 lg:pt-60">
          <div className="max-w-3xl">
            <p className="mb-5 font-mono text-[14px] tracking-[0.15em] text-[#f59e0b] md:text-[15px]">Hi, my name is</p>
            <h1 className="font-sans text-[56px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#e8d9b5] sm:text-[72px] md:text-[80px]">
              Cooper.
            </h1>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#9aa0a6] sm:text-6xl md:text-7xl">
              I build and defend stuff.
            </h2>
            <p className="mt-6 max-w-xl leading-8 text-[#8b95a7]">
              I&apos;m a senior cyber security analyst focused on large scale monitoring and detection,
              coordinating incident response within one of Australia's largest networks.
            </p>
            <Link
              to="/blog"
              className="mt-10 inline-block rounded border border-[#f59e0b] px-7 py-4 font-mono text-sm text-[#f59e0b] transition hover:-translate-y-0.5 hover:bg-[#f59e0b]/10"
            >
              Check out my blog!
            </Link>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-4xl scroll-mt-28 py-24">
          <SectionHeading number="01." title="About Me" />
          <div className="mt-10 grid gap-12 md:grid-cols-[3fr_2fr] md:items-start">
            <div className="space-y-4 text-base leading-8 text-[#8892b0]">
              <p>
                Hello! I'm a senior cyber security analyst focused on large scale monitoring and detection, coordinating incident response within one of Australia's largest networks.

                I enjoy understanding how systems work and how they break. My work spans cyber operations, detection engineering, infrastructure, and building tooling to improve security operations.
              </p>

              <p>
                Outside of work I run a homelab where I experiment with identity systems, networking, and security tooling, using it as a space to test ideas and build practical solutions.
              </p>
              <p>
                Here are some certifications and training I've done:
              </p>
              <div className="grid max-w-md grid-cols-2 gap-x-8 gap-y-2 pt-2 font-mono text-sm text-[#8892b0]">
                {[
                  "VMware VCTA-DCV",
                  "INE eJPT",
                  "Microsoft AZ-900",
                  "Microsoft SC-900",
                  "CQURE Malware Analysis",
                  "OffSec PEN-200",
                  "Splunk Detection Engineering"
                ].map((tech) => (
                  <div key={tech} className="flex items-center gap-2">
                    <span className="text-[#f59e0b]">▹</span>
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-xs">
              <div className="group relative">
                <div className="absolute inset-0 translate-x-4 translate-y-4 rounded bg-[#f59e0b]/20 transition duration-300 group-hover:translate-x-3 group-hover:translate-y-3" />
                <div className="relative rounded bg-[#112240] p-2">
                  <div className="aspect-[4/5] rounded bg-[linear-gradient(135deg,_rgba(100,255,218,0.25),_rgba(17,34,64,0.65))] ring-1 ring-[#233554]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="mx-auto max-w-4xl scroll-mt-28 py-24">
          <SectionHeading number="02." title="Where I’ve Worked" />

          <div className="mt-12 relative border-l border-[#233554] pl-8 md:pl-10">
            {jobs.map((job) => (
              <div key={job.company} className="relative mb-12 last:mb-0">

                {/* timeline dot */}
                <span className="absolute -left-[42px] top-6 h-5 w-5 rounded-full border-4 border-[#0a192f] bg-[#f59e0b] md:-left-[50px]" />

                <div className="rounded bg-[#112240]/70 p-6 shadow-lg shadow-[#020c1b]/30 ring-1 ring-[#233554] transition hover:-translate-y-1">

                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <h3 className="text-xl font-semibold text-[#ccd6f6]">
                      {job.title} <span className="text-[#f59e0b]">@ {job.company}</span>
                    </h3>

                    <p className="font-mono text-sm text-[#8892b0]">
                      {job.period}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-3 text-[20px] text-[#8892b0]">
                    {job.points.map((point) => (
                      <li key={point} className="flex gap-3 leading-7">
                        <span className="mt-2 text-xs text-[#f59e0b]">▹</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="scroll-mt-28 py-24">
          <SectionHeading number="03." title="Some Things I’ve Built" />
          <div className="mt-12 space-y-24">
            {featuredProjects.map((project) => (
              <div
                key={project.title}
                className={`grid items-center gap-8 lg:grid-cols-12 ${project.reverse ? "" : ""}`}
              >
                <div className={`lg:col-span-7 ${project.reverse ? "lg:order-2" : ""}`}>
                  <div className="group relative overflow-hidden rounded bg-[#112240] ring-1 ring-[#233554]">
                    <div className="aspect-[16/9] bg-[linear-gradient(135deg,_rgba(100,255,218,0.14),_rgba(17,34,64,0.92))] transition duration-300 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-[#f59e0b]/10 mix-blend-screen transition group-hover:bg-transparent" />
                  </div>
                </div>

                <div className={`lg:col-span-5 ${project.reverse ? "lg:order-1 lg:text-left" : "lg:text-right"}`}>
                  <p className="font-mono text-sm text-[#f59e0b]">{project.overline}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#ccd6f6]">{project.title}</h3>
                  <div className="mt-5 rounded bg-[#112240] p-6 text-[#8892b0] shadow-xl shadow-[#020c1b]/30 ring-1 ring-[#233554]">
                    <p className="leading-7">{project.description}</p>
                  </div>
                  <div className={`mt-4 flex flex-wrap gap-4 font-mono text-sm text-[#a8b2d1] ${project.reverse ? "lg:justify-start" : "lg:justify-end"}`}>
                    {project.tech.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <div className={`mt-5 flex gap-4 ${project.reverse ? "lg:justify-start" : "lg:justify-end"}`}>
                    {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:text-[#f59e0b]"
                        >
                          <Github size={20} />
                        </a>
                      )}

                      {project.external && (
                        <a
                          href={project.external}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:text-[#f59e0b]"
                        >
                          <ArrowUpRight size={20} />
                        </a>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="font-mono text-sm text-[#f59e0b]">Other Noteworthy Projects</h2>
            <p className="mt-3 text-[#8892b0]">Smaller things I've built and tinkered with.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {otherProjects.map((project) => (
                <article
                  key={project.title}
                  className="group flex min-h-[280px] flex-col rounded bg-[#112240] p-6 text-left shadow-lg shadow-[#020c1b]/30 ring-1 ring-[#233554] transition duration-200 hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Folder className="text-[#f59e0b]" size={34} strokeWidth={1.8} />
                    <div className="flex items-center gap-3 text-[#ccd6f6]">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:text-[#f59e0b]"
                        >
                          <Github size={18} />
                        </a>
                      )}

                      {project.external && (
                        <a
                          href={project.external}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:text-[#f59e0b]"
                        >
                          <ArrowUpRight size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold text-[#ccd6f6] transition group-hover:text-[#f59e0b]">
                    {project.title}
                  </h3>
                  <p className="mt-4 flex-1 leading-7 text-[#8892b0]">{project.description}</p>
                  <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-[#a8b2d1]">
                    {project.tech.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="pb-10 pt-6 text-center font-mono text-xs text-[#8892b0] lg:hidden">
          <div className="mb-6 flex items-center justify-center gap-5 text-[#a8b2d1]">
            {socialItems.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
          <p>Built by Cooper</p>
        </footer>
      </main>
    </div>
  );
}

function SectionHeading({ number, title }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="whitespace-nowrap font-sans text-2xl font-bold text-[#ccd6f6] sm:text-[32px]">
        <span className="mr-2 font-mono text-lg font-normal text-[#f59e0b]">{number}</span>
        {title}
      </h2>
      <div className="h-px w-full max-w-xs bg-[#233554]" />
    </div>
  );
}

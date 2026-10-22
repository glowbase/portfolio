import {
  Github,
  Folder,
  Menu,
  Box,
  BadgeCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const socialItems = [
    { icon: Github, href: "https://github.com/glowbase", label: "GitHub" },
    { icon: Box, href: "https://app.hackthebox.com/public/users/200316", label: "HackTheBox" },
  ];

  const jobs = [
    {
      company: "Australian Government",
      title: "Threat Emulation Operator",
      period: "Upcoming",
      points: [
        "Develop and execute realistic threat emulation scenarios to assess and improve security posture.",
        "Collaborate with various teams to design and implement attack simulations, leveraging the threat intelligence.",
        "Provide actionable insights and recommendations to improve defensive capabilities and incident response strategies.",
        "Contribute to the development of training programs and exercises to enhance the skills of security personnel in detecting and mitigating sophisticated threats."
      ],
    },
    {
      company: "Australian Government",
      title: "Capability Uplift & Detection Engineering",
      period: "Apr 2026 — Present",
      points: [
        "Lead initiatives to uplift detection maturity, focusing on coverage, quality, and operational efficiency.",
        "Identify gaps in visibility and implement improvements across telemetry, detections, and processes.",
        "Drive continuous improvement of detection engineering practices through tuning, validation, and optimisation.",
        "Collaborate across teams to enhance security tooling, infrastructure, and overall defensive capability."
      ],
    },
    {
      company: "Australian Government",
      title: "Technical Lead",
      period: "Apr 2025 — Apr 2026",
      points: [
        "Support MDR teams in coordinating and leading complex incident investigations.",
        "Provide technical guidance to analysts during security event triage, threat analysis, and incident response within a large and complex operational environment.",
        "Drive improvements in detection engineering, refining and tuning detection logic to enhance threat visibility and response capability.",
        "Contribute to the design and engineering of infrastructure improvements that strengthen organisational security posture and operational resilience."
      ],
    },
    {
      company: "Australian Government",
      title: "Cyber Security Analyst",
      period: "Aug 2022 — Apr 2025",
      points: [
        "Conducted cyber threat monitoring, analysis, and incident response across Defence networks and systems.",
        "Investigated security events and vulnerabilities to identify risks and support Defence Cyber Operations.",
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

  const certifications = [
    { issuer: "OffSec", name: "Offensive Security Certified Professional" },
    { issuer: "INE", name: "eLearnSecurity Junior Penetration Tester" },
    { issuer: "Splunk", name: "Detection Engineering & Threat Hunting"},
    { issuer: "CQURE", name: "Malware Analysis & Persistence" },
    { issuer: "VMware", name: "VMware Certified Technical Associate - DCV" },
    { issuer: "Microsoft", name: "Microsoft Azure Fundamentals (AZ-900)" },
    { issuer: "Microsoft", name: "Microsoft Azure Security, Compliance, and Identity (SC-900)" },
    { issuer: "Google", name: "Google Cloud Architecture, Engineering & Security" },
  ];

  const projects = [
    {
      title: "Decider-v2",
      description:
        "A threat intelligence platform that maps adversary behaviour to MITRE ATT&CK techniques and correlates them with ISM and NIST controls to help defenders identify effective remediations.",
      tech: ["MITRE ATT&CK", "ISM", "NIST", "Threat Intel"],
      github: "https://github.com/glowbase/decider-v2"
    },
    {
      title: "FIN7 Threat Hunt",
      description: "A threat hunt walking through the malicious documents used by the FIN7 group, breaking down the indicators and techniques observed along the way.",
      tech: ["Threat Hunting", "DFIR", "Python"],
      github: "https://github.com/glowbase/fin7-threat-hunt"
    },
    {
      title: "Nix DFIR",
      description: "A toolkit for post-mortem Linux baselining and forensic analysis of potentially compromised hosts.",
      tech: ["Linux", "Forensics", "DFIR"],
      github: "https://github.com/glowbase/nix_dfir"
    },
    {
      title: "Net DFIR",
      description: "Artifact-driven analysis of network captures to surface suspicious activity during an investigation.",
      tech: ["PCAP", "Network", "DFIR"],
      github: "https://github.com/glowbase/net_dfir"
    },
    {
      title: "AD Abuse Notes",
      description: "A collection of practical notes for enumerating, exploiting and abusing Active Directory environments.",
      tech: ["Active Directory", "Exploitation", "Pentest"],
      github: "https://github.com/glowbase/active-directory-abuse-notes"
    },
    {
      title: "Strapi CMS Exploit",
      description: "An exploit for two vulnerabilities in Strapi CMS 3.0.0-beta.17.4, chained for unauthenticated remote code execution.",
      tech: ["CVE-2019-18818", "CVE-2019-19609", "RCE"],
      github: "https://github.com/glowbase/CVE-2019-19609"
    },
    {
      title: "myRCH",
      description: "An iOS app for families using the Royal Children's Hospital Melbourne's My RCH portal, built with SwiftUI.",
      tech: ["Swift", "SwiftUI", "iOS"],
      github: "https://github.com/glowbase/myRCH"
    },
  ];

  return (
    <div className="min-h-screen text-[#b3b6b7] antialiased selection:bg-[#ff8a00]/30 selection:text-white">
      <header className="fixed top-0 z-50 w-full bg-transparent">
      <div className="mx-auto flex max-w-[1600px] items-center justify-end px-6 py-5 md:px-10 lg:px-12">
        <nav className="hidden items-center gap-8 md:flex">
            <a
                href="/#experience"
                className="font-mono text-sm text-[#b3b6b7] transition hover:text-white"
            >
                <span className="mr-1 text-[#ff8a00]">01.</span>
                Experience
            </a>

            <a
                href="/#certifications"
                className="font-mono text-sm text-[#b3b6b7] transition hover:text-white"
            >
                <span className="mr-1 text-[#ff8a00]">02.</span>
                Certifications
            </a>

            <a
                href="/#projects"
                className="font-mono text-sm text-[#b3b6b7] transition hover:text-white"
            >
                <span className="mr-1 text-[#ff8a00]">03.</span>
                Projects
            </a>

            <Link
              to="/blog"
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-[#cfd4d4]"
              >
              Blog
            </Link>
        </nav>

        <button
          className="rounded-md p-2 text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          <Menu size={28} />
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#02060a]/90 px-6 py-6 backdrop-blur-md md:hidden">
          <div className="flex flex-col items-start gap-4">
            <div className="flex flex-col items-start gap-4">
                <a
                    href="/#experience"
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-sm text-[#b3b6b7]"
                >
                    <span className="mr-2 text-[#ff8a00]">01.</span>
                    Experience
                </a>

                <a
                    href="/#certifications"
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-sm text-[#b3b6b7]"
                >
                    <span className="mr-2 text-[#ff8a00]">02.</span>
                    Certifications
                </a>

                <a
                    href="/#projects"
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-sm text-[#b3b6b7]"
                >
                    <span className="mr-2 text-[#ff8a00]">03.</span>
                    Projects
                </a>

                <Link
                  to="/blog"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black"
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
                className="translate-y-0 text-[#cfd4d4] transition duration-200 hover:-translate-y-1 hover:text-white"
              >
                <Icon size={20} strokeWidth={1.8} />
              </a>
            );
          })}
          <div className="mt-2 h-24 w-px bg-[#cfd4d4]" />
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-6 pt-28 md:px-12 lg:px-24">
        <section id="hero" className="flex min-h-screen items-start pt-32 lg:pt-60">
          <div className="max-w-3xl">
            <p className="mb-5 font-mono text-[14px] tracking-[0.15em] text-[#ff8a00] md:text-[15px]">Hi, my name is</p>
            <h1 className="font-sans text-[56px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[72px] md:text-[80px]">
              Cooper.
            </h1>
            <p className="mt-6 max-w-xl leading-8 text-[#b3b6b7]">
              I&apos;m a senior cyber security analyst focused on large scale monitoring and detection,
              coordinating incident response within one of Australia's largest networks.
            </p>
            <div className="mt-8 font-mono text-sm text-[#cfd4d4] sm:text-[15px]">
              <span className="text-[#ff8a00]">cooper@homelab</span>
              <span className="text-[#6e7578]">:~$</span>{" "}
              <TypeCycle
                phrases={[
                  "reading documentation",
                  "frying electronics",
                  "blaming DNS",
                  "googling error messages",
                  "waiting for nmap to finish",
                  "turning it off and on again",
                  "patching on a Friday",
                  "hunting adversaries",
                ]}
              />
            </div>
            <Link
              to="/blog"
              className="mt-10 inline-block rounded-full bg-white px-7 py-3.5 text-base font-medium text-black transition hover:bg-[#cfd4d4]"
            >
              Check out my blog!
            </Link>
          </div>
        </section>

        <section id="experience" className="mx-auto max-w-4xl scroll-mt-28 py-24">
          <SectionHeading title="Experience" />

          <div className="mt-12 relative border-l border-white/10 pl-8 md:pl-10">
            {jobs.map((job) => (
              <div key={job.title} className="relative mb-16 last:mb-0">

                {/* timeline dot */}
                <span className="absolute -left-[42px] top-1.5 h-5 w-5 rounded-full border-4 border-[#02060a] bg-[#ff8a00] md:-left-[50px]" />

                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                  <div>
                    <h3 className="text-2xl font-semibold text-white md:text-[28px]">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-lg text-[#ff8a00]">{job.company}</p>
                  </div>

                  <p className="font-mono text-sm text-[#b3b6b7] md:mt-2.5">
                    {job.period}
                  </p>
                </div>

                <ul className="mt-5 space-y-3 text-[20px] text-[#b3b6b7]">
                  {job.points.map((point) => (
                    <li key={point} className="flex gap-3 leading-7">
                      <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6e7578]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="certifications" className="mx-auto max-w-4xl scroll-mt-28 py-24">
          <SectionHeading title="Certifications" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="flex items-start gap-4 rounded-[15px] bg-white/[0.02] p-5 ring-1 ring-white/[0.07] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.04] hover:ring-white/15"
              >
                <BadgeCheck className="mt-0.5 shrink-0 text-[#ff8a00]" size={22} strokeWidth={1.8} />
                <div>
                  <p className="font-mono text-xs text-[#6e7578]">{cert.issuer}</p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug text-white">{cert.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="scroll-mt-28 py-24">
          <SectionHeading title="Projects" />
          <p className="mt-6 text-[#b3b6b7]">
            A mix of security tooling, DFIR projects and things I&apos;ve built along the way. More on my{" "}
            <a
              href="https://github.com/glowbase"
              target="_blank"
              rel="noreferrer"
              className="text-[#ff8a00] underline-offset-4 hover:underline"
            >
              GitHub
            </a>
            .
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.title}
                className="group flex h-[300px] flex-col rounded-[15px] bg-white/[0.02] p-6 text-left ring-1 ring-white/[0.07] backdrop-blur-sm transition duration-200 hover:-translate-y-2 hover:bg-white/[0.04] hover:ring-white/15"
              >
                <Folder className="text-[#ff8a00]" size={34} strokeWidth={1.8} />
                <h3 className="mt-6 text-xl font-semibold text-white">
                  <a
                    href={project.github || project.external}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-[#ff8a00]"
                  >
                    {project.title}
                  </a>
                </h3>
                <p className="mt-3 flex-1 overflow-hidden text-[15px] leading-6 text-[#b3b6b7] line-clamp-4">
                  {project.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tech.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-[#cfd4d4] ring-1 ring-white/10"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="pb-10 pt-6 text-center font-mono text-xs text-[#b3b6b7] lg:hidden">
          <div className="mb-6 flex items-center justify-center gap-5 text-[#cfd4d4]">
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

function TypeCycle({ phrases }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];

    if (!deleting && text === current) {
      const hold = setTimeout(() => setDeleting(true), 1600);
      return () => clearTimeout(hold);
    }

    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }

    const next = deleting
      ? current.slice(0, text.length - 1)
      : current.slice(0, text.length + 1);
    const tick = setTimeout(() => setText(next), deleting ? 45 : 85);
    return () => clearTimeout(tick);
  }, [text, deleting, index, phrases]);

  return (
    <span>
      {text}
      <span className="ml-0.5 inline-block w-[0.55ch] animate-pulse bg-[#ff8a00] text-transparent">
        |
      </span>
    </span>
  );
}

function SectionHeading({ title }) {
  return (
    <h2 className="font-sans text-[44px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[60px] md:text-[72px]">
      {title}
    </h2>
  );
}

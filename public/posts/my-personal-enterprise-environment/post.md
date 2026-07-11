
## Why I Built a Homelab

Like many people working in IT, I quickly discovered that there is only so much you can learn from reading documentation or watching videos. Real learning happens when you dive into the deep end, building and breaking things.
\
\
A homelab provides a safe environment where I can deploy new technologies, make mistakes, troubleshoot problems, and understand how systems actually work together.
\
\
My goal was never simply to host services at home. Instead, I wanted to build an environment that mirrors the kinds of systems found in enterprise and government networks.
\
\
This allows me to explore topics such as:

- Active Directory
- Enterprise networking
- Virtualisation
- Linux administration
- Cyber security operations
- PKI and smart card authentication
- SIEM engineering
- High availability design
- Automation and Infrastructure as Code

## The Core Infrastructure

Today, my environment revolves around VMware ESXi running on Dell PowerEdge servers, as well as a Raspberry Pi 4B+ and a cheap N150 Mini PC.
\
\
Rather than building a collection of disconnected systems, I designed the environment around a central identity platform.
\
\
At the heart of the lab is Active Directory, providing:

- Centralised authentication
- DNS services
- Group Policy
- Certificate Services
- Identity management

\
All Windows and Linux systems are domain joined, allowing me to manage them in a similar way to a coporate environment.

## Networking & DNS

My environment uses Active Directory-integrated DNS alongside AdGuard Home for filtering and upstream resolution. This is tied in with Cloudflare WARP, allowing me to have split-brain DNS, so devices resolve to the closest edge network.

This gives me:

- Internal name resolution
- Ad and tracking protection
- Centralised DNS logging
- Improved visibility into network activity

\
A good DNS design has proven to be one of the more important components of the entire lab and getting this working how I wanted took some tinkering.

## Network & Host Monitoring

As someone working in cyber security, a large portion of the lab exists to support security research, monitoring and detection, and security architecture and engineering.
\
\
I operate a dedicated security stack built around Splunk. I have a number of VMs with dedicated Search Heads and Indexer clustering.
\
\
This environment allows me to:
- Collect logs from Windows and Linux systems
- Develop detections
- Test Sigma rules
- Investigate simulated incidents
- Build dashboards
- Validate data sources

\
Having access to my own SIEM environment means I can test ideas without impacting production systems and gain a much deeper understanding of how security monitoring works behind the scenes and then bring these ideas to work.
\
\
As well as Splunk, I have a Corelight@Home sensor running on a Raspberry Pi 4B+ to collect network logging within the network all fed into Splunk.

## Linux & Automation

Managing systems manually becomes difficult as the environment grows. Having to go through each Linux host and install Splunk UF made me realise this. To solve this, I began introducing automation using Ansible.
\
\
Today, new Linux servers can be configured automatically with:

- Security baselines
- Domain joining
- NTP configuration
- Audit logging
- Splunk Universal Forwarder deployment
- Standardised packages and settings

\
This approach not only saves time but also ensures consistency across the environment.

## Identity and PKI

One of the areas I have become particularly interested in is enterprise identity.
\
\
The lab includes a full Microsoft Public Key Infrastructure deployment, allowing me to explore:

- Certificate issuance
- Smart card authentication
- LDAPS
- Mutual TLS
- Service authentication

\
My long-term goal is to replicate aspects of government identity systems using smart cards and certificate-based authentication. This provides an excellent platform for learning how large organisations manage trust and identity at scale.

## The Services

Beyond infrastructure, the lab hosts a range of services that I use daily.
\
\
Some of these include:

- OutlineWiki
- Authentik
- Immich
- NextCloud
- Ollama
- Scrypted
- Vaultwarden

\
Where possible, services are integrated with LDAPS to allow for central user and authentication management.

## Lessons Learned

Building a homelab has taught me far more than any certification course ever could. One of the most valuable things I have picked up is having a vast general understanding of how these kinds of environments are setup and operate. What looks normal and what doesn't. This is especially useful when it comes to cyber security operations, and being able to quickly triage events.

### Documentation Matters

You always think you'll remember how something was configured. You won't! Especially those really obscure ways you fixed something that you think you'll remember for next time. Documentation is also important for when you bring more people onboard to work on your lab. It'll help show how and why you set up things the way you did.

### Backups are Mandatory

Every homelab owner eventually learns this lesson the hard way. Backups should exist before you need them. Make sure they're tested regularly as well!
\
\
Also... RAID is not a backup!!!

### DNS Breaks Everything

If DNS stops working, almost everything else follows. It's just an unwritten rule of thumb that if something stopped working, check DNS.

### Simplicity Wins

It's easy to build something complicated, but it's much harder to build something reliable. Sometimes simplicity is best.

## What's Next?

The lab continues to evolve. My current projects on the backburner are:

- Expanding VMware infrastructure
- Implementing high availability everywhere
- Introducing 10-40Gb
- Improving storage performance
- Expanding PKI and smart card authentication
- Building out local AI and LLM capabilities
- Futher automation via Ansible

\
The ultimate goal is to create an environment that closely resembles the infrastructure found in modern enterprise networks while remaining flexible enough to support experimentation and learning.

## Final Thoughts
A homelab is much more than just a collection of servers. It's a platform for continuous learning. Every failed upgrade, broken configuration, networking issue, and late-night troubleshooting session teaches something new. For me, that's what makes the homelab journey worthwhile.
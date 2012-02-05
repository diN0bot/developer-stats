Ideas: How many pull requests everyone has made, how long do they last, how many are closed
but not merged, how many requests contain modifications to test files, etc.

Assign points to everything, and present various leaderboards.

Demo: http://ec2-107-20-75-182.compute-1.amazonaws.com

Local development: once you have an access_token, use: http://ec2-107-20-75-182.compute-1.amazonaws.com/devstats/stats/:access_token

```
git clone git@github.com:diN0bot/developer-stats.git
cd developer-stats
```

```
sudo apt-get install node nodejs nginx
sudo emacs /etc/nginx/sites-enabled/default
```

```
location / {
    proxy_pass          http://localhost:3000/;
}
```

```
sudo /etc/init.d/nginx start
cd ~/developer-stats/webapp; node app.js
```

Daemonizing node.js server: http://cuppster.com/2011/05/12/diy-node-js-server-on-amazon-ec2/

```
sudo /etc/init.d/nginx restart
sudo supervisorctl restart node
```

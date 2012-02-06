## Demo

http://game.rax.io/

Currently implemented leaderboard:

- Getting stuff done (number of pull requests and pull request life span)

Share URLs with others: http://game.rax.io/idx/:org/:repo/

eg, 

- http://game.rax.io/idx/diN0bot/developer-stats/
- http://game.rax.io/idx/HackThePlanet/developer-stats/

## Future

Other leaderboard ideas:

- Small branches (number of commits/files/changes per pull request)
- Giving reviews (leaderboard for commenting on pull requests, or possibly parsing pull request descriptions for "owning reviewer: xxx")
- Writing tests (file with "test" in path was added or updated)
- Fixing defects (version one)
- Getting stories done (version one)

Assign points to everything, as in http://twistedmatrix.com/highscores/

## Developer

Get the code

```
git clone git@github.com:diN0bot/developer-stats.git
cd developer-stats
```

Install stuff

```
sudo apt-get install node nodejs nginx
sudo emacs /etc/nginx/sites-enabled/default
```

Maybe a sample nginx config should live in this repo

```
location / {
    proxy_pass          http://localhost:3000/;
}
```

Personalize settings

```
cp webapp/settings.js.sample webapp/settings.js
emacs webapp/settings.js
```

**Run the server**

```
sudo /etc/init.d/nginx start
cd ~/developer-stats/webapp; node app.js
```

Daemonizing node.js server: http://cuppster.com/2011/05/12/diy-node-js-server-on-amazon-ec2/

```
sudo /etc/init.d/nginx restart
sudo supervisorctl restart node
```

hmmm https://github.com/hookio/hook.io

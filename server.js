const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const uuidv4 = require('uuid/v4');
const querystring = require('querystring');
const http = require('http');
const https = require('https');
const fs = require('fs');
const request = require('request');
require('dotenv').config();

const app = express();
let site = 'http://i.wot.box-box.space';
let db;
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'psk.reg.api@gmail.com',
        pass: 'n7l0cxlqhb5q34qptlge7oiwqyv59n3jt5ka'
    }
});

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
});

app.get('/subscribe', function (req, res) {
    let json;
    let query = new Promise((resolve, reject) => {
        let token = generateToken();
        let subscribe = {};
        openDB();
        subscribe['name'] = req.query.name;
        subscribe['reclamationToken'] = req.query.reclamationToken;
        json = JSON.parse(JSON.stringify(subscribe));

        subscribe['desc'] = req.query.desc;
        subscribe['email'] = req.query.email;
        db.serialize(() => {
            let sql = 'SELECT name, reclamation_token FROM domain ' +
                'WHERE name = ? and reclamation_token  = ?';
            db.get(sql, [subscribe['name'], subscribe['reclamationToken']], (err, row) => {
                if (err) {
                    reject(err)
                    // return console.error(err.message);
                }
                else {
                    if (row) {
                        console.log(row.name);
                        if (row.reclamation_token != null) {
                            console.log(row.reclamation_token);
                            //to receive API token and run Let's Encrypt
                            resolve()
                        }
                        resolve()
                    } else {
                        console.log("This domain is available.");
                        let domain = [
                            subscribe['name'],
                            subscribe['desc'],
                            subscribe['email'],
                            subscribe['reclamationToken']
                        ];
                        let placeholders = '(?,?,?,?)';
                        sql = 'INSERT INTO domain (name, desc, email, reclamation_token) VALUES ' + placeholders;
                        db.run(sql, domain, function (err) {
                            if (err) {
                                // console.error("Domain not available.");
                                console.error(err.message);
                                reject(err)
                            } else {
                                console.log('Rows inserted');
                                resolve()
                            }
                        });
                    }
                }
            });
        });
    });
    query.then(() => {
        // console.log('val' + valll[1] );
        res.send(json);
        closeDB();
    }).catch((error) => {
        res.status(400).send(error);
        closeDB();
    });
});

app.get('/reclaim', (req, res) => {
    res.sendFile(__dirname + "/" + "reclaim.html");
});

app.get('/reclaimToken', (req, res) => {
    reclamation_token = generateToken();
    openDB();
    let sql = "UPDATE domain SET reclamation_token = ? WHERE name = ?";
    db.run(sql, [reclamation_token, req.query.name], (err) => {
        if (err) {
            return console.error(err.message)
        }
        console.log(reclamation_token)
    });
    res.redirect('/');
    closeDB()
    //email with reclaimation token is not sent yet
});

app.get('/ping', (req, res) => {
    res.send();
    res.redirect('/')
});

app.get('/setemail', (req, res) => {
    let query = new Promise((resolve, reject) => {
        openDB();

        uuid = uuidv4();
        queryString = querystring.stringify({id: uuid});

        let mailOptions = {
            from: 'psk.reg.api@gmail.com',
            to: req.query.email,
            subject: 'Sending Email using Node.js',
            text: 'That was almost easy!\n' + site + '/verifyemail?' + queryString
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                sql = 'UPDATE domain SET new_email = ?, uuid = ? WHERE token = ?';
                db.run(sql, [req.query.email, uuid, req.query.token], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        console.log('Email sent: ' + info.response);
                        resolve()
                    }
                });
            }
        });
    });
    query.then(() => {
            //need to do something with email verification
            res.redirect('/');
            closeDB();
        }
    ).catch((error) => {
            res.status(400).send(error);
            closeDB();
        }
    );
});

app.get('/verifyemail', (req, res) => {
    openDB();
    let query = new Promise((resolve, reject) => {
        queryString = req.query.id;
        db.serialize(() => {
            let sql = "UPDATE domain SET email = new_email WHERE uuid = ?";
            db.run(sql, [req.query.id], (err) => {
                if (err) {
                    console.error(err.message);
                    reject(err)
                }
            });
            sql = "UPDATE domain SET new_email = NULL, uuid = NULL WHERE uuid = ?";
            db.run(sql, [req.query.id], (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve();
                }
            });
        });

    });
    query.then(() => {
            //need to do something with email verification
            console.log("email sent!");
            res.redirect('/');
            closeDB();
        }
    ).catch((error) => {
            res.status(400).send(error);
            closeDB();
        }
    );
});

app.get('/revokeemail', (req, res) => {
    openDB();
    let query = new Promise((resolve, reject) => {
        let sql = "UPDATE domain SET new_email = NULL, uuid = NULL WHERE token = ?";
        db.run(sql, [req.query.token], (err) => {
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        })
    });
    query.then(() => {
            //need to do something with email verification
            res.redirect('/');
            closeDB();
        }
    ).catch((error) => {
            res.status(400).send(error);
            closeDB();
        }
    );
});

app.get('/unsubscribe', (req, res) => {
    openDB();
    let query = new Promise((resolve, reject) => {
        let sql = "DELETE FROM domain WHERE token = ? and reclamation_token = ?";
        db.run(sql, [req.query.token, req.query.reclamationToken], (err) => {
            if (err) {
                console.error(err.message);
                reject(err)
            } else {
                resolve()
            }
        })
    });
    query.then(() => {
            //need to do something with email verification
            res.redirect('/');
            console.log("Unsubscribe successfully!")
        }
    ).catch((error) => {
            res.status(400).send(error);
        }
    );
    closeDB();
});

app.get('/dnsconfig', (req, res) => {
    let request = require('request');

    let headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': ("sso-key " + process.env.SSO_KEY),
    };

    let dataString = '[ { "data": "site=addmao7.wot.box-box.space", "name": "@", "ttl": 600, "type": "TXT" }]';

    let options = {
        url: 'https://api.godaddy.com/v1/domains/box-box.space/records',
        method: 'PATCH',
        headers: headers,
        body: dataString
    };

    function callback(error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(body);
        }
    }
    request(options, callback);
});

app.get('/info', (req, res) => {
    openDB();
    let query = new Promise((resolve, reject) => {
        let sql = "SELECT * FROM domain WHERE token = ?";
        db.get(sql, [req.query.token], (err, row) => {
            if (err) {
                console.log("err");
                reject(err);
            }
            else {
                if (row) {
                    let infoDB = {
                        'name': row.name,
                        'desc': row.desc,
                        'email': row.email,
                        'reclamation_token': row.reclamation_token
                    };
                    resolve(infoDB);
                }
            }
        })
    });
    query.then((infoDB) => {
        // console.log(row[0]);
        res.send(JSON.parse(JSON.stringify(infoDB)));
        closeDB();

    }).catch((err) => {
        res.status(501).send(err);
        closeDB();
    });
});

app.get('/health-check', (req, res) => res.sendStatus(200));

function openDB() {
    db = new sqlite3.Database('./db/domain.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the domain database.');
    });
}

function closeDB() {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
    });
    // console.log('Close the database connection.');
}

function generateToken() {
    let token = "";
    for (let i = 0; i < 6; i++) {
        token = token + Math.random().toString(36).substr(2, 6);
    }
    return token
}

const privateKey = fs.readFileSync('/etc/letsencrypt/live/i.wot.box-box.space/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/i.wot.box-box.space/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/i.wot.box-box.space/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

// const server = app.listen(80, function () {
//     const host = server.address().address;
//     const port = server.address().port;
//     console.log("App listening at http://%s:%s", host, port)
// });


httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});
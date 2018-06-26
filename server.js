const express = require('express');
const sqlite3 = require('sqlite3').verbose();

let db;
const app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
});

app.get('/subscribe', function (req, res) {
    console.log("_____________________");

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
                        console.log(row.name)
                        if (row.reclamation_token != null) {
                            console.log(row.reclamation_token)
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
                        sql = 'INSERT INTO domain VALUES ' + placeholders;
                        db.run(sql, domain, function (err) {
                            if (err) {
                                console.error("Domain not available.")
                                reject(err)
                            } else {
                                console.log('Rows inserted')
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
    let sql = "INSERT INTO domain (name, reclamation_token) VALUES (?,?)";
    db.run(sql, [req.query.name, reclamation_token], (err) => {
        if (err) {
            return console.error(err.message)
        }
    })
    //email not sent yet
});

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

const server = app.listen(8081, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port)
});

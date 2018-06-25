const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

let db;
const app = express();
// const urlencodedParser = bodyParser.urlencoded({extended: false});

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
});

app.get('/subscribe', function (req, res) {
    let token = generateToken();
    let subscribe = {};
    var noo = false;
    // subscribe = JSON.parse(fs.readFileSync('./names.json', 'utf8'));

    openDB();
    subscribe['name'] = req.query.name;
    subscribe['reclamationToken'] = req.query.reclamationToken;
    let json = JSON.parse(JSON.stringify(subscribe));
    subscribe['desc'] = req.query.desc;
    subscribe['email'] = req.query.email;

    let sql = 'SELECT name name, reclamation_token token FROM domain ' +
        'WHERE name = ? and reclamation_token  = ?';
    db.serialize(() => {
        let domainAvailable = false;
        db.get(sql, [subscribe['name'],subscribe['reclamationToken']], (err, row) => {
            if (err) {
                return console.error(err.message);
            }
            // return row
            //     ? (console.log(row.name))
            //     : console.log("This domain is available.")
            if (row) {
                console.log(row.name)
            } else {
                console.log("This domain is available.")
            }
        });
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
                return console.error(err.message);
            }
            console.log('Rows inserted')
        });
        closeDB();
    });
    if (noo) {
        console.log("noasdnasod")
    }
    res.send(json);
});

function openDB() {
    db = new sqlite3.Database('./db/domain.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the domain database.');
    });
}

function closeDB() {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
    });
    console.log('Close the database connection.');
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

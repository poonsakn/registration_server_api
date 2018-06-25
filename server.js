const express = require('express');
const sqlite3 = require('sqlite3').verbose();

let db;
const app = express();

const generateToken = function () {
    return '123'
};

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "index.html");
});

app.get('/subscribe', function (req, res) {
    console.log("_____________________");
    let query = new Promise((resolve, reject) => {
        let token = generateToken();
        let subscribe = {};
        openDB();
        subscribe['name'] = req.query.name;
        subscribe['reclamationToken'] = req.query.reclamationToken;
    
        let json = JSON.parse(JSON.stringify(subscribe));
    
        subscribe['desc'] = req.query.desc;
        subscribe['email'] = req.query.email;

        let sql = 'SELECT name name, reclamation_token token FROM domain ' +
        'WHERE name = ? and reclamation_token  = ?';
        db.serialize(() => {
            db.get(sql, [subscribe['name'], subscribe['reclamationToken']], (err, row) => {
                if (err) {
                    return console.error(err.message);
                    reject(err)
                }
                if (row) {
                    console.log(row.name);
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
            }); 
        });
    });
    query.then(() => {
        res.send(json);
        closeDB();
    }).catch((error) => {
        res.status(400).send(error);
        closeDB();
    });
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

const server = app.listen(8081, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port)
});

var port = 80;
var express = require('express');
var app = express();

var winston = require('winston');
winston.add(winston.transports.File, { filename: '/var/www/serverlog.log' });

var sys = require('sys');
var exec = require('child_process').exec;
var child;

var mysql = require('mysql');
connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mammapappa!'
});
if (connection.status != "authenticated") {
    connectDB();
    winston.log("info", "Is not connected, trying to connect....")
}

app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    winston.log("info", "\n");
    winston.log("info", "got request: get index page");

    res.render('index');
});



app.get('/station/get', function(req, res) {
    winston.log("info", "\n");
    winston.log("info", "got request: get stations");


    var query = connection.query('SELECT * FROM station', function(err, result) {
        res.send(result);
    });


});

app.post('/station/put', function(req, res) {
    winston.log("info", "\n");
    winston.log("info", "got request: put data into stations");
    var urlquery = req.query;

    var post = {url: urlquery.url, name: urlquery.name};


    var query = connection.query('INSERT INTO station SET ?', post, function(err, result) {
        winston.log("info", "Result:");
        winston.log("info", result);
        winston.log("info", "Error:");
        winston.log("info", err);
    });

});



app.get('/weekschema/check', function(req, res) {
    var date = new Date();
    var now_hour = date.getHours();
    var now_minute = date.getMinutes();
    var now_day = (date.getDay() == 0 ? 7 : date.getDay());

    winston.log("info", "\n");
    winston.log("info", "Got request: check weekschema data");
    winston.log("info", now_hour + ":" + now_minute);
    var query = connection.query('SELECT HOUR(alerttime) as hour, MINUTE(alerttime) as min, stationid, volume FROM weekschema WHERE weekday=' + now_day, function(err, result) {
        winston.log("info", "Result:");
        winston.log("info", result);
        for (var i = 0; i < result.length; i++) {
            entry_hour = result[i].hour;
            entry_minute = result[i].min;
            entry_station = result[i].stationid;
            entry_volume = result[i].volume;
            if (entry_hour == now_hour && entry_minute == now_minute) {
                winston.log("info", "TIME FOR ALERT!!! Play stations " + entry_station + " at " + (entry_volume == null ? 80 : entry_volume) + "% volume");
                child = exec("curl localhost/mediaplayer/play?stationid=" + entry_station + "&volume=" + entry_volume);
            }
        }
        winston.log("info", "Error:");
        winston.log("info", err);
    });

    res.send("");
});

app.get('/weekschema/get', function(req, res) {
    var date = new Date();
    winston.log("info", "\n");
    winston.log("info", "Got request: get weekschema data");

    var query = connection.query('SELECT * FROM weekschema ORDER BY weekday, alerttime', function(err, result) {
        winston.log("info", "Result:");
        winston.log("info", result);
        winston.log("info", "Error:");
        winston.log("info", err);
        if (err != null) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    winston.log("info", "Ran query: " + query.sql);


});

app.post('/weekschema/put', function(req, res) {
    winston.log("info", "\n");
    winston.log("info", "Got request: put data into weekschema");
    var urlquery = req.query;

    var post = {weekday: urlquery.weekday, alerttime: urlquery.alerttime, stationid: urlquery.stationid, volume: urlquery.volume};
    winston.log("info", post);

    var query = connection.query('INSERT INTO weekschema SET ?', post, function(err, result) {
        winston.log("info", "Result:");
        winston.log("info", result);
        winston.log("info", "Error:");
        winston.log("info", err);
    });
    winston.log("info", "Ran query: " + query.sql);

    res.send("Done!");
});

app.post('/weekschema/changeexisting', function(req, res) {
    winston.log("info", "\n");
    winston.log("info", "Got request: change row in weekschema");
    var urlquery = req.query;

    var query = connection.query('UPDATE weekschema SET weekday = ' + urlquery.weekday + ', alerttime = ' + urlquery.alerttime + ', stationid = ' + urlquery.stationid + ', volume = ' + urlquery.volume + ' WHERE id = ' + urlquery.id + '', function(err, result) {
        winston.log("info", "Result:");
        winston.log("info", result);
        winston.log("info", "Error:");
        winston.log("info", err);
    });
    winston.log("info", "Ran query: " + query.sql);

    res.send("Done!");
});

app.post('/weekschema/delete', function(req, res) {
    winston.log("info", "\n");
    winston.log("info", "Got request: delete row in weekschema");
    var urlquery = req.query;

    var query = connection.query('DELETE from weekschema WHERE id = ' + urlquery.id + '', function(err, result) {
        winston.log("info", "Result:");
        winston.log("info", result);
        winston.log("info", "Error:");
        winston.log("info", err);
    });
    winston.log("info", "Ran query: " + query.sql);

    res.send("Done!");
});



app.use('/mediaplayer/play', function(req, res) {
    var urlquery = req.query;
    winston.log("info", "\n");
    winston.log("info", "Got request: play media at station " + urlquery.stationid + " with volume " + urlquery.volume);


    var query = connection.query('SELECT * FROM station WHERE id =' + urlquery.stationid, function(err, result) {
        var station = result[0];
        winston.log("info", "station:");
        winston.log("info", station);

        child = exec("mpc clear", function(error, stdout, stderr) {
            winston.log("info", 'stdout: ' + stdout);
            winston.log("info", 'stderr: ' + stderr);
            if (error !== null) {
                winston.log("info", 'exec error: ' + error);
            }
        });

        child = exec("mpc add " + station.url, function(error, stdout, stderr) {
            winston.log("info", 'stdout: ' + stdout);
            winston.log("info", 'stderr: ' + stderr);
            if (error !== null) {
                winston.log("info", 'exec error: ' + error);
            }
        });

        child = exec("mpc play", function(error, stdout, stderr) {
            winston.log("info", 'stdout: ' + stdout);
            winston.log("info", 'stderr: ' + stderr);
            if (error !== null) {
                winston.log("info", 'exec error: ' + error);
            }
        });
        
        child = exec("mpc volume " + urlquery.volume, function(error, stdout, stderr) {
            winston.log("info", 'stdout: ' + stdout);
            winston.log("info", 'stderr: ' + stderr);
            if (error !== null) {
                winston.log("info", 'exec error: ' + error);
            }
        });
    });

    res.send("");
});

app.use('/mediaplayer/stop', function(req, res) {
    var urlquery = req.query;
    winston.log("info", "\n");
    winston.log("info", "Got request: stop media player");

    child = exec("mpc stop", function(error, stdout, stderr) {
        winston.log("info", 'stdout: ' + stdout);
        winston.log("info", 'stderr: ' + stderr);
        if (error !== null) {
            winston.log("info", 'exec error: ' + error);
        }
    });

    res.send("");
});


app.listen(port);

winston.log("info", "localhost:" + port);



function connectDB() {
    winston.log("info", "Before: " + connection.state);
    connection.connect(function(err) {
        if (err == null) {
            var query = connection.query('USE radio', function(err, result) {

                winston.log("info", "During: " + connection.state);
            });
        } else {

        }
    });
    return true;
}

function endDB() {
    connection.end();
}

//For running shell commands!
/*
 child = exec("pwd", function(error, stdout, stderr) {
 sys.print('stdout: ' + stdout);
 sys.print('stderr: ' + stderr);
 if (error !== null) {
 winston.log("info", 'exec error: ' + error);
 }
 });*/
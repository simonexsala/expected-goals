var express = require('express');   // Express middleware
var http = require('http');         // http-server
var io = require('socket.io');      // Socket communication with client
var mysql = require('mysql');       // Connection to the database
var bodyParser = require('body-parser');

config = require("./config.js");    // Database credentials
db = config.database;
var connection = mysql.createConnection({
  host: db.host,
  user: db.user,
  password: db.password,
  database: db.database
});

var app = express();
app.use(express.static('./public'));

var server = http.createServer(app).listen(8124);
io = io.listen(server);
console.log("Server up on port 8124.");

io.on('connection', function(socket) {
  console.log('Socket.io: connection with the client ' + socket.id + ' established.');

  socket.on('message', function(data) {
    console.log("message from client: " + data);
    io.emit('messageClient', data);
    var request = data;
    if (request.toUpperCase().split(" ")[0].localeCompare("HELP") == 0) {
      var commands = "<p>Commands you can run:</p>" +
                    "<p><b>list</b> [team_name] -> match list</p>" +
                    "<p><b>map</b> [id_match] -> xG map of the match</p>" +
                    "<p><b>plot</b> [id_team], [start_date], [end_date] -> xG plot over the time interval</p>";
      io.emit('messageServer', commands);
    } else if (request.toUpperCase().split(" ")[0].localeCompare("LIST") == 0) {
      // List of matches played by the team
      io.emit('messageServer', "list");
      var team_name = request.split(" ")[1];
      console.log("team_name: " + team_name);
      connection.connect(function(err) {
        if (err) throw err;
        console.log("Server connected to football db.");
        console.log("Proceeding with the 'list' request.")
        var sql = "SELECT * FROM matches, teams WHERE (matches.id_home = teams.id_team OR  matches.id_away = teams.id_team) AND team_name like '" + team_name + "';";
        connection.query(sql, function (err, result, fields) {
          if (err) throw err;
          console.log(result);
          io.emit('messageServer', JSON.stringify(result))
        });
      });
    } else if (request.toUpperCase().split(" ")[0].localeCompare("MAP") == 0) {
      // xG map of the game
      io.emit('messageServer', "map");
    } else if (request.toUpperCase().split(" ")[0].localeCompare("PLOT") == 0) {
      // xG plot of the team over the time interval
      io.emit('messageServer', "plot");
    }
  });
});

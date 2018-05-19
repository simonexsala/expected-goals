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
      var commands = "<p>List of commands supported:</p>" +
                    "<p><b>list</b> [team_name] -> match list</p>" +
                    "<p><b>map</b> [id_match] -> xG map of the match</p>" +
                    "<p><b>plot</b> [team_name], [start_date], [end_date] -> xG plot over the time interval</p>" +
                    "<p>All parameters should be separated with a <b>space character</b>.</p>" +
                    "<p>Dates accepted only in the following format: <b>yyyy/mm/dd.</b></p>";
      io.emit('messageServer', commands);
    } else if (request.toUpperCase().split(" ")[0].localeCompare("LIST") == 0) {
      // List of matches played by the team
      var team_name = request.split(" ")[1];

      connection.connect(function(err) {
        if (err) throw err;
        var sql = "SELECT * FROM matches, teams WHERE (matches.id_home = teams.id_team OR matches.id_away = teams.id_team) AND team_name like '" + team_name + "';";
        connection.query(sql, function (err, result, fields) {
          if (err) throw err;
          console.log(result);
          io.emit('messageServer', JSON.stringify(result))
        });
      });
    } else if (request.toUpperCase().split(" ")[0].localeCompare("MAP") == 0) {
      // xG map of the game
      var id_match = request.split(" ")[1];

      connection.connect(function(err) {
        if (err) throw err;
        var sql = "SELECT * FROM shots WHERE id_match = " + id_match + ";";
        connection.query(sql, function (err, result, fields) {
          if (err) throw err;
          console.log(result);
          io.emit('messageServer', JSON.stringify(result))
        });
      });
    } else if (request.toUpperCase().split(" ")[0].localeCompare("PLOT") == 0) {
      // xG plot of the team over the time interval
      var team_name = request.split(" ")[1];
      var start_date = request.split(" ")[2];
      var end_date = request.split(" ")[3];

      connection.connect(function(err) {
        if (err) throw err;
        var sql = "SELECT DISTINCT shots.id_shot, shots.id_match, shots.id_team FROM shots, matches, teams WHERE ((matches.id_home = teams.id_team AND matches.id_home = shots.id_team) OR (matches.id_away = teams.id_team AND matches.id_away = shots.id_team)) AND team_name like '" + team_name + "' AND (date BETWEEN '" + start_date + "' AND '" + end_date + "');";
        connection.query(sql, function (err, result, fields) {
          if (err) throw err;
          console.log(result);
          io.emit('messageServer', JSON.stringify(result))
        });
      });
    }
  });
});

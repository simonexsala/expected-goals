var express     = require('express');       // Express middleware
var http        = require('http');          // http-server
var io          = require('socket.io');     // Socket communication with client
var mysql       = require('mysql');         // Connection to the database
var bodyParser  = require('body-parser');   // Parse messages sent from client

config = require("./config.js");    // Database credentials
db = config.database;

var connection = mysql.createConnection({
  host: db.host,
  user: db.user,
  password: db.password,
  database: db.database
});

// Connection to the database
connection.connect(function(err) {
    if (err) throw err;
});

var app = express();
// Static files used by the client: index.html, style.css, assets, etc.
app.use(express.static('./public'));

// Server is listening on port 8124
var server = http.createServer(app).listen(8124);
io = io.listen(server);
console.log("Server up on port 8124.");

// 'connection' event handler. This gets called when a new client connects to the server.
io.on('connection', function(socket) {
  console.log('Socket.io: connection with the client ' + socket.id + ' established.');

  // 'message' event handler. This gets called when a new message is sent from the client.
  socket.on('message', function(data) {
    console.log("message from client: " + data);
    // The same message is sent back to the client, and it is appended to the chat.
    io.emit('messageClient', data);
    var request = data;

    // Checking the content of the message to decide what to do.
    if (request.toUpperCase().split(" ")[0].localeCompare("HELP") == 0) {
      // List of commands supported
      var commands = "<p>List of commands supported:</p>" +
                    "<p><b>list</b> [team_name]  ⟿  match list for the selected team.</p>" +
                    "<p><b>info</b> [id_match]  ⟿  information on the selected match.</p>" +
                    "<p><b>map</b> [id_match]  ⟿  xG map of the match.</p>" +
                    "<p><b>plot</b> [team_name], [start_date], [end_date]  ⟿  xG plot over the time interval.</p>" +
                    "<p>All parameters should be separated with a <b>space character</b>.</p>" +
                    "<p>Dates are accepted only in the following format: <b>yyyy</b>/<b>mm</b>/<b>dd</b>.</p>";
      io.emit('messageServer', commands);
    } else if (request.toUpperCase().split(" ")[0].localeCompare("LIST") == 0) {
      // List of matches played by the team
      var team_name = request.split(" ")[1];

      var sql = "SELECT id_match, round, a.team_name as home_team, c.team_name as away_team, home_goals, away_goals, date FROM matches b JOIN teams a ON b.id_home = a.id_team JOIN teams c ON b.id_away = c.id_team WHERE (a.team_name like '" + team_name + "' OR c.team_name like '" + team_name + "') ORDER BY round;";
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        io.emit('messageServerList', JSON.stringify(result))
      });
    } else if (request.toUpperCase().split(" ")[0].localeCompare("MAP") == 0) {
      // xG map of the game
      var id_match = request.split(" ")[1];
      var sql = "SELECT * FROM shots WHERE id_match = " + id_match + ";";
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        if (result.length == 0) {
          io.emit('messageServer', "<p>I'm sorry, no available data for the requested match.</p>");
        } else {
          io.emit('messageServerMap', JSON.stringify(result))
        }
      });
    } else if (request.toUpperCase().split(" ")[0].localeCompare("PLOT") == 0) {
      // xG plot of the team over the time interval
      var team_name = request.split(" ")[1];
      var start_date = request.split(" ")[2];
      var end_date = request.split(" ")[3];

      // var sql = "SELECT DISTINCT shots.id_shot, shots.id_match, shots.id_team FROM shots, matches, teams WHERE ((matches.id_home = teams.id_team AND matches.id_home = shots.id_team) OR (matches.id_away = teams.id_team AND matches.id_away = shots.id_team)) AND team_name like '" + team_name + "' AND (date BETWEEN '" + start_date + "' AND '" + end_date + "');";
      var sql = "SELECT xG FROM shot_quality";
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        io.emit('messageServerPlot', JSON.stringify(result))
      });
    } else if (request.toUpperCase().split(" ")[0].localeCompare("INFO") == 0) {
      var id_match = request.split(" ")[1];

      var sql = "SELECT round, a.team_name as home_team, c.team_name as away_team, home_goals, away_goals, date FROM matches b JOIN teams a ON b.id_home = a.id_team JOIN teams c ON b.id_away = c.id_team WHERE id_match = " + id_match + ";";
      connection.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        io.emit('messageServerInfo', JSON.stringify(result))
      });
    } else {
      // Default
      var commands = "<p>I'm sorry, I can't understand what you're asking me. Try reformatting the request.</p>";
      io.emit('messageServer', commands);
    }
  });
});

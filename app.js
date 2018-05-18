var express = require('express');   // Express middleware
var http = require('http');         // http-server
var io = require('socket.io');      // Socket communication with client
var mysql = require('mysql');       // Connection to the database
var bodyParser = require('body-parser');

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

    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "football"
    });

    con.connect(function(err) {
      if (err) throw err;
      console.log("Server connected to football db.");
      var sql = "SELECT * FROM shots, teams WHERE shots.id_team = teams.id_team AND team_name like '" + data + "' LIMIT 3";
      con.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        io.emit('messageServer', JSON.stringify(result))
      });
    });
  });
});

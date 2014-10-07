var http = require('http');
var path = require('path');
var request = require('request');
var io = require('socket.io');

var express = require('express');
var MongoClient = require('mongodb').MongoClient;


// Configure the Express web server
var router = express();
var server = http.createServer(router);

var url_room = io.listen(server);

// Tell Express to serve static assets
router.use(express.static(path.resolve(__dirname, 'client')));

MongoClient.connect('mongodb://mobilecomputing:asdf1234@ds043210.mongolab.com:43210/mobilescreens', function(err, db) {
      if (err) throw err;
      if (!err) {
        console.log("we are connected");

      var sites = db.collection('listofurls');

      url_room.on('connection', function(socket) {

        var testTwo = sites.find().sort( { name:1 } );


          var test = sites.find().sort( { name: 1 } ).each(function(err, message) {
            if (message != null) {
                //console.log(message);
                socket.emit('bdInfo', message);
            }
          });

          socket.on('addtodb', function(data) {
              
              var newDoc = {
                  siteurl: data.siteurl,
                  timeval: data.timeval,
                  active: 1,
                  screen: data.screen
              };

              sites.insert(newDoc, function(err, inserted) {
                if (err) throw err;
              });
          });

          socket.on('updatedb', function(data) {

            var theSite = data.idToUpdate;
            var theScreen = data.screen;
            console.log(theSite);

            sites.update({ $and: [ {siteurl: theSite},{screen: theScreen}]}, {$set: {active: 2}}, { multi: true }, function(err, updated) {
                if( err || !updated ) console.log("User not updated");
                  else console.log("User updated");
            });

          });

          socket.on('updatedbTwo', function(data) {

            var theSite = data.idToUpdate;
            var theScreen = data.screen;
            console.log(theSite);
            console.log(theScreen);

            sites.update({ $and: [ {siteurl: theSite},{screen: theScreen}]}, {$set: {active: 2}}, { multi: true }, function(err, updated) {
                if( err || !updated ) console.log("User not updated");
                  else console.log("User updated");
            });

          });

          socket.on('updatedbThree', function(data) {

            var theSite = data.idToUpdate;
            var theScreen = data.screen;
            console.log(theSite);
            console.log(theScreen);

            sites.update({ $and: [ {siteurl: theSite},{screen: theScreen}]}, {$set: {active: 2}}, { multi: true }, function(err, updated) {
                if( err || !updated ) console.log("User not updated");
                  else console.log("User updated");
            });

          });


      });


    }
});

server.listen(Number(process.env.PORT || 5000));



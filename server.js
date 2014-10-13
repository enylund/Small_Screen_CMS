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


// Connect to MongoDB
MongoClient.connect('mongodb://mobilecomputing:asdf1234@ds043210.mongolab.com:43210/mobilescreens', function(err, db) {
      if (err) throw err;
      if (!err) {
        console.log("we are connected");

// create a shortcut to the collection
var sites = db.collection('listofurls');


url_room.on('connection', function(socket) {
	
 	//Emit page refesh to small screens. 
	//Used to sync them up.
	socket.on('syncRequest', function(data){
		socket.broadcast.emit('syncUpScreens');
		console.log("message recieved");
	});

      //Execute the below function to send student site urls to screen display pages
      socket.on('connected', function(data) {

          //set data from client that tells which screens DB info is needed
          //query database for active urls
          var screenThatsRequesting = data;

		  //Query DB for urls to display
          var queryScreen = sites.find(  { $and: [ { screen: screenThatsRequesting }, { active: 1 } ] }, {siteurl:1, timeval:1}).sort({positionVal: 1});
		  var screenToEmitTo = "siteRotate"+screenThatsRequesting;
            //iterate over db query to send to screens
            queryScreen.toArray(function(err, documents) {

                socket.emit(screenToEmitTo, documents);

            });
      });

      //initial database query for use on the index page of CMS
      sites.find().sort( { positionVal: 1 } ).each(function(err, message) {
          if (message != null) {

              //Emit information to build the Index Page
              if( message.siteurl != 'blank' ) {
              socket.emit('bdInfo', message);
              }
          }
      });

      //receives index page database additions
      socket.on('addtodb', function(data) {

          //variable holds requested url position in scheduler queue
          var positionMarker = data.positionVal;

          sites.find({ active: 1 }).sort( { positionVal: 1 }).each(function(err, message) {
              if (message != null) {
                  if ( message.positionVal == positionMarker ) {
                      console.log("duplicate reached");
                      var positionMarkerNum = parseInt(positionMarker);
                      console.log(positionMarkerNum);

                      //This should update the whole queue. NOT WORKING
                      sites.update({positionVal: {$gte: positionMarkerNum} }, { $inc: { positionVal: 1 }}, { multi: true}, function(err, updated) {
                          if( err || !updated ) console.log("User not updated");
                          else console.log("User updated");
                      }); 
                   }
                }
           });

           //Build database addition json
           var newDoc = {
              siteurl: data.siteurl,
              timeval: data.timeval,
              active: 1,
              screen: data.screen,
              positionVal: data.positionVal
           };
			
		   //Insert new urls into DB
           sites.insert(newDoc, function(err, inserted) {
              if (err) throw err;
            });
       });

       //Updates the DB when user removes a url from the queue
       socket.on('updatedb', function(data) {

          var theSite = data.idToUpdate;
          var theScreen = data.screen;

          sites.update({ $and: [ {siteurl: theSite},{screen: theScreen}]}, {$set: {active: 2}}, { multi: true }, function(err, updated) {
                if( err || !updated ) console.log("User not updated");
                  else console.log("User updated");
          });

        });

      });


    }
});

server.listen(Number(process.env.PORT || 5000));



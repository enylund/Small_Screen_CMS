var http = require('http');
var path = require('path');
var request = require('request');
var io = require('socket.io');
var async = require('async');


var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;


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

function sendDocumentToScreen(socket, screenNum, cursor) {

    // If no cursor is passed, create one by doing a find
    if (cursor == undefined) {
        console.log("Finding documents for screen", screenNum);
        cursor = sites.find(
            {
                $and: [
                    {screen: screenNum},
                    {active: 1}
                ]
            },
            {
                siteurl: 1,
                timeval: 1
            }
        ).sort({positionVal: 1});
    }

    // See if there's a next document in the collection
    cursor.nextObject(function(err, document) {
        if (err) throw err;

        // If so, get it
        if (document) {
            console.log("Sending document to screen", screenNum, document.siteurl);

            // Send it to this screen
            socket.emit('showUrl', document);

            // And get the next one after the appropriate time
            setTimeout(function() {
                sendDocumentToScreen(socket, screenNum, cursor);
            }, (document.siteurl == 'blank') ? 0 : (document.timeval * 1000));

        }

        // If not, reset the cursor to the beginning by doing another find.
        else {
            console.log("Looping screen", screenNum);

            // As a special case, if there are no documents in the collection, wait a second before doing another find.
            // Otherwise there would be no delay at all, and we'd blast Mongodb with infinite queries.
            cursor.count(function(err, count) {
                if (err) throw err;
                setTimeout(function () {
                    sendDocumentToScreen(socket, screenNum);
                }, (count == 0) ? 1000 : 0)
            });

        }

    });

}

url_room.on('connection', function(socket) {
	
 	//Emit page refesh to small screens.
	//Used to sync them up.
	socket.on('syncRequest', function(data){
		socket.broadcast.emit('syncUpScreens');
		console.log("message recieved");
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


      // Screen sends this message when it first connects
      // data should be the screen number (1, 2, or 3)
      socket.on('connected', function(data) {

          console.log("Screen connected", data);

          // Start recursing!
          sendDocumentToScreen(socket, data);

      });

      //receives index page database additions
      socket.on('addtodb', function(data) {

           //Build database addition json
           var newDoc = {
              siteurl: data.siteurl,
              timeval: data.timeval,
              active: 1,
              screen: data.screen,
              positionVal: parseInt(data.positionVal)
           };

           var preventor = 1;


           async.series([
              function(callback){
                 sites.find({ active: 1, screen: newDoc.screen }).sort( { positionVal: 1 }).each(function(err, message) {
                  if (message != null) {
                  if ( message.positionVal == newDoc.positionVal ) {
                      console.log("duplicate reached");
                      var positionMarkerNum = parseInt(newDoc.positionVal);
                      console.log(positionMarkerNum);
                      preventor = 2;

                      sites.update({active: 1, screen: newDoc.screen, positionVal: {$gte:positionMarkerNum}}, { $inc: {positionVal: 1}}, {multi:true}, function(err, update) {
                        if(err || !update) console.log("User not updated");
                        else {
                         console.log("user updated");
                         sites.insert(newDoc, function(err, inserted) {
                            if (err) throw err;
                    });
                        }
                    });
                   }
                }

           if (message == null) {
                 callback(null, 'one');
           }});
                           },
              function(callback){
                if (preventor == 1) {
                    sites.insert(newDoc, function(err, inserted) {
                            if (err) throw err;
                    });
                }

                 callback(null, 'two');
                 }
                 ],
              // optional callback
               function(err, results){
               // results is now equal to ['one', 'two']
           });
			
       });

       //Updates the DB when user removes a url from the queue
       socket.on('updatedb', function(data) {

          var theSite = ObjectId(data.idToUpdate);
          console.log(theSite);

          sites.update({ _id: theSite }, {$set: {active: 2}}, { multi: true }, function(err, updated) {
                if( err || !updated ) console.log("User not updated");
                  else console.log("User updated");
          });

        });

      });


    }
});

server.listen(Number(process.env.PORT || 5000));



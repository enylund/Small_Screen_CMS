## Tiny screen CMS for Mobile Computing!

http://whispering-anchorage-6156.herokuapp.com/

Or run locally (node server.js) and go to localhost:5000

Go to `/index.html` for the CMS  

Go to `/screenone.html` `/screentwo.html` `/screenthree.html` for the screens 

TODO: Handle disconnections. Otherwise we keep sending messages to disconnected clients forever.

TODO: Test adding to the database, see if clients get the new data document the current loop (if it comes later) or if that doesn't work at least in the next loop

TODO: Use just one client html file `screen.html`, with a query parameter or a hash to specify the screen number. Otherwise there's repeated code.
   
TODO: See if just altering the `iframe src`, rather than replacing the entire `<iframe>`, would look any smoother. 
 
TODO: Fix the bug with inserting positions

TODO: Create easier deletion system

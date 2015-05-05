//--------------------  ACH --------------------//

//GET ALL EXTERNAL MODULES
var cfenv = require("cfenv"),   //get cloud foundry enviroment module
    http  = require("http"),    //get http module
    ws = require("ws"), //get the websocket module
    express = require("express"),   //get express module
    Wocket = require("./Wocket"),  //Import MaestroSocket class from MaestroSocket.js
    //IdManager = require("./IdManager"), //get IdManager module
    Misc = require("./MiscFunctions"),  //Import MiscFunctions class from MiscFunctions.js 

//INIT MODULES
    appEnv = cfenv.getAppEnv(),   // get environmental information for this app
    app = express(),    //inits the express application
    httpServer = http.createServer(app),// create a server with a simple request handler
    wsServer = new ws.Server({ server: httpServer }); //'promotes' the httpserver to a websocket server
    //idManager = new IdManager();  //inits new IdManager instance


//------------------------------------------------------------------------------------//
fs = require("fs");

//SERVE HTTP FILES IN PUBLIC FOLDERS
app.use(express.static("public"));  
    
//CREATE NEW SESSION AND RESPOND GET/ WITH THE SESSION CREATED
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/session.html");
    
    
    
    /*var newSession = createSession();
    log("New session created: " + newSession);    
    //res.redirect("https://b.qeek.me/" + newSession);
    res.redirect(newSession); */
});

//CHECK IF THE REQUESTED GET/* PATH EXISTS, IF SO, RETURN INDEX, IF NOT, RETURN ERROR     
app.get("/*", function(req, res) {  
    //CHECK REQUESTED GET/*
    if(req.path == "/status")
        res.send("<html>Status:<br>Connections: " + Misc.LengthOf(connections) + "<br>Sessions: " + Misc.LengthOf(sessions));
    else if(req.path.indexOf(".") == -1) //verify if the request has no dot, meaning that is session request
        res.sendFile(__dirname + "/public/session.html");
    else    //if any dot is found, 
        res.end();  //finish the response
});

var wordList = [];
var input = fs.createReadStream("words.txt");

readLines(input, function (data) {
    wordList.push(data);
});

function readLines(input, func) {
  var remaining = '';

  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    while (index > -1) {
      var line = remaining.substring(0, index);
      remaining = remaining.substring(index + 1);
      func(line);
      index = remaining.indexOf('\n');
    }
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
  });
}


// start the server on the calculated port and host
httpServer.listen(appEnv.port, function() {
    console.log("server starting on " + appEnv.url)
})

//-----------------------------------------------



var connections = [];

var sessions = [];

wsServer.on("connection", function(sock) {
        
    var connId = "";
    var username = "";
    
    log("New connection.");
    
    wSocket = new Wocket(sock);
    
    wSocket.on("error", function() {
        log("Websocket error.");    
    });
    
    wSocket.on("joinSession", function(sessionId, user) {
    //atribuite id only when joining sessions
    //generate timeout in case information is not send by connected client
                
        if(!sessions[sessionId]) {
            wSocket.emit("joinError", sessionId);
            log("Session join error");
            wSocket.close();
            return;   
        }
        
        //get session ref
        connSession = sessionId;
        username = user;
        /*  Create new connection ID    */
        do {
            connId = Misc.GetAlphaNumId(10);    
        } while(connections[connId]);
          
        connections[connId] = wSocket;
        log("New client ID: " + username + " " + connId);
        /*  -------------------------   */
        
        /*          Join Session        */
        sessions[sessionId].members[connId] = wSocket;
            
        if(sessions[sessionId].hostId == "") {
            sessions[sessionId].hostId = connId;
            wSocket.emit("sessionJoined", "", sessionId, connId);
        } else {
            var hostId = sessions[sessionId].hostId;
            wSocket.emit("sessionJoined", hostId, sessionId, connId);
            //got to have two separate emites due to in case of host it has to be empty and it is changed in the middle way
        }
        
        wSocket.on("close", function() {
            
            if(sessions[sessionId].members[connId])
                delete sessions[sessionId].members[connId];

            if(connections[connId])
                delete connections[connId];
            
            log("Client " + connId + " disconnected.");
            log("Session members: " + Misc.LengthOf(sessions[sessionId].members));
            if(Misc.LengthOf(sessions[sessionId].members) == 0) {
                log("Deleting empty session.");
                delete sessions[sessionId];          
            }
            else if(sessions[sessionId].hostId == connId) {  //so you were the host, need to get a new
            
                log("Host has disconnected. Electing new host...");    
                var newHostId = electHost(sessionId);  
                log("ID: " + newHostId + " is now the new host.");
            
                log("Informing session members...");
                log(Misc.LengthOf(sessions[sessionId].members));
                for(memberId in sessions[sessionId].members) {
                    if(sessions[sessionId].hostId != memberId)
                        sessions[sessionId].members[memberId].emit("newHost", newHostId);
                    else
                        sessions[sessionId].members[memberId].emit("newHost", "");
                }
            
                log("All sessions has been informed.");

                log("Informing host socket is closed");
                sessions[sessionId].members[sessions[sessionId].hostId].emit("peerClosure", connId);
            } else {
                log("Informing peers socket is closed");
                sessions[sessionId].members[sessions[sessionId].hostId].emit("peerClosure", connId);
            }
        });
    });
    
    wSocket.on("peerData", function(destId, sessionId, data) {        

    //maybe implement query id in the future
        try {
            if(sessions[sessionId].members[destId])
                sessions[sessionId].members[destId].emit("peerData", connId, data);
            else
                wSocket.emit("peerDataError", destId, data);
        } catch (error) {}
    });    
});



function createSession() {
    
    do {
        var newSessionId = getWordId();       
    } while(sessions[newSessionId]);
             
    sessions[newSessionId] = new Object();
    sessions[newSessionId].hostId= "";
    sessions[newSessionId].members = [];
    
    return newSessionId;
}

function electHost(sessionId) {
    //for now, take the first client connected
    //in the future, choose based on statistic like better performance or activity
    
    for(memberId in sessions[sessionId].members){
        log("the first member is :" + memberId);
        sessions[sessionId].hostId = memberId;
        log("THE NEW HOST ISSS" + sessions[sessionId].hostId);
        return memberId;
    }
}

function getDataStr(dataObj) {
    return JSON.stringify(dataObj);
}

function getDataObj(dataStr) {
    return JSON.parse(dataStr);
}

function getWordId()
{
    if(wordList.length == 0)
        return null;
    
    var numberFirst = false;
    
    if(Math.random() > 0.5)
        numberFirst = true;
    
    var numberId = Misc.GetNumId(3);
    
    var wIndex = (Math.random() * wordList.length).toFixed(0);  //got to fix 0 decimal places to use an index
    var wordId = wordList[wIndex];  
    
    wordId = wordId.substr(0,wordId.length-1);
    
    if(numberFirst)
        return numberId+wordId;
    else
        return wordId+numberId; 
}

    
function log(string){   //wrap for log info into the console
    cTime = new Date();
    console.log(Misc.GetTimeStamp() + " " + string);
}


    
    


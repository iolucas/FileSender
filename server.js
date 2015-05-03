//--------------------  ACH --------------------//

//GET ALL EXTERNAL MODULES
var cfenv = require("cfenv"),   //get cloud foundry enviroment module
    http  = require("http"),    //get http module
    ws = require("ws"), //get the websocket module
    express = require("express"),   //get express module
    //Wocket = require("../Wocket/Wocket");  //Import MaestroSocket class from MaestroSocket.js
    //IdManager = require("./IdManager"), //get IdManager module
    //Misc = require("./MiscFunctions"),  //Import MiscFunctions class from MiscFunctions.js 

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
    var newSession = createSession();
    log("New session created: " + newSession);    
    res.redirect(newSession); 
});

//CHECK IF THE REQUESTED GET/* PATH EXISTS, IF SO, RETURN INDEX, IF NOT, RETURN ERROR     
app.get("/*", function(req, res) {  
    //CHECK REQUESTED GET/*
    if(req.path == "/status")
        res.send("<html>Status:<br>Connections: " + lengthOf(connections) + "<br>Sessions: " + lengthOf(sessions));
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

wsServer.on("connection", function(socket) {
        
    var connId = "";
    var username = "";
    
    log("New connection.");
    
    socket.on("message", function(message) {
        
        var dataObj = getDataObj(message);
        
        switch(dataObj.type) {
                
            case "joinSession":
                //atribuite id only when joining sessions
                //generate timeout in case information is not send by connected client
                var sessionId = dataObj.data[0];
                var user = dataObj.data[1];
                
                if(!sessions[sessionId]) {
                    socket.send(getDataStr({type: "joinError", data: [sessionId]}));
                    log("Session join error");
                    socket.close();
                    return;   
                }
        
                //get session ref
                connSession = sessionId;
                username = user;
                /*  Create new connection ID    */
                connId = getId(10);    
                while(connections[connId])
                    connId = getId(10);        
                connections[connId] = socket;
                log("New client ID: " + username + " " + connId);
                /*  -------------------------   */
        
                /*          Join Session        */
                sessions[sessionId].members[connId] = socket;
            
                if(sessions[sessionId].hostId == "") {
                    sessions[sessionId].hostId = connId;
                    socket.send(getDataStr({type: "sessionJoined",data: ["", sessionId, connId]}));
                } else {
                    var hostId = sessions[sessionId].hostId;
                    socket.send(getDataStr({type: "sessionJoined",data: [hostId, sessionId, connId]}));
                    //got to have two separate emites due to in case of host it has to be empty and it is changed in the middle way
                }
        
                socket.on("close", function() {
            
                    if(sessions[sessionId].members[connId])
                        delete sessions[sessionId].members[connId];

                    if(connections[connId])
                        delete connections[connId];
            
                    log("Client " + connId + " disconnected.");
                    log("Session members: " + lengthOf(sessions[sessionId].members));
                    if(lengthOf(sessions[sessionId].members) == 0) {
                        log("Deleting empty session.");
                        delete sessions[sessionId];          
                    }
                    else if(sessions[sessionId].hostId == connId) {  //so you were the host, need to get a new
            
                        log("Host has disconnected. Electing new host...");    
                        var newHostId = electHost(sessionId);  
                        log("ID: " + newHostId + " is now the new host.");
            
                        log("Informing session members...");
                        log(lengthOf(sessions[sessionId].members));
                        for(memberId in sessions[sessionId].members) {
                            if(sessions[sessionId].hostId != memberId)
                                sessions[sessionId].members[memberId].send(getDataStr({type: "newHost", data: [newHostId]}));
                            else
                                sessions[sessionId].members[memberId].send(getDataStr({type: "newHost", data: [""]}));
                        }
            
                        log("All sessions has been informed.");

                        log("Informing host socket is closed");
			             sessions[sessionId].members[sessions[sessionId].hostId].send(getDataStr({type: "peerClosure", data: [connId]}));
                    } else {
                        log("Informing peers socket is closed");
			             sessions[sessionId].members[sessions[sessionId].hostId].send(getDataStr({type: "peerClosure", data: [connId]}));
                    }
                });
        
            break;
                
            case "peerData":
            /*          SESSION JOINED              */
            var destId = dataObj.data[0],
                sessionId = dataObj.data[1],
                data = dataObj.data[2];
                
            //maybe implement query id in the future
                try {
                    if(sessions[sessionId].members[destId])
                        sessions[sessionId].members[destId].send(getDataStr({type: "peerData", data: [connId,data]}));
                    else
                        socket.send(getDataStr({type: "peerDataError", data: [destId,data]}));
                } catch (error) {
                    
                }
            break;
        }
    });
    
});



function createSession() {
    
    do {
        var newSessionId = getWordId();       
    } while(sessions[newSessionId]);
    
    /*var newSessionId = getId(5);
        
    while(sessions[newSessionId])
        newSessionId = getId(5);*/
             
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



function lengthOf(obj) {
    var c=0;
    for(var fieldName in obj)
    {
        c++;
    }
    return c;
}

function getId(size)
{
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < size; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getNumber(size)
{
    var text = "";
    var possible = "0123456789";

    for( var i=0; i < size; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


function getWordId()
{
    if(wordList.length == 0)
        return null;
    
    var numberFirst = false;
    
    if(Math.random() > 0.5)
        numberFirst = true;
    
    var numberId = getNumber(3);
    
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
    console.log(cTime.getHours() + ":" + cTime.getMinutes() + ":" + cTime.getSeconds() + "\t" + string);
}


    
    


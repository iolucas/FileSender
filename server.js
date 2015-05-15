//--------------------  ACH --------------------//

//GET ALL EXTERNAL MODULES
var cfenv = require("cfenv"),   //get cloud foundry enviroment module
    http  = require("http"),    //get http module
    ws = require("ws"), //get the websocket module
    express = require("express"),   //get express module
    Wocket = require("./Wocket"),  //Import MaestroSocket class from MaestroSocket.js
    IdManager = require("./IdManager"), //get IdManager module
    Misc = require("./MiscFunctions"),  //Import MiscFunctions class from MiscFunctions.js 

//INIT MODULES
    appEnv = cfenv.getAppEnv(),   // get environmental information for this app
    app = express(),    //inits the express application
    httpServer = http.createServer(app),// create a server with a simple request handler
    wsServer = new ws.Server({ server: httpServer }); //'promotes' the httpserver to a websocket server
    //idManager = new IdManager();  //inits new IdManager instance


//------------------------------------------------------------------------------------//

//SERVE HTTP FILES IN PUBLIC FOLDERS
//app.use(express.static("public"));  
    
//CREATE NEW SESSION AND RESPOND GET/ WITH THE SESSION CREATED
/*app.get("/", function(req, res) {
    var newSession = createSession();
    //timeout in case no one connects to it until one minute, it will be cleared
    setTimeout(function() { 
        if(Misc.LengthOf(sessions[newSession]) <= 0) {
            log("Deleting abandoned session.");
            delete sessions[newSession]; 
        } 
    }, 60000);
    log("New session created: " + newSession);    
    //res.redirect("https://b.qeek.me/" + newSession);
    res.redirect(newSession);
});*/

//CHECK IF THE REQUESTED GET/* PATH EXISTS, IF SO, RETURN INDEX, IF NOT, RETURN ERROR     
/*app.get("/*", function(req, res) {  
    //CHECK REQUESTED GET/*
    if(req.path == "/about")
        res.sendFile(__dirname + "/public/about.html");
    else if(req.path == "/terms")
        res.sendFile(__dirname + "/public/terms.html");   
    else if(req.path == "/getSystemStatus") {
        var statusWord = "<html>Status:<br>Sessions: " + Misc.LengthOf(sessions);

        for(s in sessions)
           statusWord += "<br><br>" + s; 
        res.send(statusWord);
        //res.send("<html>Status:<br>Sessions: " + Misc.LengthOf(sessions));
    }
    else if(!sessions[req.path.substr(1)])   //if the session does not exists
        res.send("Not Found");
    else if(req.path.indexOf(".") == -1) //verify if the request has no dot, meaning that is session request
        res.sendFile(__dirname + "/public/session.html");
    else    //if any dot is found, 
        res.end();  //finish the response
});*/

app.get("/getSystemStatus", function(req, res) {  
    var statusWord = "<html>Status:<br>Sessions: " + Misc.LengthOf(sessions);
    /*for(s in sessions)
        statusWord += "<br><br>" + s; */
    res.send(statusWord);
});


//-----------------------------------------------

var sessions = [];

wsServer.on("connection", function(sock) {
    
    log("New connection.");
    
    wSocket = new Wocket(sock);
    
    var isAliveTimer = setInterval(function() { //set interval to periodic sent isAlive packets
        wSocket.emit("isAlive");
        wSocket.timerToClose = setTimeout(function() {   //set timeout of 1 minute for the connection respond the isAlive msg
            clearInterval(isAliveTimer);    //stop the check isAliveTimer
            wSocket.close();    //close the connection if no response    
        }, 60000);
    }, 70000);
    
    wSocket.on("ImAlive", function() {
        clearTimeout(wSocket.timerToClose);  //clear the close timeout   
    });
    
    wSocket.on("error", function() {
        log("Websocket error.");    
    });
    
    wSocket.on("createSession", function() {
        var newSession = createSession();
        //timeout in case no one connects to it until one minute, it will be cleared
        setTimeout(function() { 
            if(Misc.LengthOf(sessions[newSession]) <= 0) {
                log("Deleting abandoned session.");
                delete sessions[newSession]; 
            } 
        }, 60000);
        log("New session created: " + newSession);    
        //res.redirect("https://b.qeek.me/" + newSession);
        wSocket.emit("sessionCreated", newSession);  
    });
    
    wSocket.on("joinSession", function(connIpv4, sessionAddr, username, deviceType) {
    //generate timeout in case information is not send by connected client
                
        var connId;  //var to store this connection id
        
        //This will not work due to internal proxies of bluemix. We are getting the ip explicitly from the client
        //var connIpv4 = wSocket.getIpv4();   //get connection ip
        
        //sign the Wocket instance some data
        wSocket.username = username;
        wSocket.deviceType = deviceType;
        
        if(!sessions[sessionAddr]) {
            wSocket.emit("joinError", sessionAddr);
            log("Session join error");
            wSocket.close();
            return;   
        }
        
        //If IPV4 Group is not present, create it
        if(!sessions[connIpv4]) {
            log("Creating new IPV4 Group: " + connIpv4);
            sessions[connIpv4] = [];
        }
        
        //CREATE NEW CONNECTION ID
        //Keeps generating 20 chars id until a not used is found
        //Try to find away to lock sessions array to ensure not equal id is got
        do {
            connId = Misc.GetAlphaNumId(20);    
        } while(sessions[connIpv4][connId] || sessions[sessionAddr][connId]);
                 
        sessions[sessionAddr][connId] = wSocket;    //Join session
        
        sessions[connIpv4][connId] = wSocket; //Join ipv4 group
        
        wSocket.connId = connId;    //gets the connection id

        log("New client ID: " + username + " " + connId);
        
        //Set connection sucessfull events....
        
        //On peer data...
        wSocket.on("peerData", function(destId, data) {        
            //maybe implement query id in the future to identify messages
            
            if(sessions[connIpv4][destId]) //check if the destination id belongs to ipgroup
                sessions[connIpv4][destId].emit("peerData", connId, data);               
            else if(sessions[sessionAddr][destId])  //if not, check if the destination id belong to session address
                sessions[sessionAddr][destId].emit("peerData", connId, data);   
            else    //if not, send the sender an error message due to destination not found
                wSocket.emit("peerDataError", destId, data);
        });  
          
        //On connection close...
        wSocket.on("close", function() {          
            if(sessions[connIpv4][connId])    //Check if this connection belong to the ipv4 group
                delete sessions[connIpv4][connId];  //if so, delete it            
           if(sessions[sessionAddr][connId])    //Check if this connection belong to the session address
                delete sessions[sessionAddr][connId];  //if so, delete it        
            log("Client " + connId + " disconnected.");
            log("Session Address members: " + Misc.LengthOf(sessions[sessionAddr]));
            log("IPV4 Group members: " + Misc.LengthOf(sessions[connIpv4]));
            
            //Check if the ipv4 group is empty, if so, delete it, if not inform members this connection is closed
            if(Misc.LengthOf(sessions[connIpv4]) <= 0) {
                log("Deleting empty ipv4 group.");
                delete sessions[connIpv4];          
            } else {
                log("Informing ipv4 group this connection is closed...");
                for(var id in sessions[connIpv4])
                    sessions[connIpv4][id].emit("peerClosure", connId);
                log("All members of the ipv4 group have been informed.");
            }  
            
            //Check if the session is empty, if so, delete it, if not inform members this connection is closed
            if(Misc.LengthOf(sessions[sessionAddr]) <= 0) {
                log("Deleting empty session.");
                delete sessions[sessionAddr];          
            } else {
                log("Informing session this connection is closed...");
                for(var id in sessions[sessionAddr])
                    sessions[sessionAddr][id].emit("peerClosure", connId);
                log("All members of the session have been informed.");
            }
        });            
        
        //Everything is set, inform the connection it has joined
        wSocket.emit("sessionJoined", sessionAddr);
        
        //Informing session and ipv4 group members this device connection and inform this connection all the already connected devices
        
        //Iterate thru the ipv4 group...
        for(id in sessions[connIpv4]) {
            if(id == connId)    //ensure to not send informationto connection itself
                continue;          
            //inform current id this device connection
            sessions[connIpv4][id].emit("NewDevice", connId, username, "local", deviceType);   
            //inform this connection, the current device
            sessions[connIpv4][connId].emit("NewDevice", id, sessions[connIpv4][id].username, "local", sessions[connIpv4][id].deviceType);
        }  
        
        //Iterate thru the session address...
        for(id in sessions[sessionAddr]) {
            if(id == connId)    //ensure to not send informationto connection itself
                continue;          
            //inform current id this device connection
            sessions[sessionAddr][id].emit("NewDevice", connId, username, "session", deviceType);   
            //inform this connection, the current device
            sessions[sessionAddr][connId].emit("NewDevice", id, sessions[sessionAddr][id].username, "session", sessions[sessionAddr][id].deviceType);
        }
    });
});

// Everything is set, start listening Connections
httpServer.listen(appEnv.port, function() {
    console.log("Server starting on " + appEnv.url)
})


function createSession() {
    
    do {
        var newSessionId = IdManager.getWordId();       
    } while(sessions[newSessionId]);
             
    sessions[newSessionId] = [];
    
    return newSessionId;
}

function getDataStr(dataObj) {
    return JSON.stringify(dataObj);
}

function getDataObj(dataStr) {
    return JSON.parse(dataStr);
}
    
function log(string){   //wrap for log info into the console
    cTime = new Date();
    console.log(Misc.GetTimeStamp() + " " + string);
}


    
    


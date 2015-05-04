"use strict"; //ensure exception rise in case of bad pratices use

/*  ----------- TODO LIST ----------------//



----- NOW PRIORITIES  -----

-   Fix bug of in case download file connection made, the download didn't start(align with the upper request)
-   Check bug of sometimes server room got stuck and dont elect new host and dont accepet nor refuse new members(server crashing due trying to send socket data to offline peer)
-   Fix the error of exceeded quota (that means that chrome is not disposing the local storage temp files, must do this manually and files up to 5mb for example, should not use the local storage)
-   Change the very first page due to small icons for recent sites in browsers be nice


----- AFTER PRIORITIES  ----
-   When put a file on the screen, if you click once on it, it will give details like who is downloading etc, and once someone starts download will prompt a message in the screen "john started download it"
-   Once you enter em qeek.me, the HTTP GET will generate a pag and redirect the requester to it
-   Advertises while loading
-   The first time someone enter on the page, an about page will prompt describing it, and a dont show me again box will appear as well
-   Use english and portugueses words as address
-   Hard code words in require module at node js
-   In the upper screen, will be shown the number of connected clients
-   Maybe put qeek.me servers in more than one cloud
-   Its better not implement sharepoint way due to the way you want qeek.me work, placing a file and wherever who got the session download it, not throwing file direct
-   In the app, will have a similar address bar but with "qeek.me/" fixed and you will be able to write folder name only
-   Verify the protocols each browser uses and check the needs of set protocols contraints like fire fox protocol is by default unreliable
-   For a while test qeek.me with holding files into the memory
-   Test unreliable transfer to see if it matches with hack to accelerate
-   Use the host rtc connection to negotiate new connections
-   Make app that will be in background, once you open qeek.me in the same network and drop the files on the celphone it will alert on phone and start receiving it, and in the future the user may register an account to have a permanent page
-   put something similar do sharedrop to recognize same network devices
-   put a sign in system to recognize by avatar or request user to select an avatar image from the pre loaded at the first time and select whether it is a phone, tablet pc etc to be recognized
-   Put message for the user do not close the page until the download is finish
-   WHen downloading file the file owner will view a bar for each downloading peer with the name of who is downloading with the name following the end of the bar, like a car race
-   View about bootstrap, how heavy is it to get the website resposive; if so heavy, create your own way to do this
-   Enhance RTC Conn Framework with the on and emit stuff
-   Check the add candidate callbacks needs (alert on fire fox)
-   The same for setRemoteDesc and setLocalDesc
-   Implement alert interface messages with timeout to show and disapear the alert in the upper screen
-   Create menu for about stuff, change name etc
-   Create icon to copy the session address to copyboard (verify trully need of this
-   Implement better screen for the desktop site
-   implement title to the menu icons (like message and get the file) of qeek(verify if this is really need)
-   In the final version don't show the status connecting, joinning, etc
-   verify if the shown of host election is trully needed
-   Must check whether the browser is chrome last version and firefox last version... if not, block initialization(maybe use this cause individual api detection works better)
-   Implement system to limit download size in case no db system is not available due to it will be placed in the ram
-   once the user connects, prompt it in the msg space
-   Study whether is better to every connected client make it rtc connect to all clients in the room
-   Verify whether the host always accepts or requests connections to remove unnecessary messages like you are the host etc
-   In the chat screen, put some icons with the username of people with the section active, like keywords icons (host must alert every new user connected and disconnected
-   If a download has already been started or completed, it wont disappear if the owner closes it, it will have a msg of owner closed the file or has been disconnected
-   Implement mode to local file inform when it is being downloaded
-   Must implement mode to cancel on progress download or stop it to continue later
-   Implement logic to avoid allowance of same file being downloaded in parallel (to be understood)
-   Improve system to verify whether is something active (session, download) and alert in case user attempt to exit the page
-   Implement system in case private mode is used on fire fox(must verify if private on chrome affects the file system api) limit download size cause it will be store in the memory
-   Implement system to download one file per time per connection not only one download per time for all connections
-   Create websocket wrapper to work like socket io emit and on events mode of register events, with aparently unlimited number of args (MUST CHANGE SERVER ASWELL)
-   Check how to implement reconnection in case of connection lost (WILL BE MADE IN THE ABOVE IMPLEMENTATION)
-   Must implement mode to disconnect from server (is need in some cases, must remember which ones)
-   Advertise based on engineering stuff, calculating time and getting to the result that for small files, qeek me is your best option
-   Implement dynamic amount of chunks per packet and maybe dynamic chunk size due to network dynamic changes
-   Check what is chrome app to implement this system
-   Implement smart mode to elect new host in case host disconnect or have a bad perfomance
-   Must implement system to local files get download requests list to be accepted to cancel if needed and get statistics
-   Test unordered unreliable transfer
-   Implement system in case of rtc connection falls or a timeout expire without data chunk, cancel the download
-   Must verify enhancements in the rtc connections
-   Add icon background red in case of download canceled, stoped, etc DONE
-   Implement system to calculate receiving data rate ,uploding and estimate download finalization
-   Implement system to accept refuse or cancel download
-   use all functions that return operation result values to detect errors
-   In case page is closed, got to register all opened sandbox file system to close them
-   Verify if the local files beeing loaded at filesystem improve the system performance
-   maybe chunks per ack when connecting to a celphone may be changed
-   Implement system that in case of images, change the icon to the miniature
-   Check if a sandbox file already exists for this file, if so, keep wrinting on it where it stopped
-   To verify if it is the same file, randomly read some parts of it and see if it matches
-   Got to improve "message received recognizement"
-   Put different colors for qeek.me chat in different users, in the future implement talk ballons
-   got to improve username receive to avoid accept a lot of spaces as chars
-   Must have a timeout system to send chunks request in case some of them didnt arrive
-   Request will be made every 16 chunks received
-   if timeout expire, will request all the left chunks from the previous 16 chunks packet request
-   Create rtcconnections event as emit and on modes
-   Improve delete system, when one file is selected by holding, the other ones are selected with one click, and one click is enough to deselect any of them
-   Take out the cursor pointer in mobile apps due to mouse pointer is not present
-   Create system of a "online" stream that will act has a turn server to pass data on for non supported qeek.me devices
-   Put the session name at the top of the screen as folder name
-   Put advertise as icons in qeek.me


//  -------------------------------------*/


var wSocket; //Instance to have real time connection with the server

var username = "";  //var to store instance username
    
var hostId = null;  //var to store the connection id of the session host. if undefined, this connection is the host
var myConnId = "";  //var to store your connection id
var newHostFlag = false;

var sendSession;    //var to store the current session address

var rtcConnections = [];

var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;  //verify whether the browser is firefox or other (chrome)

var msgOpened = false;  //flag signalizing whether the msg panel is opened or not
var msgIco = document.getElementById("msgIco"); //variable to store the msgIco element reference
var msgPanel = document.getElementById("msgPanel"); //variable to store the msgPanel element reference


msgIco.addEventListener("click", function(event) {
    if(msgOpened) {
        msgIco.style.opacity = ".5";
        msgPanel.style.display = "none";
        document.querySelector("section").style.overflowY = ""; //allow scroll bar to be shown
        msgOpened = false;
    } else {
        stopFlashMsgIco();
        msgIco.style.opacity = "1"; //light up msg icon
        msgPanel.style.display = "block";   //show message panel
        document.getElementById("inputArea").focus();   //focus text input area
        document.querySelector("section").style.overflowY = "hidden";   //hide scroll bar
        msgOpened = true;   
    }     
});

document.getElementById("inputArea").onkeydown = function(event) { if (event.keyCode == 13) event.preventDefault(); };
document.getElementById("inputArea").onkeyup = function(event) { if (event.keyCode == 13) sendText(); };

function checkCompatibilityAndStart(sessionId, user) {
    
        if (!isRTCReady()) {
        //in the final version, only say that the browser doesn't support the system
        putScreenMsg("The WebRTC APIs are not fully supported in this browser. =/");
        //putScreenMsg("Unfortunatelly qeek.me is not supported in this browser. =/");
        //putScreenMsg("Use the last versions of Chrome or Firefox");
        return;       
    } 
    
    if(!isFileAPIReady()) {
        putScreenMsg("The File APIs are not fully supported in this browser. =/");
        //putScreenMsg("Unfortunatelly qeek.me is not supported in this browser. =/");
        //putScreenMsg("Use the last versions of Chrome or Firefox");
        return;
    }
    
    if(!window.requestFileSystem) {
        putScreenMsg("The File System are not fully supported in this browser. =/");
        //putScreenMsg("Unfortunatelly qeek.me is not supported in this browser. =/");
        //putScreenMsg("Use the last versions of Chrome or Firefox");
        return;
    } else {
        window.requestFileSystem(window.TEMPORARY, 1, function(fs) { //try to request a filesystem to verify its availability
            main(sessionId, user);  //Ok, the browser support all we need
        }, function(err) {
            putScreenMsg("The File System are not able to run on private mode. =/");
        });
    }
}





function main(sessionId, user) {

    username = user;    //get the specified username
    
    sendSession = sessionId;
    
    putScreenMsg("Connecting...");
    
    var localUrl = document.URL.substring(7, document.URL.lastIndexOf("/"));
    wSocket = new Wocket();
    //wSocket = new WebSocket("ws://" + localUrl);
    
    
    wSocket.on("connected", function() {
        putScreenMsg("Connected");
        wSocket.emit("joinSession", sessionId, username);
        putScreenMsg("Joining session " + sessionId + "...");    
    });
    
    wSocket.on("error", function() {
        alert("Socket Error");     
    });
    
    wSocket.on("joinError", function(session) {
        putScreenMsg("Error: The session '" + session + "' no longer exists.");
        putScreenMsg("");
        putScreenMsg("<a href=\"" + window.location.href.substring(0,window.location.href.lastIndexOf("/")) + "\">Click here to create a new session</a>");
        putScreenMsg("<a href=\"javascript: location.reload(true);\">Hard Reload</a>");
        //socket.disconnect();  //got to verify the correct function and manner to disconnect remote host      
    });
    
    wSocket.on("sessionJoined", function(host, session, connId) {
        if(session != sessionId) {
            putScreenMsg("Error: An error ocurred while joining session: '" + session);
            return;
        }
        
        myConnId = connId;

        if(host == "") {
            //putPanelMsg("Session joined. You are the host.","keepLine");
            putPanelMsg("Session joined.","keepLine");
            putPanelMsg("");
            stopFlashMsgIco();
            msgIco.style.opacity = "0.5";
            focusPanel();
            clearScreen();
            
            //document.getElementById("hostIco").style.display = "inline";
        } else {
            hostId = host;
            putScreenMsg("Session joined");
            putScreenMsg("Connecting to the host...");
            
            requestConnection(hostId);
                                 
        }
                
        window.onbeforeunload = function() {
            if(lengthOf(rtcConnections))
            return "Hey, your session is still active!";       
        }
        
        document.getElementsByTagName("body")[0].style.overflow = "visible";       
    });
    
    wSocket.on("peerData", function(senderId, data) {
        switch(data.type) {
                
            case "connRequest": 
                
                if(rtcConnections[senderId]) {
                    //Got to verify whether this connection is currently active instead of verify whether it exists only
                    break;
                }
                
                log(data.sdpOffer);
                rtcConnections[senderId] = new RTCDataChannel(data.sdpOffer);
                rtcConnections[senderId].onAnswerReady = function(sdpAnswer) {
                    sendPeerData(senderId, {
                        type: "connAccepted",
                        sdpAnswer: hackSDP(sdpAnswer)
                    });
                };
                
                rtcConnections[senderId].onChannelOpen = function() {
                    log("CHANNEL OPENED");
                    if(senderId == hostId) {
                        //putPanelMsg("Session joined. You are not the host.","keepLine");
                        if(!newHostFlag) {
                            putPanelMsg("Session joined.","keepLine");
                            putPanelMsg("");
                            stopFlashMsgIco();
                            msgIco.style.opacity = "0.5";
                        }
                        else
                            newHostFlag = false;
                    focusPanel();
                    clearScreen();
                    //sendRTCData(hostId, 8, "");
                    SendRTCData(hostId, 8);
                    } else {
                        //putPanelMsg("You got a new connection.");
                    }
                            
                    rtcConnections[senderId].onChannelClose = function() {
                        if(senderId == hostId) {
                            electNewHost();
                            //if the host disconnect, for a while block the page
                            //log("The session host has disconnected, the page is now stoped");                      
                        }
                        delete rtcConnections[senderId];
                        log(lengthOf(rtcConnections));
                        log("RTC ID: " + senderId + " has disconnected.");
                        //putPanelMsg("Remote connection closed.");
                                

                    };
                    
                    rtcConnections[senderId].onMessage = function(data) {
                        handleData(senderId, data);       
                    };
                
                };
                                 
                rtcConnections[senderId].onIceCandidate = function(candidate) {
                    sendPeerData(senderId, {
                        type: "iceCand",
                        candidate: candidate
                    });
                };
        
                rtcConnections[senderId].createAnswer();
                //rtcConnections[senderId].onChannelClose = function(){log("CHANNEL CLOSED");};
                break;
            
              
            case "iceCand":
                log(data.candidate);
                rtcConnections[senderId].addIceCandidate(data.candidate);
                break;

            case "connAccepted":
                log(data.sdpAnswer);
                rtcConnections[senderId].setRemoteDescription(data.sdpAnswer);
                rtcConnections[senderId].onChannelOpen = function() {
                    log("CHANNEL OPENED");
                    
                    if(senderId == hostId) {
                    //putPanelMsg("Session joined. You are not the host.","keepLine");
                        if(!newHostFlag) {
                            putPanelMsg("Session joined.","keepLine");
                            putPanelMsg("");
                            stopFlashMsgIco();
                            msgIco.style.opacity = "0.5";
                        }
                        else
                            newHostFlag = false;
                                
                        focusPanel();
                        clearScreen();
                        //sendRTCData(hostId, 8, "");
                        SendRTCData(hostId, 8);
                    } else {
                        //putPanelMsg("You got a new connection!");
                    }
                            
                    rtcConnections[senderId].onChannelClose = function() {
                        if(senderId == hostId){
                            electNewHost();
                            
                            //if the host disconnect, for a while block the page
                            //log("The session host has disconnected, the page is now stoped");

                        }
                        delete rtcConnections[senderId];
                        log(lengthOf(rtcConnections));
                        log("RTC ID: " + senderId + " has disconnected.");
                        //putPanelMsg("Remote connection closed.");
                                
                    };
                    
                    rtcConnections[senderId].onMessage = function(data) {
                        handleData(senderId, data);    
                    };
                
                };
                //rtcConnections[senderId].onChannelClose = function(){log("CHANNEL CLOSED");};
                break;
                
            default:
                log("Data not handled. ID: " + senderId + " Data: " + data);
          
        }    
    });
    
    wSocket.on("peerDataError", function(destId, data) {
        putScreenMsg("Error: Connection to the host has failed =(");
        //alert("Error while sending data to " + destId);     
    });
    
    wSocket.on("newHost", function(newHostId) {
        newHostFlag = true;
        log("new host" + newHostId);
        
        if(newHostId == "") {
            //writeMessage("Session Joined. You are the host.");
            //putPanelMsg("New host arrived. You are the new host");
            //putPanelMsg("");
            focusPanel();
            clearScreen();
            hostId = null;
            
        //document.getElementById("hostIco").style.display = "inline";
            
        } else {
            hostId = newHostId;
            //putScreenMsg("New host arrived");
            
            if(rtcConnections[newHostId]){
                //putPanelMsg("You are connnected to the new host");
                focusPanel();
                clearScreen();
                return;        
            }
            unfocusPanel();
            putScreenMsg("Connecting to the new host...");
                    
            //writeMessage("Session Joined. You are not the host.");
            
            requestConnection(newHostId);
                                 
        }          
    });
    
    wSocket.on("peerClosure", function(closeId) {
        if(hostId) //if got host id, means you not are the host, breaks
            return;
        
        broadcastData(myConnId,80,closeId);
                
        if(rtcConnections[closeId]) //check if this peer got any connection with the host
            rtcConnections[closeId].close();  //if so close it
                
        for(var fileId in RemoteFiles) {    //iterate thru all the disconnected client files
            if(RemoteFiles[fileId].FileOwnerId == closeId) {   //check if the file belongs to the connection
                DeleteRemoteFile(fileId);
                        
                if(currDownload && currDownload.id == fileId)
                    currDownload.CancelDownload();
                else
                    DeleteIcon(fileId); //remove the file icon
            }
        }
    });
    
    wSocket.connect("ws://" + localUrl);
}

function requestConnection(remoteId) {
    var newRtcConn = new RTCDataChannel(null);
            
    rtcConnections[remoteId] = newRtcConn;
            
    newRtcConn.onOfferReady = function(sdpOffer) {
        sendPeerData(remoteId,{
            type: "connRequest",
            sdpOffer: hackSDP(sdpOffer)
        });
    };
            
    newRtcConn.onIceCandidate = function(candidate) {     
        sendPeerData(remoteId,{
            type: "iceCand",
            candidate: candidate
        });
    };
            
    newRtcConn.createOffer();
    
    return newRtcConn;
}

function sendPeerData(destId, data) {
    //in the future, maybe use query id
    wSocket.emit("peerData", destId, sendSession, data);
}

function electNewHost() {
    //hostId = null;
    
    //var newUrl = window.location.href.substring(0,window.location.href.lastIndexOf("/"));
    
    //putScreenMsg("The session host has disconnected. <br> This session is now finished.<br><br><a href=\"" + newUrl + "\">Click here to create new host</a>");
    //socket.emit("getHost",sendSession);
    
    putScreenMsg("The host has disconnected. Waiting for a new host...")
    
    unfocusPanel();
}

function SendRTCData(destId, dataCode, data) {
    if(!rtcConnections[destId] || !rtcConnections[destId].readyState()){
       
        //verify if the channel is available to send message
        return false;   //if not, return false
    }
    
    if(dataCode && data)
        rtcConnections[destId].sendData(getDataStr({
            code: dataCode,
            data: data
        }));
    else if(dataCode)
        rtcConnections[destId].sendData(getDataStr({
            code: dataCode
        }));
    else if(data)
        rtcConnections[destId].sendData(getDataStr({
            data: data
        }));
    else
        return false;
    
    return true;
}

function SendChunkData(destId, chunkData) {
    if(!rtcConnections[destId] || !rtcConnections[destId].readyState())     //verify if the channel is available to send message
        return false;   //if not, return false
    rtcConnections[destId].sendData(chunkData);
    return true;
}

function handleData(senderId, recData) {
    if(recData.byteLength) {  //check if this is a file chunk (check a ArrayBuffer member)
        if(RemoteFiles[currDownload.id].FileOwnerId == senderId) { //if so, check if the sender id is the owner of the file being downloaded
            currDownload.setFileChunk(recData); //if so, set the file chunk
            if(currDownload) {  //if the still isn't complete, update its info
                var percent = currDownload.getProgress();   //the the percentage value of the progress
                Icons[currDownload.id].ChangeLoadPct(percent);   //change the load bar of the receiving file  
                Icons[currDownload.id].ChangeIconMsg("Downloading... " + percent + "%");    //change the load msg of the receving file
            }
        }
        return; //than, return
        
    } else if(typeof recData == "object" && !recData.code) { //blob to be converted
        var fileReader = new FileReader();
        fileReader.onload = function() {
            handleData(senderId, this.result);
        };
        fileReader.readAsArrayBuffer(recData);
        return; 
    }

    /*----Messages Codes----//
        
    5-> General Broadcast   
    10-> Text Message 
    11-> Other
    
    //---------------------*/
    
    if(recData.code)    //if the received data is already "objtified"
        var recDataObj = recData;   //keep it this way
    else    //otherwise
        var recDataObj = getDataObj(recData);   //objtifie it
    
    var dataCode = recDataObj.code;
    
    switch(dataCode) {    //checks the code of the data packet
            
        case 5: //code signalizing this should be broadcast to all connections
            if(hostId)  //if got any host id, that mean that the connection is not the host and must not be able to broadcast
                break;
            
            broadcastData(senderId, recDataObj.data.code, recDataObj.data.data);   //broadcast msg for all connections
            handleData(senderId, recDataObj.data); //handle the packet on host connection 
            
            break;
            
        case 8: //code requesting update for all files opened
            if(hostId)
                break;
            
            for(fileId in LocalFiles)
                SendRTCData(senderId, 30, { fileId: fileId, owner: username }); //send the file for the connection
            
            for(fileId in RemoteFiles)
                SendRTCData(senderId, 30, { fileId: fileId, owner: RemoteFiles[fileId].FileOwnerName }); //send the file for the connection
            
            break;
            
        case 10:    //code for basic text msg
            putPanelMsg(recDataObj.data);
            break;
            
        case 30:    //code for data available
            log(recDataObj);
            var fileId = recDataObj.data.fileId;
            var fileOwner = recDataObj.data.owner;
            var fileInfo = getFileInfo(fileId);
            var newRemoteFile = CreateRemoteFile(fileId, fileInfo[0], fileInfo[1], fileOwner); //create a file register with the received file data
            
            if(!newRemoteFile)  //if the file already exists, return
                return;
                
            var newIcon = CreateIcon(fileId, newRemoteFile.name, newRemoteFile.type, newRemoteFile.size, "Click for download the file", fileOwner);
    
            newIcon.onClick = function() {
                
                if(newRemoteFile.downloaded)    //if the file has already been downloaded, return
                    return;
        
                var requestDownload = function() {                           
                    RequestDownload(fileId);
                }
                    
                if(!rtcConnections[newRemoteFile.FileOwnerId]) { //if it is not connected to the remote host, connect it
            
                    var newRtcConn = requestConnection(newRemoteFile.FileOwnerId);
                        newRtcConn.onChannelOpen += function() {
                        //requestDownload();          //not working =\  
                            //alert("oieee");
                    };       
 
                }
                else {  //alert("already got connection");
                    requestDownload();    
                }
            };

            break;
            
        case 31:    //code for data available
            
            var fileId = recDataObj.data;
            
            DeleteRemoteFile(fileId); //remove a file register with the just received file data           

            if(currDownload && currDownload.id == fileId)
                currDownload.CancelDownload();
            else
                DeleteIcon(fileId); //remove the file icon
            break;
            
        case 40: //code for request file for download
            
            var fileId = recDataObj.data;
            
            if(LocalFiles[fileId])    //check if the file exists
                SendRTCData(senderId, 41, fileId);    //accepts downloads request
            else
                SendRTCData(senderId, 42, fileId);    //if the file were not found refuse the download
            break;
            
        case 42: //code for download refused
            //alert("download of " + encode(decData) + " has been refused.");
            var fileId = recDataObj.data;
            RefuseDownload(fileId);

            //alert("download of " + fileId + " has been refused.");
            
            break;
            
        case 44: //request chunks
            
            var fileId = recDataObj.data.fileId,
                chunkPointer = recDataObj.data.chunkPointer;
            
            if(LocalFiles[fileId]){
                for(var i = 0; i < chunksPerAck;i++)
                    LocalFiles[fileId].readChunk(chunkPointer + i, senderId);    
            }
            
            break;
            
        case 80:
            var closeId = recDataObj.data;
                
                if(rtcConnections[closeId]) //check if this peer got any connection with the host
                    rtcConnections[closeId].close();  //if so close it
                
                for(var fileId in RemoteFiles) {    //iterate thru all the disconnected client files
                    if(RemoteFiles[fileId].FileOwnerId == closeId) {   //check if the file belongs to the connection
                        DeleteRemoteFile(fileId);          
                        if(currDownload && currDownload.id == fileId)
                            currDownload.CancelDownload();
                        else
                            DeleteIcon(fileId); //remove the file icon
                    }
                }
            break;
            
        default:
            log("ERROR: Not handled data. ID: " + senderId);
            log("Object: " + recData);         
    }
}



function broadcastData(senderId, dataCode, data, loopback) {  //loopback for signaling whether the sender wants to receive the msg
    if(hostId)  //if got any host id, that mean that the connection is not the host
        SendRTCData(hostId, 5, { code: dataCode, data: data }); // and must send the broadcast packet to host
    else
        for (var connId in rtcConnections)   //iterate thru all the stabilished connections with the host,
            if(connId != senderId)
                SendRTCData(connId, dataCode, data); // and send them the packet received 
}

function broadcastMsg(message) {   
    broadcastData(myConnId, 10, message);  //broadcast data with data code 10 - msg code
}

function hackSDP(sdp) {
/*    var split = sdp.split("b=AS:30");
    if(split.length > 1)
        var newSDP = split[0] + "b=AS:1638400" + split[1];
    else
        newSDP = sdp;
        return newSDP;*/
    
    return sdp;
}

function sendText(){
    var inputTxt = document.getElementById("inputArea");
    
    if(inputTxt.value == "")
        return;
    
    broadcastMsg(username + ": " + inputTxt.value);
    putPanelMsg(username + ": " + inputTxt.value);

    inputTxt.value = "";
    inputTxt.focus();
}

function encode(dataArray) {   
    var result = "";    
    for(var i=0;i<dataArray.length;i++)
        result += String.fromCharCode(dataArray[i]);  
    return result;
}

function decode(dataString) {
    var dataArray = [];
    for(var i=0;i<dataString.length;i++)
        dataArray.push(dataString.charCodeAt(i));
    return dataArray;
}


function focusPanel(){
    document.getElementById("focus").style.display = "none";
}

function unfocusPanel(){
    document.getElementById("focus").style.display = "block";
}

function putScreenMsg(message){
    document.getElementById("focusMessage").innerHTML += message + "<br>";   
}

function clearScreen() {
    document.getElementById("focusMessage").innerHTML = "";    
}

function putPanelMsg(message, type){
    
    if(message==""){
        document.getElementById("displayMsg").innerHTML += "\n";
    } else if(!type){
        document.getElementById("displayMsg").innerHTML += "\n" + getTimeStamp() + " " + message;
    } else if(type == "keepLine") {
            document.getElementById("displayMsg").innerHTML += getTimeStamp() + " " + message;      
    }
    
    document.getElementById("displayMsg").scrollTop = document.getElementById("displayMsg").scrollHeight;
    
    if(!msgOpened)
        flashMsgIco();
    
    /*else if(type=="warning") {
        document.getElementById("displayMsg").innerHTML += "<span id=\"warning\">" + cTime.getHours() + ":" + cTime.getMinutes() + " " + message + "\n" + "</span>";  
    } else if(type=="alert") {
        document.getElementById("displayMsg").innerHTML += "<span id=\"alert\">" + cTime.getHours() + ":" + cTime.getMinutes() + " " + message + "\n" + "</span>";
    }*/
}
    
var flashId = null;

function flashMsgIco() {  
    if(flashId) //if flash id has already an id signed to it, returns
        return;    
    
    flashId = setInterval(function() {
        if(msgIco.style.opacity == "1")
            msgIco.style.opacity = "0.5";   
        else
            msgIco.style.opacity = "1";
    }, 500);    
}

function stopFlashMsgIco() {
    if(!flashId)
        return;
    
    clearInterval(flashId);    
    flashId = null;       
}
    

function log(message) {
    console.log(message);
}

function getDataStr(dataObj) {
    return JSON.stringify(dataObj);
}

function getDataObj(dataStr) {
    return JSON.parse(dataStr);
}



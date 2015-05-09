"use strict"; //ensure exception rise in case of bad pratices use

var username = "";  //var to store instance username
var sessionAddr = window.location.pathname.substr(1);    //Get sessionAddress from the address bar 
var deviceType = isMobile() ? "mobile":"pc";    //Get deviceType    

var wSocket; //Instance to have real time connection with the server

var rtcConnections = [];

var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;  //verify whether the browser is firefox or other (chrome)
           
window.onload = function() {              
    //Check compatibility, if not, return and inform
    if(!CheckCompatibility()) {
        alert("This browser is not compatible");    
        return;
    }               
    username = getCookie("username");   //Get username cookie, if not, request one               
    if(username != "")  //if it does exists, 
        main();   //starts the application with the username speficified, session and deviceType
    else    //if not,
        document.getElementById("welcome").style.display = "table";  //display the screen to insert a username
};
             
function setUserAndStart() {              
    if(!document.getElementById("terms").checked)   //if the terms are not checked, return
        return;                
    var textValue = document.getElementById("userInput").value; //get the typed text               
    if(textValue == "") //if it is empty, return
        return;              
    setCookie("username", textValue, 1);    //set username cookie with the textvalue                  
    username = textValue;   //set the username with the textvalue              
    document.getElementById("welcome").style.display = "none";  //hide welcome screen               
    main();   //starts the application with the username speficified, session and deviceType
}   



//--------------  MAIN FUNCTION TO BE EXECUTED TO START EVERYTHING  --------------//

function main() {
    //Set user info in the top of the screen
    SetLocalUser(username, sessionAddr, deviceType);
    
    var devices = [];   //array to store devices
    
    //gets websocket server url
    var wsUrl = document.URL.substring(7, document.URL.lastIndexOf("/"));
    
    wSocket = new Wocket(); //create new wocket instance
    
    var rtcManager = new SmartRTC(function(id, data) {
        wSocket.emit("peerData", id, data);
    });
    
    rtcManager.OnConnection = function(id, dataChannel) {
        log("CHANNEL OPENED");    
        
    };

    wSocket.on("error", function() {
        alert("Socket Error");     
    });
    
    wSocket.on("connected", function() {
        
        wSocket.on("joinError", function(session) {
            ShowMessage("Error: The session '" + session + "' no longer exists. Please try again.", "#a00");
            wSocket.close();    //then, close the connection   
        });
        
        wSocket.on("sessionJoined", function(session) {
            
            if(session != sessionAddr) {  //if session joined is different from the local one
                ShowMessage("Error: An error ocurred while joining session: '" + session, "#a00");
                wSocket.close();    //then, close the connection
                return; //and return
            }

            /*  LATER WE TURN THIS ON    
            window.onbeforeunload = function() {
                if(lengthOf(rtcConnections))
                return "Hey, your session is still active!";       
            }*/           

            ShowTempMessage("Conectado!", 3000);
        });
        
        wSocket.on("NewDevice", function(dId, dName, dOrigin, dType) {
            if(devices[dId])    //if this device exists, 
                return; //do nothing and returns
            
            ShowTempMessage("Novo dispositivo!", 3000);
            
            //creates new object for the arrived device
            devices[dId] = { devId: dId,    //puts the device id in the device object    
                            devName: dName,
                            devOrigin: devOrigin,
                            devType: dType }
            
            //gets the device type message
            var devOrigin;
            if(dOrigin == "session") devOrigin = "Dispositivo de Sessão";
            else if(dOrigin == "local") devOrigin = "Dispositivo Local";
            else devOrigin = "ErrorOnGettingDevice";
            
            //creates a new device icon
            var deviceIcon = new DeviceIcon(dName, devOrigin, dType, function(icon, file) {
                icon.setUploadProgress(0, file.size);
                icon.setUploadState("Conectando...");
                icon.setUploadName(file.name);
                icon.showUpload();
                
                rtcManager.NewConnection(dId);
            
            }, function(){}, function(){
                
            
            
            });
            
            devices[dId].Icon = deviceIcon; //put the icon ref in the new device object
        });       
        
        wSocket.emit("joinSession", localIp, sessionAddr, username, deviceType);
    });
    
    wSocket.on("peerDataError", function(destId, data) {
        ShowTempMessage("Error: Peer data sent error =(", 5000, "#800");    
    });
    
    wSocket.on("peerClosure", function(closedId) {
        if(!devices[closedId])  //checks if the id is not present on this instance
            return; //if so, return and do nothing      
            
        //Close the correspondent icon
        devices[closedId].Icon.DeleteDevice();
        
        ShowTempMessage(devices[closedId].devName + " has disconnected.", 3000, "#800");
        
        delete devices[closedId];   //deletes the device reference from the devices array
        
        /*if(hostId) //if got host id, means you not are the host, breaks
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
        }*/
    });
    

    //CHANGE FOR DEVICE DATA
    wSocket.on("peerData", function(senderId, data) {
        log(data);
        rtcManager.HandleData(senderId, data);    
    });
    

    //All set, connect websocket
    ShowMessage("Conectando...");
    wSocket.connect("ws://" + wsUrl);
}

function CheckCompatibility() {
    return isRTCReady();
    //must check whether websocket is available, despite something have webrtc and dont have websocket isn't very possible
}

/*
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
*/
/*
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
}*/

function sendPeerData(destId, data) {
    //in the future, maybe use query id
    wSocket.emit("peerData", destId, data);
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
  

function log(message) {
    console.log(message);
}

function getDataStr(dataObj) {
    return JSON.stringify(dataObj);
}

function getDataObj(dataStr) {
    return JSON.parse(dataStr);
}



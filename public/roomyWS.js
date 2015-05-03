function RoomyWS() {
    
    /*
        RoomyWS is a enhanced websocket wrapper to enhance is usage
    */
    
    var socket; //socket to hold websockets information
    
    var events = new Object;    //object to store the signed events
    
    this.connect = function(hostAddr) {
        try {   
            socket = new WebSocket(hostAddr);   //inits the websocket with the address specified
            
            socket.onopen = function() {    //signs the onopen event
                
                socket.onmessage = function(message) {  //signs the onmessage event
                    var dataObj = getDataObject(message);   //get the data object from the received string
                    var event = dataObj.event;  //get the event name from the data obj
                    var args = dataObj.args;    //get the args from the data obj              
                    
                    if(events.event)    //if the event received is signed, 
                        events.event.apply(this, args); //fire it with the args and its scope as "this" value
                };
                
                socket.onerror = function(error) {  //signs the onerror event
                    throw "socketError";          //throw a simple socketError message           
                };
                
                socket.onclose = function(closeEvt) {   //signs the close event
                    
                    socket = null;  //clear the socket reference
                    
                    if(events.disconnected)    //if the disconnected event is signed, 
                        events.disconnected(closeEvt); //fire it
                };
                
                if(events.connected)    //if the connected event is signed, 
                    events.connected(); //fire it
            };
        }
        catch(ex) {  //if any exception occurs, throw it here
            if(events.error)
                events.error(ex);
        }     
    };
    
    this.disconnect = function() {
        socket.close();     //close the socket connection 
    };
      
    this.emit = function() {
        try{
            if(socket.readyState != WebSocket.OPEN) //check if the socket is opened
                throw "socketNotOpen";  //if not, throw an error socket not open
        
            var args = [].slice.call(arguments) // slice without parameters copies all

            var dataObj = { event: args.shift(), args: args };  //create the data object with the data passed
            
            socket.send(getDataString(dataObj));    //send the data string generated from the the dataobj
            
            return true;
        }
        catch(ex) {
            if(events.error)
                events.error(ex); 
        }
    };
           
    this.on = function(event, method) {
        events.event = method;  //add the specified event to the events handler         
    };
    
    this.clear = function(event) {  //clear the specified event handler
        if(events.event)
            delete events.event;        
    }
        
    this.isConnected = function() {
        if(socket.readyState == WebSocket.OPEN) //check if the ready state is open
            return true;    //if so, return true
        return false;   //if it anything but not open, return false
    };   
}

function getDataString(obj) {
    return JSON.stringify(object);
}

function getDataObject(str) {
    return JSON.parse(str);
}
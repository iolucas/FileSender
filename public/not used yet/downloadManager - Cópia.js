//var chunkSize = 16000;  //if we use more than 16kb files get corrupted on fire fox
//var chunksPerAck = 16;
//var chunkTimeOut = 500; //time out in miliseconds until a chunk request is sent in case of no answer
//since this time this is a reliable connection, timeout stuff wont be necessary

var currDownload = null;    //instance to hold in progress downloads
var downloadQueue = []; //download queue

//window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem; //get the request file system reference

window.requestFileSystem = window.requestFileSystem ||
                           window.webkitRequestFileSystem;
window.URL = window.URL || window.webkitURL;

function RequestDownload(fileId) {

    if(!RemoteFiles[fileId] || RemoteFiles[fileId].downloaded)    //check if the file exist or if it has already been downloaded, if not, return false
        return false;
    
    if(currDownload) {   //check if a download instance is in use, if so,
        
        if(currDownload.id == fileId)   //check if the download in progress is the requested file
            return false;   //if so, return false
        
        for(var ind in downloadQueue)   //iterate thru the queue
            if(downloadQueue[ind] == fileId)    //check if the reference is already in the queue
               return false;   //if so, return false     
        
        downloadQueue.push(fileId); //if not, put the file download in the queue
        Icons[fileId].ChangeIconMsg("Download in the queue");   //put in the icon the "download in queue" msg
        return true;    //and return true
    }
    
    //if currDownload is null, so we can create a new download instance 
    return NewDownloadFile(fileId);
}

function NewDownloadFile(fileId) {
    if(!RemoteFiles[fileId] || RemoteFiles[fileId].downloaded)  //check if the file exist or if it has already been downloaded, if not, return false
        return false;
    
    var remoteFile = RemoteFiles[fileId];   //get the remote file ref that we will be downloading
    currDownload = new DownloadFile(fileId, remoteFile.name, remoteFile.size, remoteFile.type); //create new download file instance
    
    currDownload.onChunkRequest = function(fileId, chunkPointer) {
        SendRTCData(remoteFile.FileOwnerId, 44, { fileId: fileId, chunkPointer: chunkPointer });    //request chunk  
    };
       
    currDownload.onDownloadComplete = function() {         
        currDownload = null;  //clear download instance register
        RemoteFiles[fileId].downloaded = true;  //flag the downloaded flag
        
        Icons[fileId].ChangeLoadPct(100); //changes the icon load bar do 100%
        Icons[fileId].ChangeIconMsg("Download complete!");  //show the download complete msg at the icon
        
        if(downloadQueue.length == 0)   //if the download queue is 0, return
            return;
        
        do {    //keep processing the queue until an still present id is available
            var newDownloadId = downloadQueue.shift();
        } while (RemoteFiles[newDownloadId]);
        
        NewDownloadFile(newDownloadId);  //if it is not 0, take the first member of the queue and start a new download     
    }
    
    currDownload.onDownloadCanceled = function() {
        currDownload = null;  //clear download instance register
        
        Icons[fileId].ChangeIconMsg("Download Canceled - Click for delete");
        Icons[fileId].onClick = function() {
            DeleteIcon(fileId); //remove the file icon
        };
        Icons[fileId].ChangeBGColor("#800");
        
        if(downloadQueue.length == 0)   //if the download queue is 0, return
            return;
        
        do {    //keep processing the queue until an still present id is available
            var newDownloadId = downloadQueue.shift();
        } while (!RemoteFiles[newDownloadId]);
        
        NewDownloadFile(newDownloadId);  //if it is not 0, take the first member of the queue and start a new download 
    }
    
    Icons[fileId].ChangeIconMsg("Requesting file...");  //inform icon that a download has been requested
            
    currDownload.StartRequestChunk();   //start the requesting chunk proceedures   
    
    return true;    //if everything goes good until here, return true
}

function DownloadFile(fileId, fileName, fileSize, fileType) {    
    var self = this; //gather this object ref to be passed to another objects/function 
    
    //var state = 0;    //verify if this is trully needed
    /*  Download States
    0-  To be started
    1-  On Progress
    2-  Stopped-> Will be implemented in the future 
    */
    
    self.id = fileId;   //var to store the file id
    self.name = fileName;   //var to store the file name
    self.size = fileSize;   //var to store the file size
    self.type = fileType;   //var to store the file type
    
    var buffer = [];    //file buffer to store the remote file data
    
    var canceled = false;
    
    var recBuffLength = 0;  //var to store the amount of data already received
    self.getLen = function() {return recBuffLength;};
    var currChunkPointer = 0 - chunksPerAck;   //pointer to reference the next initial chunk value (the operation is a hack to make it start at 0)
    var chunksToBeReceived = 0; //var to store the chunks left until the next request
    
    var fileSystem = null;   //var to store the file system ref
    window.requestFileSystem(window.TEMPORARY, fileSize, function(fs) { //method to request a filesystem space
        
        fileSystem = fs;
        //log("Local file system created");
        
        //log("Checking if the file exist...");
        fileSystem.root.getFile(fileName, { create: false }, function(fileEntry) { //try to open the file
            //log("File exists. Removing it..."); 
            fileEntry.remove(function() {  //if it open sucessfully, remove it
                //log("File removed.");  
            }, errorHandler);       
        }, function(e) {/*log("File does not exists.");  */});
    }, errorHandler);/*function(e) {
        log("oi"+fileSize);
        log("errorcode"+e.target.errorCode);
        log(FileError.QUOTA_EXCEEDED_ERR);
        log(e);
        log(e.target);
        log(e.target.error);
        errorHandler(e);
    }*/
    
    //must remove the file id if it exists
    
    self.getProgress = function() {
        return (recBuffLength * 100 / self.size).toFixed(1);  
    }
    
    var requesting = false; //already requesting chunks flag
    
    self.StartRequestChunk = function() {
        if(requesting)  //check if the instance is already requesting chunks, 
            return false;   //if so return false        
        requesting = true;  //if not, flag the requesting flag       
        requestNextChunks();    //and request chunks        
        //since this time this is a reliable connection, timeout stuff wont be necessary
        //set time out in case no response
        //every chunk received will reset the timeout        
        return true;
    }
    
    self.CancelDownload = function() {

        canceled = true;    //cancel download flag
        
        buffer = null;  //clear the download buffer reference
        
        //remove this file from the file system
        fileSystem.root.getFile(fileName, { create: false }, function(fileEntry) { //try to open the file
            fileEntry.remove(function() {  //if it open sucessfully, remove it
            }, function(e) {});       
        }, function(e) {});
        
        if(self.onDownloadCanceled)
            self.onDownloadCanceled();              
    };
    
    var requestNextChunks = function() {    //method to get the next chunks list to request
        buffer = [];
        chunksToBeReceived = chunksPerAck;  //reset the number of chunks expected to be received      
        currChunkPointer += chunksPerAck;   //add the chunks per ack value into the pointer
  
        if(self.onChunkRequest)  //if the event has been signed and the chunks to request is not empty
            self.onChunkRequest(self.id, currChunkPointer);    //fire the event  
    }
    
    //self.StopRequestChunks;  //method to stop request chunks due to any event
        
    self.onChunkRequest;    //event to be called everytime a chunk need to be request, due to "timeout" events or "all chunks request has been received" event
    
    self.onDownloadComplete;    //event to be called once the download has been completed
    self.onDownloadCanceled;    //event to be called once the download has been canceled
    
    self.setFileChunk = function(chunkData) {        
        
        //Checks whether all conditions to continue are matched        
        if(chunkData.length > chunkSize) //checks whether the chundata length is bigger than chunk size value
            return false; //if so the chunk is bad, return false
        
        chunksToBeReceived--;   //decrement the number of chunks expected to be received
        
        recBuffLength += chunkData.byteLength;
        
        buffer.push(chunkData); //put the just received data in to the buffer
        
        if(chunksToBeReceived == 0 || recBuffLength >= self.size)   //if the chunks to be received are 0 or the total length expected has been received,
            if(fileSystem)
                storeAtFile();  //store buffer data at the file
            else
                setTimeout(function() { storeAtFile(); }, 500);//in case fileSystem is null timeout to have enough time to create a filesystem 
                 
        return true;    //if everything goes good, return true        
    };
    
    function storeAtFile() {
        
        fileSystem.root.getFile(self.name, { create: true, exclusive: false }, function(fileEntry) { //try to open the file
            fileEntry.createWriter(function(fileWriter) {   //create a writer to write the file chunk into the file   
                fileWriter.seek(fileWriter.length); // Start write position at last position               
                fileWriter.onwriteend = function() {   //to be executed once the write event finishes                   
                    if(fileWriter.length >= self.size) {    //verify if all the expected data has been received  
                          //isFirefox = true;               
                        //if(isFirefox)
                            fileEntry.file(function(newFile){
                                saveBlobLocally(newFile, self.name);  //create new blob with the fileEntry with the file name
                            });
                        //else
                            //saveBlobLocally(fileEntry.toURL(), self.name);  //create new blob with the fileEntry with the file name

                        var timeOutValue = 30*1000; //set time out time to 30 seconds
                                                
                        setTimeout(function() { //set timeout to remove the file from the file system sandbox
                            fileEntry.remove(function(){}, null);   //remove the file in the sandbox
                        }, timeOutValue);
                        
                        if(self.onDownloadComplete) //if the download complete event has been signed,
                            self.onDownloadComplete(self.id);   //fire it
                        
                    } else //if the data is not full received yet, request new chunks
                        requestNextChunks();  
                };

                fileWriter.onerror = function(e) {
                    alert('Write failed: ' + e.toString());
                };
                
                // Create a new Blob and write it
                fileWriter.write(new Blob(buffer, { type: self.type }));
                
            }, function(e){
                if(!canceled)   //if download is not canceled, so handle the error
                    alert("error1" + e.name + " " + e.message);
            });   
        
        }, function(e){
            if(!canceled)   //if download is not canceled, so handle the error
                alert("error2" + e.name + " " + e.message);
        });
    }
}

function RefuseDownload(fileId) {
    alert("download of " + fileId + " has been refused.");
    
/*    if(Downloads[0] != fileId)
        alert("another strange error: this fileId should be in the first index");
    else
        Downloads.shift();     */
}

function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}

function saveBlobLocally(blob, name) {     //method to locally download the file in browsers memory    
    if (!window.URL && window.webkitURL)
        window.URL = window.webkitURL;
    var a = document.createElement('a');
    a.download = name;
    //if(isFirefox)
        a.setAttribute('href', window.URL.createObjectURL(blob));
    //else
        //a.setAttribute('href', blob); 
    document.body.appendChild(a); 
    a.click();
    document.body.removeChild(a);   //remove the link child
}
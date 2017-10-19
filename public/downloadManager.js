var localStorager = new LocalStorager();

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
    var downReady = false;
    var canceled = false;
    
    var recBuffLength = 0;  //var to store the amount of data already received
    self.getLen = function() {return recBuffLength;};
    var currChunkPointer = 0 - chunksPerAck;   //pointer to reference the next initial chunk value (the operation is a hack to make it start at 0)
    var chunksToBeReceived = 0; //var to store the chunks left until the next request
    
    localStorager.NewFile(fileId,fileName,fileSize, fileType, function() {
        downReady = true;
    });

    
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
        localStorager.DeleteFile(self.id, function(e) {
            if(e)
                log(e);
            /*else
                log("File deleted");*/            
        });      
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
        
    self.onChunkRequest;    
    //event to be called everytime a chunk need to be request, due to "timeout" events or "all chunks request has been received" event
    
    self.onDownloadComplete;    //event to be called once the download has been completed
    self.onDownloadCanceled;    //event to be called once the download has been canceled
    
    self.setFileChunk = function(chunkData) {        
        
        //Checks whether all conditions to continue are matched        
        if(chunkData.length > chunkSize) //checks whether the chundata length is bigger than chunk size value
            return false; //if so the chunk is bad, return false
        
        chunksToBeReceived--;   //decrement the number of chunks expected to be received
        
        recBuffLength += chunkData.byteLength;
        
        buffer.push(chunkData); //put the just received data in to the buffer
        
        if(chunksToBeReceived == 0 || recBuffLength >= self.size) {  
        //if the chunks to be received are 0 or the total length expected has been received,
            if(downReady) { //check if the file was already created, 
                appendFile();
            }
            else {  //if not, wait a few milliseconds for it to be created
                setTimeout(function() { 
                    appendFile()
                }, 500);//in case fileSystem is null timeout to have enough time to create a filesystem 
            }
        }
        
        function appendFile() {
            localStorager.AppendFile(self.id, buffer, function(completed) {
                if(completed) {
                    localStorager.GetFile(self.id);
                    setTimeout(function() {
                        localStorager.DeleteFile(self.id);      
                    }, 30000);
                        
                    buffer = null;  //clear buffer accumulator
                    
                    if(self.onDownloadComplete) //if the download complete event has been signed,
                        self.onDownloadComplete(self.id);   //fire it
                        
                } else
                        requestNextChunks();
            });   
        }
    };
}

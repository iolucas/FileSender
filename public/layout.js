var menuOpened = false; 
//set menu stuff
document.body.addEventListener("click", function() {
    if(menuOpened) {
        HideMenu();
        menuOpened = false;    
    }
});  

document.getElementById("user").addEventListener("click", function(e) {
    if(!menuOpened) {
        //cancel bubble to prevent body click event to happen due to event continues to propagate to parent elements
        e.cancelBubble = true;
        menuOpened = true; 
        ShowMenu();  
    }
});

function ShowMessage(message, backColor) {
    if(!backColor)
        backColor = "#00a";    
    document.getElementById("message").style.backgroundColor = backColor;
    document.getElementById("message").innerHTML = message;
    document.getElementById("message").style.display = "block";    
}

var tOutRef;
function ShowTempMessage(message, time, backColor) {
    if(tOutRef) clearTimeout(tOutRef);  //clear current timeout 
    ShowMessage(message, backColor);    //show message
    tOutRef = setTimeout(function() {   //set timeout to hide message
        HideMessage();    
    }, time);
}

function HideMessage() {
    document.getElementById("message").style.display = "none";   
}

function DeviceIcon(deviceName, deviceOrigin, deviceType, uploadCallback, cancelDownCallback, cancelUpCallback) {
    
    var self = this;
    var parent = document.getElementById("section");
    var newDevice = document.createElement("div");
    newDevice.setAttribute("class", "device");
    
    //  Device Layout //
    
    var mainDevice = document.createElement("table");
    mainDevice.setAttribute("class", "mainDevice");
    
    var row = document.createElement("tr");
    
    var devIcoTd = document.createElement("td");
    devIcoTd.setAttribute("class", "mainImgTd");
    
    var devIco = document.createElement("img");
    devIco.setAttribute("class", "mainImg");
    if(deviceType == "mobile")
        devIco.src = "img/mob.png";
    else if(deviceType == "tablet")
        devIco.src = "img/tab.png";
    else
        devIco.src = "img/comp.png";
    
    var devNameTd = document.createElement("td");
    devNameTd.setAttribute("class", "deviceName");
    devNameTd.innerHTML = deviceName + "<br><span>" + deviceOrigin + "</span>";
    
    var fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    fileInput.addEventListener("change", function(event) {
        var file = event.target.files; // get the files selected in the input file
        uploadCallback(self, file[0]);
        fileInput.value = "";    //clear input file data to be able load same data if need in the next operation
    });
    
    var upIcoTd = document.createElement("td");
    upIcoTd.setAttribute("class", "mainImgTd");
    
    var upIco = document.createElement("img");
    upIco.src = "img/up.png";
    upIco.setAttribute("class", "uploadImg");
    upIco.addEventListener("click", function() {
        //uploadCallback(self);
        fileInput.click();
    });
    
    //  Download Layout //
    
    var download = document.createElement("table");
    download.setAttribute("class", "transfer");
    
    var downTimeOut;
    
    download.addEventListener("mousedown", function() {
        downTimeOut = setTimeout(function() {
            cancelDownCallback(self);
        }, 1000);
    });
    
    download.addEventListener("mouseup", function() {
        clearTimeout(downTimeOut);
    });
    
    var drow1 = document.createElement("tr");
    
    var downFileName = document.createElement("td");
    downFileName.setAttribute("class", "fileFirstCol");
    downFileName.innerHTML = "";
    
    var downState = document.createElement("td");
    downState.setAttribute("class", "fileLastCol");
    
    var drow2 = document.createElement("tr");
    
    var downBar = document.createElement("td");
    downBar.setAttribute("class", "downBar");
    downBar.setAttribute("colspan", "2");
    downBar.innerHTML = "0%";
    
    var drow3 = document.createElement("tr");
    
    var downLeft = document.createElement("td");
    downLeft.setAttribute("class", "fileFirstCol");
    
    var downCancel = document.createElement("td");
    downCancel.setAttribute("class", "fileLastCol");
    downCancel.innerHTML = "Pressione para Cancelar";
    
    //  Upload Layout //
    
    var upload = document.createElement("table");
    upload.setAttribute("class", "transfer");
    
    var upTimeOut;
    
    upload.addEventListener("mousedown", function() {
        upTimeOut = setTimeout(function() {
            cancelUpCallback(self);
        }, 1000);
    });
    
    upload.addEventListener("mouseup", function() {
        clearTimeout(upTimeOut);
    });

    var urow1 = document.createElement("tr");
    
    var upFileName = document.createElement("td");
    upFileName.setAttribute("class", "fileFirstCol");
    
    var upState = document.createElement("td");
    upState.setAttribute("class", "fileLastCol");
    
    var urow2 = document.createElement("tr");
    
    var upBar = document.createElement("td");
    upBar.setAttribute("class", "upBar");
    upBar.setAttribute("colspan", "2");
    upBar.innerHTML = "0%";
    
    var urow3 = document.createElement("tr");
    
    var upLeft = document.createElement("td");
    upLeft.setAttribute("class", "fileFirstCol");
    
    var upCancel = document.createElement("td");
    upCancel.setAttribute("class", "fileLastCol");
    upCancel.innerHTML = "Pressione para Cancelar";  
    
    //  Append Everything   //
    
    newDevice.appendChild(mainDevice);
    newDevice.appendChild(download);
    newDevice.appendChild(upload); 
    
    //  Device  //
    
    mainDevice.appendChild(row);
    row.appendChild(devIcoTd);
    row.appendChild(devNameTd);
    row.appendChild(upIcoTd);   
    devIcoTd.appendChild(devIco);
    upIcoTd.appendChild(upIco);
    
    //  Download    //
    
    download.appendChild(drow1);
    download.appendChild(drow2);
    download.appendChild(drow3);
    
    drow1.appendChild(downFileName);
    drow1.appendChild(downState);
    drow2.appendChild(downBar);
    drow3.appendChild(downLeft);
    drow3.appendChild(downCancel);
    
    //  Upload  //
    
    upload.appendChild(urow1);
    upload.appendChild(urow2);
    upload.appendChild(urow3);
    
    urow1.appendChild(upFileName);
    urow1.appendChild(upState);
    urow2.appendChild(upBar);
    urow3.appendChild(upLeft);
    urow3.appendChild(upCancel);

    //  Finish  //
    parent.appendChild(newDevice);
    
    this.showDownload = function() {
        download.style.display = "table";            
    };
    
    this.hideDownload = function() {
        download.style.display = "none";         
    };
    
    this.setDownloadName = function(name) {
        downFileName.innerHTML = name;        
    };    
    
    this.setDownloadProgress = function(curr, total) {       
        var percentage = curr * 100 / total;        
        if(percentage < 0) percentage = 0;
        else if(percentage > 100) percentage = 100;      
        downBar.style.backgroundSize = percentage.toFixed(1) + "% 100%";           
        downBar.innerHTML = percentage.toFixed(1) + "%";       
        downLeft.innerHTML = getSizeWord(curr) + " / " + getSizeWord(total);
    };
    
    this.setDownloadState = function(state) {
        downState.innerHTML = state;    
    };
    
    this.showUpload = function() {
        upload.style.display = "table";            
    };
    
    this.hideUpload = function() {
        upload.style.display = "none";         
    };
    
    this.setUploadName = function(name) {
        upFileName.innerHTML = name;        
    };    
    
    this.setUploadProgress = function(curr, total) {       
        var percentage = curr * 100 / total;        
        if(percentage < 0) percentage = 0;
        else if(percentage > 100) percentage = 100;      
        upBar.style.backgroundSize = percentage.toFixed(1) + "% 100%";       
        upBar.innerHTML = percentage.toFixed(1) + "%";       
        upLeft.innerHTML = getSizeWord(curr) + " / " + getSizeWord(total);
    };
    
    this.setUploadState = function(state) {
        upState.innerHTML = state;    
    };
    
    this.DeleteDevice = function() {
        parent.removeChild(newDevice);         
    };
}

function SetLocalUser(localName, sessionName, deviceType) {
    document.getElementById("userName").innerHTML = localName;
    document.getElementById("sessionName").innerHTML = "@" + sessionName;   
    document.getElementById("userImg");    
    if(deviceType == "mobile")
        document.getElementById("userImg").src = "img/mob.png";
    else if(deviceType == "tablet")
        document.getElementById("userImg").src = "img/tab.png";
    else
        document.getElementById("userImg").src = "img/comp.png";
    document.getElementById("user").style.display = "table";
}

var modalsQty = 0;

function DisableScreen() {
    document.getElementById("screen").style.display = "block";
    document.body.style.overflow = "hidden";
}

function EnableScreen() {
    document.getElementById("screen").style.display = "none";
    document.body.style.overflow = "visible";
}

function ShowPopup(device, message, file, acceptLabel, refuseLabel, acceptCallback, refuseCallback){   
    
    //var deviceOrigin = device.devOrigin == "local" ? "Dispositivo Local" : "Dispositivo de Sessão";
    modalsQty++;    //increase the modalsQty variable
    DisableScreen();
    var parent = document.getElementById("screen");
    var table = document.createElement("table");
    table.setAttribute("class", "fullscreen");    
    var imgSrc = "";   
    if(device.type == "mobile")
        imgSrc = "img/mob.png";
    else if(device.type == "tablet")
        imgSrc = "img/tab.png";
    else
        imgSrc = "img/comp.png";
    
    
    var tRow0 = document.createElement("tr"),
        tData0 = document.createElement("td");
    
    var popup = document.createElement("table");
    popup.setAttribute("class", "popupWindow");
    
    var tRow1 = document.createElement("tr");
    
    var tData1 = document.createElement("td");
    tData1.setAttribute("class", "mainImgTd");
    tData1.style.height = "1px";
    
    var img = document.createElement("img");
    img.src = imgSrc;
    img.setAttribute("class", "mainImg");
    
    var tData2 = document.createElement("td");
    tData2.setAttribute("class", "deviceName");
    tData2.innerHTML = device.name + "<br><span>" + device.origin + "</span>";
    
    var tRow2 = document.createElement("tr");
    
    var tData3 = document.createElement("td");
    tData3.setAttribute("colspan", "2");
    tData3.style.height = "1px";
    tData3.innerHTML = message;
    
    var tRow3 = document.createElement("tr");
        
    var tData4 = document.createElement("td");
    tData4.setAttribute("colspan", "2");
    tData4.style.height = "1px";
    tData4.innerHTML = file.name + "<br>" + getSizeWord(file.size);
    
    var tRow4 = document.createElement("tr");
    
    var tData5 = document.createElement("td");
    tData5.setAttribute("colspan", "2");

    var refuseBut = document.createElement("span");
    refuseBut.setAttribute("class", "popupButton");
    refuseBut.innerHTML = refuseLabel;
    
    var acceptBut = document.createElement("span");
    acceptBut.setAttribute("class", "popupButton");
    acceptBut.innerHTML = acceptLabel;
    
    tData5.appendChild(refuseBut);
    tData5.appendChild(acceptBut);
    
    tRow4.appendChild(tData5);
    tRow3.appendChild(tData4);
    tRow2.appendChild(tData3);
    
    tData1.appendChild(img);
    
    tRow1.appendChild(tData1);
    tRow1.appendChild(tData2);
    
    popup.appendChild(tRow1);
    popup.appendChild(tRow2);
    popup.appendChild(tRow3);
    popup.appendChild(tRow4);
    
    tData0.appendChild(popup);
    tRow0.appendChild(tData0);
    table.appendChild(tRow0);
    
    /*table.innerHTML = "<tr><td><table class='popupWindow'><tr><td class='mainImgTd' style='height: 1px;'><img src='" + imgSrc + "' class='mainImg'></td><td class='deviceName'>" + device.name + "<br><span>" + device.origin + "</span></td></tr><tr><td colspan='2' style='height: 1px;'>" + message + "</td></tr><tr><td colspan='2' style='height: 1px;'>" + file.name + "<br>" + getSizeWord(file.size) + "</td></tr><tr><td colspan='2'><span id='refuse' class='popupButton'>" + refuseLabel + "</span><span id='accept' class='popupButton'>" + acceptLabel + "</span></td></tr></table></td></tr>";*/  
    
    acceptBut.addEventListener("click", function() {
        modalsQty--;
        if(modalsQty <= 0)
            EnableScreen();
        parent.removeChild(table);
        acceptCallback();  
    });   
    refuseBut.addEventListener("click", function() {
        modalsQty--;
        if(modalsQty <= 0)
            EnableScreen();
        parent.removeChild(table);
        refuseCallback();  
    });
    
    parent.appendChild(table); 
}

function ShowTerms(){   
    
    var parent = document.getElementById("screen");
    var table = document.createElement("table");
    table.setAttribute("class", "fullscreen");    
    
    var tRow0 = document.createElement("tr"),
        tData0 = document.createElement("td"),
    
        frame = document.createElement("iframe");
    
    frame.src = "terms.html";
    frame.setAttribute("class", "terms");
    
    var popup = document.createElement("table");
    popup.setAttribute("class", "popupWindow");
    popup.style.textAlign = "right";
    popup.style.padding = 0;
    
    var closeBut = document.createElement("span");
    closeBut.setAttribute("id", "termsClose");
    closeBut.innerHTML = "X";
    closeBut.addEventListener("click", function() {
        parent.removeChild(table);              
    });
    
    popup.appendChild(closeBut);
    popup.appendChild(frame);
 
    tData0.appendChild(popup);
    tRow0.appendChild(tData0);
    table.appendChild(tRow0);  
    
    parent.appendChild(table); 
}

function ShowAbout(){   
    
    modalsQty++;    //increase the modalsQty variable
    DisableScreen();
    
    var parent = document.getElementById("screen");
    var table = document.createElement("table");
    table.setAttribute("class", "fullscreen");    
    
    var tRow0 = document.createElement("tr"),
        tData0 = document.createElement("td"),
    
        frame = document.createElement("iframe");
    
    frame.src = "about.html";
    frame.setAttribute("class", "terms");
    
    var popup = document.createElement("table");
    popup.setAttribute("class", "popupWindow");
    popup.style.textAlign = "right";
    popup.style.padding = 0;
    popup.style.backgroundColor = "#111";
    
    var closeBut = document.createElement("span");
    closeBut.setAttribute("id", "termsClose");
    closeBut.innerHTML = "X";
    closeBut.style.color = "#fff";
    closeBut.addEventListener("click", function() {      
        modalsQty--;
        if(modalsQty <= 0)
            EnableScreen();
        parent.removeChild(table);
    });
    
    popup.appendChild(closeBut);
    popup.appendChild(frame);
 
    tData0.appendChild(popup);
    tRow0.appendChild(tData0);
    table.appendChild(tRow0);  
    
    parent.appendChild(table); 
}

function getSizeWord(size) {    
    if(size < 1000)
        return size + " bytes";
    else if(size < 1000000)
        return (size/1024).toFixed(1) + " kB";
    else if(size < 1000000000)
        return (size/1048576).toFixed(1) + " MB";
    else //if(size < 1000000000000)
        return (size/1073741824).toFixed(1) + " GB";   
}

function ShowMenu() {
    document.getElementById("menu").style.display = "table";
    document.getElementById("user").style.backgroundColor = "#333";
}
            
function HideMenu() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("user").style.backgroundColor = "#000";
}
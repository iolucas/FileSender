function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname+"="+cvalue+"; "+expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function getIndexOf(data, char) {
    var indexList = [];    
    var currIndex = data.indexOf(char);    
    if(currIndex == -1)
        return indexList;   
    indexList[indexList.length] = currIndex;   
    while(true) {        
        currIndex = data.indexOf(char, currIndex + 1);      
        if(currIndex == -1)
            break;           
        indexList[indexList.length] = currIndex;
    }    
    return indexList; 
}

function lengthOf(obj) {
    var c=0;
    for(var fieldName in obj)
        c++;
    return c;
}

function getId(size){
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < size; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function getTimeStamp() {
    var cTime = new Date();
    return (cTime.getHours()<10?"0"+cTime.getHours():cTime.getHours()) + ":" + (cTime.getMinutes()<10?"0"+cTime.getMinutes():cTime.getMinutes());  
}
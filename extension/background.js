async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);    
    return tab;
  }

async  function notify_user(title,message,icon){

  chrome.notifications.create(
    "Word Meaning Saver",
    {
      type: "basic",
      iconUrl: icon,
      title: title,
      message: message,
    },
    function () {}
  );
}
async function successBadge(word){
  chrome.action.setBadgeText({text: "saved"});
  chrome.action.setBadgeBackgroundColor({color: "#009933"});
  chrome.action.setTitle({title: `Dictionary meaning of ${word} has saved`});
  notify_user("Success !",word,'../images/icon-2-success.png')
  setTimeout(()=>{
    defaultBadge()
  },7000)

  
}

async function errorBadge(word){
  chrome.action.setBadgeText({text: "err"});
  chrome.action.setBadgeBackgroundColor({color:"#ff0000"});
  chrome.action.setTitle({title: word});
  notify_user("Failed !",word,'../images/icon-2-failed.png')

  setTimeout(()=>{
    defaultBadge()
  },7000)

}

async function capturedBadge(){
  chrome.action.setBadgeText({text: '...'});
  chrome.action.setBadgeBackgroundColor({color: "#FFFF00"});
  chrome.action.setTitle({title: `Processing your search. Icon will turn green or red when processing is done`});
}

async function defaultBadge(){
  chrome.action.setBadgeText({text: ''});
  chrome.action.setBadgeBackgroundColor({color: "#000000"});
  chrome.action.setTitle({title: `Click here to save dictionary meaning of your search`});
}

async function save_word(){
  capturedBadge()
  getCurrentTab().then(tab => {

    let google_domain = "https://www.google.com/search?q=";
    if (tab.url.includes(google_domain)) {
        let current_url  =  new URLSearchParams(String(tab.url).split("?")[1])
        let user_searchwords = current_url.get('q')

        fetch('https://dictionary-save.eric-apps.space/api/v1/search', {
          method: 'POST',
          xhrFields: { withCredentials:true },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({'keywords': user_searchwords}),
        }).then(response => {
            if (response.status == 200) {
                successBadge(`Your search of the words '${user_searchwords}' has been saved`)
            }else{
                errorBadge("Oops! Dictionary Meaning of the word '"+ user_searchwords + "' not found.Please Use more specific words")
            }
        }).catch(err => {
          errorBadge("Oops! Something went wrong on our side. Try again later")
        })
    }else{
      errorBadge('Oops! Cannot capture search word. Please ensure you are on google search page')  
    }

  }).catch((err)=>{
  
    errorBadge("Oops! Something went wrong on our side. Try again later")
  })
   
}

async function save_conext_word(word){
  capturedBadge()
  fetch('http://127.0.0.1:8080/api/v1/search', {
    method: 'POST',
    xhrFields: { withCredentials:true },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({'keywords':word}),
  }).then(response => {
      if (response.status == 200) {
          successBadge(`Your search of the words '${word}' has been saved`)
      }else{
          errorBadge("Oops! Dictionary Meaning of the word '"+ word + "' not found.Please Use more specific words")
      }
  }).catch(err => {
    console.log(err)
    errorBadge("Oops! Something went wrong on our side. Try again later")
  })

}


chrome.action.onClicked.addListener(
  function(tab) {
    defaultBadge()
    save_word()
  }

  

)

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}

chrome.contextMenus.create(
    {
      title:"Save word Meaning",
      id:"Word_saver_context_menu",
      contexts:["selection"]


  },
 
)

chrome.contextMenus.onClicked.addListener(
  function(info,tab){
    if (info.menuItemId == "Word_saver_context_menu") {
      if (info.selectionText) {
        save_conext_word(info.selectionText)
      }
 
    }
  
  }
)


chrome.runtime.onInstalled.addListener(function() {
  

  chrome.tabs.create({
    url: 'https://dictionary-save.eric-apps.space/',
    active: true
  });

  return false;
});





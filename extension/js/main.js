// alert('Word succesfully saved');
// alert('Sign in to check your saved words');
    
    document.querySelector("#my-button").addEventListener("click", function() {
        getCurrentTab().then(tab => {
            let google_domain = "https://www.google.com/search?q=";

            if (tab.url.includes(google_domain)) {
              

            let current_url  =  new URLSearchParams(String(tab.url).split("?")[1])
            let user_searchwords = current_url.get('q')

            alert(user_searchwords)
            $.post("http://localhost:8000/api/v1/search",`keywords=${user_searchwords}`,(res)=>{
                console.log(res)
            }).catch((e=>{
                console.log(e)
            }))
             
            }else{
                alert("This is not a google page");
            }
                 




        })
       
    })


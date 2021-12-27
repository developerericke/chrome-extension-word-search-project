
   
function userState(){
    $('#save-state').addClass('d-none').html('')
    defaultBadge()
    $.ajax({
        url: "http://localhost:8000/api/v1/user/state",
        method: "GET",
        xhrFields: { withCredentials: true },
        success: function(data) {
            //show loged in section
         
            $('#guest').addClass('d-none');
            $('#authenticated').removeClass('d-none');
            $('#user_name').html(data.user)

            // $('#logout_link').click(()=>{
            //     $('#authenticated').addClass('d-none'); 
            //     $('#guest').removeClass('d-none');
            //    $.get('http://localhost:8000/api/v1/logout')
            // })
            
        },
        error: function(data) {
            //show loged out section
            $('#authenticated').addClass('d-none');
            $('#guest').removeClass('d-none');
        }

    })
}

userState()


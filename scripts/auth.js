window.onload =()=>{
    const signup=document.getElementById("form-signup");
    const login=document.getElementById("form-login");
    const btnsignup=document.getElementById("btn-signup");
    const btnlogin=document.getElementById("btn-login");
    const loginbtn=document.getElementById("login");
    const signupbtn=document.getElementById("signup");
    const msglogin=document.getElementById("login-msg");
    const msgsignup=document.getElementById("sign-msg");
    signup.style.display="none";
    btnlogin.onclick = () => {
      login.style.display="block";
      signup.style.display="none";  
    }
    btnsignup.onclick = () => {
        login.style.display="none";
        signup.style.display="block";
    }
    
    loginbtn.onclick = async () => {
        const email=document.getElementById("login-email").value;
        const pass=document.getElementById("login-pass").value;
        msglogin.innerHTML= "loading...";
        msglogin.style.color = "blue";
        fetch('/login',
        {
            method:'post',
            mode:'cors',
            credentials: 'same-origin',
            body : JSON.stringify({'email':email,'password':CryptoJS.SHA512(pass).toString()}),
            headers: {"Content-type": "application/json; charset=UTF-8"},
        }
        ).then((resp)=>resp.json())
        .then((resp)=>{
                if(resp.pass){
                    msglogin.innerHTML = "login successful";
                    msglogin.style.color = "green";
                    setTimeout(()=>window.open("/","_self"),2000);
                }else if(resp.email){
                    msglogin.style.color = "red";
                    msglogin.innerHTML = "incorrect password";
                }else{
                    msglogin.style.color = "red";
                    msglogin.innerHTML = "account not registered with the current email, register your account first ";
                }
            })
        .catch(()=>{ 
            msglogin.style.color = "red";
            msglogin.innerHTML = "connection error";
        })
    }
    
    signupbtn.onclick = async() => {
        const email=document.getElementById("sign-email").value;
        const pass=document.getElementById("sign-pass").value;
        const uname=document.getElementById("sign-uname").value;
        const phn=document.getElementById("sign-phn").value;       
        msgsignup.innerHTML= "loading...";
        msgsignup.style.color = "blue";
        var resp = await fetch('/signup',
        {
            method:'post',
            mode:'cors',
            credentials: 'same-origin',
            body : JSON.stringify({'countrycode':'+91','phone':phn,'username':uname,'email':email,'password':CryptoJS.SHA512(pass).toString()}),
            headers: {"Content-type": "application/json; charset=UTF-8"},
        }
        ).then((resp)=>resp.json())
        .then((resp)=>{
            if (resp.exists){
                msgsignup.style.color = "red";
                msgsignup.innerHTML= "account already registered  with this email please login ";
            }else if(resp.status){
                msgsignup.style.color = "green";
                msgsignup.innerHTML= "your account has been successfully registered";
            }else{
                msgsignup.style.color = "orange";
                msgsignup.innerHTML= "some error occoured, try again";
            }
        }).catch(()=>{
            msgsignup.style.color = "red";
            msgsignup.innerHTML = "connection error";
        })
    }
}
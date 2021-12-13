window.addEventListener('DOMContentLoaded', (event) => {
  const loginContainer = document.getElementById("popup-login-container");
  const recorderDiv = document.getElementById("recorder-div");
  const appNamesRow = document.getElementById("app-names-row");
  loginContainer.style.display = "none";
  const isLoggedIn = true;
  const isMeetingUrlLocation = isMeetingAppRunning();
  console.log("isMeetingUrlLocation: " + isMeetingUrlLocation);
  if(isLoggedIn) {
    if(isMeetingUrlLocation) {
      recorderDiv.style.display = "block";
      appNamesRow.style.display = "none";
    }
    else {
      recorderDiv.style.display = "none";
      appNamesRow.style.display = "block";
    }
    loginContainer.style.display = "none";
  }
  else {
    recorderDiv.style.display = "none";
    loginContainer.style.display = "block";
  }
});
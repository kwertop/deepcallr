navigator.webkitGetUserMedia({
    audio: true
}, s => {
    console.log(s);
    window.close();
}, err => {
    console.log(err);
    window.close();
})
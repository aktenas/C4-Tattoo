//wait until document is loaded before proceeding with DOM  
$(document).ready(function () {
    //DOM finds global header and injects navigation bar
    $('#global-header').load('components/navbar.html');
});
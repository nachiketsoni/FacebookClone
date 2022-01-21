var svg1 = document.querySelector('#svg1');
var svg11 = document.querySelector('#svg11');
var lcs = document.querySelector('#lcs');

function like() {
    lcs.addEventListener("click", function (dets) {
        console.log(dets.target.id);
        svg1.style.display = "none";
        svg11.style.display = "initial";
    })
}

like();

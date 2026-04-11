import {getAll, getPopular, getDesc, init, obj} from "./db";

const yesButton = document.getElementById("yes")
const noButton = document.getElementById("no")
const start = document.getElementById("start")
const question = document.getElementById("question")

let statements = {          // statements for framing questions about particular characteristics
    "sexLabel":"is your character a ",
    "citizenshipLabel":"is your character from",
    "occupationLabel":"is your character a ",
    "field":"is your character related to ",
    "political party":"is your character in ",
    "employer":"is your character employed by ",
    "alive":"is your character ",
}
let properties = ["alive", "sexLabel", "citizenshipLabel", "field", "occupationLabel"];
function getQuestion(){
    let effectProperty;
    let highEffect = null;

    if (obj.special.includes("employed")) properties.push("employed")
    if (obj.special.includes("politician")) properties.push("politician")

    for(const property of properties){
        let people = { ...obj, [property]: obj[property].concat(getPopular(property, obj)) }
        let yes = getAll(people)[0].values.count
        people = { ...obj, [property]: obj[property].concat("NOT " + getPopular(property, obj)) }
        let no = getAll(people)[0].values.count
        let effect = getAll(obj)-((yes + no)/2)

        if(effect > highEffect){
            highEffect = effect
            effectProperty = property
        }else{}
    }

    if(highEffect <= 6){
        return effectProperty
    }else if(getAll(obj)[0].values.count === 1){
        return "complete"
    }
    else if(getAll(obj)[0].values.count === 0){return "none"}
    else if(highEffect <= 7){
        let descList = []
        for (const person of getAll(obj)[0].values){
            descList.push({'person':person[0], 'desc':person[1], 'occupations':person[3], 'P':person[7]}) // change index for occupationLabel, P.
            let words = getDesc(descList)
            for(const item of words){
                if(item.organisation.length > 0){
                    // organisation question
                }else{
                    // noun question
                }
            }
        }
    }
}
function special(){
    if(obj.special.length <= 0){
        question.innerHTML = "is your character associated with a political party?"

        function politician(){obj.special.push("politician")}
        function employed(){obj.special.push("employed")}
        function no(){obj.special.push("no")}
        function noPress(){
            question.innerHTML = "is your character employed by a corporation?"
            yesButton.addEventListener("click", employed, {once: true});
            noButton.addEventListener("click", no, {once: true});
        }

        yesButton.addEventListener("click", politician, {once: true});
        noButton.addEventListener("click", noPress, {once: true});
    }else{}
}
function generate() {
    yesButton.style.display = "block";
    noButton.style.display = "block";
    start.style.display = "none";

    special()
    let property = getQuestion();
    if(property === "complete"){question.innerHTML = "you're thinking of" + getAll(obj)[0].values[0][0] + "!"}
    else if(property === "none") question.innerHTML = "sorry, I couldn't guess your character :("
    else{
        let value = getPopular(property, obj)

        question.innerHTML = statements[property] + value + "?"
        function yes(){obj[property].push(value); generate()}
        function no(){obj[property].push("NOT " + value); generate()}

        yesButton.addEventListener("click", yes, {once: true});
        noButton.addEventListener("click", no, {once: true});
    }
}

init().then(() => {
    yesButton.style.display = "none";
    noButton.style.display = "none"
    question.innerHTML = "think of a non-fictional human character, answer truthfully, and I'll read your mind >:)"
    start.addEventListener("click", generate)
});
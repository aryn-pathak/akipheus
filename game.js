import {getAll, getPopular, getDesc, obj} from "./db";

const yesButton = document.getElementById("yes")
const noButton = document.getElementById("no")
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
let order = ["alive", "sexLabel", "citizenshipLabel", "field", "occupationLabel"];

function getQuestion(){
    let effectProperty;
    let highEffect = null;

    for(const property in order){
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
        question.innerHTML = "you're thinking of" + getAll(obj)[0].values[0][0] + "!"
        return "gameComplete"
    }
    else if(getAll(obj)[0].values.count === 0){question.innerHTML = "sorry, I couldn't guess your character :("}
    else if(highEffect <= 7){
        let descList = []
        for (const person in getAll(obj)[0].values){
            descList.push({'person':person[0], 'desc':person[1], 'occupations':person[3], 'P':person[7]}) // change index for occupationLabel, P.
            let words = getDesc(descList)
            for(const item in words){
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
    }
}
function generateQuestion(){
    let ask = null;

}

// if (obj.special.includes("employer")) order.push("employer");
// if (obj.special.includes("political party")) order.push("political party");
import {getAll, getPopular} from "./db";

yesButton = document.getElementById("yes")
noButton = document.getElementById("no")
question = document.getElementById("question")

let statements = {          // statements for framing questions about particular characteristics
    "sexLabel":"is your character a ",
    "citizenshipLabel":"is your character from",
    "occupationLabel":"is your character a ",
    "field":"is your character related to ",
    "special":"is your character ", // a politician - politician OR employed by a corporation - employed
    "political party":"is your character in ",
    "employer":"is your character employed by ",
    "alive":"is your character ", // deceased/alive
}
let order = ["alive", "sexLabel", "citizenshipLabel", "special", "field", "occupationLabel"];

function getQuestion(obj){
    let affectProperty;
    let highAffect

    for(const property in order){
        let people = { ...obj, [property]: obj[property].concat(getPopular(property, obj)) }
        let yes = getAll(people)[0].values.count
        people = { ...obj, [property]: obj[property].concat("NOT " + getPopular(property, obj)) }
        let no = getAll(people)[0].values.count
        let affect = getAll(obj)-((yes + no)/2)

        if(affect > highAffect){
            highAffect = affect
            affectProperty = property
        }else{}
    }
    return affectProperty
}
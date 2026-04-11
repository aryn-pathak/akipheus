import {getAll, getPopular} from "./db";
import nlp from 'compromise'

const yesButton = document.getElementById("yes")
const noButton = document.getElementById("no")
const question = document.getElementById("question")

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
    let effectProperty;
    let highEffect

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
    if(higheffect <= 6){
        return effectProperty
    }else if(getAll(obj)[0].values.count == 1){
        question.innerHTML("you're thinking of" + getAll(obj)[0].values[0][0] + "!")
        return "gameComplete"
    }
    else if(getAll(obj)[0].values.count == 0){question.innerHTML("sorry, I couldn't guess your character :(")}
    else if(highEffect <= 7){
        for (const person in getAll(obj)[0].values){
            let desc = person[1]
        }
    }
}
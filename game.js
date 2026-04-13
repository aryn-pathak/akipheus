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

function waitForClick() {
    return new Promise((resolve) => {
        yesButton.addEventListener("click", () => resolve("yes"), { once: true });
        noButton.addEventListener("click", () => resolve("no"), { once: true });
    });
}

async function getQuestion() {
    let effectProperty;
    let highEffect = -Infinity;

    if (obj.special.includes("employed")) properties.push("employed")
    if (obj.special.includes("politician")) properties.push("politician")

    for (const property of properties) {
        let people = {...obj, [property]: obj[property].concat(getPopular(property, obj))}
        let yes = getAll(people)[0].values.count
        people = {...obj, [property]: obj[property].concat("NOT " + getPopular(property, obj))}
        let no = getAll(people)[0].values.count
        let effect = getAll(obj)[0].values.count - ((yes + no) / 2)

        if (effect > highEffect) {
            highEffect = effect
            effectProperty = property
        }
    }
    if (getAll(obj)[0].values.count === 1) {
        return "complete"
    } else if (getAll(obj)[0].values.count === 0) {
        return "none"
    }else if (highEffect <= 5) {
        let descList = []
        for (const person of getAll(obj)[0].values) {
            descList.push({'person': person[0], 'desc': person[1], 'occupations': person[3], 'P': person[7]}) // change index for occupationLabel, P.
        }
        let questionList = getDesc(descList)

        let personIndex = 0;
        let questionIndex = 0

        function showQuestion() {
            question.innerHTML = questionList[personIndex][questionIndex];
        }

        showQuestion();

        let answer = await waitForClick()
        if(answer==="yes"){
            if (questionIndex === questionList[personIndex].questions.length - 1) {
                question.innerHTML = `you're thinking of ${questionList[personIndex].person}`
            } else {
                questionList[personIndex].yes += 1
            }
            questionIndex += 1
            if (questionIndex === questionList[personIndex].questions.length - 1) {
                personIndex += 1;
                questionIndex = 0;
                showQuestion()
            }
            if (personIndex === questionList.length) {
                question.innerHTML = `you're thinking of ${questionList.reduce((a, b) => {
                    return (a.yes > b.yes) ? a : b
                }).person}`
            }
        }else{
            questionIndex += 1
            if (questionIndex === questionList[personIndex].length - 1) {
                personIndex += 1;
                questionIndex = 0;
            }
            showQuestion()
            if (personIndex === questionList.length) {
                question.innerHTML = `you're thinking of ${questionList.reduce((a, b) => {
                    return (a.yes > b.yes) ? a : b
                }).person}`
            }
        }
    }else{return effectProperty}
}
async function special(){
    if(obj.special.length <= 0){
        question.innerHTML = "is your character associated with a political party?"
        let answer = await waitForClick();
        if(answer === "yes"){obj.special.push("politician")}
        if(answer==="no"){
            question.innerHTML = "is your character employed by a corporation?"
            let employedAns = await waitForClick();
            if(employedAns === "yes"){obj.special.push("employed")}
            else{obj.special.push("no")}
        }
    }
}
async function generate() {
    yesButton.style.display = "block";
    noButton.style.display = "block";
    start.style.display = "none";

    await special()
    let property = await getQuestion();
    let value = getPopular(property, obj)
    if(property === "complete"){question.innerHTML = "you're thinking of" + getAll(obj)[0].values[0][0] + "!"}
    else if(property === "none") question.innerHTML = "sorry, I couldn't guess your character :("
    else if(property in statements){
        question.innerHTML = statements[property] + value + "?"
        const answer = await waitForClick();
        if (answer === "yes") { obj[property].push(value) }
        else { obj[property].push("NOT " + value) }
        await generate();
    }else{await getQuestion();}
}

init().then(() => {
    yesButton.style.display = "none";
    noButton.style.display = "none"
    question.innerHTML = "think of a non-fictional human character, answer truthfully, and I'll read your mind >:)"
    start.addEventListener("click", generate)
});
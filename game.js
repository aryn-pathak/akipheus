import {getAll, getPopular, init, obj} from "./db.js";

const yesButton = document.getElementById("yes")
const noButton = document.getElementById("no")
const start = document.getElementById("start")
const question = document.getElementById("question")

let statements = {
    "sexLabel":"is your character a ",
    "citizenshipLabel":"is your character from ",
    "occupationLabel":"is your character a ",
    "field":"is your character related to ",
    "politicalParty":"is your character in ",
    "employer":"is your character employed by ",
    "alive":"is your character ",
}
let properties = ["alive", "sexLabel", "citizenshipLabel", "occupationLabel", "field"];

function waitForClick() {
    return new Promise((resolve) => {
        yesButton.addEventListener("click", () => resolve("yes"), { once: true });
        noButton.addEventListener("click", () => resolve("no"), { once: true });
    });
}

async function getQuestion() {
    let effectProperty;
    let highEffect = -Infinity;

    if (obj.special.includes("employed") && !properties.includes("employer")) properties.push("employer")
    if (obj.special.includes("politician") && !properties.includes("politicalParty")) properties.push("politicalParty")

    for (const property of properties) {
        let popular = getPopular(property, obj)
        if (!popular) continue;
        let people = {...obj, [property]: obj[property].concat(popular)}
        let yes = getAll(people)[0]?.values.length ?? 0
        people = {...obj, [property]: obj[property].concat("NOT " + popular)}
        let no = getAll(people)[0]?.values.length ?? 0
        let effect = (getAll(obj)[0]?.values.length ?? 0) - ((yes + no) / 2)
        effect = effect / (1 + obj[property].length)

        if (effect > highEffect) {
            highEffect = effect
            effectProperty = property
        }
    }
    if (getAll(obj)[0].values.length === 1) {
        return "complete"
    } else if (getAll(obj)[0].values.length === 0) {
        return "none"
    } else if (highEffect <= 3) {
        let people = getAll(obj)[0].values

        let finalPeople = {}
        for (let person of people) {
            finalPeople[person[0]] = person[4]
        }

        const counts = new Map()
        for (const arr of Object.values(finalPeople)) {
            for (const item of new Set(arr)) {
                counts.set(item, (counts.get(item) || 0) + 1)
            }
        }

        for (const name in finalPeople) {
            finalPeople[name] = finalPeople[name].filter(item => counts.get(item) === 1)
        }

        let names = Object.keys(finalPeople).sort((a, b) => {
            let sa = people.find(p => p[0] === a)[10] ?? 0
            let sb = people.find(p => p[0] === b)[10] ?? 0
            return sb - sa
        })

        let winner = null
        for (const name of names) {
            let occupations = finalPeople[name]
            if (occupations.length === 0) continue
            question.innerHTML = `is your character a ${occupations[0]}?`
            let answer = await waitForClick()
            if (answer === "yes") {
                winner = name
                break
            }
        }

        if (winner) {
            question.innerHTML = `you're thinking of ${winner}!`
        } else {
            question.innerHTML = "sorry, I couldn't guess your character :("
        }
        yesButton.style.display = "none"
        noButton.style.display = "none"
        return "done"
    } else { return effectProperty }
}

async function special() {
    if (obj.special.length <= 0) {
        question.innerHTML = "is your character associated with a political party?"
        let answer = await waitForClick();
        if (answer === "yes") { obj.special.push("politician") }
        if (answer === "no") {
            question.innerHTML = "is your character employed by a corporation?"
            let employedAns = await waitForClick();
            if (employedAns === "yes") { obj.special.push("employed") }
            else { obj.special.push("no") }
        }
    }
}

async function generate() {
    yesButton.style.display = "";
    noButton.style.display = "";
    start.style.display = "none";

    await special()
    let property = await getQuestion();
    if (property === "complete") {
        question.innerHTML = "you're thinking of " + getAll(obj)[0].values[0][0] + "!"
        yesButton.style.display = "none"
        noButton.style.display = "none"
    }
    else if (property === "none") {
        question.innerHTML = "sorry, I couldn't guess your character :("
        yesButton.style.display = "none"
        noButton.style.display = "none"
    }
    else if (property === "done") {
    }
    else if (property in statements) {
        let value = getPopular(property, obj)
        question.innerHTML = statements[property] + value + "?"
        const answer = await waitForClick();
        if (answer === "yes") { obj[property].push(value) }
        else { obj[property].push("NOT " + value) }
        await generate();
    }
}

init().then(() => {
    yesButton.style.display = "none";
    noButton.style.display = "none";
    start.addEventListener("click", generate)
});

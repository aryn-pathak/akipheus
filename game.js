import {getAll, getPopular, getDesc, init, obj} from "./db.js";

const yesButton = document.getElementById("yes")
const noButton = document.getElementById("no")
const start = document.getElementById("start")
const question = document.getElementById("question")

let statements = {          // statements for framing questions about particular characteristics
    "sexLabel":"is your character a ",
    "citizenshipLabel":"is your character from ",
    "occupationLabel":"is your character a ",
    "field":"is your character related to ",
    "politicalParty":"is your character in ",
    "employer":"is your character employed by ",
    "alive":"is your character ",
}
let properties = ["alive", "sexLabel", "citizenshipLabel", "occupationLabel", "field"]; // field

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
    } else if (highEffect <= 5) {
        let descList = []
        for (const person of getAll(obj)[0].values) {
            descList.push({'person': person[0], 'desc': person[1], 'occupations': person[3], 'P': person[7]})
        }
        let {QList, PList} = getDesc(descList)
        let counts = QList.map((_, i) => PList.filter(p => p.indices.includes(i)).length)
        let order = QList.map((_, i) => i).sort((a, b) => counts[b] - counts[a])

        for (const i of order) {
            if (PList.length <= 1) break
            question.innerHTML = QList[i]
            let answer = await waitForClick();
            if (answer === "yes") {
                for (const p of PList) {
                    if (p.indices.includes(i)) p.yes += 1
                }
            }
            if (answer === "no") {
                PList = PList.filter(p => !p.indices.includes(i))
            }
        }
        let winner
        if (PList.length === 0) {
            question.innerHTML = "sorry, I couldn't guess your character :("
            yesButton.style.display = "none"
            noButton.style.display = "none"
            return "done"
        } else if (PList.length === 1) {
            winner = PList[0]
        } else {
            winner = PList.reduce((a, b) => {
                if (a.yes !== b.yes) return a.yes > b.yes ? a : b
                return a.match > b.match ? a : b
            })
        }
        question.innerHTML = `you're thinking of ${winner.name}!`
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
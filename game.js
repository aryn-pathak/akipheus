import {getAll, getTitle, getPopular, init, obj} from "./db.js";

const yesButton = document.getElementById("yes")
const noButton = document.getElementById("no")
const start = document.getElementById("start")
const question = document.getElementById("question")

let statements = {
    "sexLabel": "is your character a ",
    "citizenshipLabel": "is your character from ",
    "occupationLabel": "is your character a ",
    "field": "is your character related to ",
    "politicalParty": "is your character in ",
    "employer": "is your character employed by ",
    "alive": "is your character ",
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
        let total = getAll(obj)[0]?.values.length ?? 0
        if (yes === 0 || yes === total) continue
        let effect = total - ((yes + no) / 2)
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
            descList.push({'person': person[0], 'desc': person[1], 'sitelinks': person[10]})
        }
        let title = getTitle(descList)
        if (!effectProperty) return "none"
        if (title) {
            question.innerHTML = `is your character a ${title}?`
            let answer = await waitForClick()
            if (answer === "yes") obj.personDescription.push(title)
            else obj.personDescription.push("NOT " + title)

            return "ask"
        }
        return effectProperty
    } else {
        return effectProperty
    }
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
    } else if (property === "none") {
        question.innerHTML = "sorry, I couldn't guess your character :("
        yesButton.style.display = "none"
        noButton.style.display = "none"
    } else if (property === "ask") {
        await generate()
    } else if (property in statements) {
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
    alert("note for flavortown voters: akipheus is only as good as wikidata's data, which is often inaccurate. If you find that it doesn't work properly, check out the demo video. Also check out README.md for storytelling and how akipheus works (very interesting!) Thanks for trying out Akipheus!")
    start.addEventListener("click", generate)
});

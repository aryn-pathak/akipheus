<p align = "center"><img width="462" height="209" alt="Screenshot 2026-04-28 at 11 26 34 AM" src="https://github.com/user-attachments/assets/a944cf1d-0590-4fc7-a9f9-1530025cdd38" />
</p>

## An Akinator-style character guessing game, based on Wikidata's knowledge | [try it!](https://aryn-pathak.github.io/akipheus/)
> Wikidata is community-edited, so entries can be inaccurate. If the game gets confused, watch this [demo video](https://youtu.be/HIcR5R7A1MA).

## The Data
- Akipheus uses a [database](humansClean.db) which is extracted from Wikidata (through QLevel, since WDQS times out) using a [SPARQL query](scraper.sparql)
- The database contains ~13k entries, of non fictional humans meeting certain criteria (>700k social media followers, >14 sitelinks OR >45 sitelinks and 0 (not specified) followers.
- The database contains rows: name, description, citizenships, sex, occupations, special (a field specifying whether a person has a political party, employer, or neither, helping ask more specific questions), political party, employer, alive (alive/deceased), followers, and sitelinks.
- Apart from that, everyone has a P which is a weighted popularity score calculated using followers and sitelinks by [this script](flatten.py)
- Wikidata's "field of work" entries are very inconsistent, but field of work is helpful. Everyone's field of work is added using [cleaner.py](cleaner.py) with a local AI model, using description and occupations.

## The Logic
- Akipheus uses 3 major functions to ask the best questions: getAll(), getPopular(), getQuestion().
- `obj` is an object containing all the properties. each property's value is an array. The arrays contain each specific value that has been answered to. if answered no to, it will contain `NOT value`.

>   eg. Narendra Modi: `{
    "citizenshipLabel": ["India", "NOT United States", "NOT Portugal],
    "sexLabel": ["male"],
    "occupationLabel": ["politician", "NOT lawyer"],
    "special": ["politician"],
    "politicalParty": ["Bharatiya Janata Party"],
    "employer": [],
    "alive": ["alive"],
    "field": ["NOT music", "politics"],
    "personDescription": ["prime minister"]
}`
- `getAll()`: takes `obj` as an input and converts it to an SQL query for humansClean, returning an array of arrays of matching people.
- `getPopular()`: this is super interesting; it takes a property as an input, and returns the most "popular" value to ask about in the property, not already asked. To do so, it uses P values of all the remaining people and calculates a Bayesian average for all values, and returns the most popular value.
> Why bayesian? It ensures that a super popular person in a relatively unpopular value OR a high number of people in an unpopular field dont tip the scale (they could if regular average or sum of P was taken)
- `getQuestion()`: also super interesting; it decides what property to choose (and give to `getPopular) and also renders the question statement. It decides the question property by simulating how many people would be eliminated if yes was answered to that property's most popular value, and no was answered, and gets it's average.
> getQuestion decides property according to what splits the people better (eliminates more), getPopular decides value according to who the user is most likely to think of.
- getQuestion checks for titles in descriptions (non-occupational titles like Prime Minister, President, CEO, etc) when the elimination avg is <5. This helps differentiate people with the same occupations (like a local MLA vs Narendra Modi, both are politicians by occupation). Descriptions were previously queried using compromise.js, but that was incredibly inconsistent and unreliable (eg. not returning nouns from descriptions like American rapper, leaving stray commas, returning years in descriptions, etc), so I turned to a simpler approach which works great.

#### Submitted to Hack Club's flavortown. View the project page and devlogs [here](https://flavortown.hackclub.com/projects/16783)
> This was a project that started out with a random curious idea about how akinator works, and I initially had zero idea how mine would work, but I’m personally proud of myself for pulling it off! there were some implementations I thought of which wouldn't be found in any tutorial (like getAll(), getPopular(), getQuestion(), and the entire journey of debugging the question asking flow). This was the first time I built something completely on my own with zero tutorials and zero borrowed logic from other systems. There were a lot of moments where I was close to hardcoding some logic, but I never wanted to, and I didn’t (which I’m glad about) :D

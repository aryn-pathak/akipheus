import json
import sqlite3
import outlines
import mlx_lm
import pandas as pd
from mlx_lm.sample_utils import make_sampler

con = sqlite3.connect("humans.db")
df = pd.read_sql("SELECT * FROM humansFlat", con)
records = df.to_dict(orient='records')

model_raw, tokenizer = mlx_lm.load("mlx-community/Phi-4-mini-instruct-8bit")
model = outlines.from_mlxlm(model_raw, tokenizer)

sampler = make_sampler(temp=0.2)


def generateprompt(description, occupation, name):
    messages = [
        {
            "role": "system",
            "content": "you are a precise data extractor who can understand context well."
        },
        {
            "role": "user",
            "content": """
            You are given a name, description, and list of occupations of a person. Give one most relevant field of work for that person considering their description and occupation.
            name: Narendra Modi
            description: Prime Minister of India since 2014
            occupations: ["politician", "writer", "social worker", "bibliographer"]
            """
        },
        {
            "role": "assistant",
            "content": "politics"
        },
        {
            "role": "user",
            "content": """
        You are given a name, description, and list of occupations of a person. Give one most relevant field of work for that person considering their description and occupation.
        name: Fernando Alonso 
        description: Spanish racing driver
        occupations: ["Formula One Driver", "vegetarian"]
        """
        },
        {
            "role": "assistant",
            "content": "racing"
        },
        {
            "role": "user",
            "content": f"""
        You are given a name, description, and list of occupations of a person. Give one most relevant field of work for that person considering their description and occupation.
        name: {name}
        description: {description}
        occupations: {occupation}
        """
        },
    ]

    return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)


def AIclean(descriptionList, occupationList, nameList):
    promptBatch = []

    for i in range(len(descriptionList)):
        description = descriptionList[i]
        occupation = occupationList[i]
        name = nameList[i]
        promptBatch.append(generateprompt(description, occupation, name))

    result = model.batch(promptBatch)
    print(result)
    return result

humansClean = []
descriptionList = []
occupationList = []
nameList = []
batch = []

for item in records:
    descriptionList.append(item['personDescription'])
    occupationList.append(item['occupationLabel'])
    nameList.append(item['personLabel'])
    batch.append(item)

    if len(batch) == 30:
        result = AIclean(descriptionList, occupationList, nameList)
        for x in range(len(result)):
            batch[x]["field"] = result[x]
            print(f'batch {x} : {batch[x]}')
            humansClean.extend(batch)

        descriptionList = []
        occupationList = []
        nameList = []
        print(batch)
        batch = []

if descriptionList:
    result = AIclean(descriptionList, occupationList, nameList)
    for x in range(len(result)):
        batch[x]["field"] = result[x]
        humansClean.extend(batch)

with (open('humansClean.json', 'w') as humans):
    json.dump(humansClean, humans, indent=4)

df = pd.read_json("humansClean.json")

con = sqlite3.connect("humansClean.db")
df.to_sql("humansClean", con, if_exists='replace', index=False)

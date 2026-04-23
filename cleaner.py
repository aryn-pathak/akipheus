import json
import sqlite3
import time

import outlines
import mlx_lm
import pandas as pd
from mlx_lm.sample_utils import make_sampler

con = sqlite3.connect("humans.db")
df = pd.read_sql("SELECT * FROM humansFlat", con)
records = df.to_dict(orient='records')

model_raw, tokenizer = mlx_lm.load("mlx-community/Qwen2.5-1.5B-Instruct-4bit")
model = outlines.from_mlxlm(model_raw, tokenizer)

sampler = make_sampler(temp=0.2)


def generateprompt(description, occupation, name):
    messages = [
        {
            "role": "system",
            "content": '''
            Strict instructions:
            Classify the given person into a field of work based on their description and occupations.
            Your response must strictly be an array like: ["field"].
            Prefer broad fields like science, sports, politics, film, music, etc.
            AVOID specific fields like microbiology, central government, rap, etc.
            Output only a single item array without any explanation or additional text.
            '''
        },
        {
            "role": "user",
            "content": """  
            name: Narendra Modi
            description: Prime Minister of India since 2014
            occupations: ["politician", "writer", "social worker", "bibliographer"]
            """
        },
        {
            "role": "assistant",
            "content": '["politics"]'
        },
        {
            "role": "user",
            "content": """
        name: Fernando Alonso 
        description: Spanish racing driver
        occupations: ["Formula One Driver", "vegetarian"]
        """
        },
        {
            "role": "assistant",
            "content": '["sports"]'
        },
        {
            "role": "user",
            "content": (
                'name: Taylor Swift'
                'description: American singer-songwriter'
                'occupations: ["singer", "songwriter", "actor", "record producer", "businessperson"]'
            )
        },
        {
            "role": "assistant",
            "content": '["music"]'
        },
        {
            "role": "user",
            "content": f"""
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
    result = [r.strip() for r in result]
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

    if len(batch) == 400:
        start = time.perf_counter()
        result = AIclean(descriptionList, occupationList, nameList)
        for x in range(len(result)):
            batch[x]["field"] = result[x]
            print(f'batch {x} : {batch[x]}')
            elapsed = time.perf_counter() - start
            print(f"That took {elapsed:.2f} seconds")
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
df.to_sql("humans", con, if_exists='replace', index=False)

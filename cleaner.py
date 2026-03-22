import sqlite3
import time
import pandas as pd
from mlx_lm import load, generate

con = sqlite3.connect("humans.db")
df = pd.read_sql("SELECT * FROM humansFlat", con)
records = df.to_dict(orient='records')

model, tokenizer = load("mlx-community/Phi-4-mini-instruct-8bit")

def AIclean(description, occupation, name):
    prompt = f"""
    
    THE TASK: 
    - you will be given a name of a person, their description, and a set of suggested occupations.
    - give the most important, relevant occupations of the given person, STRICTLY according to their given description.
    - give a "field of work" for the person (examples: politics, artificial intelligence, physics, medical).
    
    RULES:
    - Return MAXIMUM 2 occupations.
    - Return exactly 1 broad field of work (example: politics, artificial intelligence, science, medicine, sports).
    - When suggested occupations is provided, you must return occupation ONLY from that list which is relevant to the given description.
    
    INFORMATION:
    person: {name}
    description: {description}
    suggested occupations: {occupation}
    
    THE FORMAT:
    your response must strictly be in the following format with no additional text.:
    {"occupation": "occupation1, occupation2", "field": "field name"}
    
    example: {"occupation": "physicist, chemist", "field": "science"}
"""
    return generate(model, tokenizer, prompt=prompt, verbose=False, temp=0.2)

humansClean = []

for item in records:
    description = item["personDescription"]
    occupation = item["occupationLabel"]
    name = item["personLabel"]

    item["occupationLabel"] = AIclean(description, occupation, name)['occupation']
    item["field"] = AIclean(description, occupation, name)['field']

    print(AIclean(description, occupation, name))
    print(item)
    time.sleep(2.5)

    humansClean.append(item)

import sqlite3
import pandas as pd
from mlx-lm import load, generate

con = sqlite3.connect("humans.db")
df = pd.read_sql("SELECT * FROM humansFlat", con)
records = df.to_dict(orient='records')

model, tokenizer = load("mlx-community/phi-4-mini-4bit")

def AIclean(description, occupation, name):
    prompt = f"""
    what is the main, most commonly known occupation of {name}, according to their description: {description}?
    give the most important occupations, minimum 1, maximum 3
    your response should solely be the occupation. separate with commas if multiple.
    the occupation must be one of these: {occupation}
"""
    return generate(model, tokenizer, prompt=prompt, verbose=False, temp=0.2)

humansClean = []

for item in records:
    desc = item["personDescription"]
    occupation = item["occupationLabel"]
    name = item["personLabel"]
    item["occupationLabel"] = AIclean(occupation, desc)
    print(AIclean(desc, occupation, name))
    print(item)
    humansClean.append(item)

import json
import sqlite3
import time
import pandas as pd
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler

con = sqlite3.connect("humans.db")
df = pd.read_sql("SELECT * FROM humansFlat", con)
records = df.to_dict(orient='records')

model, tokenizer = load("mlx-community/Phi-4-mini-instruct-8bit")
sampler = make_sampler(temp=0.2)

def AIclean(description, occupation, name):
    messages = [
        {
            "role" : "system",
            "content" : "you are a precise data extractor who can understand context well, and return well formatted content."
        },
        {
            "role" : "user",
            "content" : """
                THE TASK: 
    - you will be given a name of a person, their description, and a set of suggested occupations.
    - give the most important, relevant occupations of the given person, STRICTLY according to their given description.
    - give a "field of work" for the person (examples: politics, artificial intelligence, physics, medical).
    
    RULES:
    - Return MAXIMUM 2 occupations.
    - Return exactly 1 broad field of work (example: politics, artificial intelligence, science, medicine, sports).
    - When suggested occupations is provided, you must return occupation ONLY from that list which is relevant to the given description.
    
    INFORMATION:
    - person: Narendra Modi
    - description: Prime Minister of India since 2014
    - suggested occupations: politician, writer, social worker, bibliographer
    
    THE FORMAT:
    your response must strictly be in the following format with no additional text:
    {"occupation": "occupation1, occupation2", "field": "field name"}
            """
        },
        {
            "role" : "assistant",
            "content" : """{"occupation": "politician", "field": "politics"}"""
        },
        {
            "role" : "user",
            "content" : """
            THE TASK: 
    - you will be given a name of a person, their description, and a set of suggested occupations.
    - give the most important, relevant occupations of the given person, STRICTLY according to their given description.
    - give a "field of work" for the person (examples: politics, artificial intelligence, physics, medical).
    
    RULES:
    - Return MAXIMUM 2 occupations.
    - Return exactly 1 broad field of work (example: politics, artificial intelligence, science, medicine, sports).
    - When suggested occupations is provided, you must return occupation ONLY from that list which is relevant to the given description.
    
    INFORMATION:
    - person: Demis Hassabis
    - description: British artificial intelligence researcher (born 1976)
    - suggested occupations: artificial intelligence researcher,game programmer,poker player,computer scientist,businessperson,data scientist,chess player,engineer,video game developer,technology entrepreneur
    
    THE FORMAT:
    your response must strictly be in the following format with no additional text:
    {"occupation": "occupation1, occupation2", "field": "field name"}
            """
        },
        {
            "role" : "assistant",
            "content" : """{"occupation": "computer scientist, artificial intelligence researcher, engineer", "field": "artificial intelligence"}"""
        },
        {
            "role" : "user",
            "content" : """
                        THE TASK: 
    - you will be given a name of a person, their description, and a set of suggested occupations.
    - give the most important, relevant occupations of the given person, STRICTLY according to their given description.
    - give a "field of work" for the person (examples: politics, artificial intelligence, physics, medical).
    
    RULES:
    - Return MAXIMUM 2 occupations.
    - Return exactly 1 broad field of work (example: politics, artificial intelligence, science, medicine, sports).
    - When suggested occupations is provided, you must return occupation ONLY from that list which is relevant to the given description.
    
    INFORMATION:
    - person: Fernando Alonso
    - description: Spanish racing driver
    - suggested occupations: Formula One driver,vegetarian
    
    THE FORMAT:
    your response must strictly be in the following format with no additional text:
    {"occupation": "occupation1, occupation2", "field": "field name"}
            """
        },
        {
            "role" : "assistant",
            "content" : """
            {"occupation": "Formula One driver", "field": "Racing"}
            """
        },
        {
            "role" : "user",
            "content" : """
    THE TASK: 
    - you will be given a name of a person, their description, and a set of suggested occupations.
    - give the most important, relevant occupations of the given person, STRICTLY according to their given description.
    - give a "field of work" for the person (examples: politics, artificial intelligence, physics, medical).
    
    RULES:
    - Return MAXIMUM 2 occupations.
    - Return exactly 1 broad field of work (example: politics, artificial intelligence, science, medicine, sports).
    - When suggested occupations is provided, you must return occupation ONLY from that list which is relevant to the given description.
    
    INFORMATION:
    - person: """ + name + """
    - description: """ + description + """
    - suggested occupations: """ + occupation + """
    
    THE FORMAT:
    your response must strictly be in the following format with no additional text:
    {"occupation": "occupation1, occupation2", "field": "field name"}
    
    here's an example:
    {"occupation": "physicist, chemist", "field": "science"}
            """
        }
    ]

    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    return generate(model, tokenizer, prompt=prompt, verbose=False, sampler=sampler)

humansClean = []

for item in records:
    description = item["personDescription"]
    occupation = item["occupationLabel"]
    name = item["personLabel"]

    result = AIclean(description, occupation, name)
    print(result)
    #
    # item["occupationLabel"] = result['occupation']
    # item["field"] = result['field']
    #
    # print(item)
    time.sleep(2.5)

    humansClean.append(item)

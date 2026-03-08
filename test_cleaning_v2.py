import re

def clean_text(text):
    # Aggressive asterisk cleaning
    text = re.sub(r'\*+.*?\*+', '', text)
    # Markdown
    text = text.replace("**", "")
    # Brackets and parens
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'\(.*?\)', '', text)
    # Special chars that cause glitches
    text = re.sub(r'[^\w\s\.,!\?\']', '', text)
    # Multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

test_cases = [
    "Hello! **I am so happy to see you!** *smiles and laughs*",
    "I'm thinking [she looks at him] about what you said (giggles).",
    "**Kiss me** *leans in for a kiss*",
    "This is a test *action* with **bold** and [context] (note).",
    "Special characters: # @ % ^ & * ) ( - _ + ="
]

for tc in test_cases:
    print(f"Original: {tc}")
    print(f"Cleaned:  {clean_text(tc)}")
    print("-" * 20)

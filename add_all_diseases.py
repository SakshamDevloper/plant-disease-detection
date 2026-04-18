# Run this to see all your classes
import json

with open('model/class_indices.json', 'r') as f:
    classes = json.load(f)

print("Your 38 classes:")
for idx, name in sorted(classes.items(), key=lambda x: int(x[0])):
    print(f"   {idx}: {name}")

print("\nTemplate for disease_db - add to app.py:")
print("="*50)
for idx, name in sorted(classes.items(), key=lambda x: int(x[0])):
    plant = name.split('___')[0].replace('_', ' ')
    disease = name.split('___')[1].replace('_', ' ') if '___' in name else 'Healthy'
    print(f"""    '{name}': {{
        'name': '{disease}',
        'plant': '{plant}',
        'desc': 'Description for {disease}',
        'symptoms': ['Symptom 1', 'Symptom 2'],
        'treatment': ['Treatment 1', 'Treatment 2'],
        'prevention': ['Prevention 1', 'Prevention 2']
    }},""")

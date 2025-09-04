from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import numpy as np
import json
import os
import unicodedata
import requests 
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import nltk
import cohere # Importation de Cohere
import os # Pour la clé API Cohere
from dotenv import load_dotenv # Importation de load_dotenv

load_dotenv()

app = Flask(__name__)

co = cohere.Client(os.environ.get("COHERE_API_KEY"))


user_sessions = {}

# Questions de diagnostic dynamiques
DYNAMIC_DIAGNOSTIC_QUESTIONS = [
    "Pour commencer, quels sont vos principaux symptômes et depuis quand apparaissent-ils ?",
    "Merci. Pour vous aider au mieux, pourriez-vous préciser : la valeur de la fièvre si présente, la durée exacte des symptômes, et la présence de toux ou de difficultés à respirer ?",
    "Y a-t-il une douleur localisée, des vomissements, et quel est votre niveau d'hydratation ?",
    "Enfin, quels sont vos antécédents médicaux et vos traitements actuels ?"
]


try:
    nltk.data.find('tokenizers/punkt')
except nltk.downloader.DownloadError:
    nltk.download('punkt', quiet=True)
try:
    nltk.data.find('corpora/stopwords')
except nltk.downloader.DownloadError:
    nltk.download('stopwords', quiet=True)

stop_words = set(stopwords.words('french'))

# Liste de symptômes graves pour la détection d'urgence
URGENT_SYMPTOMS = [
    "douleur thoracique intense", "difficulté à respirer sévère", "perte de conscience",
    "engourdissement soudain", "faiblesse soudaine d'un côté du corps", "parole confuse",
    "convulsions", "saignement incontrôlable", "fièvre très élevée avec confusion",
    "raideur de la nuque avec fièvre", "vomissements persistants avec déshydratation",
    "douleur abdominale aiguë et sévère", "réaction allergique sévère (gonflement, difficulté à respirer)"
]

RAG_SERVICE_URL = "http://127.0.0.1:5002/rag" # URL du service RAG

# Charger la base de connaissances à partir du fichier JSON
try:
    json_file_path = os.path.join(os.path.dirname(__file__), 'diseases_symptoms.json')
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    symptoms_db = data.get('diseases', {})
    all_symptoms = data.get('symptoms', [])
except FileNotFoundError:
    print("Erreur: Le fichier diseases_symptoms.json n'a pas été trouvé.")
    symptoms_db = {}
    all_symptoms = []
except json.JSONDecodeError:
    print("Erreur: Impossible de décoder diseases_symptoms.json. Vérifiez le format JSON.")
    symptoms_db = {}
    all_symptoms = []

# Charger les données des médecins
doctors_data = []
try:
    doctors_file_path = os.path.join(os.path.dirname(__file__), 'doctors.json')
    with open(doctors_file_path, 'r', encoding='utf-8') as f:
        doctors_data = json.load(f)
except FileNotFoundError:
    print("Erreur: Le fichier doctors.json n'a pas été trouvé.")
except json.JSONDecodeError:
    print("Erreur: Impossible de décoder doctors.json. Vérifiez le format JSON.")

if not symptoms_db:
    print("Avertissement: La base de données des maladies est vide. Le modèle ne sera pas entraîné.")
    # Fallback à une base de connaissances minimale si le chargement échoue
    symptoms_db = {
        "Rhume": ["éternuements", "nez qui coule", "mal de gorge", "toux"],
        "Grippe": ["fièvre", "frissons", "douleurs musculaires", "fatigue", "maux de tête"]
    }
    all_symptoms = list(set([symptom for symptoms in symptoms_db.values() for symptom in symptoms]))

print(f"Base de données des maladies chargée: {len(symptoms_db)} maladies.")
print(f"Exemple de maladies: {list(symptoms_db.keys())[:5]}")

# Préparation des données pour le modèle
X_train_text = [" ".join(s) for s in symptoms_db.values()]
y_train_labels = list(symptoms_db.keys())

print(f"Textes d'entraînement: {len(X_train_text)} entrées.")
print(f"Exemple de textes d'entraînement (top 10): {X_train_text[:10]}")
print(f"Labels d'entraînement: {len(y_train_labels)} labels.")
print(f"Exemple de labels d'entraînement (top 10): {y_train_labels[:10]}")

# Création et entraînement du modèle
vectorizer = TfidfVectorizer()
if X_train_text:
    X_train = vectorizer.fit_transform(X_train_text)
    model = MultinomialNB()
    model.fit(X_train, y_train_labels)
    print(f"Modèle entraîné avec {len(model.classes_)} classes.")
    print(f"Classes du modèle: {model.classes_[:5]}")
    print(f"Taille du vocabulaire du vectorizer: {len(vectorizer.vocabulary_)}")
    print(f"Exemple de vocabulaire du vectorizer (top 10): {list(vectorizer.vocabulary_.items())[:10]}")
else:
    print("Avertissement: Pas de données d'entraînement pour le modèle.")
    model = None # Le modèle ne sera pas entraîné si X_train_text est vide

# Fonction pour suggérer des médecins
def get_suggested_doctors(disease_name):
    suggestions = []
    
    # Cartographie des maladies vers les spécialités
    disease_to_specialty_map = {
        "Hypertensive disease": "Cardiologue",
        "Coronary arteriosclerosis": "Cardiologue",
        "Coronary heart disease": "Cardiologue",
        "Myocardial infarction": "Cardiologue",
        "Cardiomyopathy": "Cardiologue",
        "Tricuspid valve insufficiency": "Cardiologue",
        "Stenosis aortic valve": "Cardiologue",
        "Failure heart congestive": "Cardiologue",
        "Failure heart": "Cardiologue",
        "Tachycardia sinus": "Cardiologue",

        "Diabetes": "Endocrinologue",
        "Hyperglycemia": "Endocrinologue",
        "Ketoacidosis diabetic": "Endocrinologue",

        "Depression mental": "Psychiatre",
        "Depressive disorder": "Psychiatre",
        "Anxiety state": "Psychiatre",
        "Psychotic disorder": "Psychiatre",
        "Bipolar disorder": "Psychiatre",
        "Schizophrenia": "Psychiatre",
        "Personality disorder": "Psychiatre",
        "Delusion": "Psychiatre",
        "Affect labile": "Psychiatre",
        "Manic disorder": "Psychiatre",
        "Suicide attempt": "Psychiatre",
        "Dependence": "Psychiatre",
        "Chronic alcoholic intoxication": "Psychiatre",

        "Pneumonia": "Pneumologue",
        "Asthma": "Pneumologue",
        "Bronchitis": "Pneumologue",
        "Respiratory failure": "Pneumologue",
        "Emphysema pulmonary": "Pneumologue",
        "Pneumothorax": "Pneumologue",
        "Upper respiratory infection": "Pneumologue",
        "Spasm bronchial": "Pneumologue",
        "Pneumocystis\u00a0carinii\u00a0pneumonia": "Pneumologue",
        "Pneumonia aspiration": "Pneumologue",
        "Hypertension pulmonary": "Pneumologue",

        "Infection urinary tract": "Néphrologue",
        "Insufficiency renal": "Néphrologue",
        "Chronic kidney failure": "Néphrologue",
        "Kidney failure acute": "Néphrologue",
        "Kidney disease": "Néphrologue",
        "Pyelonephritis": "Néphrologue",
        "Benign prostatic hypertrophy": "Urologue",
        "Malignant neoplasm of prostate": "Urologue",
        "Carcinoma prostate": "Urologue",

        "Gastroesophageal reflux disease": "Gastro-entérologue",
        "Hepatitis c": "Gastro-entérologue",
        "Cirrhosis": "Gastro-entérologue",
        "Pancreatitis": "Gastro-entérologue",
        "Cholecystitis": "Gastro-entérologue",
        "Cholelithiasis": "Gastro-entérologue",
        "Biliary calculus": "Gastro-entérologue",
        "Ileus": "Gastro-entérologue",
        "Hernia": "Gastro-entérologue",
        "Ulcer peptic": "Gastro-entérologue",
        "Diverticulitis": "Gastro-entérologue",
        "Diverticulosis": "Gastro-entérologue",
        "Gastritis": "Gastro-entérologue",
        "Gastroenteritis": "Gastro-entérologue",
        "Primary carcinoma of the liver cells": "Gastro-entérologue",
        "Hemorrhoids": "Gastro-entérologue",
        "Hernia\u00a0hiatal": "Gastro-entérologue",
        "Colitis": "Gastro-entérologue",
        "Hepatitis b": "Gastro-entérologue",
        "Hepatitis": "Gastro-entérologue",
        "Malignant tumor of colon": "Gastro-entérologue",
        "Carcinoma colon": "Gastro-entérologue",

        "Accident\u00a0cerebrovascular": "Neurologue",
        "Dementia": "Neurologue",
        "Epilepsy": "Neurologue",
        "Hemiparesis": "Neurologue",
        "Transient ischemic attack": "Neurologue",
        "Paranoia": "Neurologue",
        "Parkinson disease": "Neurologue",
        "Encephalopathy": "Neurologue",
        "Alzheimer's disease": "Neurologue",
        "Neuropathy": "Neurologue",
        "Migraine disorders": "Neurologue",
        "Tonic-clonic epilepsy": "Neurologue",
        "Tonic-clonic seizures": "Neurologue",
        "Delirium": "Neurologue",
        "Aphasia": "Neurologue",
        "Confusion": "Neurologue",

        "Malignant neoplasms": "Oncologue",
        "Primary malignant neoplasm": "Oncologue",
        "Carcinoma": "Oncologue",
        "Malignant neoplasm of breast": "Oncologue",
        "Carcinoma breast": "Oncologue",
        "Malignant neoplasm of lung": "Oncologue",
        "Carcinoma of lung": "Oncologue",
        "Neoplasm": "Oncologue",
        "Neoplasm metastasis": "Oncologue",
        "Lymphatic diseases": "Oncologue",
        "Lymphoma": "Oncologue",
        "Melanoma": "Oncologue",
        "Malignant\u00a0neoplasms": "Oncologue",

        "Arthritis": "Rhumatologue",
        "Osteoporosis": "Rhumatologue",
        "Degenerative\u00a0polyarthritis": "Rhumatologue",
        "Gout": "Rhumatologue",

        "Cellulitis": "Dermatologue",
        "Exanthema": "Dermatologue",
        "Candidiasis": "Dermatologue",
        "Oralcandidiasis": "Dermatologue",

        "Anemia": "Hématologue",
        "Thrombocytopaenia": "Hématologue",
        "Pancytopenia": "Hématologue",
        "Neutropenia": "Hématologue",
        "Sickle cell anemia": "Hématologue",

        "Allergie": "Allergologue",

        "Angine": "ORL",

        "Rhume": "Généraliste",
        "Grippe": "Généraliste",
        "COVID-19": "Généraliste",
        "Infection": "Généraliste",
        "Septicemia": "Généraliste",
        "Systemic infection": "Généraliste",
        "Sepsis (invertebrate)": "Généraliste",
        "Bacteremia": "Généraliste",
        "Influenza": "Généraliste",
        "Dehydration": "Généraliste",
        "Hypoglycemia": "Généraliste",
        "Overload fluid": "Généraliste",
        "Obesity": "Généraliste",
        "Obesity morbid": "Généraliste",
        "Hypercholesterolemia": "Généraliste",
        "Hyperlipidemia": "Généraliste",
        "Ischemia": "Généraliste",
        "Peripheral vascular disease": "Généraliste",
        "Deep vein thrombosis": "Généraliste",
        "Thrombus": "Généraliste",
        "Decubitus ulcer": "Généraliste",
        "Incontinence": "Généraliste",
        "Paroxysmal\u00a0dyspnea": "Généraliste",
        "Deglutition disorder": "Généraliste"
    }

    specialty = disease_to_specialty_map.get(disease_name, "Généraliste")
    normalized_specialty = normalize_string(specialty)
    print(f"Pour la maladie '{disease_name}', la spécialité déterminée est: '{specialty}' (normalisée: '{normalized_specialty}')")
    
    found_doctors_names = []
    for doctor in doctors_data:
        normalized_doctor_specialty = normalize_string(doctor['specialty'])
        print(f"Comparaison: Médecin spécialité '{normalized_doctor_specialty}' avec spécialité cible '{normalized_specialty}'")
        if normalized_doctor_specialty == normalized_specialty:
            found_doctors_names.append(doctor['name'])
    print(f"Médecins trouvés pour '{specialty}': {found_doctors_names}")
    return found_doctors_names

@app.route('/cohere_chat', methods=['POST'])
def cohere_chat():
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        print(f"Prompt Cohere pour /cohere_chat: {user_message}")
        response = co.chat(
            message=user_message,
            model="command-r-plus", # Ou un autre modèle Cohere approprié
            temperature=0.7,
            max_tokens=1000 # Augmenter le nombre de tokens
        )
        print(f"Réponse brute de Cohere pour /cohere_chat: {response.text}")
        return jsonify({"message": response.text}) # Changer 'response' en 'message' pour correspondre à ChatResponse
    except Exception as e:
        print(f"Erreur lors de l'appel à Cohere pour /cohere_chat: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    user_symptoms_input = data.get('symptoms', [])
    session_id = data.get('session_id', 'default_session') # Utiliser un ID de session

    if session_id not in user_sessions:
        user_sessions[session_id] = {
            'symptoms_collected': [],
            'diagnostic_step': 0,
            'last_question': ''
        }

    session_state = user_sessions[session_id]

    if not user_symptoms_input:
        # Si c'est le début d'une nouvelle session ou si l'utilisateur n'a rien fourni
        if session_state['diagnostic_step'] == 0:
            initial_message = "Bonjour ! Je suis votre assistant médical en ligne. Je suis là pour vous aider à mieux comprendre vos symptômes et vous orienter vers les prochaines étapes. Cela ne remplace pas un avis médical. " + DYNAMIC_DIAGNOSTIC_QUESTIONS[0]
            session_state['last_question'] = initial_message
            return jsonify({
                "message": initial_message,
                "requires_more_info": True,
                "next_question": DYNAMIC_DIAGNOSTIC_QUESTIONS[0]
            }), 200
        else:
            return jsonify({"error": "No symptoms provided for current step"}), 400

    # Ajouter les symptômes de l'utilisateur à la liste collectée
    session_state['symptoms_collected'].extend(user_symptoms_input)
    all_symptoms_text = " ".join([normalize_string(s) for s in session_state['symptoms_collected']])
    print(f"Symptômes collectés pour la session {session_id}: {session_state['symptoms_collected']}")

    # Détection des symptômes d'urgence (à chaque étape pour ne rien manquer)
    is_urgent = False
    for urgent_symptom in URGENT_SYMPTOMS:
        if normalize_string(urgent_symptom) in all_symptoms_text:
            is_urgent = True
            break

    if is_urgent:
        # Réinitialiser la session après une alerte d'urgence
        user_sessions.pop(session_id, None)
        emergency_message = {
            "message": "🚨 **URGENCE MÉDICALE** 🚨\n\n"
                       "Les symptômes que vous décrivez sont **potentiellement graves** et nécessitent une **attention médicale immédiate**.\n\n"
                       "**Veuillez consulter un professionnel de la santé sans délai.**\n\n"
                       "Cet assistant ne peut pas remplacer un avis médical d'urgence. Votre sécurité est notre priorité absolue.",
            "requires_more_info": False
        }
        return jsonify(emergency_message), 200

    # Passer à l'étape suivante du diagnostic
    session_state['diagnostic_step'] += 1

    if session_state['diagnostic_step'] < len(DYNAMIC_DIAGNOSTIC_QUESTIONS):
        # Poser la prochaine question
        session_state['last_question'] = DYNAMIC_DIAGNOSTIC_QUESTIONS[session_state['diagnostic_step']]
        return jsonify({
            "message": session_state['last_question'],
            "requires_more_info": True,
            "next_question": session_state['last_question']
        }), 200
    else:
        # Toutes les questions ont été posées, procéder au diagnostic final
        print(f"Diagnostic final pour la session {session_id} avec symptômes: {all_symptoms_text}")

        X_user = vectorizer.transform([all_symptoms_text])
        print(f"X_user (forme): {X_user.shape}")

        # Prédiction des probabilités
        if model is None:
            user_sessions.pop(session_id, None)
            return jsonify({"error": "Le modèle n'a pas été entraîné.", "requires_more_info": False}), 500
        
        probabilities = model.predict_proba(X_user)[0]
        print(f"Probabilités de prédiction (top 5): {np.argsort(probabilities)[::-1][:5]} -> {[model.classes_[i] for i in np.argsort(probabilities)[::-1][:5]]} avec probabilités {[round(probabilities[i], 4) for i in np.argsort(probabilities)[::-1][:5]]}")
        print(f"Classes du modèle: {model.classes_}")
        
        # Association des probabilités aux maladies
        diagnoses = []
        for i, disease in enumerate(model.classes_):
            confidence = probabilities[i]
            if confidence > 0.01: # Seuil de confiance ajusté à 0.01
                associated_symptoms = symptoms_db.get(disease, [])
                diagnoses.append({"disease": disease, "confidence": round(confidence, 2), "associated_symptoms": associated_symptoms})
                
        # Tri par confiance
        diagnoses = sorted(diagnoses, key=lambda d: d['confidence'], reverse=True)
        print(f"Diagnostics finaux: {diagnoses}")
        
        # Construction de la réponse améliorée avec RAG
        if not diagnoses:
            rag_info_fallback = ""
            try:
                rag_response_fallback = requests.post(RAG_SERVICE_URL, json={"query": all_symptoms_text})
                if rag_response_fallback.status_code == 200:
                    rag_data_fallback = rag_response_fallback.json()
                    if "response" in rag_data_fallback and rag_data_fallback["response"] == "Je n'ai pas trouvé d'informations pertinentes pour votre requête dans ma base de connaissances.":
                        rag_info_fallback = ""
                    else:
                        rag_info_fallback = f"Classe: {rag_data_fallback.get('classe', 'N/A')}, Bloc: {rag_data_fallback.get('bloc', 'N/A')}, Chapitre: {rag_data_fallback.get('chapitre', 'N/A')}."
                    print(f"Information RAG (fallback) pour '{all_symptoms_text}': {rag_info_fallback}")
                else:
                    print(f"Erreur lors de l'appel au service RAG (fallback): {rag_response_fallback.status_code} - {rag_response_fallback.text}")
            except requests.exceptions.RequestException as e:
                print(f"Impossible de se connecter au service RAG (fallback): {e}")

            try:
                prompt_cohere = f"L'utilisateur décrit les symptômes suivants : '{all_symptoms_text}'. Le système de diagnostic n'a pas pu identifier de maladie spécifique."
                if rag_info_fallback:
                    prompt_cohere += f" Cependant, j'ai trouvé des informations qui pourraient vous éclairer : {rag_info_fallback}."
                
                specialty_suggestion = "un médecin généraliste"
                prompt_cohere += f" Il est recommandé de consulter {specialty_suggestion} pour une évaluation approfondie."
                prompt_cohere += " En tant qu'assistant médical, veuillez fournir une réponse empathique et rappeler l'importance de consulter un professionnel de la santé. La réponse doit être en français."
                
                cohere_response = co.chat(
                    message=prompt_cohere,
                    model="command-r-plus",
                    temperature=0.7,
                    max_tokens=400
                )
                response_message = cohere_response.text
            except Exception as e:
                print(f"Erreur lors de l'appel à Cohere pour fallback: {e}")
                response_message = "Bonjour ! Je suis là pour vous aider. D'après ce que vous me décrivez, il est difficile de poser un diagnostic précis pour le moment, et je n'ai pas trouvé d'informations spécifiques dans ma base de connaissances. Il est vraiment important de consulter un médecin ou un professionnel de la santé dès que possible pour obtenir un diagnostic précis et des conseils adaptés à votre situation."
            
            user_sessions.pop(session_id, None) # Réinitialiser la session
            return jsonify({"message": response_message, "diagnoses": [], "requires_more_info": False})

        top_diagnosis = diagnoses[0]
        disease_name = top_diagnosis['disease']
        confidence = top_diagnosis['confidence'] * 100

        rag_info = ""
        try:
            rag_response = requests.post(RAG_SERVICE_URL, json={"query": disease_name})
            if rag_response.status_code == 200:
                rag_data = rag_response.json()
                if "response" in rag_data and rag_data["response"] == "Je n'ai pas trouvé d'informations pertinentes pour votre requête dans ma base de connaissances.":
                    rag_info = ""
                else:
                    rag_info = f"Classe: {rag_data.get('classe', 'N/A')}, Bloc: {rag_data.get('bloc', 'N/A')}, Chapitre: {rag_data.get('chapitre', 'N/A')}."
                print(f"Information RAG pour '{disease_name}': {rag_info}")
            else:
                print(f"Erreur lors de l'appel au service RAG: {rag_response.status_code} - {rag_response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Impossible de se connecter au service RAG: {e}")

        suggested_doctors_names = get_suggested_doctors(disease_name)
        specialty_for_disease = "un médecin généraliste"
        if suggested_doctors_names:
            disease_to_specialty_map = {
                "Hypertensive disease": "Cardiologue", "Coronary arteriosclerosis": "Cardiologue", "Coronary heart disease": "Cardiologue", "Myocardial infarction": "Cardiologue", "Cardiomyopathy": "Cardiologue", "Tricuspid valve insufficiency": "Cardiologue", "Stenosis aortic valve": "Cardiologue", "Failure heart congestive": "Cardiologue", "Failure heart": "Cardiologue", "Tachycardia sinus": "Cardiologue",
                "Diabetes": "Endocrinologue", "Hyperglycemia": "Endocrinologue", "Ketoacidosis diabetic": "Endocrinologue",
                "Depression mental": "Psychiatre", "Depressive disorder": "Psychiatre", "Anxiety state": "Psychiatre", "Psychotic disorder": "Psychiatre", "Bipolar disorder": "Psychiatre", "Schizophrenia": "Psychiatre", "Personality disorder": "Psychiatre", "Delusion": "Psychiatre", "Affect labile": "Psychiatre", "Manic disorder": "Psychiatre", "Suicide attempt": "Psychiatre", "Dependence": "Psychiatre", "Chronic alcoholic intoxication": "Psychiatre",
                "Pneumonia": "Pneumologue", "Asthma": "Pneumologue", "Bronchitis": "Pneumologue", "Respiratory failure": "Pneumologue", "Emphysema pulmonary": "Pneumologue", "Pneumothorax": "Pneumologue", "Upper respiratory infection": "Pneumologue", "Spasm bronchial": "Pneumologue", "Pneumocystis\u00a0carinii\u00a0pneumonia": "Pneumologue", "Pneumonia aspiration": "Pneumologue", "Hypertension pulmonary": "Pneumologue",
                "Infection urinary tract": "Néphrologue", "Insufficiency renal": "Néphrologue", "Chronic kidney failure": "Néphrologue", "Kidney failure acute": "Néphrologue", "Kidney disease": "Néphrologue", "Pyelonephritis": "Néphrologue", "Benign prostatic hypertrophy": "Urologue", "Malignant neoplasm of prostate": "Urologue", "Carcinoma prostate": "Urologue",
                "Gastroesophageal reflux disease": "Gastro-entérologue", "Hepatitis c": "Gastro-entérologue", "Cirrhosis": "Gastro-entérologue", "Pancreatitis": "Gastro-entérologue", "Cholecystitis": "Gastro-entérologue", "Cholelithiasis": "Gastro-entérologue", "Biliary calculus": "Gastro-entérologue", "Ileus": "Gastro-entérologue", "Hernia": "Gastro-entérologue", "Ulcer peptic": "Gastro-entérologue", "Diverticulitis": "Gastro-entérologue", "Diverticulosis": "Gastro-entérologue", "Gastritis": "Gastro-entérologue", "Gastroenteritis": "Gastro-entérologue", "Primary carcinoma of the liver cells": "Gastro-entérologue", "Hemorrhoids": "Gastro-entérologue", "Hernia\u00a0hiatal": "Gastro-entérologue", "Colitis": "Gastro-entérologue", "Hepatitis b": "Gastro-entérologue", "Hepatitis": "Gastro-entérologue", "Malignant tumor of colon": "Gastro-entérologue", "Carcinoma colon": "Gastro-entérologue",
                "Accident\u00a0cerebrovascular": "Neurologue", "Dementia": "Neurologue", "Epilepsy": "Neurologue", "Hemiparesis": "Neurologue", "Transient ischemic attack": "Neurologue", "Paranoia": "Neurologue", "Parkinson disease": "Neurologue", "Encephalopathy": "Neurologue", "Alzheimer's disease": "Neurologue", "Neuropathy": "Neurologue", "Migraine disorders": "Neurologue", "Tonic-clonic epilepsy": "Neurologue", "Tonic-clonic seizures": "Neurologue", "Delirium": "Neurologue", "Aphasia": "Neurologue", "Confusion": "Neurologue",
                "Malignant neoplasms": "Oncologue", "Primary malignant neoplasm": "Oncologue", "Carcinoma": "Oncologue", "Malignant neoplasm of breast": "Oncologue", "Carcinoma breast": "Oncologue", "Malignant neoplasm of lung": "Oncologue", "Carcinoma of lung": "Oncologue", "Neoplasm": "Oncologue", "Neoplasm metastasis": "Oncologue", "Lymphatic diseases": "Oncologue", "Lymphoma": "Oncologue", "Melanoma": "Oncologue", "Malignant\u00a0neoplasms": "Oncologue",
                "Arthritis": "Rhumatologue", "Osteoporosis": "Rhumatologue", "Degenerative\u00a0polyarthritis": "Rhumatologue", "Gout": "Rhumatologue",
                "Cellulitis": "Dermatologue", "Exanthema": "Dermatologue", "Candidiasis": "Dermatologue", "Oralcandidiasis": "Dermatologue",
                "Anemia": "Hématologue", "Thrombocytopaenia": "Hématologue", "Pancytopenia": "Hématologue", "Neutropenia": "Hématologue", "Sickle cell anemia": "Hématologue",
                "Allergie": "Allergologue",
                "Angine": "ORL",
                "Rhume": "Généraliste", "Grippe": "Généraliste", "COVID-19": "Généraliste", "Infection": "Généraliste", "Septicemia": "Généraliste", "Systemic infection": "Généraliste", "Sepsis (invertebrate)": "Généraliste", "Bacteremia": "Généraliste", "Influenza": "Généraliste", "Dehydration": "Généraliste", "Hypoglycemia": "Généraliste", "Overload fluid": "Généraliste", "Obesity": "Généraliste", "Obesity morbid": "Généraliste", "Hypercholesterolemia": "Généraliste", "Hyperlipidemia": "Généraliste", "Ischemia": "Généraliste", "Peripheral vascular disease": "Généraliste", "Deep vein thrombosis": "Généraliste", "Thrombus": "Généraliste", "Decubitus ulcer": "Généraliste", "Incontinence": "Généraliste", "Paroxysmal\u00a0dyspnea": "Généraliste", "Deglutition disorder": "Généraliste"
            }
            specialty_for_disease = disease_to_specialty_map.get(disease_name, "un médecin généraliste")
            specialty_for_disease = f"un {specialty_for_disease}" if specialty_for_disease != "Généraliste" else "un médecin généraliste"

        try:
            prompt_cohere_final = f"En tant qu'assistant médical, reformulez le message suivant de manière plus naturelle et empathique, en insistant sur l'importance de la consultation médicale et en offrant des conseils généraux de bien-être. Le diagnostic principal est : **{disease_name}** (avec une probabilité de {confidence:.0f}%). "
            if rag_info:
                prompt_cohere_final += f"Informations supplémentaires du RAG : {rag_info}. "
            prompt_cohere_final += f"Il est **fortement recommandé de consulter {specialty_for_disease}** pour une évaluation et un diagnostic précis. La réponse doit être en français."
            
            cohere_final_response = co.chat(
                message=prompt_cohere_final,
                model="command-r-plus",
                temperature=0.7,
                max_tokens=1000
            )
            response_message = cohere_final_response.text
            response_message = re.sub(r'\n\s*\n', '\n\n', response_message).strip()
            response_message = re.sub(r' {2,}', ' ', response_message)
            print(f"Prompt Cohere pour /predict (final): {prompt_cohere_final}")
            print(f"Réponse Cohere pour /predict (final): {response_message}")
        except Exception as e:
            print(f"Erreur lors de l'appel à Cohere pour la réponse finale: {e}")
            response_message = f"Bonjour ! Je suis là pour vous aider. D'après les symptômes que vous avez décrits, il semblerait que nous puissions envisager une piste principale : **{disease_name}** (avec une probabilité de {confidence:.0f}%)."
            if rag_info:
                response_message += f"\n\nPour vous donner plus de contexte, voici quelques informations sur cette condition : {rag_info}."
            response_message += "\n\nIl est crucial de comprendre que ces informations sont des indications basées sur notre base de connaissances et ne remplacent en aucun cas un diagnostic médical formel. Seul un professionnel de la santé qualifié, après un examen approfondi, pourra établir un diagnostic précis."
            response_message += f"\n\n**Nous vous recommandons de consulter {specialty_for_disease}** pour une évaluation plus approfondie."
            response_message += "\n\nEn attendant votre consultation, je vous conseille de bien vous hydrater, de vous reposer et d'éviter tout effort physique intense. Prenez soin de vous."
            response_message += "\n\nN'hésitez pas si vous avez d'autres questions d'ordre général, je suis là pour y répondre. Cependant, pour toute préoccupation concernant votre santé, l'avis médical professionnel reste la priorité absolue."
            response_message = re.sub(r'\n\s*\n', '\n\n', response_message).strip()
            response_message = re.sub(r' {2,}', ' ', response_message)
            print(f"Réponse Cohere pour /predict (fallback): {response_message}")

        user_sessions.pop(session_id, None) # Réinitialiser la session après le diagnostic final
        return jsonify({"message": response_message, "diagnoses": diagnoses, "requires_more_info": False})

# Fonction utilitaire pour normaliser les chaînes
def normalize_string(text):
    text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn') # Supprimer les accents
    text = text.lower()
    text = re.sub(r'\W', ' ', text) # Supprimer la ponctuation
    tokens = word_tokenize(text, language='french')
    tokens = [word for word in tokens if word.isalpha() and word not in stop_words]
    return ' '.join(tokens)

if __name__ == '__main__':
    app.run(debug=True, port=5001)

# Fonction utilitaire pour normaliser les chaînes
def normalize_string(text):
    text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn') # Supprimer les accents
    text = text.lower()
    text = re.sub(r'\W', ' ', text) # Supprimer la ponctuation
    tokens = word_tokenize(text, language='french')
    tokens = [word for word in tokens if word.isalpha() and word not in stop_words]
    return ' '.join(tokens)

if __name__ == '__main__':
    app.run(debug=True, port=5001)

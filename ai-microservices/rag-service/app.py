import json
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import re
import os
from PyPDF2 import PdfReader

app = Flask(__name__)

# Initialiser le TfidfVectorizer
vectorizer = TfidfVectorizer()

# Fonction pour extraire le texte d'un PDF
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PdfReader(file)
            for page_num in range(len(reader.pages)):
                text += reader.pages[page_num].extract_text()
    except Exception as e:
        print(f"Erreur lors de l'extraction du texte du PDF {pdf_path}: {e}")
    return text

# Charger les données
try:
    # Obtenir le chemin absolu du répertoire du script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Construire les chemins absolus vers les fichiers de données
    csv_path = os.path.join(script_dir, '..', '..', 'src', 'app', 'data', 'Data in text format (CSV).csv')
    json_path = os.path.join(script_dir, '..', 'diagnosis-service', 'diseases_symptoms.json')
    pdf_dir = os.path.join(script_dir, '..', '..', 'src', 'app', 'data')

    # Charger les données CSV
    df = pd.read_csv(csv_path, sep=';')
    # Nettoyer et préparer les données
    df['cause_initiale_classe'] = df['cause_initiale_classe'].fillna('')
    df['cause_initiale_bloc'] = df['cause_initiale_bloc'].fillna('')
    df['cause_initiale_chapitre'] = df['cause_initiale_chapitre'].fillna('')
    
    # Combiner les colonnes pertinentes pour la recherche
    df['combined_text'] = df['cause_initiale_classe'] + ' ' + \
                          df['cause_initiale_bloc'] + ' ' + \
                          df['cause_initiale_chapitre']
    
    # Charger les données de diseases_symptoms.json
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            diseases_data = json.load(f)
        
        # Créer un DataFrame à partir des données de maladies et symptômes
        diseases_list = []
        for disease, symptoms in diseases_data['diseases'].items():
            diseases_list.append({
                'disease_name': disease,
                'symptoms': ' '.join(symptoms)
            })
        df_diseases = pd.DataFrame(diseases_list)
        
        # Charger les données PDF
        pdf_texts = []
        pdf_filenames = []
        for filename in os.listdir(pdf_dir):
            if filename.endswith('.pdf'):
                pdf_path = os.path.join(pdf_dir, filename)
                text = extract_text_from_pdf(pdf_path)
                if text:
                    pdf_texts.append(text)
                    pdf_filenames.append(filename)
        
        df_pdfs = pd.DataFrame({
            'pdf_name': pdf_filenames,
            'content': pdf_texts
        })

        # Prétraitement du texte
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        stop_words = set(stopwords.words('french'))

        def preprocess_text(text):
            text = text.lower()
            text = re.sub(r'\W', ' ', text) # Supprimer la ponctuation
            tokens = word_tokenize(text, language='french')
            tokens = [word for word in tokens if word.isalpha() and word not in stop_words]
            return ' '.join(tokens)

        df['processed_text'] = df['combined_text'].apply(preprocess_text)
        df_diseases['processed_text'] = df_diseases['symptoms'].apply(preprocess_text)
        df_pdfs['processed_text'] = df_pdfs['content'].apply(preprocess_text)

        # Combiner tous les textes traités pour la vectorisation
        combined_processed_texts = df['processed_text'].tolist() + \
                                   df_diseases['processed_text'].tolist() + \
                                   df_pdfs['processed_text'].tolist()

        # Créer la matrice TF-IDF pour tous les textes
        tfidf_matrix = vectorizer.fit_transform(combined_processed_texts)
        
        # Créer un DataFrame combiné pour retrouver l'origine des résultats
        df_combined = pd.concat([
            df, 
            df_diseases.rename(columns={'disease_name': 'cause_initiale_classe', 'symptoms': 'combined_text'}),
            df_pdfs.rename(columns={'pdf_name': 'cause_initiale_classe', 'content': 'combined_text'})
        ], ignore_index=True)
        df_combined['source'] = ['csv'] * len(df) + ['json'] * len(df_diseases) + ['pdf'] * len(df_pdfs)

    except FileNotFoundError:
        print("Fichier diseases_symptoms.json ou PDF non trouvé. Le service RAG fonctionnera uniquement avec les données CSV.")
        # Fallback to CSV only if JSON/PDFs are not found
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        stop_words = set(stopwords.words('french'))

        def preprocess_text(text):
            text = text.lower()
            text = re.sub(r'\W', ' ', text)
            tokens = word_tokenize(text, language='french')
            tokens = [word for word in tokens if word.isalpha() and word not in stop_words]
            return ' '.join(tokens)

        df['processed_text'] = df['combined_text'].apply(preprocess_text)
        tfidf_matrix = vectorizer.fit_transform(df['processed_text'].tolist())
        df_combined = df
        df_combined['source'] = ['csv'] * len(df)

    except Exception as e:
        print(f"Erreur lors du chargement ou du traitement des données (JSON/PDF) : {e}")
        # Fallback to CSV only if JSON/PDF processing fails
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        stop_words = set(stopwords.words('french'))

        def preprocess_text(text):
            text = text.lower()
            text = re.sub(r'\W', ' ', text)
            tokens = word_tokenize(text, language='french')
            tokens = [word for word in tokens if word.isalpha() and word not in stop_words]
            return ' '.join(tokens)

        df['processed_text'] = df['combined_text'].apply(preprocess_text)
        tfidf_matrix = vectorizer.fit_transform(df['processed_text'].tolist())
        df_combined = df
        df_combined['source'] = ['csv'] * len(df)

except Exception as e:
    print(f"Erreur lors du chargement ou du traitement du fichier CSV : {e}")
    df = None
    tfidf_matrix = None
    df_combined = None

@app.route('/rag', methods=['POST'])
def rag_service():
    if df_combined is None or tfidf_matrix is None:
        return jsonify({"error": "Base de connaissances non disponible. Erreur de chargement des données."}), 500

    data = request.get_json()
    user_query = data.get('query', '')

    if not user_query:
        return jsonify({"response": "Veuillez fournir une requête."})

    # Prétraiter la requête de l'utilisateur
    processed_query = preprocess_text(user_query)
    query_vector = vectorizer.transform([processed_query])

    # Calculer la similarité cosinus
    similarities = cosine_similarity(query_vector, tfidf_matrix)
    
    # Obtenir l'index de la maladie la plus similaire
    most_similar_index = similarities.argmax()
    
    # Récupérer les informations de la maladie la plus pertinente
    if similarities[0, most_similar_index] > 0.1:  # Seuil de similarité
        relevant_info = df_combined.iloc[most_similar_index]
        
        response_message = {
            "source": relevant_info['source'],
            "similarite": float(similarities[0, most_similar_index])
        }
        
        if relevant_info['source'] == 'csv':
            response_message.update({
                "classe": relevant_info['cause_initiale_classe'],
                "bloc": relevant_info['cause_initiale_bloc'],
                "chapitre": relevant_info['cause_initiale_chapitre'],
                "annee_deces": str(relevant_info['annee_deces']),
                "sexe": relevant_info['sexe'],
                "classe_age": relevant_info['classe_age']
            })
        elif relevant_info['source'] == 'json':
            response_message.update({
                "maladie": relevant_info['cause_initiale_classe'],
                "symptomes": relevant_info['combined_text']
            })
        elif relevant_info['source'] == 'pdf':
            response_message.update({
                "document_pdf": relevant_info['cause_initiale_classe'],
                "contenu_extrait": relevant_info['combined_text'][:500] + "..." # Limiter le contenu pour la réponse
            })
    else:
        response_message = {"response": "Je n'ai pas trouvé d'informations pertinentes pour votre requête dans ma base de connaissances."}

    return jsonify(response_message)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)

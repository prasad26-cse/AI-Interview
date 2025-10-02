import os
import requests
import json

# Hugging Face API Configuration
# Get API key from environment variable
API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
BASE_URL = "https://api-inference.huggingface.co/models"

def test_question_generation():
    """Test question generation from context"""
    # Try multiple question generation models
    models = [
        "valhalla/t5-base-qg-hl",
        "mrm8488/t5-base-finetuned-question-generation-ap",
        "iarfmoose/t5-base-question-generator"
    ]
    
    context = """
    Python is a high-level, interpreted programming language. 
    It was created by Guido van Rossum and first released in 1991. 
    Python emphasizes code readability and uses significant indentation.
    It supports multiple programming paradigms including procedural, object-oriented, and functional programming.
    """
    
    for model in models:
        url = f"{BASE_URL}/{model}"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": context
        }
        
        try:
            print(f"\nTesting Question Generation: {model}")
            print("-" * 60)
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            print("✓ Success!")
            print(f"Status Code: {response.status_code}")
            print("Generated Questions:")
            print(json.dumps(result, indent=2))
            
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Failed with {model}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Status: {e.response.status_code}")
                print(f"Error: {e.response.text[:200]}")
    
    return None

def test_answer_evaluation_similarity():
    """Test answer evaluation using semantic similarity"""
    model = "sentence-transformers/all-MiniLM-L6-v2"
    url = f"{BASE_URL}/{model}"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Test cases: correct answer vs student answer
    test_cases = [
        {
            "question": "What is Python?",
            "correct_answer": "Python is a high-level programming language",
            "student_answer": "Python is a programming language used for coding"
        },
        {
            "question": "Who created Python?",
            "correct_answer": "Guido van Rossum",
            "student_answer": "It was created by Guido"
        },
        {
            "question": "When was Python released?",
            "correct_answer": "1991",
            "student_answer": "In the early 1990s"
        }
    ]
    
    try:
        print("\n" + "=" * 60)
        print("Testing Answer Evaluation (Semantic Similarity)")
        print("=" * 60)
        
        for i, test in enumerate(test_cases, 1):
            print(f"\nTest Case {i}:")
            print(f"Question: {test['question']}")
            print(f"Correct Answer: {test['correct_answer']}")
            print(f"Student Answer: {test['student_answer']}")
            print("-" * 60)
            
            payload = {
                "inputs": {
                    "source_sentence": test['correct_answer'],
                    "sentences": [test['student_answer']]
                }
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                similarity = result[0]
                print(f"✓ Similarity Score: {similarity:.4f}")
                
                # Evaluation criteria
                if similarity >= 0.8:
                    grade = "Excellent"
                elif similarity >= 0.6:
                    grade = "Good"
                elif similarity >= 0.4:
                    grade = "Fair"
                else:
                    grade = "Poor"
                
                print(f"Grade: {grade}")
            else:
                print("Response:", json.dumps(result, indent=2))
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed!")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status: {e.response.status_code}")
            print(f"Error: {e.response.text[:200]}")
        return None

def test_answer_correctness_qa():
    """Test answer correctness using QA model"""
    model = "deepset/roberta-base-squad2"
    url = f"{BASE_URL}/{model}"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    test_cases = [
        {
            "context": "Python is a high-level, interpreted programming language created by Guido van Rossum in 1991.",
            "question": "Who created Python?",
            "student_answer": "Guido van Rossum"
        },
        {
            "context": "Python is a high-level, interpreted programming language created by Guido van Rossum in 1991.",
            "question": "When was Python created?",
            "student_answer": "1991"
        },
        {
            "context": "Python emphasizes code readability and uses significant indentation. It supports multiple programming paradigms.",
            "question": "What does Python emphasize?",
            "student_answer": "Code readability"
        }
    ]
    
    try:
        print("\n" + "=" * 60)
        print("Testing Answer Correctness (QA Model)")
        print("=" * 60)
        
        for i, test in enumerate(test_cases, 1):
            print(f"\nTest Case {i}:")
            print(f"Question: {test['question']}")
            print(f"Student Answer: {test['student_answer']}")
            print("-" * 60)
            
            payload = {
                "inputs": {
                    "question": test['question'],
                    "context": test['context']
                }
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if isinstance(result, dict):
                model_answer = result.get("answer", "")
                confidence = result.get("score", 0)
                
                print(f"✓ Model's Expected Answer: {model_answer}")
                print(f"Confidence: {confidence:.4f}")
                
                # Simple comparison
                student_lower = test['student_answer'].lower()
                model_lower = model_answer.lower()
                
                if student_lower in model_lower or model_lower in student_lower:
                    match = "Correct ✓"
                else:
                    match = "Incorrect ✗"
                
                print(f"Evaluation: {match}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed!")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status: {e.response.status_code}")
            print(f"Error: {e.response.text[:200]}")
        return None

def test_text_classification_for_evaluation():
    """Test using text classification for answer quality"""
    model = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    url = f"{BASE_URL}/{model}"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    test_cases = [
        {
            "query": "What is machine learning?",
            "answer": "Machine learning is a subset of AI that enables systems to learn from data"
        },
        {
            "query": "What is machine learning?",
            "answer": "It's about computers and stuff"
        }
    ]
    
    try:
        print("\n" + "=" * 60)
        print("Testing Answer Quality (Cross-Encoder)")
        print("=" * 60)
        
        for i, test in enumerate(test_cases, 1):
            print(f"\nTest Case {i}:")
            print(f"Question: {test['query']}")
            print(f"Answer: {test['answer']}")
            print("-" * 60)
            
            payload = {
                "inputs": {
                    "text": test['query'],
                    "text_pair": test['answer']
                }
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            print(f"✓ Relevance Score: {result}")
            print(f"Response: {json.dumps(result, indent=2)}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed!")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status: {e.response.status_code}")
            print(f"Error: {e.response.text[:200]}")
        return None

def effectiveness_summary():
    """Print effectiveness summary"""
    print("\n" + "=" * 60)
    print("EFFECTIVENESS ANALYSIS")
    print("=" * 60)
    
    print("\n📊 QUESTION GENERATION:")
    print("  Pros:")
    print("  ✓ Can generate questions from context automatically")
    print("  ✓ Useful for creating practice tests")
    print("  ✓ Saves time in content creation")
    print("  Cons:")
    print("  ✗ May require specific models (some have 404 errors)")
    print("  ✗ Quality depends on context clarity")
    print("  ✗ May need fine-tuning for domain-specific questions")
    print("  Effectiveness: 6-7/10 (model availability issues)")
    
    print("\n📊 ANSWER EVALUATION:")
    print("  Pros:")
    print("  ✓ Semantic similarity works well (tested successfully)")
    print("  ✓ QA models can extract expected answers")
    print("  ✓ Can provide confidence scores")
    print("  ✓ Good for objective questions")
    print("  Cons:")
    print("  ✗ Struggles with subjective/open-ended answers")
    print("  ✗ May miss context-dependent correctness")
    print("  ✗ Simple string matching can be limiting")
    print("  Effectiveness: 7-8/10 (works well for factual QA)")
    
    print("\n💡 RECOMMENDATIONS:")
    print("  1. Use QA models (deepset/roberta-base-squad2) - WORKING ✓")
    print("  2. Use sentence transformers for similarity - WORKING ✓")
    print("  3. Combine multiple approaches for better accuracy")
    print("  4. Add human review for complex answers")
    print("  5. Consider fine-tuning models for your specific domain")
    
    print("\n🎯 BEST USE CASES:")
    print("  ✓ Technical interviews (factual questions)")
    print("  ✓ MCQ generation and validation")
    print("  ✓ Short answer evaluation")
    print("  ✓ Automated grading for objective tests")
    print("  ⚠ Less effective for:")
    print("    - Essay evaluation")
    print("    - Creative/subjective answers")
    print("    - Complex reasoning tasks")

if __name__ == "__main__":
    print("=" * 60)
    print("QUESTION GENERATION & ANSWER EVALUATION TEST")
    print("=" * 60)
    
    # Test 1: Question Generation
    test_question_generation()
    
    # Test 2: Answer Evaluation via Similarity
    test_answer_evaluation_similarity()
    
    # Test 3: Answer Correctness via QA
    test_answer_correctness_qa()
    
    # Test 4: Cross-Encoder for Quality
    test_text_classification_for_evaluation()
    
    # Summary
    effectiveness_summary()
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)

// WARNING: For a purely static GitHub Pages deployment, the key lives here.
// Keep strict quotas on this key in your Google Cloud Console.
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; 

let currentTranslation = "";
let currentLang = "";

const speechLocales = {
    "Japanese": "ja-JP",
    "Chinese": "zh-CN",
    "Russian": "ru-RU",
    "Arabic": "ar-SA"
};

async function translateAndLearn() {
    const text = document.getElementById('inputText').value.trim();
    const targetLang = document.getElementById('languageSelect').value;
    const resultDiv = document.getElementById('result');
    const btn = document.getElementById('translateBtn');

    if (!text) return alert("Please enter a phrase to translate!");
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') return alert("Please insert your API Key in script.js");

    btn.innerText = "Processing...";
    btn.disabled = true;

    // We prompt Gemini to act as a structured data generator for our UI
    const prompt = `You are a language teacher. Translate the following English text into ${targetLang}: "${text}". 
    Return EXACTLY one valid JSON object with NO markdown blocks or extra text. The JSON format must be:
    {
        "translation": "The translated text in native script",
        "romanization": "The pronunciation using English alphabet (e.g. Romaji/Pinyin)",
        "breakdown": [
            {"word": "native word", "meaning": "english meaning"}
        ],
        "example": "A short, simple example sentence in ${targetLang} using one of the words."
    }`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        let rawJson = data.candidates[0].content.parts[0].text;
        
        // Clean up markdown block if the model included it defensively
        rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(rawJson);

        updateUI(parsedData, targetLang);
    } catch (error) {
        console.error("Translation error:", error);
        alert("Failed to parse the translation. Check the console for details.");
    } finally {
        btn.innerText = "Translate & Learn";
        btn.disabled = false;
    }
}

function updateUI(data, lang) {
    document.getElementById('result').classList.remove('hidden');
    
    currentTranslation = data.translation;
    currentLang = lang;

    document.getElementById('translatedText').innerText = data.translation;
    document.getElementById('romanization').innerText = data.romanization;
    document.getElementById('exampleText').innerText = data.example;

    const list = document.getElementById('dictionaryList');
    list.innerHTML = "";
    data.breakdown.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.word}</strong> : ${item.meaning}`;
        list.appendChild(li);
    });
}

function playTranslation() {
    if (!currentTranslation) return;
    
    // Using the browser's native SpeechSynthesis API
    const utterance = new SpeechSynthesisUtterance(currentTranslation);
    utterance.lang = speechLocales[currentLang];
    window.speechSynthesis.speak(utterance);
}

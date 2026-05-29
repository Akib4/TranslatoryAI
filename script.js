let currentTranslation = "";
let currentLang = "";

const speechLocales = {
    "Japanese": "ja-JP",
    "Chinese": "zh-CN",
    "Russian": "ru-RU",
    "Arabic": "ar-SA"
};

// Check for a saved key when the application loads
document.addEventListener("DOMContentLoaded", () => {
    const savedKey = localStorage.getItem("gemini_user_key");
    const statusText = document.getElementById("keyStatus");
    if (savedKey) {
        statusText.innerText = "🔑 Key loaded securely from your local browser memory.";
        document.getElementById("apiKeyInput").value = "••••••••••••••••••••••••";
    } else {
        statusText.innerText = "⚠️ No API key set. Please save your key to translate.";
    }
});

function saveApiKey() {
    const key = document.getElementById("apiKeyInput").value.trim();
    if (!key || key.includes("•••")) return alert("Please enter a valid key.");
    
    localStorage.setItem("gemini_user_key", key);
    document.getElementById("keyStatus").innerText = "✅ Key saved successfully!";
}

function clearApiKey() {
    localStorage.removeItem("gemini_user_key");
    document.getElementById("apiKeyInput").value = "";
    document.getElementById("keyStatus").innerText = "❌ Key removed from browser memory.";
}

async function translateAndLearn() {
    const apiKey = localStorage.getItem("gemini_user_key");
    if (!apiKey) {
        return alert("Please enter and save your Gemini API key in the configuration panel first!");
    }

    const text = document.getElementById('inputText').value.trim();
    const targetLang = document.getElementById('languageSelect').value;
    const btn = document.getElementById('translateBtn');

    if (!text) return alert("Please enter a phrase to translate!");

    btn.innerText = "Processing...";
    btn.disabled = true;

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
        // We call the model using the local key provided by the UI input box
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error("API Key might be invalid or expired.");

        const data = await response.json();
        let rawJson = data.candidates[0].content.parts[0].text;
        
        rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(rawJson);

        updateUI(parsedData, targetLang);
    } catch (error) {
        console.error("Translation error:", error);
        alert("Error connecting to Gemini. Please verify your API key is correct.");
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
    const utterance = new SpeechSynthesisUtterance(currentTranslation);
    utterance.lang = speechLocales[currentLang];
    window.speechSynthesis.speak(utterance);
}

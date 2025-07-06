// ==UserScript==
// @name         Talk with ChatGPT on Scratch (with free models)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Button to talk with ChatGPT on Scratch, including 2 free no-API-key options and localStorage saving.
// @author       VIGARPAST_777
// @match        *://scratch.mit.edu/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', () => {
        const STORAGE_KEY = 'chatgpt-scratch-history';
        const STORAGE_APIKEY = 'chatgpt-api-key';
        const STORAGE_MODEL = 'chatgpt-model';

        const models = [
            { id: "gpt-3.5-free-mubi", label: "(FREE) GPT-3.5 (mubi.tech)" },
            { id: "gpt-3.5-free-tmrace", label: "(FREE) GPT-3.5 (tmrace.net)" },
            { id: "gpt-3.5-turbo", label: "(FREE) gpt-3.5-turbo (API Key Required)" },
            { id: "gpt-4", label: "(Paid) gpt-4 (API Key Required)" },
            { id: "gpt-4o", label: "(Paid) gpt-4o (API Key Required)" }
        ];

        const style = `
            #chatgpt-button {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999;
                background-color: #10a37f;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
            }
            #chatgpt-panel {
                position: fixed;
                top: 50px;
                right: 10px;
                width: 340px;
                height: 500px;
                background: white;
                border: 1px solid #ccc;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 99998;
                display: none;
                flex-direction: column;
                font-family: sans-serif;
                border-radius: 8px;
            }
            #chatgpt-panel header {
                background: #10a37f;
                color: white;
                padding: 10px;
                font-size: 16px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #chatgpt-panel .body {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 10px;
                overflow-y: auto;
            }
            #chatgpt-panel .footer {
                padding: 10px;
                border-top: 1px solid #ccc;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            #chatgpt-panel textarea {
                width: 100%;
                height: 60px;
                resize: none;
            }
            #chatgpt-panel select, #chatgpt-panel input[type="text"] {
                width: 100%;
                padding: 4px;
            }
            .chat-history {
                font-size: 12px;
                margin-bottom: 8px;
                overflow-y: auto;
                max-height: 240px;
            }
            .chat-question {
                font-weight: bold;
                color: #333;
            }
            .chat-answer {
                margin-left: 10px;
                color: #555;
            }
            #clear-history-btn {
                background: #e63946;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            #clear-history-btn:hover {
                background: #d62828;
            }
        `;

        GM_addStyle(style);

        const button = document.createElement('button');
        button.id = "chatgpt-button";
        button.innerText = "Talk with ChatGPT";

        const panel = document.createElement('div');
        panel.id = "chatgpt-panel";
        panel.innerHTML = `
            <header>
                ChatGPT Panel
                <button id="clear-history-btn" title="Clear chat history">Clear History</button>
            </header>
            <div class="body">
                <div>
                    <label>API Key:</label>
                    <input type="text" id="chatgpt-api-key" placeholder="sk-..." />
                </div>
                <div>
                    <label>Model:</label>
                    <select id="chatgpt-model">
                        ${models.map(m => `<option value="${m.id}">${m.label}</option>`).join("")}
                    </select>
                </div>
                <div class="chat-history" id="chatgpt-history"></div>
            </div>
            <div class="footer">
                <textarea id="chatgpt-question" placeholder="Enter your question..."></textarea>
                <button id="chatgpt-send">Send</button>
            </div>
        `;

        document.body.appendChild(button);
        document.body.appendChild(panel);

        const apiKeyInput = panel.querySelector("#chatgpt-api-key");
        const modelSelect = panel.querySelector("#chatgpt-model");
        const questionInput = panel.querySelector("#chatgpt-question");
        const sendButton = panel.querySelector("#chatgpt-send");
        const historyDiv = panel.querySelector("#chatgpt-history");
        const clearHistoryBtn = panel.querySelector("#clear-history-btn");

        apiKeyInput.value = localStorage.getItem(STORAGE_APIKEY) || "";
        modelSelect.value = localStorage.getItem(STORAGE_MODEL) || "gpt-3.5-turbo";

        let savedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        for (const entry of savedHistory) {
            historyDiv.innerHTML += `<div class="chat-question">You: ${entry.q}</div>`;
            historyDiv.innerHTML += `<div class="chat-answer">ChatGPT: ${entry.a}</div>`;
        }

        button.addEventListener('click', () => {
            panel.style.display = panel.style.display === "flex" ? "none" : "flex";
            panel.style.flexDirection = "column";
        });

        sendButton.addEventListener('click', async () => {
            const model = modelSelect.value;
            const question = questionInput.value.trim();
            const apiKey = apiKeyInput.value.trim();

            if (!question) {
                alert("Enter a question.");
                return;
            }

            if (!model.startsWith("gpt-3.5-free") && !apiKey) {
                alert("Please enter your API key for this model.");
                return;
            }

            localStorage.setItem(STORAGE_APIKEY, apiKey);
            localStorage.setItem(STORAGE_MODEL, model);

            historyDiv.innerHTML += `<div class="chat-question">You: ${question}</div>`;
            historyDiv.scrollTop = historyDiv.scrollHeight;

            let answer = "";

            try {
                if (model === "gpt-3.5-free-mubi") {
                    const res = await fetch("https://reverse.mubi.tech/v1", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            messages: [{ role: "user", content: question }]
                        })
                    });
                    const data = await res.json();
                    answer = data.choices?.[0]?.message?.content || "No response.";
                } else if (model === "gpt-3.5-free-tmrace") {
                    const res = await fetch("https://api.tmrace.net/v1/chat/completions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo",
                            messages: [{ role: "user", content: question }]
                        })
                    });
                    const data = await res.json();
                    answer = data.choices?.[0]?.message?.content || "No response.";
                } else {
                    const res = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [{ role: "user", content: question }]
                        })
                    });
                    const data = await res.json();
                    answer = data.choices?.[0]?.message?.content || "No response.";
                }
            } catch (err) {
                answer = `❌ Error: ${err.message}`;
            }

            historyDiv.innerHTML += `<div class="chat-answer">ChatGPT: ${answer}</div>`;
            historyDiv.scrollTop = historyDiv.scrollHeight;
            questionInput.value = "";

            savedHistory.push({ q: question, a: answer });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedHistory));
        });

        clearHistoryBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the chat history?")) {
                savedHistory = [];
                localStorage.removeItem(STORAGE_KEY);
                historyDiv.innerHTML = "";
            }
        });
    });
})();

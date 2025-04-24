import React, { useState, useRef, useEffect } from 'react';
import Kiosksinterface from './kiosksinterface';
import processjson from './flattened_menu';

const MenuKiosk = () => {
    const [query, setQuery] = useState('');
    const [voiceQuery, setVoiceQuery] = useState('');
    const [response, setResponse] = useState([]);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Welcome to KFC. What would you like to order?' }
    ]);
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);

    const recognitionRef = useRef(null);
    const micTimeoutRef = useRef(null);

    useEffect(() => {
        const speakWelcome = () => {
            window.speechSynthesis.cancel();
            const message = new SpeechSynthesisUtterance("Welcome to KFC. What would you like to order?");
            message.lang = 'en-US';
            message.rate = 1;
            message.pitch = 1;
            window.speechSynthesis.speak(message);
        };

        setTimeout(() => {
            speakWelcome();
            handleMicClick();
        }, 500);
    }, []);

    const handleSubmit = (searchText = query) => {
        const normalizedText = searchText.trim().toLowerCase().replace(/\s+/g, ' ');
        if (!normalizedText) {
            alert("Please enter a query or use the mic.");
            return;
        }

        setLoading(true);
        setMessages(prev => [...prev, { type: 'user', text: searchText }]);

        const filteredAssets = processjson.filter(item => {
            const textFields = [
                item.category,
                item.option_title,
                item.menu_text,
                item.description
            ];
            return textFields.some(field =>
                field?.toLowerCase().includes(normalizedText)
            );
        });

        setResponse(filteredAssets);

        setMessages(prev => [
            ...prev,
            {
                type: 'bot',
                text: filteredAssets.length > 0
                    ? `Here are some items related to "${searchText}":`
                    : `Sorry, I couldn’t find anything for "${searchText}".`,
                items: filteredAssets.length > 0 ? filteredAssets : null
            }
        ]);

        setLoading(false);
    };

    const handleMicClick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setVoiceQuery('');
            clearTimeout(micTimeoutRef.current);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        let finalTranscript = '';

        recognition.onstart = () => {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance("I'm listening...");
            msg.lang = 'en-US';
            window.speechSynthesis.speak(msg);

            setIsRecording(true);
            setVoiceQuery('');
            finalTranscript = '';

            micTimeoutRef.current = setTimeout(() => {
                recognition.stop();
                setIsRecording(false);
            }, 30000);
        };

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                    const cleanedText = transcript.trim().replace(/\s+/g, ' ');
                    setVoiceQuery(cleanedText);
                    handleSubmit(cleanedText);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'no-speech') {
                recognition.stop();
                setTimeout(() => {
                    handleMicClick();
                }, 1000);
            } else {
                setIsRecording(false);
                clearTimeout(micTimeoutRef.current);
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            clearTimeout(micTimeoutRef.current);
        };

        recognition.start();
    };

    const handleReset = () => {
        setQuery('');
        setVoiceQuery('');
        setResponse([]);
        setMessages([
            { type: 'bot', text: 'Welcome to KFC. What would you like to order?' }
        ]);
        setLoading(false);

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        setIsRecording(false);
        clearTimeout(micTimeoutRef.current);
    };

    return (
        <div className="chat-container">
            <h1 className="chat-header">Menu Kiosk PoC</h1>

            <div className="chat-box">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.type}`}>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.items && <Kiosksinterface response={msg.items} />}
                    </div>
                ))}
            </div>

            {loading && (
                <div className="loading">Loading...</div>
            )}

            <div className="chat-actions">
                <div className="input-container">
                    <input
                        type="text"
                        className="query-input"
                        value={query}
                        onChange={(e) => {
                            const cleaned = e.target.value.replace(/\s+/g, ' ');
                            setQuery(cleaned);
                        }}
                        placeholder="Type your query here..."
                    />
                    {(query || voiceQuery || response.length > 0 || messages.length > 1) && (
                        <button className="reset-button" onClick={handleReset}>
                            &#x27F3;
                        </button>
                    )}

                    <button
                        className={`mic-button ${isRecording ? 'recording' : ''}`}
                        onClick={handleMicClick}
                    >
                        {isRecording ? (
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                <path d="M8 5v14l7-7-7-7z"></path>
                                <path d="M0 0h24v24H0z" fill="none"></path>
                            </svg>
                        ) : (
                            '🎙️'
                        )}
                    </button>
                </div>

                <button className="submit-button" onClick={() => handleSubmit()}>
                    Submit
                </button>
            </div>
        </div>
    );
};

export default MenuKiosk;

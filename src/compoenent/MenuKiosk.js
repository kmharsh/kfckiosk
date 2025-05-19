import React, { useState, useRef, useEffect } from 'react';
import Kiosksinterface from './kiosksinterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { postFetchData, getFetchData } from "../utils/api";
import { URLS } from "../utils/endpoints";
import KfcLoader from './KfcLoader';

const MenuKiosk = () => {
    const [query, setQuery] = useState('');
    const [voiceQuery, setVoiceQuery] = useState('');
    const [response, setResponse] = useState([]);
    const [messages, setMessages] = useState([
        { type: "bot", message: "Welcome to KFC. What would you like to order?" }
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
            window.speechSynthesis.speak(message);
        };
        speakWelcome();
    }, []);

    const sendHistoryToAPI = async (messagesHistory) => {
        const payload = { conversation: messagesHistory };
        try {
            console.log("📡 Sending full chat history to API:", payload);
        } catch (err) {
            console.error("❌ API Error:", err.message);
        }
    };

    const handleSubmit = async (searchText = query) => {
        const normalizedText = searchText.trim().toLowerCase().replace(/\s+/g, ' ');

        if (!normalizedText) {
            alert("Please enter a query or use the mic.");
            return;
        }

        setMessages(prev => [...prev, { type: 'user', message: searchText }]);
        setLoading(true);

        try {
            const resp = await postFetchData(URLS.POST_SEACH_DATA, JSON.stringify({ query: normalizedText }));
            console.log(resp);
            setMessages(prev => [...prev, { type: 'bot', message: resp.response?.answer }]);
            setResponse(resp.response);
        } catch (error) {
            console.error("Error while fetching search data:", error);
            alert("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
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
            clearTimeout(micTimeoutRef.current);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsRecording(true);
            micTimeoutRef.current = setTimeout(() => {
                recognition.stop();
            }, 10000);
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript.trim();
            setVoiceQuery(transcript);
            const normalizedText = transcript.replace(/\s+/g, ' ');

            try {
                const resp = await postFetchData(URLS.POST_SEACH_DATA, JSON.stringify({ query: normalizedText }));
                console.log("API Response:", resp);
                setMessages(prev => [
                    ...prev,
                    { type: 'user', message: transcript },
                    { type: 'bot', message: resp.response?.answer }
                ]);
                setResponse(resp.response);
                setLoading(false);
                setIsRecording(false);
                clearTimeout(micTimeoutRef.current);
                setQuery('');
                setVoiceQuery('');
                sendHistoryToAPI([
                    ...messages,
                    { type: 'user', message: transcript },
                    { type: 'bot', message: resp.response?.answer }
                ]);
            } catch (error) {
                console.error("API Error:", error);
                setIsRecording(false);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
            clearTimeout(micTimeoutRef.current);
        };

        recognition.start();
    };

    const handleReset = async () => {
        try {
            recognitionRef.current?.stop();
            if (micTimeoutRef.current) clearTimeout(micTimeoutRef.current);
            setIsRecording(false);
            setQuery('');
            setVoiceQuery('');
            setResponse([]);
            setLoading(false);
            setMessages([{ type: 'bot', message: 'Welcome to KFC. What would you like to order?' }]);
            if (URLS?.GET_RESET_DATA) {
                const resetData = await getFetchData(URLS.GET_RESET_DATA);
                console.log('Reset Data:', resetData);
            } else {
                console.warn('GET_RESET_DATA URL is not defined.');
            }
        } catch (error) {
            console.error('Error during reset:', error);
        }
    };

    return (
        <div className="chat-container">
            <h1 className="chat-header">
                <img src="/kfc-2.svg" alt="KFC Logo" className="logo" />Kiosk
            </h1>

            <div className="chat-box">
                {messages?.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.type}`}>
                        <p>{msg?.message}</p>
                        {msg.type === "bot" && index === messages.length - 1 && (
                            <Kiosksinterface response={response} />
                        )}
                    </div>
                ))}
            </div>

            {loading && <KfcLoader />}

            <div className="chat-actions">
                <div className="input-container">
                    <input
                        type="text"
                        className="query-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value.replace(/\s+/g, ' '))}
                        placeholder="Type your query here..."
                    />
                    {(query || voiceQuery || response.length > 0 || messages?.length > 1) && (
                        <button className="reset-button" onClick={handleReset}>
                            &#x27F3;
                        </button>
                    )}
                    <button
                        className={`mic-button ${isRecording ? 'recording' : ''}`}
                        onClick={handleMicClick}
                        aria-label="Toggle microphone"
                    >
                        <FontAwesomeIcon icon={isRecording ? faMicrophoneSlash : faMicrophone} />
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

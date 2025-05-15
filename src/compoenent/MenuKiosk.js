import React, { useState, useRef, useEffect } from 'react';
import Kiosksinterface from './kiosksinterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faRotate } from '@fortawesome/free-solid-svg-icons';
import { postFetchData } from "../utils/api";
import { URLS } from "../utils/endpoints";



const MenuKiosk = () => {
    const [query, setQuery] = useState('');
    const [voiceQuery, setVoiceQuery] = useState('');
    const [response, setResponse] = useState([]);
    const [messages, setMessages] = useState([{type:"user", message:"Welcome to KFC. What would you like to order?"}]);
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
        const payload = {
            conversation: messagesHistory
        };

        try {
            console.log("📡 Sending full chat history to API:", payload);


        } catch (err) {
            console.error("❌ API Error:", err.message);
        }
    };

    const handleSubmit = async (searchText = query) => {
        const normalizedText = searchText.trim().toLowerCase().replace(/\s+/g, ' ');
         let messages__ = [...messages]
            messages__.push({ type: 'user', message: searchText });
        
            setMessages(messages__);

        if (!normalizedText) {
            alert("Please enter a query or use the mic.");
            return;
        }

        setLoading(true);

        try {
            const resp = await postFetchData(URLS.POST_SEACH_DATA, JSON.stringify({ query: normalizedText }));
            console.log(resp);
            
            let messages_ = [...messages__]
            
            messages_.push({ type: 'bot', message: resp.response?.answer });
            setMessages(messages_);

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
            setVoiceQuery('');
            clearTimeout(micTimeoutRef.current);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        let finalTranscript = '';

        recognition.onstart = () => {
            window.speechSynthesis.cancel();
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
            setIsRecording(false);
            clearTimeout(micTimeoutRef.current);
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
            { type: 'bot', message: 'Welcome to KFC. What would you like to order?' }
        ]);
        setLoading(false);

        if (recognitionRef.current) recognitionRef.current.stop();

        setIsRecording(false);
        clearTimeout(micTimeoutRef.current);
    };

    return (
        <div className="chat-container">
            <h1 className="chat-header">Menu Kiosk</h1>

            <div className="chat-box">
                {messages?.map((msg, index) => (
                    <div key={index} className={`chat-message `}>
                        <p>{msg?.message}</p>
                        {msg.type ==="bot" &&
                        <Kiosksinterface response={response} />}
                    </div>
                    
                ))}
            </div>

            {loading && <div className="loading">Loading...</div>}

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

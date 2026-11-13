
import { useState } from "react";

const API_URL = "http://localhost:8080/api/ai/ask";

function AIAssistant() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I'm ProjectPulse AI. I can help you with project planning, procurement, budgets, and project analysis. What would you like to know?"
        }
    ]);

    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!question.trim() || loading) return;

        const userQuestion = question.trim();

        setMessages((prev) => [
            ...prev,
            { role: "user", content: userQuestion }
        ]);

        setQuestion("");
        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: userQuestion
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to get an AI response.");
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.answer
                }
            ]);

        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I couldn't connect to the AI service. Please check that the backend is running and try again."
                }
            ]);

            console.error("AI Assistant Error:", error);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-assistant">
            <h2>ProjectPulse AI Assistant</h2>
            <p>Your intelligent project and procurement assistant.</p>

            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`chat-message ${message.role}`}
                    >
                        <strong>
                            {message.role === "user" ? "You" : "ProjectPulse AI"}
                        </strong>
                        <p>{message.content}</p>
                    </div>
                ))}

                {loading && (
                    <div className="chat-message assistant">
                        <strong>ProjectPulse AI</strong>
                        <p>Thinking...</p>
                    </div>
                )}
            </div>

            <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder="Ask something about your projects..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading}
                />

                <button type="submit" disabled={loading || !question.trim()}>
                    {loading ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
}

export default AIAssistant;

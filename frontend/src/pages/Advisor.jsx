import { useState } from "react";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function Advisor() {
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askAdvisor = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAdvice("");

    try {
      const res = await fetch("http://localhost:3001/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error("Failed to get advice");
      }

      const data = await res.json();
      setAdvice(data.advice);
    } catch (err) {
      setError("Could not connect to advisor. Check your backend.");
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What is the current market condition?",
    "Should I invest in stocks right now?",
    "What are the risks of trading?",
    "How do I build a diversified portfolio?",
  ];

  return (
    <div className="min-h-full overflow-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-3xl font-bold">AI Market Advisor</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Get simple, beginner-friendly insights on the Indian stock market
          </p>
        </div>

        {/* Quick questions */}
        <div className="glass rounded-xl p-4">
          <p className="text-sm font-semibold mb-3">Quick Questions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuestion(q)}
                className="text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors text-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about the market, investing, or trading..."
              rows={4}
              className="w-full px-4 py-3 bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={askAdvisor}
            disabled={loading || !question.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask Advisor
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 border border-destructive/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Response */}
        {advice && (
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Advisor's Response</h3>
            </div>
            <div className="prose prose-sm max-w-none text-foreground">
              {advice.split("\n").map((para, i) => (
                <p key={i} className="mb-3 last:mb-0 text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
          <p>
            ⚠️ This is AI-generated advice for educational purposes only.
            Always do your own research and consult a certified financial advisor before investing.
          </p>
        </div>
      </div>
    </div>
  );
}

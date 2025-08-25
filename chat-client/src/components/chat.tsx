"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import AISelector from "@/components/ai-selector";
import { ArrowUp, Bot, User, Settings } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolResponses?: any[];
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentAI, setCurrentAI] = useState<{provider: string, model: string}>(() => {
    // Cargar configuración guardada del localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiConfig');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Error loading saved AI config:', e);
        }
      }
    }
    return { provider: 'gemini', model: 'gemini-2.0-flash-exp' };
  });

  const handleProviderChange = (provider: string, model: string) => {
    setCurrentAI({ provider, model });
    // Guardar en localStorage para persistencia
    localStorage.setItem('aiConfig', JSON.stringify({ provider, model }));
    console.log(`🔄 AI changed to: ${provider} - ${model}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          aiProvider: currentAI.provider,
          aiModel: currentAI.model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Network error");
      }

      const assistantMessage = await response.json();
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${error.message}\n\nPlease make sure:\n1. Your .env file has JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN\n2. Your Gemini API key is configured\n3. The MCP server is running properly`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatJiraData = (data: any) => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.issues && Array.isArray(parsed.issues)) {
        return (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Found {parsed.found} of {parsed.total} issues for query: <code className="bg-muted px-1 py-0.5 rounded">{parsed.query}</code>
            </div>
            {parsed.issues.map((issue: any, index: number) => (
              <div key={issue.key || index} className="border rounded-lg p-3 bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">{issue.key}</span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">{issue.status}</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{issue.priority}</span>
                  </div>
                  <a 
                    href={issue.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View →
                  </a>
                </div>
                <h4 className="font-semibold text-sm mb-1">{issue.summary}</h4>
                <div className="text-xs text-muted-foreground space-x-4">
                  <span>👤 {issue.assignee}</span>
                  <span>📅 {issue.created}</span>
                  <span>🏷️ {issue.issueType}</span>
                </div>
                {issue.description && issue.description !== "No description" && (
                  <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{issue.description}</p>
                )}
              </div>
            ))}
          </div>
        );
      }
      
      if (parsed.projects && Array.isArray(parsed.projects)) {
        return (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Found {parsed.total} projects</div>
            {parsed.projects.map((project: any, index: number) => (
              <div key={project.key || index} className="border rounded p-2 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-semibold">{project.key}</span>
                    <span className="ml-2 text-sm">{project.name}</span>
                  </div>
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View →
                  </a>
                </div>
                <div className="text-xs text-muted-foreground">
                  👤 Lead: {project.lead} • Type: {project.projectTypeKey}
                </div>
              </div>
            ))}
          </div>
        );
      }
      
      return <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto">{data}</pre>;
    } catch {
      return <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto">{data}</pre>;
    }
  };

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6" />
            <h1 className="font-semibold">Jira MCP Chat</h1>
          </div>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">IA:</span>
              <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-md text-xs">
                <span>
                  {currentAI.provider === 'ollama-llama3' ? '🦙' : 
                   currentAI.provider === 'gemini' ? '✨' : 
                   currentAI.provider.includes('gpt') ? '🤖' : '🔧'}
                </span>
                <span>{currentAI.model}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Ask me about Jira issues using natural language
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-2xl text-center">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Jira MCP Chat</h2>
              <p className="text-muted-foreground mb-4">
                I can help you search Jira issues using natural language. Try asking:
              </p>
              <div className="space-y-2 text-sm">
                <div className="bg-muted/50 p-2 rounded">💡 "Show me all open issues in project AIDEV"</div>
                <div className="bg-muted/50 p-2 rounded">💡 "What issues are assigned to me?"</div>
                <div className="bg-muted/50 p-2 rounded">💡 "Find high priority bugs created this week"</div>
                <div className="bg-muted/50 p-2 rounded">💡 "List all projects"</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container py-4 space-y-4 max-w-4xl">
            {messages.map((message, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {message.role === "user" ? (
                    <User className="h-6 w-6 mt-1" />
                  ) : (
                    <Bot className="h-6 w-6 mt-1" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  {message.role === "assistant" && Array.isArray(message.toolResponses) && message.toolResponses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Tool Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="w-full">
                          {message.toolResponses.map((toolRes, i) => (
                            <AccordionItem key={i} value={`item-${i}`}>
                              <AccordionTrigger className="text-sm">
                                {toolRes.name} ({JSON.stringify(toolRes.arguments)})
                              </AccordionTrigger>
                              <AccordionContent>
                                {formatJiraData(JSON.stringify(toolRes.result))}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  )}

                  <div className={`rounded-lg p-4 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground ml-12" 
                      : "bg-muted"
                  }`}>
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start space-x-3">
                <Bot className="h-6 w-6 mt-1" />
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Configuración de IA</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>
            <AISelector 
              onProviderChange={handleProviderChange}
              defaultProvider={currentAI.provider}
              defaultModel={currentAI.model}
            />
          </div>
        </div>
      )}

      <div className="border-t bg-background">
        <div className="container py-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="relative">
            <AutoResizeTextarea
              value={input}
              onChange={setInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about Jira issues... (e.g., 'Show open issues in AIDEV project')"
              className="w-full border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  disabled={!input.trim() || loading}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          </form>
        </div>
      </div>
    </main>
  );
}
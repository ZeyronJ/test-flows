'use client';
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Send, RotateCcw, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// Definición de tipos para los mensajes
type MessageRole = 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

export default function TestFlows() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Función para configurar el webhook
  const handleWebhookSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (webhookUrl.trim()) {
      setIsConfigured(true);
    }
  };

  // Función para reiniciar el chat
  const handleResetChat = () => {
    setMessages([]);
    setSessionId(uuidv4());
    setInput('');
  };

  // Función para volver a la configuración
  const handleReconfigure = () => {
    setIsConfigured(false);
    setMessages([]);
    setSessionId(uuidv4());
    setInput('');
    setWebhookUrl('');
  };

  // Función para manejar el envío de mensajes
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      console.log('Respuesta del webhook:', data);

      // Agregar respuesta del asistente
      const assistantMessage: Message = {
        role: 'assistant',
        content: data[0].message || 'Error al obtener respuesta',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Mensaje de error en caso de fallo
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para enviar automáticamente el mensaje TEST_FLOW al iniciar el chat
  useEffect(() => {
    if (isConfigured && webhookUrl) {
      // Enviar POST invisible al webhook con el mensaje TEST_FLOW
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({ message: 'TEST_FLOW' }),
      }).catch(() => {}); // Ignorar errores
    }
    // Solo debe ejecutarse una vez al configurar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, webhookUrl, sessionId]);

  // Pantalla de configuración del webhook
  if (!isConfigured) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center'>Test Flows</CardTitle>
            <p className='text-sm text-gray-600 text-center'>
              Configura el webhook para comenzar
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWebhookSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='webhook'>URL del Webhook</Label>
                <Input
                  id='webhook'
                  type='url'
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder='https://ejemplo.com/webhook'
                  required
                />
              </div>
              <Button type='submit' className='w-full'>
                Iniciar Chat
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interfaz principal del chat
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-4 py-3'>
        <div className='max-w-3xl mx-auto flex items-center justify-between'>
          <h1 className='text-xl font-semibold text-gray-800'>Test Flows</h1>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleResetChat}
              className='flex items-center gap-2 bg-transparent'
            >
              <RotateCcw size={16} />
              Reiniciar Chat
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleReconfigure}
              className='flex items-center gap-2 bg-transparent'
            >
              <Settings size={16} />
              Configurar
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className='xl:w-2/5 w-full h-[calc(100vh-70px)] mx-auto flex flex-col justify-between'>
        {/* Contenedor de chat con altura controlada */}
        <div className='flex-1 overflow-auto p-4 h-full'>
          <div className='max-w-3xl mx-auto space-y-4'>
            {messages.length === 0 ? (
              <div className='text-center py-20'>
                <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
                  Escribe tu primer mensaje...
                </h2>
                <div className='mt-4 text-xs text-gray-500'>
                  Session ID: {sessionId}
                </div>
              </div>
            ) : (
              <div className='xl:pb-2 pb-0 pt-4 w-full'>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`px-2 md:px-6 lg:px-8 max-w-3xl mx-auto xl:mb-2 ${
                      message.role !== 'assistant' ? 'flex justify-end' : ''
                    }`}
                  >
                    <div
                      className={`flex items-start gap-4 py-4 ${
                        message.role !== 'assistant' ? 'justify-end' : ''
                      }`}
                    >
                      <div
                        className={`flex-1 max-w-none text-gray-800 ${
                          message.role === 'assistant'
                            ? ''
                            : 'bg-[#e9e9e980] rounded-lg px-4 py-2 max-w-fit'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className='prose'>
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className='px-4 md:px-6 lg:px-8 max-w-3xl mx-auto mb-4'>
                    <div className='flex items-start gap-4 py-4'>
                      <div className='flex-1'>
                        <div className='flex space-x-2 items-center h-6'>
                          <div className='w-2 h-2 rounded-full bg-gray-300 animate-bounce'></div>
                          <div className='w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-75'></div>
                          <div className='w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-150'></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Elemento de referencia para el scroll */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Área de entrada */}
        <div className='px-0 xl:px-4 py-2 border-t border-gray-200'>
          <div className='max-w-3xl mx-auto px-4'>
            <form onSubmit={handleSubmit} className='relative'>
              <div className='flex items-center overflow-hidden rounded-lg border border-gray-200 shadow-sm focus-within:border-sky-500 focus-within:ring-0 focus-within:ring-sky-500'>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        handleSubmit(
                          e as unknown as FormEvent<HTMLFormElement>
                        );
                      }
                    }
                  }}
                  placeholder='Escribe tu mensaje...'
                  className='w-full resize-none border-0 bg-transparent p-3 focus:outline-none focus:ring-0 text-gray-800 max-h-[200px]'
                  rows={1}
                />
                <button
                  type='submit'
                  className='p-2 rounded-md text-sky-600 hover:text-sky-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                  disabled={isLoading || !input.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
              <p className='mt-2 text-xs text-gray-500 text-center hidden xl:block'>
                Presiona Enter para enviar, Shift+Enter para nueva línea
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Loader2, Circle } from "lucide-react";
import api from "@/services/api";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const MessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/messages");
        setMessages(response.data);
        // Automatically select the first message if the list is not empty
        if (response.data.length > 0) {
            handleSelectMessage(response.data[0]);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, []);
  
  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      try {
        await api.patch(`/messages/${message.id}/read`);
        setMessages(messages.map(m => m.id === message.id ? { ...m, isRead: true } : m));
      } catch (error) {
      }
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mesaje Primite</h1>
        <p className="text-muted-foreground mt-2">
          Vizualizează și gestionează mesajele primite prin formularul de contact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:h-[calc(100vh-12rem)]">
        {/* Message List */}
        <Card className="lg:col-span-1 border-card-border bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-foreground">Inbox</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <Mail className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Niciun mesaj</h3>
                <p className="text-sm">Când vei primi mesaje, acestea vor apărea aici.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${
                      selectedMessage?.id === message.id
                        ? "bg-primary-light"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {!message.isRead && (
                         <Circle className="w-2.5 h-2.5 text-primary fill-current mt-1.5 flex-shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${message.isRead ? 'pl-[14px]' : ''}`}>
                        <div className="flex items-baseline justify-between gap-2">
                            <p className={`font-semibold text-sm truncate ${!message.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {message.name}
                            </p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: ro })}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate pr-4 mt-1 break-words">
                            {message.message}
                        </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Message Viewer */}
        <Card className="lg:col-span-2 border-card-border bg-card flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-foreground">Detalii Mesaj</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {selectedMessage ? (
              <div className="space-y-4 h-full flex flex-col">
                <div className="pb-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground break-words">{selectedMessage.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <a href={`mailto:${selectedMessage.email}`} className="hover:text-primary break-all">{selectedMessage.email}</a>
                        <span className="hidden sm:inline">&bull;</span>
                        <a href={`tel:${selectedMessage.phone}`} className="hover:text-primary break-all">{selectedMessage.phone}</a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(selectedMessage.createdAt), "PPP p", { locale: ro })}
                    </p>
                </div>
                <div className="prose prose-sm max-w-none text-foreground flex-1 pt-2">
                  <p className="whitespace-pre-wrap break-words">{selectedMessage.message}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-4">
                <Mail className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Selectează un mesaj</h3>
                <p className="text-sm">Selectează un mesaj din lista din stânga pentru a-l citi aici.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessagesPage;

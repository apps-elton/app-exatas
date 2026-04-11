import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageSquare, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Ticket = Tables<'support_tickets'>;
type Profile = Tables<'profiles'>;
type TicketMessage = Tables<'ticket_messages'>;

type TicketWithProfile = Ticket & {
  profiles: Pick<Profile, 'full_name' | 'email'> | null;
};

type MessageWithSender = TicketMessage & {
  profiles: Pick<Profile, 'full_name' | 'email'> | null;
};

type Priority = 'low' | 'medium' | 'high' | 'critical';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  resolved: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const FILTER_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'open', label: 'Abertos' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'resolved', label: 'Resolvidos' },
  { key: 'closed', label: 'Fechados' },
];

export default function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, profiles!support_tickets_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar tickets');
      console.error(error);
    } else {
      setTickets((data as TicketWithProfile[]) || []);
    }
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*, profiles!ticket_messages_sender_id_fkey(full_name, email)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar mensagens');
      console.error(error);
    } else {
      setMessages((data as MessageWithSender[]) || []);
    }
    setMessagesLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleToggleExpand = (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      setMessages([]);
    } else {
      setExpandedTicket(ticketId);
      setReplyText('');
      fetchMessages(ticketId);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: newStatus as TicketStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(`Status atualizado para ${STATUS_LABELS[newStatus] || newStatus}`);
      fetchTickets();
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ priority: newPriority as Priority, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) {
      toast.error('Erro ao atualizar prioridade');
    } else {
      toast.success('Prioridade atualizada');
      fetchTickets();
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este ticket?')) return;
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      toast.error('Erro ao excluir ticket');
    } else {
      toast.success('Ticket excluido');
      if (expandedTicket === ticketId) {
        setExpandedTicket(null);
        setMessages([]);
      }
      fetchTickets();
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim() || !user) return;
    setSendingReply(true);

    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message: replyText.trim(),
    });

    if (error) {
      toast.error('Erro ao enviar resposta');
      console.error(error);
    } else {
      toast.success('Resposta enviada');
      setReplyText('');
      fetchMessages(ticketId);
    }
    setSendingReply(false);
  };

  const filteredTickets =
    activeFilter === 'all'
      ? tickets
      : tickets.filter((t) => t.status === activeFilter);

  const openCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-red-400" />
              Suporte
            </h1>
            <p className="text-sm font-nunito text-muted-foreground mt-1">
              Gerencie os tickets de suporte da plataforma
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <span className="text-xs font-nunito text-muted-foreground">Abertos</span>
            <p className="text-xl font-poppins font-bold text-emerald-400">{openCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted/30 p-1 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-nunito transition-colors ${
                activeFilter === tab.key
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-400" />
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-nunito">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="w-8 px-2 py-3" />
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Assunto</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Usuario</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Prioridade</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Criado em</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <>
                      <tr
                        key={ticket.id}
                        className={`border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer ${
                          expandedTicket === ticket.id ? 'bg-muted/20' : ''
                        }`}
                        onClick={() => handleToggleExpand(ticket.id)}
                      >
                        <td className="px-2 py-3 text-center">
                          {expandedTicket === ticket.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">{ticket.subject}</td>
                        <td className="px-4 py-3 text-foreground">
                          {ticket.profiles?.full_name || ticket.profiles?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.low}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_COLORS[ticket.status] || STATUS_COLORS.open}>
                            {STATUS_LABELS[ticket.status] || ticket.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Select
                              value={ticket.status}
                              onValueChange={(v) => handleStatusChange(ticket.id, v)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Aberto</SelectItem>
                                <SelectItem value="in_progress">Em Andamento</SelectItem>
                                <SelectItem value="resolved">Resolvido</SelectItem>
                                <SelectItem value="closed">Fechado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={ticket.priority}
                              onValueChange={(v) => handlePriorityChange(ticket.id, v)}
                            >
                              <SelectTrigger className="w-[110px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => handleDelete(ticket.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Messages */}
                      {expandedTicket === ticket.id && (
                        <tr key={`${ticket.id}-messages`}>
                          <td colSpan={7} className="px-6 py-4 bg-muted/10 border-b border-border/30">
                            {messagesLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                              </div>
                            ) : (
                              <div className="space-y-4 max-w-3xl">
                                <h4 className="font-poppins font-semibold text-sm text-foreground">
                                  Mensagens ({messages.length})
                                </h4>

                                {messages.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-2">
                                    Nenhuma mensagem ainda
                                  </p>
                                ) : (
                                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {messages.map((msg) => (
                                      <div
                                        key={msg.id}
                                        className="rounded-lg border border-border/30 bg-background/50 p-3"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-semibold text-foreground">
                                            {msg.profiles?.full_name || msg.profiles?.email || 'Usuario'}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(msg.created_at).toLocaleString('pt-BR')}
                                          </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                          {msg.message}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reply */}
                                <div className="flex gap-2 pt-2">
                                  <Textarea
                                    placeholder="Digite sua resposta..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="min-h-[60px] text-sm resize-none"
                                  />
                                  <Button
                                    onClick={() => handleSendReply(ticket.id)}
                                    disabled={!replyText.trim() || sendingReply}
                                    className="shrink-0 bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    {sendingReply ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        Nenhum ticket encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

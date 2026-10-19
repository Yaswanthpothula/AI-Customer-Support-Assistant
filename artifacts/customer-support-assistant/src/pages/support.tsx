import { useState, type FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  LifeBuoy,
  MessageCircle,
  PackageCheck,
  RotateCw,
  Send,
  ShieldCheck,
  TicketCheck,
  Truck,
} from 'lucide-react';
import {
  getGetSupportFaqsQueryKey,
  getGetSupportHealthQueryKey,
  getHealthCheckQueryKey,
  useChatWithSupport,
  useCreateSupportTicket,
  useGetSupportFaqs,
  useGetSupportHealth,
  useHealthCheck,
} from '@workspace/api-client-react';
import type { ChatReply, TicketInputPriority } from '@workspace/api-client-react';

type ChatLine = {
  id: number;
  role: 'shopper' | 'team';
  text: string;
  reply?: ChatReply;
};

const starters = [
  { label: 'Where is my order?', icon: PackageCheck },
  { label: 'How do returns work?', icon: ArrowDownLeft },
  { label: 'Shipping timelines', icon: Truck },
];

function SupportPage() {
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: 1 } });
  const supportHealth = useGetSupportHealth({ query: { queryKey: getGetSupportHealthQueryKey(), retry: 1 } });
  const faqs = useGetSupportFaqs({ query: { queryKey: getGetSupportFaqsQueryKey(), retry: 1 } });
  const chatMutation = useChatWithSupport();
  const ticketMutation = useCreateSupportTicket();

  const [chatText, setChatText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSummary, setTicketSummary] = useState('');
  const [ticketCategory, setTicketCategory] = useState('order');
  const [ticketPriority, setTicketPriority] = useState<TicketInputPriority>('normal');
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [sendError, setSendError] = useState('');

  const submitChat = (event?: FormEvent<HTMLFormElement>, preset?: string) => {
    event?.preventDefault();
    const message = (preset ?? chatText).trim();
    if (message.length < 2 || chatMutation.isPending) return;
    setSendError('');
    setLines((current) => [...current, { id: Date.now(), role: 'shopper', text: message }]);
    setChatText('');
    chatMutation.mutate(
      { data: { message, customer_name: customerName.trim() || undefined, customer_email: customerEmail.trim() || undefined } },
      {
        onSuccess: (reply) => setLines((current) => [...current, { id: Date.now() + 1, role: 'team', text: reply.answer, reply }]),
        onError: () => setSendError('We could not reach our support desk just now. Your message is still here—please try again.'),
      },
    );
  };

  const openTicket = (message = '') => {
    ticketMutation.reset();
    setTicketMessage(message);
    setTicketSummary(message.slice(0, 90));
    setTicketOpen(true);
    setSendError('');
  };

  const submitTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ticketMessage.trim().length < 2 || ticketSummary.trim().length < 2) return;
    ticketMutation.mutate({
      data: {
        message: ticketMessage.trim(),
        customer_name: customerName.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        category: ticketCategory,
        priority: ticketPriority,
        summary: ticketSummary.trim(),
      },
    });
  };

  const serviceUp = health.isSuccess && supportHealth.isSuccess;
  const currentTicket = ticketMutation.data;

  return (
    <main className="support-shell soft-grain min-h-[100dvh] px-4 py-5 text-[#233b34] sm:px-7 sm:py-8 lg:px-10">
      <div className="relative z-10 mx-auto max-w-[1390px]">
        <header className="mb-8 flex items-center justify-between gap-4 enter-up">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#285b4e] text-[#f9f5e9] shadow-[0_8px_18px_rgba(40,91,78,.18)]">
              <span className="font-serif text-[23px] font-extrabold tracking-[-.08em]">b.</span>
            </div>
            <div>
              <p className="font-serif text-[19px] font-extrabold leading-none tracking-[-.04em]">brightcart</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[.17em] text-[#718078]">The good things shop</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#d8e1d7] bg-[#fbfbf5]/80 px-3 py-2 text-xs font-semibold text-[#50665c]" data-testid="status-support-service">
            {health.isLoading || supportHealth.isLoading ? (
              <><span className="h-2 w-2 animate-pulse rounded-full bg-[#dca66e]" /> Checking our desk</>
            ) : serviceUp ? (
              <><span className="h-2 w-2 rounded-full bg-[#4a9b70]" /> Support assistant connected</>
            ) : (
              <><span className="h-2 w-2 rounded-full bg-[#c96b5b]" /> Desk connection needs a moment</>
            )}
          </div>
        </header>

        <div className="mb-7 grid items-end gap-5 md:grid-cols-[1fr_auto] enter-up enter-delay">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.19em] text-[#718078]">
              <span className="h-px w-7 bg-[#dc9c78]" /> BrightCart care
            </div>
            <h1 className="max-w-[760px] font-serif text-[clamp(2.1rem,5vw,3.7rem)] font-bold leading-[1.04] tracking-[-.055em] text-[#233b34]">
              A little help goes<br className="hidden sm:block" /> a long way.
            </h1>
            <p className="mt-3 max-w-[560px] text-[15px] leading-6 text-[#63736c]">
              Ask about store policies or create a demo ticket. This preview doesn’t access live orders or send email.
            </p>
          </div>
          <div className="hidden items-center gap-3 rounded-2xl border border-[#d9e2d8] bg-[#fafaf4]/75 px-4 py-3 md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e6d5] text-[#a66c4d]"><Clock3 size={19} /></div>
            <div><p className="text-xs font-bold text-[#334b42]">Grounded in</p><p className="mt-0.5 font-serif text-lg font-bold leading-none text-[#285b4e]">store policies</p></div>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,.82fr)]">
          <section className="support-panel overflow-hidden rounded-[26px] border border-[#e0e3d9] bg-[#fbfbf7] enter-up" aria-label="Support chat">
            <div className="flex items-center justify-between border-b border-[#e9e9df] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#e5efe7] text-[#285b4e]">
                  <Headphones size={20} strokeWidth={1.8} />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#fbfbf7] bg-[#5a9c73]" />
                </div>
                <div><h2 className="font-serif text-[16px] font-bold">BrightCart support</h2><p className="mt-0.5 text-xs text-[#78857e]">The demo support assistant</p></div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#edf3eb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#52745e]">
                <ShieldCheck size={13} /> Policy-grounded
              </div>
            </div>

            <div className="min-h-[320px] space-y-5 px-5 py-6 sm:min-h-[362px] sm:px-7" aria-live="polite">
              {lines.length === 0 ? (
                <div className="max-w-[590px]">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#829087]"><span className="h-1.5 w-1.5 rounded-full bg-[#e3a17d]" /> A note from the team</div>
                  <div className="rounded-2xl rounded-tl-sm border border-[#e3e7dc] bg-white px-4 py-4 text-[14px] leading-[1.7] text-[#485c53] shadow-[0_4px_14px_rgba(57,77,64,.035)]">
                    Hi there. We’re glad you stopped by. Tell us what’s going on and we’ll help you get to the bottom of it.
                  </div>
                  <div className="mt-5">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[.12em] text-[#829087]">A few things we can help with</p>
                    <div className="flex flex-wrap gap-2">
                      {starters.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => submitChat(undefined, label)} data-testid={`button-starter-${label.toLowerCase().replaceAll(' ', '-')}`} className="inline-flex items-center gap-2 rounded-full border border-[#dce4d9] bg-[#f7f8f2] px-3.5 py-2.5 text-xs font-semibold text-[#436154] transition hover:border-[#9db8a4] hover:bg-[#edf4ec]"><Icon size={14} />{label}<ArrowUpRight size={12} className="opacity-50" /></button>)}
                    </div>
                  </div>
                </div>
              ) : lines.map((line) => (
                <div key={line.id} className={`flex ${line.role === 'shopper' ? 'justify-end' : 'justify-start'}`} data-testid={`message-${line.role}-${line.id}`}>
                  {line.role === 'team' && <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e5efe7] text-[#285b4e]"><MessageCircle size={13} /></div>}
                  <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-[14px] leading-[1.65] ${line.role === 'shopper' ? 'rounded-br-sm bg-[#285b4e] text-[#fbfbf2]' : 'rounded-tl-sm border border-[#e3e7dc] bg-white text-[#485c53] shadow-[0_4px_14px_rgba(57,77,64,.035)]'}`}>
                    {line.text}
                    {line.reply && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#e8ece5] pt-2.5 text-[10px] font-semibold text-[#79887f]">
                      {line.reply.matched_faq && <span className="rounded-full bg-[#eff4ed] px-2 py-1">Based on: {line.reply.matched_faq}</span>}
                      <span className="rounded-full bg-[#eff4ed] px-2 py-1 capitalize">{line.reply.category}</span>
                      {line.reply.ticket_id && <span className="rounded-full bg-[#e8f2e8] px-2 py-1 text-[#426c50]">Ticket saved: {line.reply.ticket_id}</span>}
                      {line.reply.ticket_recommended && !line.reply.ticket_id && <button type="button" onClick={() => openTicket(line.text)} className="rounded-full bg-[#f6e8dd] px-2 py-1 text-[#8b563d] hover:bg-[#f1ddce]" data-testid={`button-create-ticket-${line.id}`}>Create a demo ticket</button>}
                    </div>}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && <div className="flex items-start gap-2" aria-label="Support is writing a reply"><div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#e5efe7] text-[#285b4e]"><MessageCircle size={13} /></div><div className="space-y-2 rounded-2xl rounded-tl-sm border border-[#e3e7dc] bg-white px-4 py-3"><div className="h-2 w-28 animate-pulse rounded-full bg-[#e7ece4]" /><div className="h-2 w-20 animate-pulse rounded-full bg-[#edf0e9]" /></div></div>}
            </div>

            {sendError && <div className="mx-5 mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#efd2c6] bg-[#fff6f0] px-4 py-3 text-xs text-[#8c503d] sm:mx-7" role="alert" data-testid="error-chat">{sendError}<button type="button" onClick={() => submitChat(undefined, lines.filter((line) => line.role === 'shopper').at(-1)?.text)} className="flex shrink-0 items-center gap-1 font-bold underline underline-offset-2" data-testid="button-retry-chat"><RotateCw size={12} /> Try again</button></div>}

            <div className="border-t border-[#e9e9df] bg-[#f8f8f2] px-4 py-4 sm:px-6">
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                <label className="sr-only" htmlFor="customer-name">Your name, optional</label>
                <input id="customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name (optional)" maxLength={100} data-testid="input-customer-name" className="h-9 rounded-lg border border-[#e0e4da] bg-[#fffefa] px-3 text-xs text-[#334b42] outline-none placeholder:text-[#9ba69f] focus:border-[#8eae9b] focus:ring-2 focus:ring-[#dce9dd]" />
                <label className="sr-only" htmlFor="customer-email">Email for follow-up, optional</label>
                <input id="customer-email" type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="Email for follow-up (optional)" maxLength={254} data-testid="input-customer-email" className="h-9 rounded-lg border border-[#e0e4da] bg-[#fffefa] px-3 text-xs text-[#334b42] outline-none placeholder:text-[#9ba69f] focus:border-[#8eae9b] focus:ring-2 focus:ring-[#dce9dd]" />
              </div>
              <form onSubmit={submitChat} className="flex items-end gap-2.5">
                <label className="sr-only" htmlFor="chat-message">Your message</label>
                <textarea id="chat-message" rows={1} maxLength={2000} value={chatText} onChange={(event) => setChatText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitChat(); } }} placeholder="Write us a note…" data-testid="input-chat-message" className="max-h-32 min-h-[46px] flex-1 resize-y rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-4 py-3 text-sm text-[#334b42] outline-none placeholder:text-[#9ba69f] focus:border-[#8eae9b] focus:ring-2 focus:ring-[#dce9dd]" />
                <button type="submit" disabled={chatMutation.isPending || chatText.trim().length < 2} aria-label="Send message" data-testid="button-send-chat" className="flex h-[46px] w-[48px] shrink-0 items-center justify-center rounded-xl bg-[#285b4e] text-white transition hover:bg-[#1e4c40] disabled:cursor-not-allowed disabled:opacity-45"><Send size={17} /></button>
              </form>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#89958d]"><span>Name and email are saved with an escalated demo ticket.</span><span>{chatText.length}/2000</span></div>
            </div>
          </section>

          <aside className="space-y-5 enter-up enter-delay">
            <section className="rounded-[24px] border border-[#dfe5d9] bg-[#f9faf4] p-5 sm:p-6" aria-labelledby="faq-title">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1e5d5] text-[#a66c4d]"><CircleHelp size={18} /></div><div><h2 id="faq-title" className="font-serif text-[17px] font-bold">Quick answers</h2><p className="text-[11px] text-[#7b8981]">The things shoppers ask most</p></div></div>
                <span className="rounded-full bg-[#e9f0e7] px-2.5 py-1 text-[10px] font-bold text-[#5c7863]">{faqs.data?.length ?? '—'} topics</span>
              </div>
              {faqs.isLoading ? <div className="space-y-2" aria-label="Loading frequently asked questions">{[0, 1, 2].map((n) => <div key={n} className="h-11 animate-pulse rounded-xl bg-[#edf0e8]" />)}</div>
                : faqs.isError ? <div className="rounded-xl border border-[#efd2c6] bg-[#fff6f0] p-3 text-xs text-[#8c503d]" role="alert" data-testid="error-faqs"><p>We couldn’t load the quick answers.</p><button type="button" onClick={() => faqs.refetch()} className="mt-2 flex items-center gap-1 font-bold underline underline-offset-2" data-testid="button-retry-faqs"><RotateCw size={12} /> Try again</button></div>
                : faqs.data?.length ? <div className="space-y-2">{faqs.data.map((faq) => <div key={faq.id} className="overflow-hidden rounded-xl border border-[#e2e6dc] bg-white" data-testid={`faq-${faq.id}`}><button type="button" onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)} aria-expanded={activeFaq === faq.id} className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left text-[12px] font-semibold leading-5 text-[#425a4f] hover:bg-[#fbfcf8]" data-testid={`button-faq-${faq.id}`}><span>{faq.title}</span><ChevronDown size={15} className={`shrink-0 text-[#829087] transition-transform ${activeFaq === faq.id ? 'rotate-180' : ''}`} /></button>{activeFaq === faq.id && <div className="border-t border-[#edf0e8] px-3.5 py-3 text-xs leading-[1.7] text-[#65766d]">{faq.answer}</div>}</div>)}</div>
                : <div className="rounded-xl bg-white px-4 py-5 text-center text-xs text-[#7b8981]">No quick answers are available just yet.</div>}
              <div className="mt-4 flex items-center gap-2 border-t border-[#e6e9df] pt-3 text-[11px] text-[#77867d]"><ShieldCheck size={14} className="text-[#668c70]" /> Answers come from BrightCart’s support policies.</div>
            </section>

            <section className="relative overflow-hidden rounded-[24px] bg-[#285b4e] p-5 text-[#f8f4e9] sm:p-6" aria-labelledby="ticket-title">
              <div className="absolute -right-5 -top-8 h-36 w-36 rounded-full border border-white/10" /><div className="absolute -right-1 -top-2 h-24 w-24 rounded-full border border-white/10" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f1b28b]"><LifeBuoy size={19} /></div><span className="rounded-full border border-white/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-[#d8e4d8]">Demo ticket</span></div>
                <h2 id="ticket-title" className="font-serif text-[21px] font-bold tracking-[-.03em]">Need a person?</h2>
                <p className="mt-2 max-w-[320px] text-[12px] leading-[1.7] text-[#d9e5dc]">Save a ticket to preview the support flow. This demo does not notify a live team.</p>
                <button type="button" onClick={() => openTicket()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f1b28b] px-4 py-3 text-xs font-bold text-[#293c35] transition hover:bg-[#f5c19e]" data-testid="button-open-ticket"><TicketCheck size={15} /> Write to our team <ArrowUpRight size={14} /></button>
              </div>
            </section>

            <div className="flex items-start gap-3 px-1 text-[11px] leading-[1.7] text-[#79867f]">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9eee4] text-[#68846e]"><Check size={13} /></div>
              <p><strong className="font-semibold text-[#566960]">A safe demo support flow.</strong> Tickets are stored for this demo; no email or live-team alerts are sent.</p>
            </div>
          </aside>
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#dfe4d8] pt-4 text-[10px] text-[#839087] sm:flex-row sm:items-center sm:justify-between">
          <span>BrightCart support · A policy-based assistant demo</span>
          <span className="flex items-center gap-1.5">
            {health.isLoading || supportHealth.isLoading ? <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#dca66e]" /> Checking systems</> : serviceUp ? <><span className="h-1.5 w-1.5 rounded-full bg-[#5b9d71]" /> Support systems connected</> : <>Support connection unavailable</>}
            {(health.isError || supportHealth.isError) && <><span aria-hidden="true"> · </span><button type="button" onClick={() => { health.refetch(); supportHealth.refetch(); }} className="inline-flex items-center gap-1 font-bold text-[#63786b] underline underline-offset-2" data-testid="button-retry-health"><RotateCw size={10} /> Retry</button></>}
          </span>
        </footer>
      </div>

      {ticketOpen && <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#1c3029]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !ticketMutation.isPending) setTicketOpen(false); }}>
        <section className="support-panel max-h-[94dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[26px] border border-[#e0e3d9] bg-[#fbfbf7] p-5 sm:rounded-[26px] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="ticket-form-title" data-testid="dialog-ticket">
          {currentTicket ? <div className="py-4 text-center" data-testid="receipt-ticket">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f0e7] text-[#3f805a]"><Check size={25} strokeWidth={2.5} /></div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6b8973]">Note received</p>
            <h2 className="mt-2 font-serif text-2xl font-bold tracking-[-.04em] text-[#27463b]">We’ve got it.</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6a7a71]">{currentTicket.message}</p>
            <div className="mx-auto mt-5 max-w-xs rounded-xl border border-[#e0e7dc] bg-[#f4f7f0] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#829087]">Your reference</p><p className="mt-1 font-mono text-sm font-bold text-[#315d4b]" data-testid="text-ticket-id">{currentTicket.ticket_id}</p><p className="mt-1 text-[11px] capitalize text-[#748279]">Status: {currentTicket.status}</p></div>
            <p className="mt-4 text-xs text-[#748279]">Your ticket is saved for demo purposes. No follow-up is sent automatically.</p>
            <button type="button" onClick={() => { setTicketOpen(false); ticketMutation.reset(); }} className="mt-6 rounded-xl bg-[#285b4e] px-5 py-3 text-xs font-bold text-white hover:bg-[#1e4c40]" data-testid="button-close-receipt">Back to support</button>
          </div> : <>
             <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#7b8b80]">BrightCart care</p><h2 id="ticket-form-title" className="mt-1 font-serif text-[25px] font-bold tracking-[-.04em]">Tell us what happened.</h2><p className="mt-1 text-xs leading-5 text-[#77857d]">This preview saves your note as a demo ticket only.</p></div><button type="button" onClick={() => setTicketOpen(false)} aria-label="Close ticket form" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef1e9] text-[#68776e] hover:bg-[#e3e9df]" data-testid="button-close-ticket"><span className="text-lg leading-none">×</span></button></div>
            {ticketMutation.isError && <div role="alert" className="mb-4 rounded-xl border border-[#efd2c6] bg-[#fff6f0] px-4 py-3 text-xs leading-5 text-[#8c503d]" data-testid="error-ticket">We couldn’t send your note just now. Your details are still in the form; please try again.</div>}
            <form onSubmit={submitTicket} className="space-y-3.5">
              <div><label htmlFor="ticket-summary" className="mb-1.5 block text-[11px] font-bold text-[#52655b]">Short summary</label><input id="ticket-summary" required maxLength={500} minLength={2} value={ticketSummary} onChange={(event) => setTicketSummary(event.target.value)} placeholder="What can we help with?" data-testid="input-ticket-summary" className="h-11 w-full rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-3.5 text-sm outline-none placeholder:text-[#a1aaa3] focus:border-[#8eae9b] focus:ring-2 focus:ring-[#dce9dd]" /></div>
              <div><label htmlFor="ticket-message" className="mb-1.5 block text-[11px] font-bold text-[#52655b]">A little more detail</label><textarea id="ticket-message" required minLength={2} maxLength={2000} rows={4} value={ticketMessage} onChange={(event) => setTicketMessage(event.target.value)} placeholder="Share the details that will help us look into it…" data-testid="input-ticket-message" className="w-full resize-y rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#a1aaa3] focus:border-[#8eae9b] focus:ring-2 focus:ring-[#dce9dd]" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor="ticket-category" className="mb-1.5 block text-[11px] font-bold text-[#52655b]">Topic</label><select id="ticket-category" value={ticketCategory} onChange={(event) => setTicketCategory(event.target.value)} data-testid="select-ticket-category" className="h-11 w-full rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-3 text-sm text-[#425a4f] outline-none focus:border-[#8eae9b]"><option value="order">Order or delivery</option><option value="returns">Returns and refunds</option><option value="product">Product question</option><option value="account">Account and payments</option><option value="other">Something else</option></select></div>
                <div><label htmlFor="ticket-priority" className="mb-1.5 block text-[11px] font-bold text-[#52655b]">Priority</label><select id="ticket-priority" value={ticketPriority} onChange={(event) => setTicketPriority(event.target.value as TicketInputPriority)} data-testid="select-ticket-priority" className="h-11 w-full rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-3 text-sm text-[#425a4f] outline-none focus:border-[#8eae9b]"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor="ticket-name" className="mb-1.5 block text-[11px] font-bold text-[#52655b]">Your name <span className="font-normal text-[#97a29b]">optional</span></label><input id="ticket-name" maxLength={100} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Name" data-testid="input-ticket-name" className="h-11 w-full rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-3 text-sm outline-none placeholder:text-[#a1aaa3] focus:border-[#8eae9b] focus:ring-2 focus:ring-[#dce9dd]" /></div>
                <div><label htmlFor="ticket-email" className="mb-1.5 block text-[11px] font-bold text-[#52655b]">Email <span className="font-normal text-[#97a29b]">optional</span></label><input id="ticket-email" type="email" maxLength={254} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="you@example.com" data-testid="input-ticket-email" className="h-11 w-full rounded-xl border border-[#dfe4d9] bg-[#fffefa] px-3 text-sm outline-none placeholder:text-[#a1aaa3] focus:border-[#8eae9b] focus:ring-2 focus:ring-[#dce9dd]" /></div>
              </div>
              <p className="flex items-center gap-1.5 pt-1 text-[10px] text-[#849087]"><ShieldCheck size={13} /> Don’t enter passwords, card numbers, or sensitive personal data.</p>
              <button type="submit" disabled={ticketMutation.isPending || ticketMessage.trim().length < 2 || ticketSummary.trim().length < 2} data-testid="button-submit-ticket" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#285b4e] text-sm font-bold text-white transition hover:bg-[#1e4c40] disabled:cursor-not-allowed disabled:opacity-50">{ticketMutation.isPending ? <><span className="h-4 w-4 animate-pulse rounded-full bg-white/70" /> Sending your note…</> : <>Send to our team <ArrowUpRight size={16} /></>}</button>
            </form>
          </>}
        </section>
      </div>}
    </main>
  );
}

export default SupportPage;

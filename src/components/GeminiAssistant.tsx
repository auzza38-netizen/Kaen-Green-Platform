import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User as UserIcon, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const GeminiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'bot',
      text: 'สวัสดีครับ ผมคือผู้ช่วย AI ประจำระบบคลังสินค้า KAEN GREEN (ผักปลอดภัยจากไทขอนแก่น)\n\nสามารถช่วยวิเคราะห์สินค้าใกล้หมด วางแผนการเติมผักสดเข้าห้องเย็น สรุปยอดขาย HoReCa และแนะนำการบริหารสต็อคได้ครับ ต้องการให้ช่วยวิเคราะห์ข้อมูลส่วนใดครับ?',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบวิเคราะห์ โปรดลองอีกครั้ง',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'สรุปสินค้าผักสดที่ใกล้หมดในคลังขณะนี้',
    'แนะนำแผนการเติมสต็อคสำหรับลูกค้าโรงแรม HoReCa',
    'วิเคราะห์สรุปยอดขายจากเอกสารล่าสุด',
    'แนวทางการเก็บรักษาผักสลัดในระบบ Cold Chain'
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E6E2D6] overflow-hidden flex flex-col h-[640px]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E6E2D6] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F7F5EF] text-[#5A8F3E] flex items-center justify-center border border-[#E6E2D6]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#263E1A]">
              KAEN GREEN Smart Inventory Assistant
            </h3>
            <p className="text-[11px] text-[#8B5E34]">
              วิเคราะห์สต็อค ยอดขาย และแผนการสั่งซื้อด้วย AI
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg-init-reset',
                sender: 'bot',
                text: 'รีเซ็ตบทสนทนาเรียบร้อยแล้ว ต้องการให้ช่วยวิเคราะห์ข้อมูลคลังสินค้าเรื่องใดครับ?',
                timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }}
          className="p-2 text-[#8B5E34] hover:text-[#263E1A] rounded-lg hover:bg-[#F7F5EF] transition-colors"
          title="ล้างประวัติแชท"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FAF8F3]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-[#5A8F3E] text-white'
                  : 'bg-white border border-[#E6E2D6] text-[#5A8F3E]'
              }`}
            >
              {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] p-4 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#5A8F3E] text-white'
                  : 'bg-white text-[#23311D] border border-[#E6E2D6]'
              }`}
            >
              <div className="font-medium mb-1 flex items-center justify-between gap-4 text-[10px] opacity-80 pb-1 border-b border-current/10">
                <span>{msg.sender === 'user' ? 'คุณ' : 'KAEN GREEN AI'}</span>
                <span className="font-mono tabular-nums">{msg.timestamp}</span>
              </div>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-[#6B665B] text-xs py-2.5 px-4 bg-white rounded-xl border border-[#E6E2D6] w-max">
            <Bot className="w-4 h-4 text-[#5A8F3E] animate-spin" />
            <span>กำลังประมวลผลข้อมูลสต็อคสินค้า...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2.5 bg-[#F7F5EF] border-t border-[#E6E2D6] flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-medium text-[#8B5E34] shrink-0">คำถามแนะนำ:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 bg-white hover:bg-[#EFECE2] text-[#23311D] border border-[#E6E2D6] rounded-lg shrink-0 font-medium transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 bg-white border-t border-[#E6E2D6] flex items-center gap-2.5"
      >
        <input
          type="text"
          placeholder="พิมพ์คำถามเกี่ยวกับสต็อค ยอดขาย หรือการจัดการคลังสินค้า..."
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          className="flex-1 p-2.5 bg-[#F7F5EF] border border-[#E6E2D6] rounded-xl text-xs focus:outline-none focus:border-[#5A8F3E] text-[#23311D]"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="px-4 py-2.5 bg-[#5A8F3E] hover:bg-[#436E2C] disabled:bg-[#E6E2D6] disabled:text-[#8B5E34] text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>ส่งข้อความ</span>
        </button>
      </form>
    </div>
  );
};

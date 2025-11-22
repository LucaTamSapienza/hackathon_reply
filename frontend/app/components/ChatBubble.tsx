import { motion } from "framer-motion";

interface ChatBubbleProps {
    text: string;
    isUser?: boolean;
}

export function ChatBubble({ text, isUser = false }: ChatBubbleProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-xl shadow-xl ${isUser
                    ? "ml-auto bg-gradient-to-br from-blue-600/30 to-blue-500/20 text-blue-50 rounded-tr-md border border-blue-400/20"
                    : "mr-auto bg-slate-800/60 text-slate-200 rounded-tl-md border border-white/10"
                }`}
        >
            {text}
        </motion.div>
    );
}

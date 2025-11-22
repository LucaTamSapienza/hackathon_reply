import { motion } from "framer-motion";
import { LucideIcon, AlertTriangle, Stethoscope, FileText, Search } from "lucide-react";
import clsx from "clsx";

interface AgentCardProps {
    agentName: string;
    content: string;
    category: "insight" | "alert" | "diagnosis" | "note";
}

const agentConfig = {
    "Dr. House": {
        icon: Stethoscope,
        color: "text-orange-400",
        border: "border-orange-500/30",
        bg: "bg-orange-500/10",
        shadow: "shadow-orange-500/20",
    },
    "Guardian": {
        icon: AlertTriangle,
        color: "text-red-400",
        border: "border-red-500/30",
        bg: "bg-red-500/10",
        shadow: "shadow-red-500/20",
    },
    "Scribe": {
        icon: FileText,
        color: "text-blue-400",
        border: "border-blue-500/30",
        bg: "bg-blue-500/10",
        shadow: "shadow-blue-500/20",
    },
    "Dr. Watson": {
        icon: Search,
        color: "text-purple-400",
        border: "border-purple-500/30",
        bg: "bg-purple-500/10",
        shadow: "shadow-purple-500/20",
    }
};

export function AgentCard({ agentName, content, category }: AgentCardProps) {
    // Default to Scribe style if agent unknown
    const config = agentConfig[agentName as keyof typeof agentConfig] || agentConfig["Scribe"];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={clsx(
                "relative overflow-hidden rounded-2xl border p-4 backdrop-blur-md",
                config.border,
                config.bg,
                "shadow-lg",
                config.shadow
            )}
        >
            <div className="flex items-start gap-3">
                <div className={clsx("rounded-full p-2 bg-black/20", config.color)}>
                    <Icon size={24} />
                </div>
                <div className="flex-1">
                    <h3 className={clsx("font-bold text-sm mb-1", config.color)}>{agentName}</h3>
                    <p className="text-sm text-slate-200 leading-relaxed">{content}</p>
                </div>
            </div>

            {/* Glow effect */}
            <div className={clsx("absolute -top-10 -right-10 w-20 h-20 rounded-full blur-3xl opacity-20", config.bg.replace("/10", ""))} />
        </motion.div>
    );
}

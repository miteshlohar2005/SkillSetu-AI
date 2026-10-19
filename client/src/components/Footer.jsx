import { BsShieldCheck } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <footer className="relative bg-white border-t border-[#E5E7EB] pt-16 pb-12 transition-colors select-none">
      <div className="h-[2px] w-full bg-[#101014] absolute top-0 left-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E5E7EB]">
          {/* Brand & Mandate */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-display font-bold text-sm shrink-0 border border-[#101014]">
                S
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-[#101014] tracking-tight">
                  SkillSetu <span className="text-[#2D81FF] font-mono text-xs">AI</span>
                </h2>
                <p className="font-mono text-[10px] text-[#101014]/60 uppercase tracking-wider">
                  Bridge the Skill Gap. Build a Smarter Workforce.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#101014]/70 leading-relaxed font-sans max-w-md">
              AI-Powered Skill Intelligence & Capacity Building Platform for competency mapping, real-time skill-gap analytics, intelligent quiz generation, voice-based oral viva evaluations, and automated learning pathways.
            </p>

            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#101014]/70">
              <BsShieldCheck className="text-[#2D81FF]" size={14} />
              <span>SkillSetu Enterprise Capacity Building & Competency Standard</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-sans">
            <div className="space-y-3">
              <h3 className="font-mono text-[11px] font-bold text-[#101014] uppercase tracking-[0.1em]">
                Core Modules
              </h3>
              <div className="space-y-2 text-[#101014]/70 font-medium">
                <p
                  onClick={() => navigate("/dashboard")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Competency Dashboard
                </p>
                <p
                  onClick={() => navigate("/competencies")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Competency Matrix
                </p>
                <p
                  onClick={() => navigate("/interview")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  AI Oral Board Viva
                </p>
                <p
                  onClick={() => navigate("/quizzes")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Question Bank & Quizzes
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono text-[11px] font-bold text-[#101014] uppercase tracking-[0.1em]">
                Integrations
              </h3>
              <div className="space-y-2 text-[#101014]/70 font-medium">
                <p
                  onClick={() => navigate("/learning-path")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Adaptive Learning Pathways
                </p>
                <p
                  onClick={() => navigate("/materials")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Survey Manual MCQ Gen
                </p>
                <p
                  onClick={() => navigate("/chat")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  SkillSetu Copilot
                </p>
                <p
                  onClick={() => navigate("/history")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Assessment Archive
                </p>
              </div>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h3 className="font-mono text-[11px] font-bold text-[#101014] uppercase tracking-[0.1em]">
                Governance
              </h3>
              <div className="space-y-2 text-[#101014]/70 font-medium">
                <p
                  onClick={() => navigate("/portal-comparison")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Portal Comparison
                </p>
                <p
                  onClick={() => navigate("/privacy")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </p>
                <p
                  onClick={() => navigate("/terms")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  Terms of Service
                </p>
                <p
                  onClick={() => navigate("/settings")}
                  className="hover:text-[#2D81FF] transition-colors cursor-pointer"
                >
                  System Settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-[#101014]/60 uppercase tracking-wider">
          <p>© {new Date().getFullYear()} SkillSetu AI • AI-Powered Skill Intelligence Platform</p>
          <p>Bridge the Skill Gap. Build a Smarter Workforce.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

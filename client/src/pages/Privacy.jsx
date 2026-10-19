import { motion, useScroll, useSpring } from "framer-motion";
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineDatabase } from "react-icons/hi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";

const PrivacyPolicy = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const sections = [
    { id: "collection", title: "1. Official Information Collection", icon: <HiOutlineDatabase /> },
    { id: "usage", title: "2. Cadre Evaluation & Data Usage", icon: <HiOutlineShieldCheck /> },
    { id: "security", title: "3. Data Protection & DPDP Compliance", icon: <HiOutlineLockClosed /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-300">
      <Navbar />

      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 origin-left z-50"
        style={{ scaleX }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-24 pt-28">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          <aside className="lg:w-1/4 lg:sticky lg:top-24 h-fit">
            <div className="mb-8">
              <BackButton fallbackUrl="/" label="Back to Previous Screen" variant="subtle" />
            </div>

            <nav className="hidden lg:block space-y-2 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-2">Contents</p>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-xs font-semibold"
                >
                  <span className="text-base text-blue-600 dark:text-blue-400">{section.icon}</span>
                  <span>{section.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:w-3/4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-14 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-12">
              <header className="border-b border-slate-100 dark:border-slate-800 pb-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold tracking-wider uppercase mb-4 border border-blue-200/60 dark:border-blue-800/60">
                  DATA GOVERNANCE & PRIVACY
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  Official Data Privacy & Security Policy
                </h1>
                <p className="text-xs font-bold text-slate-400">
                  SkillSetu AI • AI-Powered Skill Intelligence Platform
                </p>
              </header>

              <div className="space-y-12 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">

                <section id="collection" className="scroll-mt-24 space-y-4">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                    Information Collection & Confidentiality
                  </h2>
                  <p>
                    The <span className="text-blue-600 dark:text-blue-400 font-bold">SkillSetu AI Platform</span> operates strictly in compliance with data privacy standards and statistical confidentiality principles. When you register or sign in, we record:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {["Official / Gov Email", "Cadre & Division Designation", "Competency Assessments"].map((item) => (
                      <div key={item} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 text-center">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    Voice audio responses recorded during AI Cadre Mock Interviews are processed securely in real-time solely to compute diagnostic scoring metrics and are never used for commercial or external marketing purposes.
                  </div>
                </section>

                <section id="usage" className="scroll-mt-24 space-y-4">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    Cadre Evaluation & Data Usage
                  </h2>
                  <div className="space-y-3">
                    {[
                      { title: "Competency Gap Diagnostic", desc: "Generating personalized 4-Domain strength radar and recommendation pathways." },
                      { title: "Curated Course Mapping", desc: "Curating tailored e-learning modules based on assessed weakness areas." },
                      { title: "Performance Dossier Generation", desc: "Compiling printable competency assessment documentation in PDF." }
                    ].map((item, index) => (
                      <div key={index} className="flex gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section id="security" className="scroll-mt-24 space-y-4">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                    Data Protection & Security
                  </h2>
                  <p>
                    All survey data, mock evaluations, and learner metrics are protected with <strong>AES-256 encryption at rest</strong> and TLS 1.3 in transit.
                  </p>
                  <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-slate-300 text-xs border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <HiOutlineLockClosed className="text-emerald-400" size={18} />
                      <span>Zero Third-Party Data Monetization</span>
                    </div>
                    <p className="text-slate-400">
                      The platform strictly adheres to modern data governance standards and industry cybersecurity practices.
                    </p>
                  </div>
                </section>

              </div>

              <footer className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs">
                SkillSetu AI • AI-Powered Skill Intelligence Platform
              </footer>
            </div>
          </motion.main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
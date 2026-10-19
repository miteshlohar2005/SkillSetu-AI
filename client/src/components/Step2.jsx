import { useState, useRef, useEffect } from "react";
import femaleVideo from "../assets/Videos/female-ai.mp4";
import maleVideo from "../assets/Videos/male-ai.mp4";
import Timer from "./Timer";
import { motion, AnimatePresence } from "framer-motion";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import axios from "axios";
import { ServerUrl } from "../App";
import { BsArrowRight } from "react-icons/bs";
import toast from "react-hot-toast";

const Step2 = ({ interviewData, onFinish }) => {
  const {
    interviewId,
    question: questions = [],
    username: userName = "Candidate",
    isDiagnostic = false,
  } = interviewData || {};

  const [isIntroPhase, setIntroPhase] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(questions?.[0]?.timeLimit || 60);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");

  const videoRef = useRef(null);
  const currentQuestion = questions?.[currentIndex];

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const initialTextRef = useRef("");
  const latestAnswerRef = useRef("");

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const femaleVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("google us english")
      );
      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }

      const maleVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes("david") ||
          v.name.toLowerCase().includes("mark") ||
          v.name.toLowerCase().includes("male")
      );
      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;

  const stopRecognitionInstance = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const startRecognitionSession = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      setIsRecording(false);
      isRecordingRef.current = false;
      return;
    }

    stopRecognitionInstance();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let sessionTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript;
        }

        const base = initialTextRef.current ? initialTextRef.current.trim() : "";
        const combined = base
          ? `${base} ${sessionTranscript.trimStart()}`
          : sessionTranscript;

        latestAnswerRef.current = combined;
        setAnswer(combined);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition event:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast.error("Microphone access blocked! Please allow microphone access in browser settings.");
          isRecordingRef.current = false;
          setIsRecording(false);
          stopRecognitionInstance();
        } else if (event.error === "network") {
          toast.error("Speech service network error. Please check your connection.");
          isRecordingRef.current = false;
          setIsRecording(false);
          stopRecognitionInstance();
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          initialTextRef.current = latestAnswerRef.current;
          try {
            recognition.start();
          } catch {
            startRecognitionSession();
          }
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const handleToggleSpeech = async () => {
    if (isAIPlaying) {
      toast.error("Please wait for the interviewer to finish speaking.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      setIsRecording(false);
      stopRecognitionInstance();
      toast.success("Voice response captured! ✨");
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr) {
          if (permErr.name === "NotAllowedError" || permErr.name === "PermissionDeniedError") {
            toast.error("Microphone access blocked. Please allow microphone in browser URL bar.");
            return;
          }
        }
      }

      initialTextRef.current = answer;
      latestAnswerRef.current = answer;
      isRecordingRef.current = true;
      setIsRecording(true);
      toast("🎙️ Listening... Speak your answer now", { icon: "🎙️" });
      startRecognitionSession();
    }
  };


  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        stopRecognitionInstance();
        setIsRecording(false);
      }

      window.speechSynthesis.cancel();
      const humanText = text.replace(/,/g, ",...").replace(/\./g, ". ...");
      const utterance = new SpeechSynthesisUtterance(humanText);

      utterance.voice = selectedVoice;
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsAIPlaying(true);
        videoRef.current?.play();
      };

      utterance.onend = () => {
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;
        setIsAIPlaying(false);
        setSubtitle("");
        resolve();
      };

      utterance.onerror = () => {
        setIsAIPlaying(false);
        setSubtitle("");
        resolve();
      };

      setSubtitle(text);
      window.speechSynthesis.speak(utterance);
    });
  };

  useEffect(() => {
    if (!selectedVoice) return;

    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
        );
        await speakText(
          "I will ask you questions one by one. Whenever you are ready to answer, click the Speak button or type your response. Let's begin."
        );
        setIntroPhase(false);
      } else if (currentQuestion) {
        await new Promise((r) => setTimeout(r, 600));
        if (currentIndex === questions.length - 1) {
          await speakText("Alright, this is your final question.");
        }
        await speakText(currentQuestion.question);
      }
    };
    runIntro();
  }, [selectedVoice, isIntroPhase, currentIndex]);

  useEffect(() => {
    if (isIntroPhase || !currentQuestion || isAIPlaying || isSubmitting || feedback) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIntroPhase, currentIndex, isAIPlaying, isSubmitting, feedback]);

  useEffect(() => {
    if (!isIntroPhase && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 60);
    }
  }, [currentIndex, currentQuestion, isIntroPhase]);

  const submitAnswer = async () => {
    if (isSubmitting) return;

    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      stopRecognitionInstance();
      setIsRecording(false);
    }

    setIsSubmitting(true);
    const totalLimit = currentQuestion?.timeLimit || 60;
    const timeTaken = Math.max(1, totalLimit - (timeLeft || 0));

    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/submit-answer",
        {
          interviewId,
          questionIndex: currentIndex,
          answer: answer || "No response provided",
          timeTaken,
        },
        { withCredentials: true }
      );
      setFeedback(result.data.feedback);
      await speakText(result.data.feedback);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.messages ||
        "Failed to submit answer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    initialTextRef.current = "";
    latestAnswerRef.current = "";
    setAnswer("");
    setFeedback("");
    if (currentIndex + 1 >= (questions?.length || 0)) {
      finishInterview();
      return;
    }

    await speakText("Alright, let's move to the next question.");
    setCurrentIndex(currentIndex + 1);
  };

  const finishInterview = async () => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      stopRecognitionInstance();
      setIsRecording(false);
    }

    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/finish",
        { interviewId },
        { withCredentials: true }
      );

      window.dispatchEvent(new CustomEvent("assessmentCompleted", { detail: result.data }));
      window.dispatchEvent(new CustomEvent("diagnostic-updated", { detail: result.data }));
      localStorage.setItem("lastAssessmentUpdate", Date.now().toString());

      onFinish(result.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to compile final evaluation report.");
    }
  };

  useEffect(() => {
    if (isIntroPhase || !currentQuestion) return;
    if (timeLeft === 0 && !isSubmitting && !feedback) {
      submitAnswer();
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      stopRecognitionInstance();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full flex items-center justify-center my-auto lg:h-[calc(100vh-6.5rem)]"
    >
      <div className="w-full max-w-6xl lg:h-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-[32%] xl:w-[30%] bg-slate-50/90 dark:bg-slate-950/70 p-3 sm:p-4 lg:p-5 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 space-y-3 lg:space-y-0">
          <div className="w-full flex flex-col items-center space-y-2.5 sm:space-y-3">
            <div className="w-full max-w-[190px] sm:max-w-[230px] lg:max-w-full lg:h-38 xl:h-44 rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center shrink-0 relative">
              <video
                src={videoSource}
                key={videoSource}
                ref={videoRef}
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />

              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white flex items-center gap-1.5">
                {isAIPlaying ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Interviewer Speaking</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>AI Assessor</span>
                  </>
                )}
              </div>
            </div>

            {subtitle ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-slate-800/95 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5 shadow-xs"
              >
                <p className="text-slate-800 dark:text-slate-200 text-xs font-medium text-center leading-snug">
                  "{subtitle}"
                </p>
              </motion.div>
            ) : (
              <div className="w-full max-w-md py-1 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isIntroPhase
                    ? "Welcome to your Viva Voce session"
                    : isRecording
                      ? "🎙️ Transcribing your speech live..."
                      : "Click 'Speak Answer' to record voice"}
                </span>
              </div>
            )}

            <div className="w-full max-w-md bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl shadow-xs p-2.5 sm:p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Viva Status
                </span>

                {isRecording ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Recording Voice</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[10px] font-medium">
                    {isIntroPhase ? "Introduction" : "Awaiting Answer"}
                  </span>
                )}
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center justify-around py-0.5">
                <div className="flex flex-col items-center">
                  <Timer
                    timeLeft={timeLeft}
                    totalTime={currentQuestion?.timeLimit || 60}
                    className="w-12 h-12 sm:w-14 sm:h-14"
                  />
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Time Left</span>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

                <div className="flex flex-col items-center text-center">
                  <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 leading-tight">
                    {currentIndex + 1}
                    <span className="text-xs text-slate-400 font-normal"> / {questions?.length || 0}</span>
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Question</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full text-center hidden lg:block pt-1">
            <span className="text-[10px] text-slate-400 font-medium">
              Official Cadre Viva Evaluation
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 bg-white dark:bg-slate-900 justify-between lg:overflow-hidden space-y-3">

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <HiSparkles size={16} />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white">
                SkillSetu AI <span className="text-blue-600 dark:text-blue-400">Viva Voce Engine</span>
              </h2>
            </div>
            {isDiagnostic ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300/50 dark:border-indigo-800 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Cadre Diagnostic Intake Viva</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                Live Session
              </span>
            )}
          </div>

          {!isIntroPhase && currentQuestion ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-3.5 shadow-xs shrink-0"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Question {currentIndex + 1} • {currentQuestion.difficulty || "Core Competency"}
                </p>
                <span className="text-[10px] font-semibold text-slate-400">
                  {currentQuestion.timeLimit || 60}s Limit
                </span>
              </div>

              <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h3>
            </motion.div>
          ) : (
            <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-3 text-center shrink-0">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                Introductory greeting in progress. Your interview will begin momentarily...
              </span>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Your Answer (Click 'Speak' or Type)
              </label>
              {isRecording && (
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Listening to your voice...
                </span>
              )}
            </div>

            <textarea
              placeholder="Click 'Speak Answer' below to speak your response, or type directly here..."
              onChange={(e) => {
                setAnswer(e.target.value);
                initialTextRef.current = e.target.value;
                latestAnswerRef.current = e.target.value;
              }}
              value={answer}
              className={`flex-1 w-full min-h-[120px] lg:min-h-0 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl sm:rounded-2xl border ${isRecording
                ? "border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20"
                : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                } resize-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all text-xs sm:text-sm leading-relaxed`}
            />
          </div>

          <div className="shrink-0 pt-1">
            <AnimatePresence mode="wait">
              {!feedback ? (
                <motion.div
                  key="submit-controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 sm:gap-3"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleToggleSpeech}
                    className={`px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl transition-all shadow-md cursor-pointer font-bold text-xs sm:text-sm shrink-0 ${isRecording
                      ? "bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/25 animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
                      }`}
                  >
                    {isRecording ? (
                      <>
                        <FaStop size={14} />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <FaMicrophone size={15} />
                        <span>Speak Answer</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={submitAnswer}
                    disabled={isSubmitting || isIntroPhase}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-blue-500/20 transition-all font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Evaluating Response with AI...</span>
                      </>
                    ) : (
                      <span>Submit & Evaluate Answer</span>
                    )}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="feedback-controls"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl shadow-xs space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
                      Assessor Feedback:
                    </span>
                    <p className="text-emerald-900 dark:text-emerald-200 font-semibold text-xs leading-snug">
                      "{feedback}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="group w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2 rounded-xl shadow-md transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentIndex + 1 >= (questions?.length || 0)
                        ? "Complete & Generate Evaluation Report"
                        : "Proceed to Next Question"}
                    </span>
                    <BsArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Step2;




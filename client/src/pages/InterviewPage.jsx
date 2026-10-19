import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import Step1 from "../components/Step1";
import Step2 from "../components/Step2";
import Step3 from "../components/Step3";
import { BsShieldCheck } from "react-icons/bs";
import { ArtCard } from "../components/ArtCraftUI";

const InterviewPage = () => {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [interViewData, setInterViewData] = useState(null);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(true);

  const isIntakeParam =
    searchParams.get("type") === "intake" ||
    searchParams.get("diagnostic") === "true" ||
    searchParams.get("intake") === "true";

  const isPracticeParam = searchParams.get("type") === "practice";

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      if (isPracticeParam) {
        if (isMounted) {
          setLoadingDiagnostic(false);
          setStep(1);
        }
        return;
      }

      try {
        const { data } = await axios.get(`${ServerUrl}/api/interview/diagnostic`, {
          withCredentials: true,
        });

        if (
          isMounted &&
          data &&
          data.success &&
          Array.isArray(data.question) &&
          data.question.length > 0
        ) {
          if (isIntakeParam || data.status !== "completed") {
            setInterViewData(data);
            setStep(2);
            setLoadingDiagnostic(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not auto-load diagnostic intake viva:", err.message);
      }

      if (isMounted) {
        setLoadingDiagnostic(false);
        setStep(1);
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [searchParams, isIntakeParam, isPracticeParam]);

  if (loadingDiagnostic) {
    return (
      <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <ArtCard padding="lg" className="text-center max-w-md w-full space-y-4">
            <div className="w-8 h-8 border-2 border-[#101014] border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#2D81FF] block">
              SkillSetu AI • Board Evaluation Engine
            </span>
            <h3 className="font-display font-bold text-lg text-[#101014]">
              Initializing Oral Viva Voce Session
            </h3>
            <p className="font-sans text-xs text-[#101014]/60 leading-relaxed">
              Loading official cadre questions, speech recognition models, and assessment rubrics...
            </p>
          </ArtCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/dashboard" label="Return to Dashboard" />
          <span className="font-mono text-[11px] text-[#101014]/60 uppercase tracking-wider">
            Speech-to-Text Board Viva
          </span>
        </div>

        {step === 1 && (
          <Step1
            onStart={(data) => {
              setInterViewData(data);
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <Step2
            interviewData={interViewData}
            onFinish={(report) => {
              setInterViewData(report);
              setStep(3);
            }}
          />
        )}
        {step === 3 && <Step3 report={interViewData} />}
      </main>
      <Footer />
    </div>
  );
};

export default InterviewPage;
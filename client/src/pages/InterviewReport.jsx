import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import Step3 from "../components/Step3";
import { ArtCard } from "../components/ArtCraftUI";

const InterviewReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await axios.get(`${ServerUrl}/api/interview/report/${id}`, {
          withCredentials: true,
        });
        setReport(result.data);
      } catch (error) {
        console.error("Fetch report error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/history" label="Return to Evaluation History" />
          <span className="font-mono text-[11px] text-[#101014]/60 uppercase tracking-wider">
            Official Viva Voce Scorecard
          </span>
        </div>

        {loading ? (
          <ArtCard padding="lg" className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#101014] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#101014]/60">
              Loading Oral Board Scorecard & Rubrics...
            </span>
          </ArtCard>
        ) : (
          <Step3 report={report} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default InterviewReport;

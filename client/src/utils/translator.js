import i18n from "../i18n";

export const setGlobalLanguage = (lang) => {
  try {
    const targetLang = lang === "hi" ? "hi" : "en";
    localStorage.setItem("sankhya_lang", targetLang);

    if (i18n && i18n.changeLanguage && i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang);
    }

    const hostname = window.location.hostname;
    const cookieVal = `/en/${targetLang}`;

    document.cookie = `googtrans=${cookieVal}; path=/`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname}`;

    if (hostname.includes(".")) {
      const parts = hostname.split(".");
      if (parts.length > 1) {
        const rootDomain = parts.slice(-2).join(".");
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${rootDomain}`;
      }
    }
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = targetLang;
      combo.dispatchEvent(new Event("change"));
    }

    window.dispatchEvent(
      new CustomEvent("sankhyaLanguageChange", { detail: { language: targetLang } })
    );
  } catch (err) {
    console.warn("[SkillSetu AI Translator] Error switching language:", err);
  }
};

export const syncPageTranslation = (lang) => {
  try {
    const targetLang = lang || localStorage.getItem("sankhya_lang") || "en";
    if (targetLang !== "hi") return;

    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      if (combo.value !== "hi") {
        combo.value = "hi";
      }
      combo.dispatchEvent(new Event("change"));
    }
  } catch (err) {
  }
};

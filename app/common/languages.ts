// common/languages.ts

// Import all flag assets
import flagUs from "../../public/flags/20/us.svg";
import flagspain from "../../public/flags/20/es.svg";
import flaggermany from "../../public/flags/20/de.svg";
import flagfrench from "../../public/flags/20/fr.svg";
import flagjapan from "../../public/flags/20/jp.svg";
import flagchina from "../../public/flags/20/china.svg";
import flagitaly from "../../public/flags/20/it.svg";
import flagrussia from "../../public/flags/20/ru.svg";
import flagarabic from "../../public/flags/20/ae.svg";
import flagIndia from "../../public/flags/20/in.svg"; 

import { StaticImageData } from "next/image";

interface Language {
  label: string;
  flag: string | StaticImageData;
}

const languages: { [key: string]: Language } = {
  sp: {
    label: "Española",
    flag: flagspain,
  },
  gr: {
    label: "Deutsche",
    flag: flaggermany,
  },
  it: {
    label: "Italiana",
    flag: flagitaly,
  },
  rs: {
    label: "русский",
    flag: flagrussia,
  },
  en: {
    label: "English",
    flag: flagUs,
  },
  cn: {
    label: "中国人",
    flag: flagchina,
  },
  fr: {
    label: "français",
    flag: flagfrench,
  },
  ar: {
    label: "Arabic",
    flag: flagarabic,
  },
  jp: {
    label: "日本語",
    flag: flagjapan,
  },
  gu: {
    label: "ગુજરાતી",
    flag: flagIndia, 
  },
  hi: {
    label: "हिन्दी",
    flag: flagIndia, 
  },
  mr: {
    label: "मराठी",
    flag: flagIndia, 
  },
  te: {
    label: "తెలుగు",
    flag: flagIndia, 
  },
  ta: {
    label: "தமிழ்",
    flag: flagIndia, 
  },
};

export default languages;
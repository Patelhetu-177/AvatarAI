"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Dropdown } from "./Dropdown";
import Image from "next/image";
import { useRouter } from "next/navigation";

import i18n from "@/lib/i18n";
import languages from "@/app/common/languages";

interface LanguageDropdownProps {
  onLanguageChange?: (lang: string) => void;
  initialLanguage?: string;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  onLanguageChange,
  initialLanguage = "en",
}) => {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState(initialLanguage);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem("I18N_LANGUAGE") || initialLanguage;
      if (storedLang && storedLang !== selectedLang) {
        setSelectedLang(storedLang);
        if (i18n.language !== storedLang) {
          i18n.changeLanguage(storedLang);
        }
      }
    }
  }, [initialLanguage, selectedLang]);

  const changeLanguageAction = useCallback((lang: string) => {
    if (typeof window !== 'undefined') {
      i18n.changeLanguage(lang);
      localStorage.setItem("I18N_LANGUAGE", lang);
      
      setSelectedLang(lang);
      
      if (onLanguageChange) {
        onLanguageChange(lang);
      }
      
      router.refresh();
    }
  }, [onLanguageChange, router]);
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex items-center">
      <Dropdown className="relative flex items-center h-header">
        <Dropdown.Trigger
          type="button"
          className="inline-flex justify-center items-center p-0 text-black transition-all size-[37.5px] duration-200 ease-linear bg-blue-500 rounded-md dropdown-toggle btn hover:bg-blue-600 hover:text-black shadow-sm border border-blue-400"
          id="flagsDropdown"
          data-bs-toggle="dropdown"
        >
          {selectedLang && languages[selectedLang] && (
            <Image
              src={languages[selectedLang].flag} 
              alt="header-lang-img"
              width={20}
              height={15}
              className="h-5 rounded-sm shadow-sm"
              priority
            />
          )}
        </Dropdown.Trigger>
        <Dropdown.Content
          placement="right-end"
          className="absolute z-50 p-4 ltr:text-left rtl:text-right bg-white rounded-md shadow-md !top-4 dropdown-menu min-w-[10rem] flex flex-col gap-4 dark:bg-zink-600 max-h-[300px] overflow-y-auto"
          aria-labelledby="flagsDropdown"
        >
          {Object.entries(languages).map(([key, lang]) => (
            <button
              key={key}
              type="button"
              className={`flex items-center gap-3 group/items w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-zink-500 transition-colors text-black ${
                selectedLang === key ? 'bg-gray-100 dark:bg-zink-500' : ''
              }`}
              onClick={() => changeLanguageAction(key)}
              title={lang.label}
            >
              <Image
                src={lang.flag}
                alt={lang.label}
                width={20}
                height={15}
                className="h-4 w-6 object-cover rounded-sm"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {lang.label}
              </span>
            </button>
          ))}
        </Dropdown.Content>
      </Dropdown>
    </div>
  );
};

export default React.memo(LanguageDropdown);
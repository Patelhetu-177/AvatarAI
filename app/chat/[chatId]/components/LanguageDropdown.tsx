"use client";

import React, { useEffect, useState } from "react";
import { Dropdown } from "./Dropdown";
import Image from "next/image";

import i18n from "@/lib/i18n";
import languages from "@/app/common/languages";

const LanguageDropdown = () => {
  const [selectedLang, setSelectedLang] = useState("");

  useEffect(() => {
    const currentLanguage: string =
      localStorage.getItem("I18N_LANGUAGE") || "en";
    setSelectedLang(currentLanguage);
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, []);

  const changeLanguageAction = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("I18N_LANGUAGE", lang);
    setSelectedLang(lang);
  };

  return (
    <React.Fragment>
      <Dropdown className="relative flex items-center h-header">
        <Dropdown.Trigger
          type="button"
          className="inline-flex justify-center items-center p-0 text-topbar-item transition-all size-[37.5px] duration-200 ease-linear bg-topbar rounded-md dropdown-toggle btn hover:bg-topbar-item-bg-hover hover:text-topbar-item-hover group-data-[topbar=dark]:bg-topbar-dark group-data-[topbar=dark]:hover:bg-topbar-item-bg-hover-dark group-data-[topbar=dark]:hover:text-topbar-item-hover-dark group-data-[topbar=brand]:bg-topbar-brand group-data-[topbar=brand]:hover:bg-topbar-item-bg-hover-brand group-data-[topbar=brand]:hover:text-topbar-item-hover-brand group-data-[topbar=dark]:dark:bg-zink-700 group-data-[topbar=dark]:dark:hover:bg-zink-600 group-data-[topbar=dark]:dark:text-zink-500 group-data-[topbar=dark]:dark:hover:text-zink-50"
          id="flagsDropdown"
          data-bs-toggle="dropdown"
        >
          {selectedLang && languages[selectedLang] && (
            <Image
              src={languages[selectedLang].flag} // Direct access
              alt="header-lang-img"
              width={20}
              height={15}
              className="h-5 rounded-sm"
            />
          )}
        </Dropdown.Trigger>
        <Dropdown.Content
          placement="right-end"
          className="absolute z-50 p-4 ltr:text-left rtl:text-right bg-white rounded-md shadow-md !top-4 dropdown-menu min-w-[10rem] flex flex-col gap-4 dark:bg-zink-600"
          aria-labelledby="flagsDropdown"
        >
          {Object.keys(languages).map((key) => (
            <a
              href="#!"
              className={`flex items-center gap-3 group/items language ${
                selectedLang === key ? "active" : ""
              }`}
              data-lang={key}
              title={languages[key].label}
              onClick={() => changeLanguageAction(key)}
              key={key}
            >
              <Image
                src={languages[key].flag} // Direct access
                alt=""
                width={16}
                height={12}
                className="object-cover h-4 rounded-full"
              />
              <h6 className="transition-all duration-200 ease-linear font-15medium text- text-slate-600 dark:text-zink-200 group-hover/items:text-custom-500">
                {languages[key].label}
              </h6>
            </a>
          ))}
        </Dropdown.Content>
      </Dropdown>
    </React.Fragment>
  );
};

export default LanguageDropdown;
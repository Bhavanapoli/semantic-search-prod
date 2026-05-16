import fitz
import pdfplumber
import re
import json
import os
from langdetect import detect
import pandas as pd
import datetime
import pdfreader
# Content extraction from the Pdf file
def intro_extractor(intro_match):
    # Step 1: Remove any email addresses and copyright information
    cleaned_intro = re.sub(
        r"\*Equal contribution.*?Copyright.*?\n", "", intro_match, flags=re.DOTALL
    )

    # Remove emails (including those with *, ;, or whitespace before)
    cleaned_intro = re.sub(
        r"[\*\s;]*[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "", cleaned_intro
    )
    # Step 2: Remove any figure captions that start with "Figure" (common in papers)
    cleaned_intro = re.sub(
        r"^Figure \d+[a-zA-Z]*\.\s+.*?(?=\n{2,}|\n\Z)",
        " ",
        cleaned_intro,
        flags=re.DOTALL,
    )

    # Optional: Remove emails, extra whitespace, or arXiv metadata
    cleaned_intro = re.sub(r"<.*?>", "", cleaned_intro)  # Remove emails in <>
    cleaned_intro = re.sub(
        r"\n\s*\d+\s*\n", "", cleaned_intro
    )  # Remove standalone line numbers
    cleaned_intro = re.sub(
        r"arXiv:[\d\.]+v\d+.*?\n", "", cleaned_intro
    )  # arXiv ID lines
    cleaned_intro = re.sub(r"\s{2,}", " ", cleaned_intro)

    return cleaned_intro


def process_pdf(File_name, Title):
    # def process_pdf(File_name):
    # ---------------------------------------------------
    title = Title
    published_date = ""
    authors = []

    doc = fitz.open(File_name)
    full_text = ""
    for page in doc:
        full_text += page.get_text()

    try:
        language = detect(full_text[:1000])
    except:
        language = "unknown"

    # ---------------------------------------------------
    # Abstract extraction
    # ---------------------------------------------------

    abstract_match = re.search(
        r"(?:^|\n)[\s\dIVX\.]*Abstract[\s\S]+?(?=\n[\s\dIVX\.]*(Keywords|Introduction|1\s*Introduction|I\.?\s*Introduction)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )

    if abstract_match:
        abstract_text = abstract_match.group(0)
        # Clean up Abstract header
        abstract_text = re.sub(
            r"^[\s\dIVX\.]*Abstract\s*", "", abstract_text, flags=re.IGNORECASE
        )
    else:
        abstract_text = "Not found"

    intro_match = "Not found"
    related_work = "Not found"
    background = "Not found"
    preliminary = "Not found"
    method = "Not found"
    experiments = "Not found"
    results = "Not found"
    discussion = "Not found"
    acknowledgements = "Not found"

    #print("Abstract:", abstract_text)
    # Remove everything before the last "Introduction" section header when present.
    intro_headers = list(
        re.finditer(r"(?:^|\n)[\s\dIVX\.]*Introduction\b", full_text, re.IGNORECASE)
    )
    if intro_headers:
        full_text = full_text[intro_headers[-1].start() :]
    full_text = re.sub(r"^(\s*\d{2,}\s*\n)+", "", full_text)

    #language = detect(abstract_match.group(0).strip())
    # ---------------------------------------------------
    # Introduction extraction
    # ---------------------------------------------------

    intro_match = re.search(
        r"(?:^|\n)[\dIVX\. ]*Introduction[\s\S]+?(?=(?:\n+[\dIVX\.]+\s*(LITERATURE REVIEW|Method[s]?|Related Work|Background|Preliminaries|Experiment[s]?|Result[s]?|Discussion|Conclusion[s]?|Acknowledgement[s]?|Reference[s]?)[\:\-\s]*\b|\Z))",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    # print("Introduction:", intro_match.group(0).strip())

    if intro_match:
        # If "Introduction" is found, extract the text
        intro_match = intro_extractor(intro_match.group(0).strip())
        intro_match = re.sub(
            r"^[\dIVXivx\. ]*Introduction\s*", "", intro_match, flags=re.IGNORECASE
        )

    elif "Introduction" in full_text:
        # If "Introduction" is not found, but the word exists, extract the text
        intro_match = re.search(
            r"(?<=Introduction)(.*?)(?=(LITERATURE REVIEW|Related Work|Background|Method[s]?|Experiment[s]?|Result[s]?|Conclusion[s]?|Discussion)\b)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        intro_match = (
            intro_extractor(intro_match.group(0).strip())
            if intro_match
            else "Not found"
        )
    # print("Intro:", intro_match)
    # ---------------------------------------------------
    # Related Work extraction
    # ---------------------------------------------------
    related_work = re.search(
        r"(?:^|\n)[\dIVX\. ]*(?:Related Work)[\s\S]+?(?=\n[\dIVX\. ]*(^Background|^Preliminary|^method[s]?|^Experiment[s]?|^Result[s]?|^Conclusion[s]?|Discussion)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    if related_work:
        # If "Related Work" is found, extract the text
        related_work = related_work.group(0).strip()
        # Remove the "Related Work" heading
        related_work = re.sub(
            r"^[\dIVXivx\. ]*Related Work\s*", "", related_work, flags=re.DOTALL
        )
        related_work = related_work.strip()
    elif "Related Work" in full_text:
        # If "Related Work" is not found, but the word exists, extract the text
        related_work = re.search(
            r"(?<=Related Work)(.*?)(?=(^Background|^Preliminary|^Method[s]?|Experiment[s]?|^Result[s]?|^Conclusion[s]?|Discussion)\b)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        related_work = (
            re.sub(
                r"^[\dIVXivx\. ]*Related Work\s*",
                "",
                related_work.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if related_work
            else "Not found"
        )
    elif "LITERATURE REVIEW" in full_text:
          related_work = re.search(
                r"(?:^|\n)[\dIVX\. ]*(?:LITERATURE REVIEW)[\s\S]+?(?=\n[\dIVX\. ]+\s*(^Background|^Preliminary|^method[s]?|^Experiment[s]?|^Result[s]?|^Conclusion[s]?|Discussion)\b)",
                full_text,
                re.DOTALL | re.IGNORECASE,
            )
          related_work = (
              re.sub(
                  r"^[\dIVXivx\. ]*LITERATURE REVIEW\s*",
                  "",
                  related_work.group(0).strip(),
                  flags=re.IGNORECASE,
              ).strip()
              if related_work
              else "Not found"
          )

    # ---------------------------------------------------
    # Background extraction
    # ---------------------------------------------------
    background = re.search(
        r"(?:^|\n)[\dIVX\. ]*(?:Background)[\s\S]+?(?=\n[\dIVX\. ]*(^Related Work|^Method[s]?|^Experiment[s]?|^Result[s]?|^Conclusion[s]?|^Discussion)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    if background:
        # If "Background" is found, extract the text
        background = background.group(0).strip()
        # Remove the "Background" heading
        background = re.sub(
            r"^[\dIVXivx\. ]*Background\s*", "", background, flags=re.IGNORECASE
        )
        background = background.strip()

    elif "Background" in full_text:
        # If "Background" is not found, but the word exists, extract the text
        background = re.search(
            r"(?<=Background)(.*?)(?=(Preliminary|Method[s]?|Experiment[s]?|Result[s]?|Conclusion|Discussion)\b)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        background = (
            re.sub(
                r"^[\dIVXivx\. ]*Background\s*",
                "",
                background.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if background
            else "Not found"
        )

    # ---------------------------------------------------
    # Preliminary extraction
    # ---------------------------------------------------

    preliminary = re.search(
        r"(?:^|\n)[\dIVX\. ]*(?:Preliminary)[\s\S]+?(?=\n[\dIVX\. ]*(Method[s]?|Experiment[s]?|Result[s]?|Conclusion[s]?)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    if preliminary:
        # If "Preliminary" is found, extract the text
        preliminary = preliminary.group(0).strip()
        # Remove the "Preliminary" heading
        preliminary = re.sub(
            r"^[\dIVXivx\. ]*Preliminary\s*", "", preliminary, flags=re.DOTALL
        )
        preliminary = preliminary.strip()
    elif "Preliminary" in full_text:
        # If "Preliminary" is not found, but the word exists, extract the text
        preliminary = re.search(
            r"(?<=Preliminary)(.*?)(?=(?:Method[s]?|Experiment[s]?|Result[s]?|Conclusion[s]?|Discussion)\n)",
            full_text,
            re.DOTALL,
        )
        preliminary = (
            re.sub(
                r"^[\dIVXivx\. ]*Preliminary\s*",
                "",
                preliminary.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if preliminary
            else "Not found"
        )

    # ---------------------------------------------------
    # Method extraction
    # ---------------------------------------------------

    method = re.search(
        r"(?:^|\n)\s*[\dIVX]+[\.\)]?\s*Methods?(?!:)[\s\S]+?(?=(?:\n+[\dIVX\. ]*(Related Work|Experiment[s]?|Result[s]?|Conclusion[s]?|Discussion)\b)|\Z)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    if method:
        method = method.group(0).strip()
        # Remove the "Methods" heading
        method = re.sub(
            r"^\n[\dIVXivx\. ]*Method[s]?\s*", "", method, flags=re.IGNORECASE
        )
        method = method.strip()
    elif "Methods" in full_text:

        method = re.search(
            r"^Method[s]?(.*?)(?=(Related Work|Experiment[s]?|Result[s]?|Conclusion)\b)",
            full_text,
            re.IGNORECASE,
        )
        method = (
            re.sub(
                r"^[\dIVXivx\. ]*Method[s]?\s*",
                "",
                method.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if method
            else "Not found"
        )

    # ---------------------------------------------------
    # Experiments extraction
    # ---------------------------------------------------

    experiments = re.search(
        r"(?:^|\n)[\dIVX\. ]*(Experiment[s]?)[\s\S]+?(?=\n[\dIVX\. ]*(Method[s]?|Result[s]?|Conclusion[s]?)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    if experiments:
        # If "Experiments" is found, extract the text
        experiments = experiments.group(0).strip()
        # Remove the "Experiments" heading
        experiments = re.sub(
            r"^[\dIVXivx\. ]*Experiment[s]?\s*", "", experiments, flags=re.DOTALL
        )
        experiments = experiments.strip()

    elif "Experiments" in full_text:
        # If "Experiments" is not found, but the word exists, extract the text
        experiments = re.search(
            r"(?<=Experiment[s]?)(.*?)(?=(?:Result[s]?|Method[s]?|Conclusion[s]?)\n)",
            full_text,
            re.DOTALL,
        )
        experiments = (
            re.sub(
                r"^[\dIVXivx\. ]*Experiment[s]?\s*", "", experiments.group(0).strip()
            ).strip()
            if experiments
            else "Not found"
        )

    # ---------------------------------------------------
    # Results extraction
    # ---------------------------------------------------

    results = re.search(
        r"(\n[\dIVX\. ]*(Result[s]?)\s*)[\s\S]+?(?=\n[\dIVX\. ]*(Method[s]?|Conclusion[s]?|Discussion)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    
    if results:
        # If "Results" is found, extract the text
        results = results.group(0).strip()
        results = re.sub(
            r"^[\dIVXivx\. ]*Result[s]?\s*",
            "",
            results,
            flags=re.DOTALL | re.IGNORECASE,
        )
        #print("Results1:", results)
    elif "Results" in full_text:
        # If "Results" is not found, but the word exists, extract the text
        results = re.search(
            r"(?<=Results)(.*?)(?=(Conclusion|Conclusions|Discussion|Acknowledgement|Reference|References))",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        #print("Results2:", results)
        results = (
            re.sub(
                r"^[\dIVXivx\. ]*Result[s]?\s*",
                "",
                results.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if results
            else "Not found"
        )

    # ---------------------------------------------------
    # Conclusion extraction
    # ---------------------------------------------------

    conclusion = re.search(
        r"(\n[\dIVX\. ]*(conclusion[s]?)\s*)[\s\S]+?(?=\n[\dIVX\. ]*(Discussion|Acknowledgement[s]?|References)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    
    if "CONCLUSION AND DISCUSSION" in full_text:
        conclusion = re.search(
            r"(?:^|\n)[\dIVX\. ]*(?:CONCLUSION AND DISCUSSION)[\s\S]+?(?=\n[\dIVX\. ]*(Acknowledgement[s]?|References)\b)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        conclusion = (
            re.sub(
                r"^CONCLUSION AND DISCUSSION\s*",
                "",
                conclusion.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if conclusion
            else "Not found"
        )
    
    else:
        # If "Conclusion" is found, extract the text
        if conclusion:
            conclusion = conclusion.group(0).strip()
            # Remove the "Conclusions" heading
            conclusion = re.sub(
                r"^[\dIVXivx\. ]*Conclusion[s]?\n*", " ", conclusion, flags=re.DOTALL
            )
            conclusion = conclusion.strip()
        else:
            conclusion = "Not found"
        
    # ---------------------------------------------------
    # Discussion extraction
    # ---------------------------------------------------

    discussion = re.search(
        r"(\n[\dIVX\. ]*(Discussion)\s*)[\s\S]+?(?=\n[\dIVX\. ]*(Conclusion[s]?|Acknowledgement[s]?|Reference[s]?)\b)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    if "Discussion and Future Directions" in full_text:
        discussion = re.search(
            r"(?:^|\n)[\dIVX\. ]*(?:Discussion and Future Directions)[\s\S]+?(?=\n[\dIVX\. ]*(Conclusion[s]?|Acknowledgement[s]?|Reference[s]?)\b)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        discussion = (
            re.sub(
                r"^Discussion and Future Directions\s*",
                "",
                discussion.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if discussion
            else "Not found"
        )
   
    elif "Discussion" in full_text:
        # If "Discussion" is not found, but the word exists, extract the text
        discussion = re.search(
            r"^Discussion(.*?)(?=(Conclusion[s]?|Acknowledgement[s]?|Reference[s]?)\b)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        discussion = discussion.group(0).strip() if discussion else "Not found"
    

    # ---------------------------------------------------
    # Acknowledgements extraction
    # ---------------------------------------------------
    acknowledgements = re.search(
        r"(?:^|\n)[\dIVX\. ]*(Acknowledgement[s]?)[\s\S]+?(?=\n[\dIVX\. ]*(?:Reference[s]?|APPENDIX))",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    if acknowledgements:
        # If "Acknowledgements" is found, extract the text?
        acknowledgements = acknowledgements.group(0).strip()
        # Remove the "Acknowledgements" heading
        acknowledgements = re.sub(
            r"^[\dIVXivx\. ]*Acknowledgement[s]?\s*",
            "",
            acknowledgements,
            flags=re.IGNORECASE,
        )
        acknowledgements = acknowledgements.strip()
    elif "Acknowledgements" or "Acknowledgement" in full_text:
        # If "Acknowledgements" is not found, but the word exists, extract the text
        acknowledgements = re.search(
            r"^Acknowledgement[s]?(.*?)(?=(?:Reference[s]?|APPENDIX)\n)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        # Remove the "Acknowledgements" heading
        acknowledgements = (
            re.sub(
                r"^[\dIVXivx\. ]*Acknowledgement[s]?\s*",
                "",
                acknowledgements.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if acknowledgements
            else "Not found"
        )

    # ---------------------------------------------------
    # References extraction
    # ---------------------------------------------------

    references = re.search(
        r"(?:^|\n)\s*References\s*\n([\s\S]+?)(?=\n\s*[A-Z][A-Za-z ]{2,}\n|\Z)",
        full_text,
        re.IGNORECASE,
    )
    
    if references:
        # If "References" is found, extract the text
        references = references.group(0).strip()
        # Remove the "References" heading
        references = re.sub(
            r"^[\dIVXivx\. ]*Reference[s]?\s*", "", references, flags=re.IGNORECASE
        )
        references = references.strip()
        # print("References:", references)

        references_text = re.findall(
            r"(?:^\d+\.\s+.+?(?=^\d+\.|\Z))|(?:^\[\d+\].+?(?=^\[\d+\]|\Z))",
            references,
            flags=re.MULTILINE | re.DOTALL,
        )

        references = [ref.strip() for ref in references_text]
    elif "References" in full_text:

        # If "References" is not found, but the word exists, extract the text
        references = re.search(
            r"^References?(.*?)(?=(?:Acknowledgement[s]?|APPENDIX|A\.\s*Notation|A\s*Cross-Fold\sValidation|)\b|\Z)",
            full_text,
            re.DOTALL | re.IGNORECASE,
        )
        # print("References:", references)
        references = (
            re.sub(
                r"^[\dIVXivx\. ]*Reference[s]?\s*",
                "",
                references.group(0).strip(),
                flags=re.IGNORECASE,
            ).strip()
            if references
            else "Not found"
        )

    else:
        references = []

    figures = re.findall(
        r"(?im)^\s*Fig(?:ure)?\.?\s*\d+[.:]?(?:\s*[A-Za-z]\)?)?[\s\S]*?(?=\s*(?:Fig\.|equation\s+\d+\.?|[\dIVX]+\.?\s|$))",
        full_text,
    )

    figure_data = [{"caption": fig.strip()} for fig in figures]

    pattern = (
        pattern
    ) = r"""
                            (?ms)                         
                            (?:^|\r?\n\r?\n)               
                            (Table\s*\d+(?:\.|\:).*?)
                            (?=\.\n{1,}|[A-Z]\.\s|\s*Table\s*\d+\.|\s*[A-Za-z]+\s*[A-Z]\d\s*)   
                            """
    tables = re.findall(pattern, full_text, flags=re.VERBOSE)
    table_data = [{"caption": c.replace("\n", " ").strip()} for c in tables]

    #print("figures:", figures)
    ld_json = {
        "name": title,
        "datePublished": published_date,
        "inLanguage": language,
        "author": [{"@type": "Person", "name": name} for name in authors],
        "articleBody": [
            {"ABSTRACT": abstract_text},
            {"INTRODUCTION": intro_match},
            {"RELATED WORK ": related_work},
            {"PRELIMINARY": preliminary},
            {"BACKGROUND": background},
            {"METHOD": method},
            {"EXPERIMENTS": experiments},
            {"RESULTS": results},
            {"DISCUSSION": discussion},
            {"CONCLISION": conclusion},
        ],
        # "citations": list(set(bracket_citations + inline_citations)),
        "citations": references,
        "figure": figure_data,
        "table": table_data,
    }

    
    return ld_json

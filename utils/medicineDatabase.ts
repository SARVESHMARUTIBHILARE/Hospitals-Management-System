/**
 * Medicine Database Generator and Search Utility
 * Supports 1,518,750 deterministic combinations of realistic medications.
 */

export interface Medicine {
  id: string;
  name: string;
  chemicalName: string;
  category: string;
  strength: string;
  form: string;
  suggestedDosage: string;
  refills: number;
  description: string;
}

// Popular medications for quick suggestions
export const POPULAR_MEDICINES: Medicine[] = [
  {
    id: "med-pop-1",
    name: "Lisinopril",
    chemicalName: "Lisinopril dihydrate",
    category: "Cardiovascular (Heart & Blood)",
    strength: "10 mg",
    form: "Tablet",
    suggestedDosage: "1 tablet by mouth daily",
    refills: 3,
    description: "ACE inhibitor used to treat high blood pressure, heart failure, and improve survival after a heart attack."
  },
  {
    id: "med-pop-2",
    name: "Amoxicillin",
    chemicalName: "Amoxicillin trihydrate",
    category: "Antibiotics & Anti-Infectives",
    strength: "500 mg",
    form: "Capsule",
    suggestedDosage: "1 capsule by mouth every 8 hours for 10 days",
    refills: 0,
    description: "Penicillin antibiotic that fights bacteria. Used to treat various types of bacterial infections."
  },
  {
    id: "med-pop-3",
    name: "Atorvastatin",
    chemicalName: "Atorvastatin calcium",
    category: "Cardiovascular (Heart & Blood)",
    strength: "20 mg",
    form: "Tablet",
    suggestedDosage: "1 tablet by mouth at bedtime daily",
    refills: 5,
    description: "HMG-CoA reductase inhibitor (statin) used to lower cholesterol and triglycerides, reducing cardiovascular risk."
  },
  {
    id: "med-pop-4",
    name: "Metformin",
    chemicalName: "Metformin hydrochloride",
    category: "Endocrine & Metabolic (Diabetes & Thyroid)",
    strength: "500 mg",
    form: "Extended-Release Tablet",
    suggestedDosage: "1 tablet by mouth daily with the evening meal",
    refills: 11,
    description: "Biguanide antidiabetic medication used to treat type 2 diabetes by improving insulin sensitivity."
  },
  {
    id: "med-pop-5",
    name: "Albuterol",
    chemicalName: "Albuterol sulfate",
    category: "Respiratory & Pulmonary",
    strength: "90 mcg",
    form: "Inhaler",
    suggestedDosage: "2 puffs by mouth every 4 to 6 hours as needed for shortness of breath",
    refills: 3,
    description: "Beta-2 adrenergic agonist bronchodilator. Relaxes muscles in the airways and increases airflow to the lungs."
  },
  {
    id: "med-pop-6",
    name: "Gabapentin",
    chemicalName: "Gabapentin",
    category: "Analgesics & Anti-Inflammatories",
    strength: "300 mg",
    form: "Capsule",
    suggestedDosage: "1 capsule by mouth three times daily",
    refills: 3,
    description: "GABA analogue used to treat neuropathic pain, shingles nerve pain, and seizures."
  },
  {
    id: "med-pop-7",
    name: "Omeprazole",
    chemicalName: "Omeprazole magnesium",
    category: "Gastrointestinal & Digestive",
    strength: "20 mg",
    form: "Delayed-Release Capsule",
    suggestedDosage: "1 capsule by mouth 30 minutes before breakfast daily",
    refills: 5,
    description: "Proton pump inhibitor (PPI) that decreases the amount of acid produced in the stomach."
  },
  {
    id: "med-pop-8",
    name: "Levothyroxine",
    chemicalName: "Levothyroxine sodium",
    category: "Endocrine & Metabolic (Diabetes & Thyroid)",
    strength: "100 mcg",
    form: "Tablet",
    suggestedDosage: "1 tablet by mouth in the morning on an empty stomach at least 30 minutes before food",
    refills: 11,
    description: "Synthetic thyroid hormone used to treat hypothyroidism (underactive thyroid gland)."
  }
];

export interface CategoryComponents {
  name: string;
  prefixes: string[];
  stems: string[];
  suffixes: string[];
  strengths: string[];
  forms: string[];
  description: string;
}

export const CATEGORY_DATA: CategoryComponents[] = [
  {
    name: "Cardiovascular (Heart & Blood)",
    prefixes: ["Cardi", "Cardo", "Vas", "Vaso", "Ten", "Teno", "Cor", "Coro", "Angi", "Hyper", "Sola", "Nova", "Tens", "Pres", "Lod"],
    stems: ["pril", "sartan", "olol", "dipine", "statin", "grel", "arone", "xaban", "parin", "osin", "renin", "cor", "vas", "card", "tens"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["5 mg", "10 mg", "20 mg", "40 mg", "50 mg", "80 mg", "100 mg", "150 mg", "200 mg", "300 mg"],
    forms: ["Tablet", "Capsule", "Extended-Release Tablet", "Injection Solution", "Liquid Suspension"],
    description: "Used for managing blood pressure, cholesterol, heart rate, and preventing cardiac events."
  },
  {
    name: "Antibiotics & Anti-Infectives",
    prefixes: ["Amox", "Cef", "Ceph", "Cip", "Doxy", "Azith", "Pen", "Clind", "Bact", "Sulfa", "Eryth", "Levo", "Metro", "Nitro", "Macro"],
    stems: ["cillin", "cycline", "floxacin", "mycin", "cef", "pen", "sulfa", "thromycin", "dazole", "furantoin", "prim", "clind", "bact", "vir", "zole"],
    suffixes: ["ax", "is", "ol", "in", "ex", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["125 mg", "250 mg", "500 mg", "750 mg", "875 mg", "1000 mg", "100 mg/5ml", "200 mg/5ml", "250 mg/5ml", "500 mg/10ml"],
    forms: ["Capsule", "Tablet", "Oral Suspension", "Intravenous Solution", "Liquid Drops"],
    description: "Indicated for bacterial infections, respiratory tract infections, and microbial eradication."
  },
  {
    name: "Neurological & Psychiatric",
    prefixes: ["Sert", "Sertr", "Fluo", "Cit", "Cital", "Esci", "Par", "Parox", "Dulox", "Venla", "Bupr", "Trazo", "Amit", "Nort", "Clona"],
    stems: ["raline", "oxetine", "lopram", "loxetine", "faxine", "propion", "zodone", "tyline", "zepam", "prazole", "azepam", "pine", "ridone", "dote", "carb"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["2 mg", "5 mg", "10 mg", "20 mg", "37.5 mg", "50 mg", "75 mg", "100 mg", "150 mg", "300 mg"],
    forms: ["Tablet", "Extended-Release Capsule", "Rapid Dissolving Tablet", "Oral Solution", "Liquid Drops"],
    description: "Prescribed for anxiety, depression, mood stabilization, sleep modulation, and neurological balance."
  },
  {
    name: "Respiratory & Pulmonary",
    prefixes: ["Albut", "Vent", "Flut", "Sere", "Mont", "Bud", "Ipra", "Tio", "Sym", "Adv", "Bre", "Flo", "Sing", "Xop", "Air"],
    stems: ["erol", "tikon", "lukast", "onide", "tropium", "pium", "sone", "vent", "flo", "air", "bud", "mont", "albut", "ipra", "tio"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["90 mcg", "100 mcg", "180 mcg", "200 mcg", "4 mcg", "5 mcg", "10 mcg", "50 mcg", "250 mcg", "500 mcg"],
    forms: ["Inhaler", "HFA Aerosol", "RespiClick Powder", "Nebulizer Suspension", "Tablet"],
    description: "Formulated for asthma management, bronchospasm relief, chronic obstructive pulmonary disease (COPD), and allergic airways."
  },
  {
    name: "Gastrointestinal & Digestive",
    prefixes: ["Omep", "Esome", "Lanso", "Panto", "Rabi", "Famo", "Rani", "Cime", "Loper", "Metocl", "Odans", "Decl", "Nex", "Preva", "Pep"],
    stems: ["prazole", "tidine", "clopramide", "setron", "loper", "subsal", "pep", "gastro", "nex", "lanso", "panto", "famo", "rani", "cime", "decl"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["10 mg", "20 mg", "40 mg", "150 mg", "300 mg", "4 mg", "8 mg", "2 mg", "10 ml", "15 ml"],
    forms: ["Delayed-Release Capsule", "Tablet", "Rapid Melt Tab", "Oral Suspension", "Injectable Solution"],
    description: "Prescribed for acid reflux, GERD, stomach ulcers, nausea prevention, and motility assistance."
  },
  {
    name: "Endocrine & Metabolic",
    prefixes: ["Met", "Metf", "Gli", "Glip", "Glim", "Piog", "Sitar", "Empa", "Lin", "Lira", "Mela", "Lev", "Levo", "Synth", "Armor"],
    stems: ["formin", "pride", "zide", "litazone", "gliptin", "gliflozin", "tide", "thyroxine", "mel", "lev", "piog", "sita", "empa", "lin", "synth"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["25 mcg", "50 mcg", "75 mcg", "88 mcg", "100 mcg", "112 mcg", "500 mg", "850 mg", "1000 mg", "5 mg"],
    forms: ["Tablet", "Extended-Release Tablet", "Subcutaneous Injection Pen", "Liquid Solution", "Capsule"],
    description: "Manages glucose levels, insulin sensitivity, thyroid hormone deficiency, and metabolic rate balance."
  },
  {
    name: "Analgesics & Anti-Inflammatories",
    prefixes: ["Ibu", "Nap", "Napro", "Acet", "Tram", "Oxy", "Hydro", "Morph", "Fent", "Cele", "Mela", "Gab", "Gaba", "Bac", "Cycl"],
    stems: ["profen", "xen", "aminophen", "adol", "codone", "morphone", "nyl", "coxib", "oxicam", "pentin", "lofen", "benzaprine", "gaba", "tram", "morphine"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["100 mg", "200 mg", "325 mg", "400 mg", "500 mg", "600 mg", "800 mg", "50 mg", "10 mg", "300 mg"],
    forms: ["Tablet", "Capsule", "Liquid Gel", "Transdermal Patch", "Concentrated Solution"],
    description: "Formulated for acute pain mitigation, chronic neuropathy, inflammatory arthritis, and musculoskeletal spasm control."
  },
  {
    name: "Oncology & Immunological",
    prefixes: ["Meth", "Rheu", "Hum", "Enb", "Rem", "Rit", "Key", "Opd", "Ibr", "Lypar", "Tar", "Tas", "Afin", "Imbr", "Jak"],
    stems: ["trexate", "umira", "brel", "icade", "ximab", "munit", "tinib", "parza", "riga", "tas", "jak", "meth", "rheu", "rit", "key"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["2.5 mg", "10 mg", "25 mg", "40 mg", "50 mg", "100 mg", "140 mg", "200 mg", "400 mg", "500 mg"],
    forms: ["Intravenous Infusion", "Subcutaneous Autoinjector", "Tablet", "Capsule", "Lyophilized Powder"],
    description: "Advanced biologics, selective kinase inhibitors, and immunosuppressive therapies for cancer and autoimmune conditions."
  },
  {
    name: "Dermatological & Topical",
    prefixes: ["Hydroc", "Betam", "Triam", "Clob", "Mup", "Ketoc", "Terb", "Perm", "Clind", "Adap", "Tret", "Tacro", "Elid", "Dupl", "Euc"],
    stems: ["cortisone", "thasone", "cinolone", "betasol", "rocin", "conazole", "afine", "methrin", "mycin", "palene", "tinoin", "limus", "crisa", "dupi", "hydro"],
    suffixes: ["ex", "is", "ol", "in", "ax", "or", "on", "id", "en", "ac", "um", "al", "im", "us", "er"],
    strengths: ["0.025%", "0.05%", "0.1%", "0.5%", "1%", "2%", "5%", "10 mg/g", "20 mg/g", "50 mg/g"],
    forms: ["Topical Cream", "Topical Ointment", "Topical Gel", "Medicated Shampoo", "Foaming Lotion"],
    description: "Indicated for dermatitis relief, fungal eradication, acne modulation, eczema flares, and skin barrier recovery."
  }
];

// Calculation parameters
const PREFIX_COUNT = 15;
const STEM_COUNT = 15;
const SUFFIX_COUNT = 15;
const STRENGTH_COUNT = 10;
const FORM_COUNT = 5;
const COMBINATIONS_PER_CATEGORY = PREFIX_COUNT * STEM_COUNT * SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT; // 168,750
export const TOTAL_COMBINATIONS = COMBINATIONS_PER_CATEGORY * CATEGORY_DATA.length; // 1,518,750

/**
 * Maps a single unique index (from 0 to 1,518,749) to a fully generated Medicine object.
 */
export function getMedicineByIndex(index: number): Medicine {
  // Clamp index within range
  const safeIdx = Math.max(0, Math.min(index, TOTAL_COMBINATIONS - 1));
  
  const categoryIdx = Math.floor(safeIdx / COMBINATIONS_PER_CATEGORY);
  const rem1 = safeIdx % COMBINATIONS_PER_CATEGORY;
  
  const prefixIdx = Math.floor(rem1 / (STEM_COUNT * SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT));
  const rem2 = rem1 % (STEM_COUNT * SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT);
  
  const stemIdx = Math.floor(rem2 / (SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT));
  const rem3 = rem2 % (SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT);
  
  const suffixIdx = Math.floor(rem3 / (STRENGTH_COUNT * FORM_COUNT));
  const rem4 = rem3 % (STRENGTH_COUNT * FORM_COUNT);
  
  const strengthIdx = Math.floor(rem4 / FORM_COUNT);
  const formIdx = rem4 % FORM_COUNT;
  
  const cat = CATEGORY_DATA[categoryIdx];
  const prefix = cat.prefixes[prefixIdx];
  const stem = cat.stems[stemIdx];
  const suffix = cat.suffixes[suffixIdx];
  const strength = cat.strengths[strengthIdx];
  const form = cat.forms[formIdx];
  
  // Format beautifully
  const rawBrand = prefix + stem.toLowerCase() + suffix.toLowerCase();
  const brandName = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
  const chemicalName = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase() + " " + stem.toLowerCase() + " hydrochloride";
  
  // Deterministic suggested dosage based on strengths and forms
  let suggestedDosage = "1 tablet oral daily with food";
  if (form.includes("Inhaler") || form.includes("Aerosol") || form.includes("Powder")) {
    suggestedDosage = "2 puffs by mouth twice daily";
  } else if (form.includes("Drops") || form.includes("Suspension")) {
    suggestedDosage = "Take 5 ml oral twice daily";
  } else if (form.includes("Ointment") || form.includes("Cream") || form.includes("Gel")) {
    suggestedDosage = "Apply a thin layer to affected skin twice daily";
  } else if (form.includes("Injection") || form.includes("Infusion")) {
    suggestedDosage = "Administer subcutaneously as directed once weekly";
  } else if (strength.includes("mcg") || parseFloat(strength) <= 10) {
    suggestedDosage = "1 tablet by mouth daily in the morning on empty stomach";
  } else if (parseFloat(strength) >= 500) {
    suggestedDosage = "1 tablet by mouth twice daily with morning and evening meals";
  }
  
  // Deterministic refills count based on safeIdx
  const refills = (safeIdx % 4) * 3; // 0, 3, 6, 9 refills
  
  return {
    id: `med-gen-${safeIdx}`,
    name: brandName,
    chemicalName: chemicalName,
    category: cat.name,
    strength: strength,
    form: form,
    suggestedDosage: suggestedDosage,
    refills: refills,
    description: cat.description + ` Formulated as ${form} containing active compound ${chemicalName} ${strength}.`
  };
}

/**
 * Searches the 1,518,750 virtual database.
 * Uses index search and pattern filtering for fast response.
 */
export function searchMedicineDatabase(query: string, categoryFilter: string = "All", limit: number = 30): Medicine[] {
  const normQuery = query.trim().toLowerCase();
  
  // 1. Initial Popular matches if query is empty or partially matches
  let matches: Medicine[] = [];
  
  if (normQuery === "") {
    matches = [...POPULAR_MEDICINES];
    if (categoryFilter !== "All") {
      matches = matches.filter(m => m.category === categoryFilter);
    }
    // Fill up to limit with deterministic items from first few indices
    let idx = 0;
    while (matches.length < limit && idx < TOTAL_COMBINATIONS) {
      const med = getMedicineByIndex(idx);
      if (categoryFilter === "All" || med.category === categoryFilter) {
        matches.push(med);
      }
      idx += 1000; // Increment with step to get varied categories
    }
    return matches.slice(0, limit);
  }
  
  // Search popular list first
  POPULAR_MEDICINES.forEach(med => {
    if ((categoryFilter === "All" || med.category === categoryFilter) &&
        (med.name.toLowerCase().includes(normQuery) || 
         med.chemicalName.toLowerCase().includes(normQuery) ||
         med.category.toLowerCase().includes(normQuery))) {
      matches.push(med);
    }
  });
  
  // Fast combinatorial query resolution
  // Find which elements of categories could match
  const catIdxsToSearch: number[] = [];
  CATEGORY_DATA.forEach((cat, idx) => {
    if (categoryFilter === "All" || cat.name === categoryFilter) {
      catIdxsToSearch.push(idx);
    }
  });
  
  // Check combination component matches
  for (const catIdx of catIdxsToSearch) {
    if (matches.length >= limit) break;
    const cat = CATEGORY_DATA[catIdx];
    
    // Check which prefixes or stems match
    const matchingPrefixIdxs: number[] = [];
    cat.prefixes.forEach((p, idx) => {
      if (p.toLowerCase().includes(normQuery)) {
        matchingPrefixIdxs.push(idx);
      }
    });
    
    const matchingStemIdxs: number[] = [];
    cat.stems.forEach((s, idx) => {
      if (s.toLowerCase().includes(normQuery)) {
        matchingStemIdxs.push(idx);
      }
    });
    
    // Generate matches combining matching components
    if (matchingPrefixIdxs.length > 0) {
      for (const pIdx of matchingPrefixIdxs) {
        if (matches.length >= limit) break;
        // Generate a few samples
        for (let sIdx = 0; sIdx < 3; sIdx++) {
          for (let sufIdx = 0; sufIdx < 2; sufIdx++) {
            for (let strIdx = 0; strIdx < 2; strIdx++) {
              if (matches.length >= limit) break;
              
              const combinationIdx = 
                catIdx * COMBINATIONS_PER_CATEGORY +
                pIdx * (STEM_COUNT * SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT) +
                sIdx * (SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT) +
                sufIdx * (STRENGTH_COUNT * FORM_COUNT) +
                strIdx * FORM_COUNT +
                0; // Form index 0
              
              const med = getMedicineByIndex(combinationIdx);
              if (!matches.some(m => m.name === med.name)) {
                matches.push(med);
              }
            }
          }
        }
      }
    }
    
    if (matchingStemIdxs.length > 0 && matches.length < limit) {
      for (const sIdx of matchingStemIdxs) {
        if (matches.length >= limit) break;
        // Generate a few samples
        for (let pIdx = 0; pIdx < 3; pIdx++) {
          for (let sufIdx = 0; sufIdx < 2; sufIdx++) {
            if (matches.length >= limit) break;
            
            const combinationIdx = 
              catIdx * COMBINATIONS_PER_CATEGORY +
              pIdx * (STEM_COUNT * SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT) +
              sIdx * (SUFFIX_COUNT * STRENGTH_COUNT * FORM_COUNT) +
              sufIdx * (STRENGTH_COUNT * FORM_COUNT) +
              0 * FORM_COUNT + 0;
            
            const med = getMedicineByIndex(combinationIdx);
            if (!matches.some(m => m.name === med.name)) {
              matches.push(med);
            }
          }
        }
      }
    }
  }
  
  // If still not enough matches, search by scanning step-by-step
  let stepIdx = 50;
  while (matches.length < limit && stepIdx < TOTAL_COMBINATIONS) {
    const med = getMedicineByIndex(stepIdx);
    if ((categoryFilter === "All" || med.category === categoryFilter) &&
        (med.name.toLowerCase().includes(normQuery) || med.chemicalName.toLowerCase().includes(normQuery))) {
      if (!matches.some(m => m.id === med.id)) {
        matches.push(med);
      }
    }
    stepIdx += 3000; // Step to avoid scanning everything but grab varied combinations
  }
  
  return matches.slice(0, limit);
}

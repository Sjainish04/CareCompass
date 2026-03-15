// src/data/index.js

export const CLINICS = [
  { id:1, name:'Scarborough Health Network', spec:'Family Medicine', icon:'🏥', lat:43.7615, lng:-79.2308, addr:'3050 Lawrence Ave E, Scarborough', phone:'(416) 431-8200', hours:'Mon–Fri 8AM–6PM, Sat 9AM–2PM', acc:true, open:true, dist:1.2, wait:5, rating:4.7, rc:312, color:'#7c3aed', langs:['Igbo','English','Urdu','Hindi','Tamil'],
    reviews:[{a:'Fatima A.',l:'Urdu',s:5,t:'The navigator helped me book in Urdu — incredibly smooth.',d:'Nov 2024'},{a:'James O.',l:'Igbo',s:5,t:'The Igbo interpreter made all the difference.',d:'Dec 2024'}],
    slots:[{d:'Mon Dec 16',t:'9:00 AM'},{d:'Mon Dec 16',t:'11:30 AM'},{d:'Tue Dec 17',t:'10:00 AM'},{d:'Tue Dec 17',t:'2:30 PM'},{d:'Wed Dec 18',t:'9:30 AM'},{d:'Wed Dec 18',t:'4:00 PM'}] },
  { id:2, name:'Mount Sinai Cardiology', spec:'Cardiology', icon:'❤️', lat:43.6576, lng:-79.3873, addr:'600 University Ave, Toronto', phone:'(416) 596-4200', hours:'Mon–Fri 8AM–5PM', acc:true, open:true, dist:4.8, wait:21, rating:4.9, rc:528, color:'#db2777', langs:['English','French','Mandarin','Hebrew'],
    reviews:[{a:'Rachel S.',l:'English',s:5,t:'World-class cardiology. CareCompass intake was seamless.',d:'Nov 2024'},{a:'Wei L.',l:'Mandarin',s:5,t:'Mandarin support available. Worth the 3-week wait.',d:'Oct 2024'}],
    slots:[{d:'Wed Dec 18',t:'10:30 AM'},{d:'Fri Dec 20',t:'9:00 AM'},{d:'Mon Dec 23',t:'2:00 PM'},{d:'Tue Dec 24',t:'11:00 AM'},{d:'Wed Jan 8',t:'9:30 AM'},{d:'Thu Jan 9',t:'3:00 PM'}] },
  { id:3, name:'North York General', spec:'Internal Medicine', icon:'🏨', lat:43.7615, lng:-79.3588, addr:'4001 Leslie St, North York', phone:'(416) 756-6000', hours:'Mon–Fri 7AM–7PM, Sat 9AM–3PM', acc:false, open:true, dist:3.5, wait:30, rating:4.3, rc:187, color:'#0891b2', langs:['English','Korean','Tagalog','Mandarin'],
    reviews:[{a:'Sofia K.',l:'Korean',s:4,t:'Korean-speaking staff were amazing.',d:'Sep 2024'}],
    slots:[{d:'Fri Jan 10',t:'2:00 PM'},{d:'Mon Jan 13',t:'9:00 AM'},{d:'Mon Jan 13',t:'3:30 PM'},{d:'Tue Jan 14',t:'11:00 AM'},{d:'Wed Jan 15',t:'4:00 PM'},{d:'Thu Jan 16',t:'10:00 AM'}] },
  { id:4, name:'CAMH Mental Health', spec:'Mental Health', icon:'🧠', lat:43.6386, lng:-79.4176, addr:'1001 Queen St W, Toronto', phone:'(416) 535-8501', hours:'Mon–Fri 9AM–5PM', acc:true, open:true, dist:5.9, wait:14, rating:4.6, rc:403, color:'#059669', langs:['English','French','Arabic','Somali','Farsi'],
    reviews:[{a:'Amina H.',l:'Somali',s:5,t:'Somali interpreter removed so much stress.',d:'Nov 2024'},{a:'Reza M.',l:'Farsi',s:4,t:'Farsi support was available and staff were kind.',d:'Oct 2024'}],
    slots:[{d:'Tue Dec 17',t:'1:00 PM'},{d:'Wed Dec 18',t:'11:00 AM'},{d:'Thu Dec 19',t:'9:00 AM'},{d:'Fri Dec 20',t:'2:00 PM'},{d:'Mon Dec 23',t:'10:00 AM'},{d:'Tue Dec 24',t:'3:00 PM'}] },
  { id:5, name:'Humber River Hospital', spec:'Internal Medicine', icon:'🏥', lat:43.7408, lng:-79.5088, addr:'1235 Wilson Ave, Toronto', phone:'(416) 242-1000', hours:'Mon–Fri 8AM–6PM', acc:true, open:true, dist:7.2, wait:12, rating:4.4, rc:256, color:'#0891b2', langs:['English','Italian','Portuguese','Spanish'],
    reviews:[{a:'Maria C.',l:'Portuguese',s:5,t:'Portuguese intake was available. Very welcoming.',d:'Nov 2024'}],
    slots:[{d:'Mon Dec 16',t:'2:00 PM'},{d:'Tue Dec 17',t:'9:30 AM'},{d:'Wed Dec 18',t:'1:00 PM'},{d:'Thu Dec 19',t:'10:30 AM'},{d:'Fri Dec 20',t:'3:30 PM'},{d:'Mon Dec 23',t:'9:00 AM'}] },
  { id:6, name:'Sunnybrook Orthopaedics', spec:'Orthopaedics', icon:'🦴', lat:43.7237, lng:-79.3765, addr:'2075 Bayview Ave, Toronto', phone:'(416) 480-6100', hours:'Mon–Thu 8AM–5PM, Fri 8AM–4PM', acc:true, open:false, dist:5.1, wait:45, rating:4.8, rc:622, color:'#6366f1', langs:['English','Farsi','Arabic','French'],
    reviews:[{a:'Hassan A.',l:'Arabic',s:5,t:'CareCompass pre-filled my intake in Arabic — saved huge time.',d:'Dec 2024'}],
    slots:[{d:'Fri Jan 10',t:'9:00 AM'},{d:'Mon Jan 13',t:'1:00 PM'},{d:'Tue Jan 14',t:'3:30 PM'},{d:'Wed Jan 15',t:'10:00 AM'},{d:'Thu Jan 16',t:'2:00 PM'},{d:'Fri Jan 17',t:'9:30 AM'}] },
  { id:7, name:'Regent Park Community Health', spec:'Family Medicine', icon:'🌿', lat:43.6587, lng:-79.3605, addr:'465 Dundas St E, Toronto', phone:'(416) 364-2261', hours:'Mon–Fri 8:30AM–4:30PM, Thu until 7PM', acc:true, open:true, dist:3.8, wait:3, rating:4.5, rc:189, color:'#7c3aed', langs:['English','Tamil','Somali','Bengali','Tigrinya'],
    reviews:[{a:'Priya T.',l:'Tamil',s:5,t:'Tamil support is fantastic.',d:'Nov 2024'},{a:'Dawit M.',l:'Tigrinya',s:5,t:'First time seeing a doctor who understood my background.',d:'Oct 2024'}],
    slots:[{d:'Mon Dec 16',t:'10:00 AM'},{d:'Mon Dec 16',t:'2:30 PM'},{d:'Tue Dec 17',t:'8:30 AM'},{d:'Tue Dec 17',t:'3:00 PM'},{d:'Wed Dec 18',t:'10:30 AM'},{d:'Thu Dec 19',t:'5:30 PM'}] },
  { id:8, name:"Women's College Hospital", spec:'Family Medicine', icon:'🏥', lat:43.6638, lng:-79.3878, addr:'76 Grenville St, Toronto', phone:'(416) 323-6400', hours:'Mon–Fri 8AM–6PM', acc:true, open:true, dist:4.4, wait:7, rating:4.6, rc:445, color:'#7c3aed', langs:['English','French','Cantonese','Punjabi'],
    reviews:[{a:'Gurpreet K.',l:'Punjabi',s:5,t:'Punjabi-speaking doctor made my mother feel so comfortable.',d:'Dec 2024'}],
    slots:[{d:'Wed Dec 18',t:'9:00 AM'},{d:'Thu Dec 19',t:'2:00 PM'},{d:'Fri Dec 20',t:'11:00 AM'},{d:'Mon Dec 23',t:'9:30 AM'},{d:'Tue Dec 24',t:'1:00 PM'},{d:'Wed Jan 8',t:'10:00 AM'}] },
  { id:9, name:'SickKids Hospital', spec:'Paediatrics', icon:'🧸', lat:43.6569, lng:-79.3888, addr:'555 University Ave, Toronto', phone:'(416) 813-1500', hours:'24 hours · Emergency always open', acc:true, open:true, dist:4.7, wait:10, rating:4.9, rc:831, color:'#d97706', langs:['English','French','Mandarin','Urdu','Hindi'],
    reviews:[{a:'Zara M.',l:'Urdu',s:5,t:'Best children\'s hospital in Canada. Urdu staff were outstanding.',d:'Nov 2024'}],
    slots:[{d:'Mon Dec 16',t:'9:30 AM'},{d:'Tue Dec 17',t:'11:00 AM'},{d:'Wed Dec 18',t:'2:00 PM'},{d:'Thu Dec 19',t:'9:00 AM'},{d:'Fri Dec 20',t:'10:30 AM'},{d:'Mon Dec 23',t:'3:00 PM'}] },
  { id:10, name:'Brampton Civic Hospital', spec:'Internal Medicine', icon:'🏥', lat:43.6835, lng:-79.7624, addr:'2100 Bovaird Dr E, Brampton', phone:'(905) 494-2120', hours:'Mon–Fri 7AM–8PM, Weekends 9AM–5PM', acc:true, open:true, dist:9.8, wait:18, rating:4.2, rc:394, color:'#0891b2', langs:['English','Hindi','Punjabi','Gujarati','Urdu'],
    reviews:[{a:'Raj P.',l:'Gujarati',s:4,t:'Very diverse staff. Gujarati support via CC navigator.',d:'Oct 2024'}],
    slots:[{d:'Thu Dec 19',t:'10:00 AM'},{d:'Fri Dec 20',t:'1:00 PM'},{d:'Mon Dec 23',t:'11:30 AM'},{d:'Tue Dec 24',t:'9:00 AM'},{d:'Wed Jan 8',t:'2:30 PM'},{d:'Thu Jan 9',t:'4:00 PM'}] },
  { id:11, name:'Etobicoke Mental Wellness', spec:'Mental Health', icon:'💚', lat:43.6952, lng:-79.5680, addr:'25 Woodbine Ave, Etobicoke', phone:'(416) 231-8010', hours:'Mon–Fri 9AM–6PM, Sat 10AM–2PM', acc:true, open:false, dist:8.3, wait:8, rating:4.5, rc:178, color:'#059669', langs:['English','Polish','Ukrainian','Russian'],
    reviews:[{a:'Olena V.',l:'Ukrainian',s:5,t:'Finding a Ukrainian-speaking therapist through CareCompass was life-changing.',d:'Nov 2024'}],
    slots:[{d:'Mon Dec 16',t:'3:00 PM'},{d:'Tue Dec 17',t:'10:30 AM'},{d:'Thu Dec 19',t:'2:30 PM'},{d:'Fri Dec 20',t:'9:30 AM'},{d:'Sat Dec 21',t:'11:00 AM'},{d:'Mon Dec 23',t:'4:00 PM'}] },
  { id:12, name:'Markham Stouffville Hospital', spec:'Family Medicine', icon:'🏥', lat:43.8561, lng:-79.2686, addr:'381 Church St, Markham', phone:'(905) 472-7000', hours:'Mon–Fri 8AM–5PM', acc:false, open:true, dist:11.2, wait:25, rating:4.1, rc:221, color:'#7c3aed', langs:['English','Mandarin','Cantonese','Korean'],
    reviews:[{a:'Jenny L.',l:'Cantonese',s:4,t:'Good experience. Cantonese-speaking doctor was professional.',d:'Sep 2024'}],
    slots:[{d:'Fri Jan 10',t:'9:00 AM'},{d:'Mon Jan 13',t:'2:00 PM'},{d:'Tue Jan 14',t:'10:30 AM'},{d:'Wed Jan 15',t:'1:00 PM'},{d:'Thu Jan 16',t:'3:30 PM'},{d:'Fri Jan 17',t:'11:00 AM'}] },
];

export const CDISC_DOMAINS = [
  {code:'DM',name:'Demographics'},{code:'VS',name:'Vital Signs'},{code:'LB',name:'Laboratory'},
  {code:'AE',name:'Adverse Events'},{code:'CM',name:'Concomitant Meds'},{code:'MH',name:'Medical History'},
  {code:'EX',name:'Exposure'},{code:'DS',name:'Disposition'},{code:'FA',name:'Findings About'},
  {code:'PR',name:'Procedures'},{code:'SU',name:'Substance Use'},{code:'QS',name:'Questionnaires'},
  {code:'RS',name:'Disease Response'},{code:'TU',name:'Tumor ID'},{code:'TR',name:'Tumor Results'},{code:'RP',name:'Reproductive'},
];

export const AI_PRED_DOMAINS = ['DM','VS','LB','CM','MH','AE'];

export const CLINICAL_PHRASES = [
  'Where does it hurt?','Any allergies?','How long have you had this?',
  'Are you taking any medications?','Rate your pain 1 to 10.',
  'Family history of heart disease?','Please describe your symptoms.',
  'Have you had this before?','We need a blood test.',
  'I am going to examine you now.','Take a deep breath.',
  'Can you open your mouth?','Do you smoke or drink alcohol?',
  'When was your last period?','Are you pregnant?',
  'Have you had surgery before?','Do you have chest pain?',
  'I need to check your blood pressure.','Do you feel dizzy?',
];

export { DEMO_TRANSLATIONS, REVERSE_INDEX } from './translations.js';

export const CHAT_RESPONSES = [
  { match:['book','ortho','sunnybrook'], reply:"Great! I found 3 available slots at Sunnybrook Orthopaedics:\n\n📅 Fri Jan 10 · 9:00 AM\n📅 Mon Jan 13 · 1:00 PM\n📅 Tue Jan 14 · 3:30 PM\n\nWhich would you prefer? I'll confirm and send your Igbo reminder!" },
  { match:['remind','igbo','sms','reminder'], reply:"✅ Done! Your Igbo SMS reminder for the Dec 18 cardiology appointment has been rescheduled for Dec 17 at 8:00 AM." },
  { match:['document','need','bring','dec 18','appointment'], reply:"For your Dec 18 cardiology appointment you'll need:\n\n📄 OHIP card (version XP, expires March 2026)\n🩸 Blood work results (sent digitally)\n💊 Current medications: Lisinopril 10mg, Iron supplements\n\nI'll send this checklist to your phone in Igbo tomorrow! ✅" },
  { match:['blood','result','explain'], reply:"Your Dec 10 blood work summary:\n\n🩸 Hemoglobin: 10.2 g/dL (slightly low)\n❤️ LDL Cholesterol: 3.8 mmol/L (borderline high)\n✅ Blood glucose: Normal range\n\nDr. Patel will review in detail on Dec 18." },
  { match:['hello','hi','ndewo','hey'], reply:"Ndewo! 👋 How can I help you today? I can:\n• Book appointments\n• Resend reminders in Igbo\n• Explain your documents or results\n• Find clinics near you" },
  { match:['thank','thanks'], reply:"Ọ dị mma! 😊 You're very welcome, Amara. Anything else I can help with?" },
];

export const SAMPLE_EHR = `Patient: Amara Nwosu, 42F, DOB: 1982-03-14
Visit Date: 2024-12-05, Site: Scarborough Health Network
Chief Complaint: Chest tightness, intermittent shortness of breath x3 weeks
Vitals: BP 145/92 mmHg, HR 88 bpm, RR 16/min, Temp 36.8C, SpO2 97%, Wt 72kg, Ht 164cm
PMH: Hypertension (2021), Iron-deficiency anaemia (2022)
Medications: Lisinopril 10mg PO daily, Ferrous sulfate 65mg PO daily
Allergies: Penicillin (rash), Sulfonamides
Labs ordered: CBC, lipid panel, HbA1c, BMP
Assessment: Uncontrolled hypertension, symptomatic anaemia
Plan: Cardiology referral, repeat BP in 2 weeks
Physician: Dr. Adeyemi, Scarborough Health Network`;

export const DEMO_VARS = [
  {domain:'DM',variable:'SUBJID',label:'Subject ID',value:'AN-2024-001',confidence:99,source:'EHR',explanation:'Extracted from patient identifier in EHR header. Format matches study protocol AN-YYYY-NNN.',ehrSource:'Patient: Amara Nwosu, 42F, DOB: 1982-03-14'},
  {domain:'DM',variable:'AGE',label:'Age',value:'42',confidence:99,source:'EHR',explanation:'Calculated from DOB (1982-03-14) and current year (2024). Age = 2024 - 1982 = 42 years.',ehrSource:'DOB: 1982-03-14'},
  {domain:'DM',variable:'SEX',label:'Sex',value:'F',confidence:99,source:'EHR',explanation:'Sex identifier extracted from patient header notation "42F" indicating Female.',ehrSource:'Patient: Amara Nwosu, 42F'},
  {domain:'DM',variable:'RFSTDTC',label:'Ref Start Date',value:'2024-12-05',confidence:97,source:'EHR',explanation:'Reference start date mapped from visit date. ISO 8601 format YYYY-MM-DD per SDTM v3.4.',ehrSource:'Visit Date: 2024-12-05'},
  {domain:'VS',variable:'SYSBP',label:'Systolic BP',value:'145',confidence:98,source:'EHR',explanation:'Parsed from vitals section "BP 145/92 mmHg". Value 145 exceeds normal range (90-120), flagged as elevated.',ehrSource:'Vitals: BP 145/92 mmHg'},
  {domain:'VS',variable:'DIABP',label:'Diastolic BP',value:'92',confidence:98,source:'EHR',explanation:'Diastolic value extracted from blood pressure reading "145/92". Value 92 is above normal (60-80 mmHg).',ehrSource:'Vitals: BP 145/92 mmHg'},
  {domain:'VS',variable:'HR',label:'Heart Rate',value:'88',confidence:97,source:'EHR',explanation:'Heart rate extracted from vital signs. 88 bpm is within normal adult range (60-100 bpm).',ehrSource:'Vitals: HR 88 bpm'},
  {domain:'VS',variable:'WEIGHT',label:'Weight',value:'72',confidence:96,source:'EHR',explanation:'Weight value extracted and mapped from vitals. Unit assumed as kg based on EHR context.',ehrSource:'Vitals: Wt 72kg'},
  {domain:'LB',variable:'CBC',label:'CBC',value:'Ordered',confidence:94,source:'EHR',explanation:'Laboratory test identified from "Labs ordered" section. Status mapped as "Ordered" (test pending).',ehrSource:'Labs ordered: CBC, lipid panel, HbA1c, BMP'},
  {domain:'LB',variable:'LIPIDS',label:'Lipid Panel',value:'Ordered',confidence:93,source:'EHR',explanation:'Lipid panel test extracted from laboratory order list. Mapped to LB domain per SDTM standards.',ehrSource:'Labs ordered: CBC, lipid panel, HbA1c, BMP'},
  {domain:'LB',variable:'HBA1C',label:'HbA1c',value:'Ordered',confidence:93,source:'EHR',explanation:'HbA1c (glycated hemoglobin) identified in lab orders. Used for diabetes screening/monitoring.',ehrSource:'Labs ordered: CBC, lipid panel, HbA1c, BMP'},
  {domain:'CM',variable:'CMTRT',label:'Treatment 1',value:'Lisinopril',confidence:99,source:'EHR',explanation:'Active medication extracted from medications list. Lisinopril is an ACE inhibitor for hypertension.',ehrSource:'Medications: Lisinopril 10mg PO daily'},
  {domain:'CM',variable:'CMDOSE',label:'Dose 1',value:'10mg',confidence:99,source:'EHR',explanation:'Dosage extracted from medication entry "10mg PO daily". Dose and route clearly specified in EHR.',ehrSource:'Medications: Lisinopril 10mg PO daily'},
  {domain:'CM',variable:'CMTRT2',label:'Treatment 2',value:'Ferrous Sulfate 65mg',confidence:99,source:'EHR',explanation:'Second medication identified from medications list. Iron supplement for treating anaemia.',ehrSource:'Medications: Ferrous sulfate 65mg PO daily'},
  {domain:'MH',variable:'MHTERM',label:'Medical Hx 1',value:'Hypertension',confidence:99,source:'EHR',explanation:'Primary diagnosis extracted from past medical history (PMH) section with onset year 2021.',ehrSource:'PMH: Hypertension (2021)'},
  {domain:'MH',variable:'MHTERM2',label:'Medical Hx 2',value:'Iron-deficiency Anaemia',confidence:98,source:'EHR',explanation:'Secondary diagnosis identified from PMH. Linked to current ferrous sulfate treatment.',ehrSource:'PMH: Iron-deficiency anaemia (2022)'},
  {domain:'AE',variable:'AETERM',label:'Adverse Event 1',value:'Penicillin allergy (rash)',confidence:96,source:'EHR',explanation:'Drug allergy extracted from allergies section. Reaction type (rash) specified, critical for prescribing.',ehrSource:'Allergies: Penicillin (rash)'},
  {domain:'AE',variable:'AETERM2',label:'Adverse Event 2',value:'Sulfonamide allergy',confidence:95,source:'EHR',explanation:'Second drug allergy identified. Sulfonamides are antibiotics; allergy limits treatment options.',ehrSource:'Allergies: Sulfonamides'},
];

export const NAV_PAT = [
  { section:'Care', items:[
    {id:'p-overview',   icon:'🏠', label:'Overview'},
    {id:'p-journey',    icon:'🧭', label:'My Journey'},
    {id:'find-care',    icon:'🗺️', label:'Find Care'},
    {id:'p-appointments',icon:'📅',label:'Appointments', badge:'2', bc:'g'},
    {id:'p-referrals',  icon:'🔁', label:'Referrals',    badge:'1', bc:'y'},
  ]},
  { section:'Clinical AI', items:[
    {id:'ai-translation',icon:'🌐',label:'AI Translation', badge:'Live', bc:'g'},
    {id:'ai-recorder',   icon:'🎙', label:'Voice Recorder'},
    {id:'ai-cdisc',      icon:'🧬', label:'CDISC Mapping'},
  ]},
  { section:'Support', items:[
    {id:'p-navigator',icon:'💬',label:'My Navigator', badge:'●', bc:'g'},
    {id:'p-records',  icon:'📋',label:'Health Records'},
  ]},
  { section:'Account', items:[
    {id:'settings',icon:'⚙️',label:'Settings'},
  ]},
];

export const NAV_PROV = [
  { section:'Provider', items:[
    {id:'prov-appointments', icon:'📅', label:'Appointments'},
    {id:'prov-schedule',     icon:'🗓️', label:'Schedule'},
    {id:'prov-patients',     icon:'👥', label:'Patients'},
    {id:'prov-analytics',    icon:'📊', label:'Analytics'},
  ]},
  { section:'Clinical AI', items:[
    {id:'ai-translation',icon:'🌐',label:'AI Translation'},
    {id:'ai-recorder',   icon:'🎙', label:'Voice Recorder'},
    {id:'ai-cdisc',      icon:'🧬', label:'CDISC Mapping'},
  ]},
  { section:'Account', items:[
    {id:'settings',icon:'⚙️',label:'Settings'},
  ]},
];

export const GEO = { minLat:43.56, maxLat:43.92, minLng:-79.86, maxLng:-79.13 };

export function geoToXY(lat, lng, w=800, h=600) {
  return {
    x: (lng - GEO.minLng) / (GEO.maxLng - GEO.minLng) * w,
    y: (1 - (lat - GEO.minLat) / (GEO.maxLat - GEO.minLat)) * h,
  };
}

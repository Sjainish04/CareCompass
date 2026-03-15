import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

const CLINICS = [
  { name:'Scarborough Health Network', spec:'Family Medicine', icon:'hospital', lat:43.7615, lng:-79.2308, addr:'3050 Lawrence Ave E, Scarborough', phone:'(416) 431-8200', hours:'Mon-Fri 8AM-6PM, Sat 9AM-2PM', acc:true, open:true, dist:1.2, wait:5, rating:4.7, rc:312, color:'#7c3aed', langs:['Igbo','English','Urdu','Hindi','Tamil'], reviews:[{a:'Fatima A.',l:'Urdu',s:5,t:'The navigator helped me book in Urdu.',d:'Nov 2024'},{a:'James O.',l:'Igbo',s:5,t:'The Igbo interpreter made all the difference.',d:'Dec 2024'}], slots:[{d:'Mon Dec 16',t:'9:00 AM'},{d:'Mon Dec 16',t:'11:30 AM'},{d:'Tue Dec 17',t:'10:00 AM'},{d:'Tue Dec 17',t:'2:30 PM'},{d:'Wed Dec 18',t:'9:30 AM'},{d:'Wed Dec 18',t:'4:00 PM'}] },
  { name:'Mount Sinai Cardiology', spec:'Cardiology', icon:'heart', lat:43.6576, lng:-79.3873, addr:'600 University Ave, Toronto', phone:'(416) 596-4200', hours:'Mon-Fri 8AM-5PM', acc:true, open:true, dist:4.8, wait:21, rating:4.9, rc:528, color:'#db2777', langs:['English','French','Mandarin','Hebrew'], reviews:[{a:'Rachel S.',l:'English',s:5,t:'World-class cardiology.',d:'Nov 2024'}], slots:[{d:'Wed Dec 18',t:'10:30 AM'},{d:'Fri Dec 20',t:'9:00 AM'},{d:'Mon Dec 23',t:'2:00 PM'}] },
  { name:'North York General', spec:'Internal Medicine', icon:'hospital', lat:43.7615, lng:-79.3588, addr:'4001 Leslie St, North York', phone:'(416) 756-6000', hours:'Mon-Fri 7AM-7PM, Sat 9AM-3PM', acc:false, open:true, dist:3.5, wait:30, rating:4.3, rc:187, color:'#0891b2', langs:['English','Korean','Tagalog','Mandarin'], reviews:[{a:'Sofia K.',l:'Korean',s:4,t:'Korean-speaking staff were amazing.',d:'Sep 2024'}], slots:[{d:'Fri Jan 10',t:'2:00 PM'},{d:'Mon Jan 13',t:'9:00 AM'}] },
  { name:'CAMH Mental Health', spec:'Mental Health', icon:'brain', lat:43.6386, lng:-79.4176, addr:'1001 Queen St W, Toronto', phone:'(416) 535-8501', hours:'Mon-Fri 9AM-5PM', acc:true, open:true, dist:5.9, wait:14, rating:4.6, rc:403, color:'#059669', langs:['English','French','Arabic','Somali','Farsi'], reviews:[{a:'Amina H.',l:'Somali',s:5,t:'Somali interpreter removed so much stress.',d:'Nov 2024'}], slots:[{d:'Tue Dec 17',t:'1:00 PM'},{d:'Wed Dec 18',t:'11:00 AM'}] },
  { name:'Humber River Hospital', spec:'Internal Medicine', icon:'hospital', lat:43.7408, lng:-79.5088, addr:'1235 Wilson Ave, Toronto', phone:'(416) 242-1000', hours:'Mon-Fri 8AM-6PM', acc:true, open:true, dist:7.2, wait:12, rating:4.4, rc:256, color:'#0891b2', langs:['English','Italian','Portuguese','Spanish'], reviews:[{a:'Maria C.',l:'Portuguese',s:5,t:'Portuguese intake was available.',d:'Nov 2024'}], slots:[{d:'Mon Dec 16',t:'2:00 PM'},{d:'Tue Dec 17',t:'9:30 AM'}] },
  { name:'Sunnybrook Orthopaedics', spec:'Orthopaedics', icon:'bone', lat:43.7237, lng:-79.3765, addr:'2075 Bayview Ave, Toronto', phone:'(416) 480-6100', hours:'Mon-Thu 8AM-5PM, Fri 8AM-4PM', acc:true, open:false, dist:5.1, wait:45, rating:4.8, rc:622, color:'#6366f1', langs:['English','Farsi','Arabic','French'], reviews:[{a:'Hassan A.',l:'Arabic',s:5,t:'CareCompass pre-filled my intake in Arabic.',d:'Dec 2024'}], slots:[{d:'Fri Jan 10',t:'9:00 AM'},{d:'Mon Jan 13',t:'1:00 PM'}] },
  { name:'Regent Park Community Health', spec:'Family Medicine', icon:'leaf', lat:43.6587, lng:-79.3605, addr:'465 Dundas St E, Toronto', phone:'(416) 364-2261', hours:'Mon-Fri 8:30AM-4:30PM', acc:true, open:true, dist:3.8, wait:3, rating:4.5, rc:189, color:'#7c3aed', langs:['English','Tamil','Somali','Bengali','Tigrinya'], reviews:[{a:'Priya T.',l:'Tamil',s:5,t:'Tamil support is fantastic.',d:'Nov 2024'}], slots:[{d:'Mon Dec 16',t:'10:00 AM'},{d:'Mon Dec 16',t:'2:30 PM'}] },
  { name:"Women's College Hospital", spec:'Family Medicine', icon:'hospital', lat:43.6638, lng:-79.3878, addr:'76 Grenville St, Toronto', phone:'(416) 323-6400', hours:'Mon-Fri 8AM-6PM', acc:true, open:true, dist:4.4, wait:7, rating:4.6, rc:445, color:'#7c3aed', langs:['English','French','Cantonese','Punjabi'], reviews:[{a:'Gurpreet K.',l:'Punjabi',s:5,t:'Punjabi-speaking doctor was wonderful.',d:'Dec 2024'}], slots:[{d:'Wed Dec 18',t:'9:00 AM'},{d:'Thu Dec 19',t:'2:00 PM'}] },
  { name:'SickKids Hospital', spec:'Paediatrics', icon:'teddy', lat:43.6569, lng:-79.3888, addr:'555 University Ave, Toronto', phone:'(416) 813-1500', hours:'24 hours', acc:true, open:true, dist:4.7, wait:10, rating:4.9, rc:831, color:'#d97706', langs:['English','French','Mandarin','Urdu','Hindi'], reviews:[{a:'Zara M.',l:'Urdu',s:5,t:'Best children\'s hospital in Canada.',d:'Nov 2024'}], slots:[{d:'Mon Dec 16',t:'9:30 AM'},{d:'Tue Dec 17',t:'11:00 AM'}] },
  { name:'Brampton Civic Hospital', spec:'Internal Medicine', icon:'hospital', lat:43.6835, lng:-79.7624, addr:'2100 Bovaird Dr E, Brampton', phone:'(905) 494-2120', hours:'Mon-Fri 7AM-8PM, Weekends 9AM-5PM', acc:true, open:true, dist:9.8, wait:18, rating:4.2, rc:394, color:'#0891b2', langs:['English','Hindi','Punjabi','Gujarati','Urdu'], reviews:[{a:'Raj P.',l:'Gujarati',s:4,t:'Very diverse staff.',d:'Oct 2024'}], slots:[{d:'Thu Dec 19',t:'10:00 AM'},{d:'Fri Dec 20',t:'1:00 PM'}] },
  { name:'Etobicoke Mental Wellness', spec:'Mental Health', icon:'heart-green', lat:43.6952, lng:-79.5680, addr:'25 Woodbine Ave, Etobicoke', phone:'(416) 231-8010', hours:'Mon-Fri 9AM-6PM, Sat 10AM-2PM', acc:true, open:false, dist:8.3, wait:8, rating:4.5, rc:178, color:'#059669', langs:['English','Polish','Ukrainian','Russian'], reviews:[{a:'Olena V.',l:'Ukrainian',s:5,t:'Finding a Ukrainian-speaking therapist was life-changing.',d:'Nov 2024'}], slots:[{d:'Mon Dec 16',t:'3:00 PM'},{d:'Tue Dec 17',t:'10:30 AM'}] },
  { name:'Markham Stouffville Hospital', spec:'Family Medicine', icon:'hospital', lat:43.8561, lng:-79.2686, addr:'381 Church St, Markham', phone:'(905) 472-7000', hours:'Mon-Fri 8AM-5PM', acc:false, open:true, dist:11.2, wait:25, rating:4.1, rc:221, color:'#7c3aed', langs:['English','Mandarin','Cantonese','Korean'], reviews:[{a:'Jenny L.',l:'Cantonese',s:4,t:'Good experience.',d:'Sep 2024'}], slots:[{d:'Fri Jan 10',t:'9:00 AM'},{d:'Mon Jan 13',t:'2:00 PM'}] },
];

async function seed() {
  console.log('Seeding CareCompass database...');

  // Seed providers
  for (const clinic of CLINICS) {
    const { data: existing } = await supabaseAdmin
      .from('providers')
      .select('id')
      .eq('name', clinic.name)
      .single();

    if (!existing) {
      const { error } = await supabaseAdmin.from('providers').insert(clinic);
      if (error) {
        console.error(`  Failed to insert ${clinic.name}:`, error.message);
      } else {
        console.log(`  Inserted: ${clinic.name}`);
      }
    } else {
      console.log(`  Exists: ${clinic.name}`);
    }
  }

  console.log('Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

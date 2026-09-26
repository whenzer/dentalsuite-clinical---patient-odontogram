import { Customer, TeethChartState, ToothNumber } from '../types';
import { generateRecommendedServices } from '../utils/dentalRules';
import {
  PHOTO_ANTERIOR_AFTER,
  PHOTO_ANTERIOR_BEFORE,
  PHOTO_MOLAR_AFTER,
  PHOTO_MOLAR_BEFORE,
} from './samplePhotos';

export function createDefaultTeethChart(): TeethChartState {
  const chart: TeethChartState = {} as TeethChartState;
  for (let i = 1; i <= 32; i++) {
    chart[i as ToothNumber] = {
      number: i as ToothNumber,
      condition: 'healthy',
      surfaces: [],
      notes: '',
    };
  }
  return chart;
}

// Patient 1: Sarah Jenkins
const sarahChartCurrent = createDefaultTeethChart();
// Teeth conditions:
sarahChartCurrent[1].condition = 'growing_impacted'; // UR 3rd molar
sarahChartCurrent[16].condition = 'growing_impacted'; // UL 3rd molar
sarahChartCurrent[3].condition = 'filling'; // #3 has filling
sarahChartCurrent[3].surfaces = ['occlusal', 'mesial'];
sarahChartCurrent[8].condition = 'veneer'; // #8 cosmetic composite veneer
sarahChartCurrent[9].condition = 'veneer'; // #9 cosmetic composite veneer
sarahChartCurrent[14].condition = 'moderate_cavity'; // #14 moderate cavity
sarahChartCurrent[14].surfaces = ['occlusal', 'distal'];
sarahChartCurrent[19].condition = 'large_cavity'; // #19 large cavity
sarahChartCurrent[19].surfaces = ['occlusal', 'buccal'];
sarahChartCurrent[30].condition = 'weared_dentin'; // #30 weared down dentin
sarahChartCurrent[30].surfaces = ['occlusal'];
sarahChartCurrent[24].condition = 'calculus_tartar'; // lower anterior tartar
sarahChartCurrent[25].condition = 'calculus_tartar';

// Previous chart for Sarah (6 months ago - for historical comparison)
const sarahChartPrevious = createDefaultTeethChart();
sarahChartPrevious[1].condition = 'growing_impacted';
sarahChartPrevious[16].condition = 'growing_impacted';
sarahChartPrevious[3].condition = 'small_cavity'; // had small cavity (now filled)
sarahChartPrevious[8].condition = 'healthy'; // was chipped/stained (now veneered)
sarahChartPrevious[9].condition = 'healthy';
sarahChartPrevious[14].condition = 'small_cavity'; // was small, now progressed to moderate!
sarahChartPrevious[19].condition = 'moderate_cavity'; // was moderate, now worsened to large cavity!
sarahChartPrevious[30].condition = 'healthy'; // was healthy, now weared dentin!

const sarahCleaningDues = [
  {
    type: 'Prophylaxis (Cleaning)' as const,
    lastDoneDate: '2025-11-10',
    intervalMonths: 6,
    nextDueDate: '2026-05-10', // Overdue!
    status: 'overdue' as const,
    notes: 'Patient overdue by ~4 months. Light bleeding on probing, subgingival calculus.',
  },
  {
    type: 'Night Guard Check' as const,
    lastDoneDate: '2025-11-10',
    intervalMonths: 6,
    nextDueDate: '2026-05-10',
    status: 'overdue' as const,
    notes: 'Check nocturnal clenching wear facets.',
  },
  {
    type: 'Fluoride Varnish' as const,
    lastDoneDate: '2025-11-10',
    intervalMonths: 6,
    nextDueDate: '2026-05-10',
    status: 'overdue' as const,
  },
];

// Patient 2: Marcus Vance
const marcusChart = createDefaultTeethChart();
marcusChart[2].condition = 'weared_dentin';
marcusChart[3].condition = 'weared_dentin';
marcusChart[15].condition = 'rotted'; // rotted #15
marcusChart[18].condition = 'weared_dentin';
marcusChart[19].condition = 'missing'; // missing #19
marcusChart[30].condition = 'weared_dentin';
marcusChart[31].condition = 'weared_dentin';

const marcusCleaningDues = [
  {
    type: 'Prophylaxis (Cleaning)' as const,
    lastDoneDate: '2026-01-15',
    intervalMonths: 6,
    nextDueDate: '2026-07-15',
    status: 'overdue' as const,
    notes: 'Smoker; stain removal and scaling needed.',
  },
  {
    type: 'Periodontal Deep Maintenance' as const,
    lastDoneDate: '2026-01-15',
    intervalMonths: 4,
    nextDueDate: '2026-05-15',
    status: 'overdue' as const,
  },
];

// Patient 3: Elena Rostova
const elenaChart = createDefaultTeethChart();
elenaChart[6].condition = 'veneer';
elenaChart[7].condition = 'veneer';
elenaChart[8].condition = 'veneer';
elenaChart[9].condition = 'veneer';
elenaChart[10].condition = 'veneer';
elenaChart[11].condition = 'veneer';
elenaChart[18].condition = 'filling';
elenaChart[31].condition = 'small_cavity';

const elenaCleaningDues = [
  {
    type: 'Prophylaxis (Cleaning)' as const,
    lastDoneDate: '2026-03-20',
    intervalMonths: 6,
    nextDueDate: '2026-09-20',
    status: 'due_soon' as const,
    notes: 'Recall due in 2 weeks. Routine cosmetic maintenance and gentle prophy paste.',
  },
  {
    type: 'Whitening Touch-up' as const,
    lastDoneDate: '2026-03-20',
    intervalMonths: 6,
    nextDueDate: '2026-09-20',
    status: 'due_soon' as const,
  },
];

// Patient 4: David Chen
const davidChart = createDefaultTeethChart();
davidChart[19].condition = 'implant';
davidChart[30].condition = 'implant';
davidChart[14].condition = 'crown';
davidChart[3].condition = 'root_canal';

const davidCleaningDues = [
  {
    type: 'Periodontal Deep Maintenance' as const,
    lastDoneDate: '2026-07-02',
    intervalMonths: 3,
    nextDueDate: '2026-10-02',
    status: 'up_to_date' as const,
    notes: 'Implant peri-mucosal margins healthy, probing depths 2-3mm.',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    dob: '1992-04-14',
    gender: 'Female',
    phone: '(555) 234-8901',
    email: 'sarah.jenkins@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    registeredDate: '2024-02-12',
    medicalAlerts: ['Nocturnal Bruxism (Night Teeth Grinding)', 'Penicillin Allergy'],
    allergies: ['Penicillin', 'Latex (Mild)'],
    insuranceProvider: 'Delta Dental Premier (#DLT-98421)',
    emergencyContact: {
      name: 'Mark Jenkins',
      phone: '(555) 234-8999',
      relation: 'Spouse',
    },
    cleaningDues: sarahCleaningDues,
    teethChart: sarahChartCurrent,
    teethSnapshots: [
      {
        id: 'snap-sarah-prev',
        date: '2025-11-10',
        visitTitle: 'Comprehensive Initial Examination',
        notes: 'Small cavity noted on #3 and #14, moderate caries #19. No wear facets observed yet on #30.',
        chart: sarahChartPrevious,
      },
      {
        id: 'snap-sarah-curr',
        date: '2026-09-02',
        visitTitle: 'Periodic Recall & Emergency Toothache Exam',
        notes: 'Tooth #19 has worsened to deep cavity. Rapid enamel wear on #30 with dentin exposure from clenching.',
        chart: sarahChartCurrent,
      },
    ],
    photos: [
      {
        id: 'photo-sarah-1',
        customerId: 'cust-1',
        url: PHOTO_ANTERIOR_BEFORE,
        caption: 'Anterior Pre-treatment: Attrition, chipped edge on #8, and coffee staining',
        category: 'pre_op',
        takenAt: '2025-11-10 10:15',
        relatedTeeth: [7, 8, 9, 10],
        stage: 'before',
      },
      {
        id: 'photo-sarah-2',
        customerId: 'cust-1',
        url: PHOTO_ANTERIOR_AFTER,
        caption: 'Anterior Post-treatment: Cosmetic composite veneer bonding and in-office whitening',
        category: 'post_op',
        takenAt: '2025-11-25 14:30',
        relatedTeeth: [7, 8, 9, 10],
        stage: 'after',
      },
      {
        id: 'photo-sarah-3',
        customerId: 'cust-1',
        url: PHOTO_MOLAR_BEFORE,
        caption: 'Intraoral Occlusal View: Tooth #19 deep cavity with darkened central fossa',
        category: 'intraoral',
        takenAt: '2026-09-02 09:40',
        relatedTeeth: [19],
        stage: 'before',
      },
      {
        id: 'photo-sarah-4',
        customerId: 'cust-1',
        url: PHOTO_MOLAR_AFTER,
        caption: 'Tooth #19 Composite Simulation Restoration Preview',
        category: 'intraoral',
        takenAt: '2026-09-02 10:05',
        relatedTeeth: [19],
        stage: 'after',
      },
    ],
    beforeAfterPairs: [
      {
        id: 'ba-sarah-1',
        customerId: 'cust-1',
        title: 'Anterior Smile Transformation (Teeth #7-#10)',
        beforePhotoId: 'photo-sarah-1',
        afterPhotoId: 'photo-sarah-2',
        dateCreated: '2025-11-25',
        notes: 'Restored natural golden proportions, brightened shade from A3 to BL2, closed minor diastema.',
        relatedTeeth: [7, 8, 9, 10],
      },
      {
        id: 'ba-sarah-2',
        customerId: 'cust-1',
        title: 'Molar #19 Occlusal Restoration Plan',
        beforePhotoId: 'photo-sarah-3',
        afterPhotoId: 'photo-sarah-4',
        dateCreated: '2026-09-02',
        notes: 'Pre-op caries versus planned biological composite restoration.',
        relatedTeeth: [19],
      },
    ],
    treatmentLogs: [
      {
        id: 'log-1',
        customerId: 'cust-1',
        date: '2025-11-25',
        doctorName: 'Dr. Emily Watson, DDS',
        category: 'Cosmetic',
        procedureName: 'Direct Composite Resin Veneers & Incisal Reconstruction',
        teethInvolved: [8, 9],
        clinicalNotes: 'Etched with 37% phosphoric acid, Prime&Bond applied. Microhybrid A1 composite sculpted and polished with Sof-Lex discs. Occlusion checked in centric and excursive movements.',
        cost: 950,
        status: 'Completed',
        snapshotId: 'snap-sarah-prev',
      },
      {
        id: 'log-2',
        customerId: 'cust-1',
        date: '2025-11-10',
        doctorName: 'Dr. Emily Watson, DDS',
        category: 'Restorative',
        procedureName: 'Composite Filling (MO surface) - Tooth #3',
        teethInvolved: [3],
        clinicalNotes: 'Local anesthesia 2% lidocaine 1:100k epi. Caries excavated to hard dentin. Single bond universal adhesive and composite placed in 2mm increments.',
        cost: 210,
        status: 'Completed',
        snapshotId: 'snap-sarah-prev',
      },
    ],
    recommendedServices: [],
    attachedFiles: [
      {
        id: 'file-sarah-3d-1',
        name: 'Maxillary_Digital_Impression_Arch.stl',
        category: '3d_scan',
        fileType: 'STL',
        uploadDate: '2026-09-02',
        sizeBytes: 14200000,
        url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&auto=format&fit=crop&q=80',
        notes: 'High-precision intraoral 3D scan of upper arch for smile reconstruction and night guard fabrication.',
        relatedTeeth: [7, 8, 9, 10],
      },
      {
        id: 'file-sarah-xray-1',
        name: 'Panoramic_Full_Mouth_Survey_OPG.png',
        category: 'xray',
        fileType: 'PNG',
        uploadDate: '2026-09-02',
        sizeBytes: 4800000,
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&auto=format&fit=crop&q=80',
        notes: 'Full mouth panoramic radiograph confirming third molar impaction on #1 & #16.',
        relatedTeeth: [1, 16, 19, 30],
      },
      {
        id: 'file-sarah-xray-2',
        name: 'Bitewing_Posterior_Left_Quadrant.png',
        category: 'xray',
        fileType: 'PNG',
        uploadDate: '2026-09-02',
        sizeBytes: 2400000,
        url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format&fit=crop&q=80',
        notes: 'High-resolution digital bitewing of molar #19 demonstrating dentin caries penetration.',
        relatedTeeth: [18, 19, 20],
      },
      {
        id: 'file-sarah-pic-1',
        name: 'Smile_Aesthetic_HighRes_Frontal.jpg',
        category: 'picture',
        fileType: 'JPG',
        uploadDate: '2025-11-25',
        sizeBytes: 3100000,
        url: PHOTO_ANTERIOR_AFTER,
        thumbnailUrl: PHOTO_ANTERIOR_AFTER,
        notes: 'DSLR macro clinical photo of anterior veneer rehabilitation post-bonding.',
        relatedTeeth: [7, 8, 9, 10],
      },
      {
        id: 'file-sarah-doc-1',
        name: 'Dental_Lab_Prescription_NightGuard.pdf',
        category: 'document',
        fileType: 'PDF',
        uploadDate: '2026-09-02',
        sizeBytes: 520000,
        url: '#',
        notes: 'Hard/Soft dual-laminate occlusal splint work order to Apex Dental Lab.',
      },
    ],
  },
  {
    id: 'cust-2',
    firstName: 'Marcus',
    lastName: 'Vance',
    dob: '1981-08-22',
    gender: 'Male',
    phone: '(555) 782-4110',
    email: 'marcus.vance@workmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    registeredDate: '2023-09-15',
    medicalAlerts: ['Hypertension (Managed with Lisinopril)', 'Severe Sleep Apnea / Heavy Clencher'],
    allergies: ['None known'],
    insuranceProvider: 'MetLife Dental PPO',
    cleaningDues: marcusCleaningDues,
    teethChart: marcusChart,
    teethSnapshots: [
      {
        id: 'snap-marcus-1',
        date: '2026-01-15',
        visitTitle: 'Consultation & X-Ray Review',
        notes: 'Severe attrition noted. Missing #19 and non-restorable roots on #15.',
        chart: marcusChart,
      },
    ],
    photos: [
      {
        id: 'photo-marcus-1',
        customerId: 'cust-2',
        url: PHOTO_MOLAR_BEFORE,
        caption: 'Severe wear and caries on upper molar quadrant',
        category: 'intraoral',
        takenAt: '2026-01-15 11:00',
        relatedTeeth: [15],
        stage: 'before',
      },
    ],
    beforeAfterPairs: [],
    treatmentLogs: [
      {
        id: 'log-marcus-1',
        customerId: 'cust-2',
        date: '2026-01-15',
        doctorName: 'Dr. Robert Garcia, DMD',
        category: 'Periodontic',
        procedureName: 'Full Mouth Debridement & Periodontal Charting',
        teethInvolved: [],
        clinicalNotes: 'Ultrasonic scaling performed. Recommended night guard and implant for #19.',
        cost: 280,
        status: 'Completed',
      },
    ],
    recommendedServices: [],
    attachedFiles: [
      {
        id: 'file-marcus-3d-1',
        name: 'Mandibular_Implant_Surgical_Guide_Model.stl',
        category: '3d_scan',
        fileType: 'STL',
        uploadDate: '2026-01-15',
        sizeBytes: 16500000,
        url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&auto=format&fit=crop&q=80',
        notes: '3D scan of lower jaw for implant site planning at missing tooth #19.',
        relatedTeeth: [19],
      },
      {
        id: 'file-marcus-xray-1',
        name: 'CBCT_3D_Tomography_Quadrant_3.png',
        category: 'xray',
        fileType: 'DICOM',
        uploadDate: '2026-01-15',
        sizeBytes: 32000000,
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&auto=format&fit=crop&q=80',
        notes: 'Cone Beam CT scan showing 12.5mm bone height above inferior alveolar nerve for implant placement.',
        relatedTeeth: [19],
      },
      {
        id: 'file-marcus-pic-1',
        name: 'Intraoral_Occlusal_Wear_Assessment.jpg',
        category: 'picture',
        fileType: 'JPG',
        uploadDate: '2026-01-15',
        sizeBytes: 2800000,
        url: PHOTO_MOLAR_BEFORE,
        thumbnailUrl: PHOTO_MOLAR_BEFORE,
        notes: 'Intraoral macro photography documenting severe enamel attrition.',
        relatedTeeth: [15, 18, 30, 31],
      },
    ],
  },
  {
    id: 'cust-3',
    firstName: 'Elena',
    lastName: 'Rostova',
    dob: '1998-11-03',
    gender: 'Female',
    phone: '(555) 441-9923',
    email: 'elena.rostova@designstudio.io',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    registeredDate: '2025-01-08',
    medicalAlerts: ['Mitral Valve Prolapse (No premed needed per AHA guidelines)'],
    allergies: ['Sulfa drugs'],
    insuranceProvider: 'Cigna Dental Health',
    cleaningDues: elenaCleaningDues,
    teethChart: elenaChart,
    teethSnapshots: [
      {
        id: 'snap-elena-1',
        date: '2026-03-20',
        visitTitle: 'Post-Whitening & Porcelain Veneer Delivery',
        notes: 'Shade stabilized at BL1. Patient extremely pleased with smile aesthetics.',
        chart: elenaChart,
      },
    ],
    photos: [
      {
        id: 'photo-elena-1',
        customerId: 'cust-3',
        url: PHOTO_ANTERIOR_BEFORE,
        caption: 'Pre-treatment smile analysis with discolored anterior margins',
        category: 'pre_op',
        takenAt: '2026-02-10 14:00',
        relatedTeeth: [6, 7, 8, 9, 10, 11],
        stage: 'before',
      },
      {
        id: 'photo-elena-2',
        customerId: 'cust-3',
        url: PHOTO_ANTERIOR_AFTER,
        caption: 'Post-delivery portrait with 6 anterior porcelain veneers',
        category: 'post_op',
        takenAt: '2026-03-20 16:30',
        relatedTeeth: [6, 7, 8, 9, 10, 11],
        stage: 'after',
      },
    ],
    beforeAfterPairs: [
      {
        id: 'ba-elena-1',
        customerId: 'cust-3',
        title: 'Full Anterior Smile Makeover (#6 to #11)',
        beforePhotoId: 'photo-elena-1',
        afterPhotoId: 'photo-elena-2',
        dateCreated: '2026-03-20',
        notes: 'Pre-op versus final porcelain veneers in BL1 shade.',
        relatedTeeth: [6, 7, 8, 9, 10, 11],
      },
    ],
    treatmentLogs: [
      {
        id: 'log-elena-1',
        customerId: 'cust-3',
        date: '2026-03-20',
        doctorName: 'Dr. Emily Watson, DDS',
        category: 'Cosmetic',
        procedureName: 'Porcelain Laminate Veneer Cementation (#6-#11)',
        teethInvolved: [6, 7, 8, 9, 10, 11],
        clinicalNotes: 'Veneers bonded using Variolink Esthetic LC light-cure resin cement under rubber dam isolation. Perfect margins.',
        cost: 6200,
        status: 'Completed',
      },
    ],
    recommendedServices: [],
    attachedFiles: [
      {
        id: 'file-elena-3d-1',
        name: 'Aesthetic_Smile_Mockup_PreVis.ply',
        category: '3d_scan',
        fileType: 'PLY',
        uploadDate: '2026-02-10',
        sizeBytes: 19800000,
        url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&auto=format&fit=crop&q=80',
        notes: 'Digital wax-up 3D model for cosmetic veneer sizing.',
        relatedTeeth: [6, 7, 8, 9, 10, 11],
      },
      {
        id: 'file-elena-xray-1',
        name: 'Anterior_Periapical_Survey.png',
        category: 'xray',
        fileType: 'PNG',
        uploadDate: '2026-02-10',
        sizeBytes: 3400000,
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&auto=format&fit=crop&q=80',
        notes: 'Periapical radiograph confirming pulp chamber vitality before veneer preparation.',
        relatedTeeth: [8, 9],
      },
    ],
  },
  {
    id: 'cust-4',
    firstName: 'David',
    lastName: 'Chen',
    dob: '1974-06-19',
    gender: 'Male',
    phone: '(555) 609-3321',
    email: 'dchen@techcorp.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    registeredDate: '2022-04-18',
    medicalAlerts: ['Type 2 Diabetes (HbA1c 6.8% stable)', 'Takes Aspirin 81mg daily'],
    allergies: ['None'],
    insuranceProvider: 'Aetna Dental PPO',
    cleaningDues: davidCleaningDues,
    teethChart: davidChart,
    teethSnapshots: [
      {
        id: 'snap-david-1',
        date: '2026-07-02',
        visitTitle: '3-Month Periodontal Implant Maintenance',
        notes: 'Implants #19 and #30 integrated solidly with zero bone loss on bitewings.',
        chart: davidChart,
      },
    ],
    photos: [],
    beforeAfterPairs: [],
    treatmentLogs: [
      {
        id: 'log-david-1',
        customerId: 'cust-4',
        date: '2026-07-02',
        doctorName: 'Dr. Robert Garcia, DMD',
        category: 'Periodontic',
        procedureName: 'Periodontal Maintenance with Air-Polishing',
        teethInvolved: [19, 30],
        clinicalNotes: 'Glycine powder air-polishing around implant collars. Probing depths 2-3mm, bleeding index 0.',
        cost: 160,
        status: 'Completed',
      },
    ],
    recommendedServices: [],
    attachedFiles: [
      {
        id: 'file-david-xray-1',
        name: 'Bitewing_Implant_Marginal_Bone_Level.png',
        category: 'xray',
        fileType: 'PNG',
        uploadDate: '2026-07-02',
        sizeBytes: 2900000,
        url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format&fit=crop&q=80',
        notes: 'Digital radiograph demonstrating zero bone loss around implant fixture collars #19 & #30.',
        relatedTeeth: [19, 30],
      },
    ],
  },
  {
    id: 'cust-5',
    firstName: 'Leo',
    lastName: 'Martinez',
    dob: '2017-08-15',
    gender: 'Male',
    phone: '(555) 892-4412',
    email: 'martinez.family@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
    registeredDate: '2025-03-10',
    medicalAlerts: ['Childhood Asthma (Carries Albuterol inhaler)'],
    allergies: ['Peanuts (Severe - Anaphylaxis)', 'Amoxicillin'],
    insuranceProvider: 'MetLife Pediatric Care PPO',
    emergencyContact: {
      name: 'Elena Martinez',
      phone: '(555) 892-4419',
      relation: 'Mother',
    },
    cleaningDues: [
      {
        type: 'Fluoride Varnish',
        lastDoneDate: '2026-03-10',
        intervalMonths: 6,
        nextDueDate: '2026-09-10',
        status: 'overdue',
        notes: 'Recall due for topical 5% sodium fluoride varnish application and plaque removal.',
      },
    ],
    teethChart: createDefaultTeethChart(),
    teethSnapshots: [],
    photos: [
      {
        id: 'photo-leo-1',
        customerId: 'cust-5',
        url: PHOTO_MOLAR_BEFORE,
        caption: 'Tooth #3 Deep Pit Caries Prior to Sealant / Filling',
        category: 'intraoral',
        takenAt: '2026-03-10 11:15',
        relatedTeeth: [3],
        stage: 'before',
      },
      {
        id: 'photo-leo-2',
        customerId: 'cust-5',
        url: PHOTO_MOLAR_AFTER,
        caption: 'Tooth #3 Resin Sealant & Preventive Restoration',
        category: 'intraoral',
        takenAt: '2026-03-10 11:45',
        relatedTeeth: [3],
        stage: 'after',
      },
    ],
    beforeAfterPairs: [
      {
        id: 'ba-leo-1',
        customerId: 'cust-5',
        title: 'Molar Sealant Protection (Tooth #3)',
        beforePhotoId: 'photo-leo-1',
        afterPhotoId: 'photo-leo-2',
        dateCreated: '2026-03-10',
        notes: 'Deep fissures etched and sealed with bioactive resin to prevent juvenile decay.',
        relatedTeeth: [3],
      },
    ],
    treatmentLogs: [
      {
        id: 'log-leo-1',
        customerId: 'cust-5',
        date: '2026-03-10',
        doctorName: 'Dr. Emily Watson, DDS',
        category: 'Preventive',
        procedureName: 'Pediatric Sealant Application (Tooth #3, #14)',
        teethInvolved: [3, 14],
        clinicalNotes: 'Child was relaxed while watching distraction video. Isolation maintained with cotton rolls, acid etch 20s, sealant cured with LED.',
        cost: 120,
        status: 'Completed',
      },
    ],
    recommendedServices: [],
    attachedFiles: [
      {
        id: 'file-leo-bitewing-1',
        name: 'Pediatric_Bitewings_Posterior.png',
        category: 'xray',
        fileType: 'PNG',
        uploadDate: '2026-03-10',
        sizeBytes: 2100000,
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&auto=format&fit=crop&q=80',
        notes: 'Pediatric bitewing showing erupting permanent first molars and intact primary teeth.',
        relatedTeeth: [3, 14, 19, 30],
      },
    ],
  },
];

// Initialize dynamic recommendations for initial customers
INITIAL_CUSTOMERS.forEach((customer) => {
  customer.recommendedServices = generateRecommendedServices(
    customer.teethChart,
    customer.cleaningDues,
    customer.id
  );
});

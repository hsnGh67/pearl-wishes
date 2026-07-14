/**
 * WorkshopTabContext
 * Provides editable tab-content for each workshop (by title key).
 * Data is persisted to localStorage so Admin changes survive page reloads
 * and are immediately reflected on the public Workshops page.
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface WorkshopTabContent {
  badgeLabel: string;
  learningPoints: string[];   // "What You'll Learn"
  whatsIncluded: string[];    // "What's Included"
  importantInfo: string[];    // "Important Information"
  durationNote: string;       // text below session fact grid
}

type Store = Record<string, WorkshopTabContent>;

const STORAGE_KEY = 'pearl_wishes_workshop_tab_content';

// ── defaults kept in sync with the hardcoded component content ────────────────

export const COMPLETE_DEFAULTS: WorkshopTabContent = {
  badgeLabel: 'Beginner to Professional',
  learningPoints: [
    'Introduction to professional tools, products, and latest industry materials, including correct usage techniques',
    'Gel Manicure',
    'Russian Manicure',
    'BIAB Full Set Application',
    'BIAB Infill',
    'Nail Extensions using Tips & Hard Gel',
    'Nail Extensions using Forms, Hard Gel & BIAB',
    'Shellac Application',
    'French Tip & Chrome Finish Techniques',
    'Live model practice and final assessment',
  ],
  whatsIncluded: [
    'All professional tools and products provided during the course',
    'Complimentary tea, coffee, and refreshments',
    'Hands-on practical training in a professional environment',
  ],
  importantInfo: [
    'Video recording during the course is not permitted',
    'Students must bring a notebook, pen, and hand sanitiser',
    'Available for individuals of legal age',
  ],
  durationNote:
    'Custom training schedules are available depending on the course format and student level.',
};

export const ADVANCED_DEFAULTS: WorkshopTabContent = {
  badgeLabel: 'For Experienced Nail Technicians',
  learningPoints: [
    'Full revision of BIAB, Hard Gel, and advanced manicure techniques',
    'Individual correction sessions and focused practical exercises',
    'Training in the latest international nail trends and techniques',
    'Introduction to new-generation tools and professional products',
    'Final assessment on a live model',
  ],
  whatsIncluded: [
    'All professional tools and products provided during the course',
    'Complimentary tea, coffee, and refreshments',
    'Practical and personalised guidance in a professional setting',
  ],
  importantInfo: [
    'Video recording during the course is not permitted',
    'Students must bring a notebook, pen, and hand sanitiser',
    'Accredited certification can be arranged upon request',
  ],
  durationNote: 'Flexible course structure based on the level and goals of each student.',
};

// ─────────────────────────────────────────────────────────────────────────────

interface ContextValue {
  getContent: (workshopTitle: string, defaults: WorkshopTabContent) => WorkshopTabContent;
  setContent: (workshopTitle: string, content: WorkshopTabContent) => void;
}

const WorkshopTabContext = createContext<ContextValue | null>(null);

function loadFromStorage(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function WorkshopTabProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(loadFromStorage);

  const getContent = useCallback(
    (title: string, defaults: WorkshopTabContent): WorkshopTabContent =>
      store[title] ?? defaults,
    [store],
  );

  const setContent = useCallback((title: string, content: WorkshopTabContent) => {
    setStore((prev) => {
      const next = { ...prev, [title]: content };
      saveToStorage(next);
      return next;
    });
  }, []);

  return (
    <WorkshopTabContext.Provider value={{ getContent, setContent }}>
      {children}
    </WorkshopTabContext.Provider>
  );
}

export function useWorkshopTab(
  workshopTitle: string,
  defaults: WorkshopTabContent,
): WorkshopTabContent {
  const ctx = useContext(WorkshopTabContext);
  if (!ctx) return defaults;
  return ctx.getContent(workshopTitle, defaults);
}

const NO_OP_ADMIN = {
  getContent: (_title: string, defaults: WorkshopTabContent) => defaults,
  setContent: (_title: string, _content: WorkshopTabContent) => {},
};

export function useWorkshopTabAdmin(): {
  getContent: (title: string, defaults: WorkshopTabContent) => WorkshopTabContent;
  setContent: (title: string, content: WorkshopTabContent) => void;
} {
  const ctx = useContext(WorkshopTabContext);
  return ctx ?? NO_OP_ADMIN;
}

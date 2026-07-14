interface Appointment {
  id: number;
  date: string;
  time: string;
  service: string;
  price: number;
  people: number;
  promoCode?: string;
  type: 'training' | 'session';
}

interface Note {
  id: number;
  content: string;
  date: string;
  time: string;
  author: string;
}

export interface User {
  id: number;w
  name: string;
  email: string;
  phone: string;
  appointments: number;
  joined: string;
  lastAppointment: string;
  address: string;
  appointmentHistory: Appointment[];
  notes: Note[];
}

export const initialUsers: User[] = [
  { 
    id: 1, 
    name: 'Sarah Johnson', 
    email: 'sarah.j@email.com', 
    phone: '020 7946 1234', 
    appointments: 12, 
    joined: 'Jan 2024', 
    lastAppointment: 'Feb 14, 2026', 
    address: '123 Oxford Street, London, W1D 2HG',
    appointmentHistory: [
      { id: 1, date: 'Feb 14, 2026', time: '10:00 AM', service: 'Classic Manicure', price: 40, people: 1, type: 'session' },
      { id: 2, date: 'Feb 10, 2026', time: '2:00 PM', service: 'Gel Manicure', price: 45, people: 2, promoCode: 'WINTER20', type: 'session' },
      { id: 3, date: 'Feb 5, 2026', time: '10:00 AM', service: 'BIAB Application Masterclass', price: 165, people: 1, type: 'training' },
      { id: 4, date: 'Jan 28, 2026', time: '3:00 PM', service: 'Biab Fresh Set', price: 60, people: 1, type: 'session' },
      { id: 5, date: 'Jan 20, 2026', time: '1:00 PM', service: 'Gel Manicure Fundamentals', price: 150, people: 1, promoCode: 'FIRST10', type: 'training' },
      { id: 6, date: 'Jan 15, 2026', time: '11:00 AM', service: 'Luxury Manicure-gel', price: 55, people: 1, type: 'session' },
    ],
    notes: [
      { id: 1, content: 'Sarah is a regular customer and loves our gel manicures.', date: 'Feb 10, 2026', time: '10:30 AM', author: 'Admin' },
      { id: 2, content: 'She attended the BIAB Application Masterclass and was very enthusiastic.', date: 'Feb 5, 2026', time: '11:00 AM', author: 'Admin' },
    ]
  },
  { 
    id: 2, 
    name: 'Emma Wilson', 
    email: 'emma.w@email.com', 
    phone: '020 7946 5678', 
    appointments: 8, 
    joined: 'Feb 2024', 
    lastAppointment: 'Feb 15, 2026', 
    address: '45 Baker Street, London, NW1 6XE',
    appointmentHistory: [
      { id: 7, date: 'Feb 15, 2026', time: '10:00 AM', service: 'Classic Manicure', price: 40, people: 1, type: 'session' },
      { id: 8, date: 'Feb 8, 2026', time: '11:00 AM', service: 'Gel Manicure', price: 45, people: 1, promoCode: 'SAVE15', type: 'session' },
      { id: 10, date: 'Jan 22, 2026', time: '3:00 PM', service: 'Full Set Gel Extensions', price: 70, people: 1, type: 'session' },
    ],
    notes: [
      { id: 1, content: 'Emma is a regular customer who enjoys our nail services.', date: 'Feb 8, 2026', time: '10:30 AM', author: 'Admin' },
    ]
  },
  { 
    id: 3, 
    name: 'Lucy Brown', 
    email: 'lucy.b@email.com', 
    phone: '020 7946 9012', 
    appointments: 15, 
    joined: 'Dec 2023', 
    lastAppointment: 'Feb 16, 2026', 
    address: '78 Regent Street, London, SW1Y 4PE',
    appointmentHistory: [
      { id: 11, date: 'Feb 16, 2026', time: '10:00 AM', service: 'Biab Infill', price: 50, people: 1, type: 'session' },
      { id: 12, date: 'Feb 12, 2026', time: '11:00 AM', service: 'Full Set Gel Extensions', price: 70, people: 1, type: 'session' },
      { id: 13, date: 'Feb 6, 2026', time: '2:00 PM', service: 'Classic Manicure', price: 40, people: 3, promoCode: 'GROUP10', type: 'session' },
      { id: 14, date: 'Jan 30, 2026', time: '10:00 AM', service: 'Gel Extensions Complete Guide', price: 220, people: 1, type: 'training' },
      { id: 15, date: 'Jan 18, 2026', time: '1:00 PM', service: 'Chrome & Metallic Finishes', price: 170, people: 1, type: 'training' },
    ],
    notes: [
      { id: 1, content: 'Lucy is a frequent visitor and enjoys our training sessions.', date: 'Jan 18, 2026', time: '10:30 AM', author: 'Admin' },
      { id: 2, content: 'She attended the Gel Extensions Complete Guide training and was very impressed.', date: 'Jan 30, 2026', time: '11:00 AM', author: 'Admin' },
    ]
  },
  { 
    id: 4, 
    name: 'Olivia Davis', 
    email: 'olivia.d@email.com', 
    phone: '020 7946 3456', 
    appointments: 5, 
    joined: 'Mar 2024', 
    lastAppointment: 'Feb 10, 2026', 
    address: '12 Piccadilly, London, W1J 0DD',
    appointmentHistory: [
      { id: 16, date: 'Feb 10, 2026', time: '10:00 AM', service: 'Gel Manicure', price: 45, people: 1, type: 'session' },
      { id: 17, date: 'Jan 25, 2026', time: '11:00 AM', service: 'Biab Fresh Set', price: 60, people: 2, type: 'session' },
      { id: 18, date: 'Jan 15, 2026', time: '2:00 PM', service: 'Building Your Nail Business', price: 140, people: 1, promoCode: 'NEWBIE', type: 'training' },
      { id: 19, date: 'Jan 8, 2026', time: '3:00 PM', service: 'Luxury Manicure-gel', price: 55, people: 1, type: 'session' },
    ],
    notes: [
      { id: 1, content: 'Olivia is new to our services and is interested in learning more.', date: 'Jan 15, 2026', time: '10:30 AM', author: 'Admin' },
      { id: 2, content: 'She attended the Building Your Nail Business training and was very motivated.', date: 'Jan 15, 2026', time: '11:00 AM', author: 'Admin' },
    ]
  },
];

// Helper function to find user by phone number
export function findUserByPhone(phone: string): User | undefined {
  const phoneNoSpaces = phone.replace(/\s/g, '').toLowerCase();
  return initialUsers.find(user => {
    const userPhoneNoSpaces = user.phone.replace(/\s/g, '').toLowerCase();
    return userPhoneNoSpaces === phoneNoSpaces;
  });
}

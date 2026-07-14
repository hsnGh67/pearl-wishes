/**
 * Script to add sample treatment data to existing bookings
 * This populates the booking_treatments table with realistic multi-person data
 */

import { supabase } from '../config/supabase';

const SAMPLE_TREATMENTS = [
  {
    service_name: 'Gel Manicure',
    price: 35,
    duration: 45,
  },
  {
    service_name: 'Classic Pedicure',
    price: 45,
    duration: 60,
  },
  {
    service_name: 'Luxury Manicure & Pedicure',
    price: 75,
    duration: 90,
  },
  {
    service_name: 'Gel Nail Extensions',
    price: 55,
    duration: 90,
  },
  {
    service_name: 'Nail Art',
    price: 25,
    duration: 30,
  },
];

const SAMPLE_NAMES = [
  'Sarah Johnson',
  'Emily Chen',
  'Jessica Williams',
  'Rachel Martinez',
  'Amanda Taylor',
  'Sophie Anderson',
  'Olivia Brown',
  'Emma Davis',
  'Ava Wilson',
  'Isabella Moore',
];

async function addSampleTreatmentData() {
  console.log('🚀 Starting to add sample treatment data...');

  try {
    // 1. Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    if (!bookings || bookings.length === 0) {
      console.log('⚠️ No bookings found in the database');
      return;
    }

    console.log(`📋 Found ${bookings.length} bookings`);

    // 2. Fetch all services to get service_ids
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');

    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }

    console.log(`💅 Found ${services?.length || 0} services`);

    // 3. For each booking, create 1-3 treatments
    let totalTreatments = 0;

    for (const booking of bookings) {
      // Skip if booking is cancelled
      if (booking.status === 'cancelled') {
        console.log(`⏭️ Skipping cancelled booking ${booking.id}`);
        continue;
      }

      // Determine number of people (1-3)
      const numPeople = Math.floor(Math.random() * 3) + 1;
      
      const treatments = [];

      for (let i = 0; i < numPeople; i++) {
        // Pick a random treatment
        const treatment = SAMPLE_TREATMENTS[Math.floor(Math.random() * SAMPLE_TREATMENTS.length)];
        
        // Find matching service or use first service
        const matchingService = services?.find(s => 
          s.name.toLowerCase().includes(treatment.service_name.toLowerCase().split(' ')[0])
        ) || services?.[0];

        if (!matchingService) {
          console.warn(`⚠️ No service found for treatment ${treatment.service_name}`);
          continue;
        }

        // Pick a random name
        const personName = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];

        treatments.push({
          booking_id: booking.id,
          service_id: matchingService.id,
          person_name: personName,
          service_name: treatment.service_name,
          price: treatment.price,
          duration: treatment.duration,
          status: 'active',
        });
      }

      // Insert treatments for this booking
      if (treatments.length > 0) {
        const { error: insertError } = await supabase
          .from('booking_treatments')
          .insert(treatments);

        if (insertError) {
          console.error(`❌ Error inserting treatments for booking ${booking.id}:`, insertError);
        } else {
          totalTreatments += treatments.length;
          console.log(`✅ Added ${treatments.length} treatment(s) for booking ${booking.id}`);
        }
      }
    }

    console.log(`\n🎉 Successfully added ${totalTreatments} treatments to ${bookings.length} bookings!`);
    console.log('✨ Your calendar now has multi-person booking data!');

  } catch (error) {
    console.error('❌ Error adding sample treatment data:', error);
    throw error;
  }
}

// Run the script
addSampleTreatmentData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

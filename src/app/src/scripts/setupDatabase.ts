import { supabase } from '../config/supabase';

/**
 * Pearl Wishes Studio - Automated Database Setup
 * Seeds the database with initial data after schema is created
 */

export async function setupDatabase() {
  console.log('🚀 Starting Pearl Wishes Studio database setup...');

  try {
    console.log('📦 Seeding initial data...');

    // Insert seed data
    await seedData();

    console.log('🎉 Database setup complete!');
    return { success: true, message: 'Database setup completed successfully' };
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return { success: false, error };
  }
}

async function seedData() {
  console.log('📦 Seeding initial data...');

  // Check if services already exist
  const { data: existingServices } = await supabase
    .from('services')
    .select('id')
    .limit(1);

  if (existingServices && existingServices.length > 0) {
    console.log('⚠️  Data already exists, skipping seed');
    return;
  }

  // Insert services (using actual website data)
  const { error: servicesError } = await supabase.from('services').insert([
    {
      name: 'Classic Manicure',
      description: 'Shaping, detailed cuticle care and hydration, finished with a smooth, glossy polish.',
      duration: 60,
      price: 40.00,
      category: 'manicure',
      is_active: true,
      display_order: 1
    },
    {
      name: 'Biab Fresh Set',
      description: 'Builder gel strengthens and protects nails before colour.',
      duration: 90,
      price: 60.00,
      category: 'manicure',
      is_active: true,
      display_order: 2
    },
    {
      name: 'Luxury Manicure-gel',
      description: 'Shaping, cuticle care, massage and hot cream, finished with long-lasting gel.',
      duration: 90,
      price: 55.00,
      category: 'manicure',
      is_active: true,
      display_order: 3
    },
    {
      name: 'Full Set Gel Extensions',
      description: 'Premium gel extensions add natural length and strength, finished with your chosen polish or gel.',
      duration: 120,
      price: 70.00,
      category: 'extensions',
      is_active: true,
      display_order: 4
    },
    {
      name: 'Biab Infill',
      description: 'Builder gel is rebalanced and refreshed to maintain strength and growth.',
      duration: 60,
      price: 50.00,
      category: 'manicure',
      is_active: true,
      display_order: 5
    },
    {
      name: 'Gel Manicure',
      description: 'Shaping, cuticle care and hydration, finished with long-lasting gel.',
      duration: 75,
      price: 45.00,
      category: 'manicure',
      is_active: true,
      display_order: 6
    },
    {
      name: 'French Finish',
      description: 'Classic French tip styling',
      duration: 15,
      price: 10.00,
      category: 'add_on',
      is_active: true,
      display_order: 7
    },
    {
      name: 'Chrome Finish',
      description: 'Sleek metallic chrome effect',
      duration: 15,
      price: 10.00,
      category: 'add_on',
      is_active: true,
      display_order: 8
    },
    {
      name: 'Gel Removal (Soak Off)',
      description: 'Safe removal of existing gel polish',
      duration: 20,
      price: 10.00,
      category: 'add_on',
      is_active: true,
      display_order: 9
    }
  ]);

  if (servicesError) {
    console.error('❌ Services seed failed:', servicesError);
  } else {
    console.log('✅ Services seeded');
  }

  // Insert admin user
  const { error: userError } = await supabase.from('users').insert([
    {
      email: 'admin@pearlwishes.com',
      full_name: 'Pearl Wishes Admin',
      role: 'admin',
      phone: '+44 20 1234 5678'
    }
  ]);

  if (userError) {
    console.error('❌ Admin user seed failed:', userError);
  } else {
    console.log('✅ Admin user created');
  }

  // Insert testimonials (using actual website data)
  const { error: testimonialsError } = await supabase.from('testimonials').insert([
    {
      client_name: 'Sarah Johnson',
      rating: 5,
      comment: 'Booking was so easy and they arrived exactly on time! The technician was incredibly skilled and brought all sterilized equipment to my home. Everything was spotlessly clean.',
      service_type: 'Classic Manicure',
      is_featured: true,
      is_published: true
    },
    {
      client_name: 'Emily Chen',
      rating: 5,
      comment: 'The gel extensions look absolutely stunning! They were perfectly punctual and the technician was so talented and attentive to detail. Highly professional service!',
      service_type: 'Gel Extensions',
      is_featured: true,
      is_published: true
    },
    {
      client_name: 'Jessica Martinez',
      rating: 5,
      comment: 'The nail art design was absolutely stunning! The technician is incredibly creative and skillful. The attention to detail in every design element was remarkable. True artistry!',
      service_type: 'Nail Art Design',
      is_featured: true,
      is_published: true
    },
    {
      client_name: 'Amanda Lee',
      rating: 5,
      comment: 'Love the convenience of booking from my phone! They are always on time, the service at my home is so relaxing, and their hygiene standards are outstanding. The team is consistently skilled and professional. Perfect every time!',
      service_type: 'Gel Extensions',
      is_featured: true,
      is_published: true
    },
    {
      client_name: 'Rachel Brown',
      rating: 5,
      comment: 'Impressed by their punctuality and professionalism! The booking was effortless, they brought immaculately clean equipment to my home, and the technician was exceptionally skilled. My gel extensions are perfect and long-lasting!',
      service_type: 'Gel Extensions',
      is_featured: true,
      is_published: true
    },
    {
      client_name: 'Lisa Wilson',
      rating: 5,
      comment: 'The easy booking system is fantastic! Always on time, incredibly talented technicians, and the cleanliness is hospital-grade. Having professional manicures at home is such a treat. My nails always look flawless!',
      service_type: 'Classic Manicure',
      is_featured: true,
      is_published: true
    }
  ]);

  if (testimonialsError) {
    console.error('❌ Testimonials seed failed:', testimonialsError);
  } else {
    console.log('✅ Testimonials seeded');
  }

  // Insert content sections (using actual website data)
  const { error: contentError } = await supabase.from('content_sections').insert([
    {
      section_name: 'hero',
      title: 'Luxury nail care at your doorstep',
      subtitle: 'Premium mobile nail treatments in London',
      description: 'Experience salon-quality treatments in the comfort of your home'
    },
    {
      section_name: 'instagram',
      title: 'Follow Us',
      subtitle: '@pearlwishesstudio',
      description: 'See our latest work and inspiration on Instagram'
    },
    {
      section_name: 'about',
      title: 'About Pearl Wishes Studio',
      subtitle: 'Bringing Beauty to You',
      description: 'We are London\'s leading mobile nail care service, offering luxury treatments at your convenience.'
    }
  ]);

  if (contentError) {
    console.error('❌ Content sections seed failed:', contentError);
  } else {
    console.log('✅ Content sections seeded');
  }

  console.log('✅ Seed data inserted successfully');
}

// Export individual setup functions for flexibility
export { seedData };